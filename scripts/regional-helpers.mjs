import {relevance} from './parsers.mjs';
const provinces=['内蒙古','黑龙江','广东','广西','海南','云南','贵州','山西','甘肃','新疆','浙江','江苏','福建','河南','湖南','四川','北京','天津','河北','辽宁','吉林','陕西','宁夏','青海','上海','安徽','江西','湖北','重庆','西藏'];
function regionalTopic(title){if(/^(?:国家能源局(?:综合司)?|国家发展改革委(?:员会)?)(?:关于|办公厅|、|\s+国家能源局)/.test(title)||/青年干部|建言献策|党建|党课|主题教育|人事任免/.test(title))return false;if(/煤矿|油气|天然气|电煤|外债|许可.*公告|行政许可通告|人事任免|课题|招聘|采购|招标|设备检修/.test(title)&&!/电力市场|电力现货|辅助服务/.test(title))return false;return relevance(title)||/电力(?:多边)?交易.*(?:市场|规则)|电力市场|电力现货|中长期.*交易|新能源.*入市|售电.*(?:规则|交易|监管)|两个细则|两细则|调频.*市场|爬坡.*市场/.test(title)}
export function regionalRelevance(title){
 if(!regionalTopic(title))return false;
 return ruleDocument(title);
}
export function ruleDocument(title){
 // A meeting about a named rule is still a work update, not a document release.
 const outside=title.replace(/《[^》]*》/g,'');
 if(/召开|座谈|调研|走访|现场检查|督导|培训|宣贯|宣讲|工作会|专题研究|组织.*(?:会议|活动)|推进.*工作|开展.*监管/.test(outside))return false;
 const documentTerms=/规则|细则|办法|规定|方案|意见|指引|准则|标准|通知|价格机制|实施机制/;
 const names=[...title.matchAll(/《([^》]+)》/g)].map(m=>m[1]);
 if(names.some(name=>documentTerms.test(name)))return true;
 // Keep unquoted formal notices and documents, without treating work verbs as a release.
 if(/组织修订|研究修订|推动|推进|召开|开展/.test(outside)&&!/印发|发布|征求|解读|答记者问/.test(outside))return false;
 if(/关于.*(?:通知|公告|通告|函|批复|决定)(?:[（(][^）)]*[）)])?$/.test(title))return true;
 return documentTerms.test(title)&&(/关于.*(?:通知|公告|通告|复函)$|印发|发布|公开征求|征求意见|政策解读|答记者问|修订.*条款.*通知/.test(title)||/(?:规则|细则|办法|规定|规则体系)(?:[（(]?(?:试行|暂行|20\d{2}年?(?:修订版|版)?|修订版)[）)]?)?$/.test(title));
}
export function regionalArea(title,fallback){const found=provinces.filter(p=>title.includes(p));if(found.length===1)return found[0];return fallback}
export function publicationDate(detail,candidateDate,meta,text){const value=meta(detail,'PubDate')||meta(detail,'publishdate')||meta(detail,'pubtime')||meta(detail,'ArticlePubDate');const d=value.match(/20\d{2}[-/]\d{1,2}[-/]\d{1,2}/)?.[0];if(d){const [y,m,day]=d.split(/[-/]/);return `${y}-${m.padStart(2,'0')}-${day.padStart(2,'0')}`}if(candidateDate)return candidateDate;const m=text(detail).match(/(?:发布日期|发布时间|时间)[:：]?\s*(20\d{2})[-/年](\d{1,2})[-/月](\d{1,2})/);return m?`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`:''}
