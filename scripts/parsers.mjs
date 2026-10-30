export function text(s='') {return String(s).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim()}
export function meta(h,name){for(const m of h.matchAll(/<meta\b[^>]*>/gi)){const n=m[0].match(/(?:name|property)\s*=\s*["']([^"']+)/i),v=m[0].match(/content\s*=\s*["']([^"']*)/i);if(n&&v&&n[1].toLowerCase()===name.toLowerCase())return text(v[1])}return ''}
export function canonical(value,base){const u=new URL(value,base);if(!['http:','https:'].includes(u.protocol))throw Error('非网页链接');if(!['nyj.shandong.gov.cn','fgw.shandong.gov.cn'].includes(u.hostname))u.protocol='https:';if(u.pathname!=='/sa.html')u.hash='';if(u.hostname==='nyj.shandong.gov.cn')u.searchParams.delete('xxgkhide');return u.href}
export function allowed(url,source){const host=new URL(url).hostname;if(source.allowedHosts)return source.allowedHosts.some(root=>host===root||host.endsWith('.'+root));const root=source.id.startsWith('ndrc')?'ndrc.gov.cn':source.id.startsWith('sd-nyj')?'nyj.shandong.gov.cn':source.id.startsWith('sd-fgw')?'fgw.shandong.gov.cn':'nea.gov.cn';return host===root||host.endsWith('.'+root)}
// Substantive market regulation may be reported as news rather than a formal document.
export function shandongMarketUpdate(title){
 if(/召开|座谈|调研|走访|培训|宣贯|宣讲|党建|党日|献血|捐|招聘|采购|招标|安全生产|事故隐患/.test(title))return false;
 return /电力市场|电力交易|电力系统并网运行|虚拟电厂|市场交易机构|市场经营主体|市场化手段|市场机制|电网公平开放|电网设施公平开放/.test(title);
}
export function relevance(title,source={}){
 if((source.region==='山东'||String(source.id||'').startsWith('sdb'))&&shandongMarketUpdate(title))return true;
 const topic=/售电|电网公平开放|电力市场|电力现货|电力中长期|能源保供|电力保供|电力.*中长期合同|直接交易|辅助服务|并网运行|输配电|输电价格|输电权|绿电|绿证|绿色电力|电价|虚拟电厂|需求响应|电力体制|新型电力系统|煤电|新能源|储能|抽水蓄能|能源行政处罚|供电企业信息公开|电力调度|电力负荷|电能量|容量补偿|电力交易/;
 const formal=/通知|规则|办法|规定|细则|意见|指引|规划|政策|解读|答记者问|一图读懂|监管|方案|公告|通告|机制|函|批复|决定/.test(title);
 const interpretation=String(source.id||'').includes('interpretation')||String(source.channel||'').includes('解读');
 return !/外债|氢能产业|电煤|煤炭中长期/.test(title)&&topic.test(title)&&(formal||interpretation);
}
export function genericOfficialTitle(title=''){
 const normalized=text(title).replace(/\s+/g,'');
 return /^(?:中华人民共和国)?(?:国家发展和改革委员会|国家发展改革委|国家能源局(?:综合司)?)?公告20\d{2}年第\d+号$/.test(normalized);
}
export function detailRelevance(h,source={}){
 return text(h).split(/[。；！？]/).some(part=>relevance(part,source));
}
export function isChallenge(h){return /usershare\/flash\.js|rtcsetcookie\(|checkflash\(/i.test(h)}
export function parseLinks(h,base,source){const out=[];for(const m of h.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)){const href=m[1].match(/href\s*=\s*["']([^"']+)/i);if(!href)continue;let url;try{url=canonical(href[1],base)}catch{continue}if(!allowed(url,source))continue;const u=new URL(url);if(!/\/(?:t?\d{8}[_/]|\d{6}\/)|\/c\.html|\/content\/post_\d+\.html|\/art\/\d{4}\/\d{1,2}\/\d{1,2}\//.test(u.pathname)&&!(u.hostname==='yyglxxbsgw.ndrc.gov.cn'&&['/sa.html','/htmls/article/article.html'].includes(u.pathname)))continue;const title=text(m[1].match(/\btitle\s*=\s*["']([^"']+)/i)?.[1]||m[2]).replace(/^【进行中】/,'').replace(/\[已结束\]$/,'').replace(/\s*20\d{2}[-/]\d{2}[-/]\d{2}\s*$/,'');const liStart=h.lastIndexOf('<li',m.index),liEnd=h.indexOf('</li>',m.index);const block=liStart>=0&&liEnd>=0?h.slice(m.index,liEnd):h.slice(m.index,m.index+m[0].length+180);const d=text(block).match(/(20\d{2})[-/](\d{2})[-/](\d{2})/);const pathDate=u.pathname.match(/(?:t|\/)(20\d{2})(\d{2})(\d{2})/)||u.pathname.match(/\/art\/(20\d{2})\/(\d{1,2})\/(\d{1,2})\//);const p=d||pathDate;out.push({url,title,date:p?`${p[1]}-${p[2].padStart(2,'0')}-${p[3].padStart(2,'0')}`:''})}return out}
export function attachments(h,base){return [...h.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].filter(m=>/\.(?:pdf|docx?|xlsx?)(?:\?|$)|\/module\/download\/downfile\.jsp/i.test(m[1])).map(m=>{try{return {title:text(m[2])||'附件',url:new URL(m[1].replaceAll('&amp;','&'),base).href}}catch{return null}}).filter(Boolean)}
