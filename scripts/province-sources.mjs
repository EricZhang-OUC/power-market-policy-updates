export const provinceSources=[
{id:'nmg-nyj-notices',name:'内蒙古自治区能源局',region:'内蒙古',channel:'通知公告',url:'https://nyj.nmg.gov.cn/tzgg/',adapter:'trs',allowedHosts:['nyj.nmg.gov.cn']},
{id:'nmg-nyj-home',name:'内蒙古自治区能源局',region:'内蒙古',channel:'官网政策补充',url:'https://nyj.nmg.gov.cn/',adapter:'single',allowedHosts:['nyj.nmg.gov.cn']},
{id:'gd-drc-notices',name:'广东省发展改革委',region:'广东',channel:'业务通知',url:'https://drc.gd.gov.cn/ywtz/index.html',adapter:'single',allowedHosts:['drc.gd.gov.cn']},
{id:'gd-drc-public',name:'广东省发展改革委',region:'广东',channel:'公告公示',url:'https://drc.gd.gov.cn/gggs5623/index.html',adapter:'single',allowedHosts:['drc.gd.gov.cn']},
{id:'gd-drc-interpretation',name:'广东省发展改革委',region:'广东',channel:'政策解读',url:'https://drc.gd.gov.cn/zcjd5635/index.html',adapter:'single',allowedHosts:['drc.gd.gov.cn']},
{id:'gd-nyj',name:'广东省能源局',region:'广东',channel:'官网入口',url:'https://drc.gd.gov.cn/snyj/index.html',adapter:'single',allowedHosts:['drc.gd.gov.cn']},
{id:'sx-nyj-notices',name:'山西省能源局',region:'山西',channel:'通知公告',url:'https://nyj.shanxi.gov.cn/zfxxgk/fdzdgknr/gg/fdzdgknr_11759.html',adapter:'single',allowedHosts:['nyj.shanxi.gov.cn']},
{id:'sx-nyj-interpretation',name:'山西省能源局',region:'山西',channel:'政策解读',url:'https://nyj.shanxi.gov.cn/zfxxgk/fdzdgknr/jdhy/fdzdgknr_11759.html',adapter:'single',allowedHosts:['nyj.shanxi.gov.cn']},
{id:'sx-nyj-consultation',name:'山西省能源局',region:'山西',channel:'意见征集',url:'https://nyj.shanxi.gov.cn/hdjl_0531/yjzj_new/',adapter:'trs',allowedHosts:['nyj.shanxi.gov.cn']}
];

// A verified 2026 historical notice not present on the current listing page.
provinceSources.find(s=>s.id==='nmg-nyj-notices').seedRecords=[{url:'https://nyj.nmg.gov.cn/tzgg/202602/t20260214_2863478.html',title:'内蒙古自治区能源局关于公开征求《内蒙古电力多边交易市场规则体系2026年修订版(征求意见稿)》《蒙东电力市场规则体系2026年修订版(征求意见稿)》意见建议的公告',date:'2026-02-14'}];
