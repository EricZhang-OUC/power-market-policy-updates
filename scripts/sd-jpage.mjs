import {parseLinks,isChallenge} from './parsers.mjs';
// JPage's nextgroup link omits the record range. The site's script uses POST
// with startrecord/endrecord/perpage and the public column parameters instead.
export async function loadSdJpage(source,first,get,{since,maxPages,pages=[]}){
 const raw=first.match(/var\s+param_\d+\s*=\s*\{([^}]+)\}/)?.[1];
 const total=Number(first.match(/totalRecord\s*:\s*(\d+)/)?.[1]);
 const perPage=Number(first.match(/perPage\s*:\s*(\d+)/)?.[1]);
 const groupSize=Number(first.match(/groupSize\s*:\s*(\d+)/)?.[1]);
 if(!raw||!total||!perPage||!groupSize)throw Error('JPage栏目或分页参数未识别');
 const params=new URLSearchParams();
 const allowedKeys=new Set(['col','webid','path','columnid','sourceContentType','unitid','webname','permissiontype']);
 for(const m of raw.matchAll(/(\w+)\s*:\s*(?:'([^']*)'|"([^"]*)"|(\d+))/g))if(allowedKeys.has(m[1]))params.set(m[1],m[2]??m[3]??m[4]);
 if(!params.has('unitid')||!params.has('columnid')||!params.has('webid'))throw Error('JPage栏目参数缺失');
 const all=new Map(),groupRecords=perPage*groupSize,groups=Math.ceil(total/groupRecords);
 const endpoint=new URL('/module/web/jpage/dataproxy.jsp',source.url).href;
 const entries=h=>parseLinks(h.match(/<recordset>([\s\S]*?)<\/recordset>/i)?.[1]||h,source.url,source);
 let current=entries(first),stopReason=groups>maxPages?'page-limit':'declared-page-end';const listErrors=[];
 if(!current.length)throw Error('JPage首页没有可识别的文件记录');
 for(const r of current)all.set(r.url,r);
 for(let group=1;group<Math.min(groups,maxPages);group++){
  if(current.every(r=>r.date&&r.date<since)){stopReason='passed-history-start';break}
  const requestParams=new URLSearchParams(params);
  requestParams.set('startrecord',String(group*groupRecords+1));
  requestParams.set('endrecord',String(Math.min((group+1)*groupRecords,total)));
  requestParams.set('perpage',String(perPage));
  const url=endpoint+'?'+requestParams;
  try{
   const h=await get(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params.toString()});
   if(isChallenge(h))throw Error('官网返回验证页');
   pages.push({url,method:'POST',bytes:Buffer.byteLength(h)});
   current=entries(h);
   if(!current.length){stopReason='unparsed-page';break}
   const size=all.size;for(const r of current)all.set(r.url,r);
   if(all.size===size){stopReason='repeated-next-page';break}
  }catch(e){listErrors.push({url,error:e.message});stopReason='page-read-error';break}
 }
 return {entries:[...all.values()],pages,stopReason,listErrors};
}
