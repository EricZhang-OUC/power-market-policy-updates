import {parseLinks,text,isChallenge,canonical,allowed} from './parsers.mjs';
export async function loadSource(source,get,{since='2022-01-01',maxPages=80}={}){
 const pages=[];const listErrors=[];const all=new Map();let stopReason='single-page';let indexUrl=source.url;
 const add=(entries)=>{for(const c of entries)all.set(c.url,c)};
 function record(url,h){if(isChallenge(h))throw Error('官网返回验证页，未读取政策正文');pages.push({url,bytes:Buffer.byteLength(h)});return h}
 add(source.seedRecords||[]);
 let first;
 try{first=record(indexUrl,await get(indexUrl))}catch(e){
  if(!all.size)throw e;
  listErrors.push({url:indexUrl,error:e.message});
  return {entries:[...all.values()],pages,stopReason:'seed-fallback',listErrors};
 }
 if(source.adapter==='discovery')throw Error(source.id==='sd-fgw'?'官网入口尚不可读':'动态公开目录尚未解析');
 if(source.adapter==='gov-json'){
  const url=new URL('./ZUIXINZHENGCE.json',indexUrl).href;const body=record(url,await get(url));const json=JSON.parse(body);if(!Array.isArray(json))throw Error('中国政府网最新政策数据格式改变');
  for(const r of json){let u;try{u=canonical(r.URL,indexUrl)}catch{continue}if(!allowed(u,source))continue;const title=text(r.TITLE),rawDate=String(r.DOCRELPUBTIME||'').slice(0,10).replace(/[./]/g,'-');if(title&&/^\d{4}-\d{2}-\d{2}$/.test(rawDate))add([{url:u,title,date:rawDate}])}
  stopReason='json-feed-end';
 }else if(source.adapter==='nea-json'){
  const matches=[...first.matchAll(/data=["']datasource:([^"']+)["'][^>]*datatype=["']ds["'][^>]*preview=["']([^"']+)["']/gi)];
  if(!matches.length)throw Error('能源局栏目数据源标识未识别');
  for(const m of matches){const url=new URL('./'+m[2]+m[1]+'.json',indexUrl).href;const body=record(url,await get(url));const json=JSON.parse(body);if(!Array.isArray(json.datasource))throw Error('能源局列表数据格式改变');for(const r of json.datasource){let u;try{u=canonical(r.publishUrl,indexUrl)}catch{continue}if(!allowed(u,source))continue;const title=text(r.showTitle||r.title),date=String(r.publishTime||'').slice(0,10);if(title&&/^\d{4}-\d{2}-\d{2}$/.test(date))add([{url:u,title,date}])}}
  stopReason='json-feed-end';
 }else{
  add(parseLinks(first,indexUrl,source));
  if(source.adapter==='trs'){
   const total=Number(first.match(/createPageHTML\(\s*(\d+)/i)?.[1]||first.match(/countPage\s*=\s*Number\(["'](\d+)/)?.[1]||1);
   stopReason=total>maxPages?'page-limit':'declared-page-end';
   for(let page=1;page<Math.min(total,maxPages);page++){
    const dates=[...all.values()].map(r=>r.date).filter(Boolean);const tail=dates.slice(-5);if(tail.length===5&&tail.every(d=>d<since)){stopReason='passed-history-start';break}
    const url=new URL('index_'+page+'.html',indexUrl).href;let h;try{h=record(url,await get(url))}catch(e){listErrors.push({url,error:e.message});stopReason='page-read-error';break}const parsed=parseLinks(h,url,source);if(!parsed.length){stopReason='unparsed-page';break}add(parsed);
   }
  }else if(source.adapter==='jpage'){
   let current=first;stopReason='jpage-end';const seen=new Set();
   for(let page=1;page<maxPages;page++){
    const next=current.match(/<nextgroup>[\s\S]*?<a\b[^>]*href=["']([^"']+)/i)?.[1];if(!next)break;
    const url=new URL(next.replaceAll('&amp;','&'),indexUrl).href;if(seen.has(url)){stopReason='repeated-next-page';break}seen.add(url);
    try{current=record(url,await get(url))}catch(e){listErrors.push({url,error:e.message});stopReason='page-read-error';break}if(!parseLinks(current,url,source).length){stopReason='unparsed-page';break}add(parseLinks(current,url,source));
    const dates=[...all.values()].map(r=>r.date).filter(Boolean).slice(-5);if(dates.length===5&&dates.every(d=>d<since)){stopReason='passed-history-start';break}
    if(page===maxPages-1)stopReason='page-limit';
   }
  }
 }
 if(!all.size)throw Error('页面可读，但未解析到任何文件链接');
 return {entries:[...all.values()],pages,stopReason,listErrors};
}
