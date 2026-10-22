import {cleanPolicies,exclusionReason} from './policy-cleanup.mjs';
import {consultationDetail} from './ndrc-consultation.mjs';
import {sources} from './sources.mjs';
import {text,meta,canonical,relevance,genericOfficialTitle,detailRelevance,isChallenge,attachments} from './parsers.mjs';
import {loadSource} from './source-loader.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const historyStart='2022-01-01', backfill=process.argv.includes('--backfill');
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(18000),headers:{'User-Agent':'PowerMarketPolicyUpdates/0.2 (public policy index)'}});if(!r.ok)throw Error('HTTP '+r.status);let b=await r.arrayBuffer();let head=new TextDecoder().decode(b.slice(0,3000));return new TextDecoder(/charset\s*=\s*["']?gb/i.test(head)?'gb18030':'utf-8').decode(b)}
const file=path.join(root,'data/policies.json');let old={rows:[],sources:[]};try{old=JSON.parse(await fs.readFile(file,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
const byUrl=new Map((old.records||old.rows).map(r=>{const {state,...record}=r;return [canonical(r.url),record]}));const statuses=[],audit=[];let successes=0;
for(const source of sources){const checkedAt=new Date().toISOString();let loaded;try{
 loaded=await loadSource(source,get,{since:historyStart,maxPages:backfill?80:3});
 const candidates=loaded.entries.filter(r=>(!r.date||r.date>=historyStart)&&(relevance(r.title,source)||genericOfficialTitle(r.title))&&(source.region!=='山东'||!exclusionReason({...r,region:source.region}))); let count=0,errors=0,indexOnly=0;const failures=[];
 for(const c of candidates){try{
  let detail,url=c.url;const previous=byUrl.get(url);
  // Backfill resumes by reusing already-read records; the normal sync refreshes them.
  if(backfill&&previous?.lastCheckedAt&&previous.detailStatus!=='index-only'){count++;continue}
  try{if(new URL(url).hostname==='yyglxxbsgw.ndrc.gov.cn'){const resolved=await consultationDetail(url,get);url=resolved.url;detail=resolved.html}else detail=await get(url);if(isChallenge(detail))throw Error('官网返回验证页')}catch(e){if(source.id.startsWith('sd-nyj')&&c.date){indexOnly++;byUrl.set(url,{...previous,id:previous?.id||crypto.createHash('sha256').update(url).digest('hex').slice(0,16),region:source.region,date:c.date,title:c.title,agency:source.name,url,note:'',sourceId:source.id,firstSeenAt:previous?.firstSeenAt||checkedAt,lastCheckedAt:checkedAt,detailStatus:'index-only',detailError:e.message,attachments:previous?.attachments||[]});count++;continue}throw e}
  let title=meta(detail,'ArticleTitle')||text(detail.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||c.title);title=title.replace(/[_-](?:国家能源局山东监管办公室|国家能源局)$/,'').replace(/^〖|〗-国家发展和改革委员会$/g,'');let pub=meta(detail,'PubDate')||meta(detail,'publishdate');const date=c.date||pub.match(/20\d{2}[-/]\d{2}[-/]\d{2}/)?.[0].replaceAll('/','-');if(!date||!title||/已删除或过期|稿件不存在|页面不存在/.test(title))throw Error('文件标题或发布日期缺失，或原文已经移除');if(title.length<c.title.length*0.6)title=c.title;if(date<historyStart)continue;if(!relevance(title,source)&&!detailRelevance(detail,source))continue;
  const prev=byUrl.get(url);const hash=crypto.createHash('sha256').update(detail).digest('hex');if(prev&&prev.contentHash&&prev.contentHash!==hash){await fs.mkdir(path.join(root,'data/snapshots'),{recursive:true});await fs.writeFile(path.join(root,'data/snapshots',prev.id+'-'+Date.now()+'.json'),JSON.stringify(prev,null,2))}
  byUrl.set(url,{id:prev?.id||crypto.createHash('sha256').update(url).digest('hex').slice(0,16),region:source.region,date,title,agency:source.name,url,note:'',documentDate:pub||null,sourceId:source.id,firstSeenAt:prev?.firstSeenAt||checkedAt,lastCheckedAt:checkedAt,contentHash:hash,detailStatus:'read',attachments:attachments(detail,url)});count++;
 }catch(e){errors++;failures.push({url:c.url,title:c.title,error:e.message});}}
 successes++;const status=errors||indexOnly||loaded.listErrors.length||['page-limit','unparsed-page','repeated-next-page'].includes(loaded.stopReason)?'partial':'ok';statuses.push({...source,status,checkedAt,lastSuccessAt:checkedAt,recordCount:count,detailErrors:errors,indexOnly,listErrors:loaded.listErrors,scannedPages:loaded.pages.length,stopReason:loaded.stopReason});audit.push({sourceId:source.id,pages:loaded.pages,stopReason:loaded.stopReason,listed:loaded.entries.length,selected:candidates.length,listErrors:loaded.listErrors,failures,entries:candidates.map(c=>({title:c.title,date:c.date,url:c.url}))});console.log(source.id+': '+count+' records; '+indexOnly+' index-only; '+errors+' errors; '+loaded.pages.length+' pages');
 }catch(e){const error=e.cause?.message||e.message;statuses.push({...source,status:'error',checkedAt,lastSuccessAt:old.sources.find(s=>s.id===source.id)?.lastSuccessAt||null,error});audit.push({sourceId:source.id,error,pages:loaded?.pages||[]});console.error(source.id+': '+error)}
 // Save progress after every source, making an interrupted history run resumable.
 await save();
}
async function save(){const records=[...byUrl.values()].filter(r=>r.date>=historyStart);const cleaned=cleanPolicies(records);const data={updatedAt:successes?new Date().toISOString():old.updatedAt||null,historyStart,intervalMinutes:60,schedulerActive:false,sources:statuses,records,rows:cleaned.rows,cleanup:cleaned.report};await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(data,null,2));await fs.writeFile(path.join(root,'data/policies.js'),'window.POLICY_DATA = '+JSON.stringify(data).replaceAll('<','\\u003c')+';\n');await fs.writeFile(path.join(root,'data/coverage.json'),JSON.stringify({checkedAt:new Date().toISOString(),historyStart,mode:backfill?'history':'incremental',note:'只反映已配置栏目中按标题筛选的结果，不能证明全站无遗漏。',sources:audit},null,2))}
if(!successes)process.exitCode=1;
