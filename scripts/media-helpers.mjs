import {text,relevance} from './parsers.mjs';

export const accounts=[{id:'bjx',name:'北极星电力市场网',group:'行业观察',url:'https://shoudian.bjx.com.cn/'}];
export const mediaSources=[...accounts.map(a=>({...a,kind:a.id})),{id:'bjx-ranking',name:'北极星电力网 · 电力排行榜',group:'行业观察',url:'https://news.bjx.com.cn/rankinglist/dianli/',kind:'bjx',keywordFiltered:true}];
export function activeMediaRows(rows){return rows.filter(r=>mediaSources.some(s=>s.id===r.sourceId)&&r.group==='行业观察'&&validDate(r.date)&&mediaRelevant(r.title))}
export function mediaRelevant(title){return title.length>7&&!/招聘|招标|中标|实训|培训|招生|课程|峰会|展会|研修|圆满|座谈|调研|签约|交流会|携手|党建|党委|社会责任|海外.*产业创新/.test(title)&&/电力|煤电|新型电网|电价|现货|售电|绿电|绿证|新能源|储能|虚拟电厂|需求响应|负荷|算电|能源气象/.test(title)}
export function rankingRelevant(title){return mediaRelevant(title)&&relevance(title,{channel:'解读'})}
export function mediaChallenge(html){return /aliyun_waf|CF_APP_WAF|rtcsetcookie\(|checkflash\(/i.test(html)}
export function validDate(date,today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date())){const d=new Date(date+'T00:00:00Z');return /^20\d{2}-\d{2}-\d{2}$/.test(date)&&date>='2026-01-01'&&date<=today&&Number.isFinite(d.getTime())&&d.toISOString().startsWith(date)}
export function listedArticles(html,base,kind){
 if(kind!=='bjx')return [];
 const rows=[];
 for(const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)){
  const href=m[1].match(/href\s*=\s*["']([^"']+)/i)?.[1];if(!href)continue;
  let url;try{url=new URL(href.replaceAll('&amp;','&'),base);if(!['http:','https:'].includes(url.protocol))continue}catch{continue}
  const date=url.pathname.match(/^\/html\/(\d{4})(\d{2})(\d{2})\/\d+\.shtml$/);
  if(url.hostname!=='news.bjx.com.cn'||!date)continue;
  const title=text(m[1].match(/\btitle\s*=\s*["']([^"']+)/i)?.[1]||m[2]);
  url.hash='';if(mediaRelevant(title))rows.push({title,date:date.slice(1,4).join('-'),url:url.href});
 }
 return [...new Map(rows.map(r=>[r.url,r])).values()];
}
