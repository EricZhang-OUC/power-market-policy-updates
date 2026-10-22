import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {accounts,mediaSources,activeMediaRows,listedArticles,validDate,rankingRelevant,mediaChallenge} from './media-helpers.mjs';

const file=new URL('../data/media.json',import.meta.url);
let old={rows:[],sources:[]};try{old=JSON.parse(await fs.readFile(file,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
// Restrict retained history as well as new records, including when a request fails.
const rows=new Map(activeMediaRows(old.rows).map(r=>[r.url,r]));const sources=[];let successes=0;
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(18000),headers:{'User-Agent':'PowerMarketPolicyUpdates/0.3 (article index)'}});if(!r.ok)throw Error('HTTP '+r.status);return r.text()}
async function getFirst(s){const urls=s.urls?.length?s.urls:[s.url];const failures=[];
 for(const url of urls){
  try{const html=await get(url);if(mediaChallenge(html))throw Error('网站返回访问验证页，未取得真实文章列表');return {html,url}}
  catch(e){failures.push(url.replace(/^https:\/\//,'')+' → '+e.message)}
 }
 throw Error(failures.join('；'))}
for(const s of mediaSources){
 const checkedAt=new Date().toISOString();let count=0,errors=0;
 try{
  const {html,url:usedUrl}=await getFirst(s);const listed=listedArticles(html,usedUrl,s.kind);
  if(!listed.length)throw Error('未识别文章目录，不能视为零新增');
  const candidates=s.keywordFiltered?listed.filter(c=>rankingRelevant(c.title)):listed;
  for(const c of candidates){
   if(c.date&&!validDate(c.date))continue;
   const row={...c,agency:s.name,group:'行业观察',region:'北极星网站目录',linkLabel:'查看网站文章 ↗',detailStatus:'media-index-only',note:''};
   if(!validDate(row.date))continue;
   const previous=rows.get(row.url);rows.set(row.url,{...row,id:previous?.id||crypto.createHash('sha256').update(row.url).digest('hex').slice(0,16),sourceId:previous?.sourceId||s.id,firstSeenAt:previous?.firstSeenAt||checkedAt,lastCheckedAt:checkedAt});count++;
  }
  successes++;sources.push({...s,status:errors?'partial':'ok',checkedAt,lastSuccessAt:checkedAt,recordCount:count,detailErrors:errors});console.log(s.id+': '+count+' records, '+errors+' errors');
 }catch(e){sources.push({...s,status:'error',checkedAt,error:e.message,lastSuccessAt:old.sources.find(x=>x.id===s.id)?.lastSuccessAt||null});console.error(s.id+': '+e.message)}
}
const result={updatedAt:successes?new Date().toISOString():old.updatedAt||null,historyStart:'2026-01-01',accounts,sources,rows:activeMediaRows([...rows.values()]).sort((a,b)=>b.date.localeCompare(a.date))};
await fs.writeFile(file,JSON.stringify(result,null,2));
await fs.writeFile(new URL('../data/media.js',import.meta.url),'window.MEDIA_DATA = '+JSON.stringify(result).replaceAll('<','\\u003c')+';\n');
if(!successes)process.exitCode=1;
