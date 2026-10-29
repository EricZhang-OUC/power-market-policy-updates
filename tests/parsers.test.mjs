import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLinks,allowed,attachments,relevance,genericOfficialTitle,detailRelevance,isChallenge} from '../scripts/parsers.mjs';

test('coal power and renewable integration policy and interpretation titles are retained',()=>{
 assert(relevance('国家能源局关于推动煤电与新能源融合发展的实施意见'));
 assert(relevance('国家能源局关于煤电机组改造升级的实施方案'));
 assert(relevance('国家能源局关于促进新能源高质量发展的指导意见'));
 assert(relevance('国家能源局关于完善虚拟电厂管理机制的通知'));
 assert(relevance('国家能源局关于促进新型储能高质量发展的实施方案'));
 assert(relevance('构建煤电与新能源融合发展模式 持续提升系统调节能力与绿色低碳水平',{id:'nea-interpretation',channel:'解读'}));
 assert(!relevance('国家能源局召开煤电与新能源融合发展工作座谈会'));
});

test('numbered announcements are inspected for relevant policy changes in their body',()=>{
 assert(genericOfficialTitle('国家能源局公告 2026年第3号'));
 assert(!relevance('国家能源局公告 2026年第3号'));
 assert(detailRelevance('<p>决定废止《国家能源局综合司关于当前开展电力用户与发电企业直接交易有关事项的通知》。</p>'));
 assert(!detailRelevance('<p>现公布能源行业一般统计信息。</p>'));
});
import {loadSource} from '../scripts/source-loader.mjs';
test('official market replies and approvals are retained without requiring the word notice',()=>{
 for(const title of ['关于同意南方区域电力市场转入正式运行的复函(发改办体改〔2026〕715号)','关于跨电网经营区常态化电力交易机制方案的复函','关于新能源机制电价竞价有关事项的函','关于电力市场交易规则的批复','关于修改电力市场规则的决定'])assert(relevance(title),title);
 assert(!relevance('关于对外投资项目的复函'));
 const rows=parseLinks('<li><a href="./202610/t20261028_1408423.html">关于同意南方区域电力市场转入正式运行的复函(发改办体改〔2026〕715号)</a><span>2026/10/28</span></li>','https://www.ndrc.gov.cn/xxgk/zcfb/tz/',{id:'ndrc'});
 assert.equal(rows[0].date,'2026-10-28');assert(relevance(rows[0].title));
});
test('energy supply long-term contract order and accompanying explanations are selected',()=>{
 for(const title of ['《能源保供中长期合同管理办法(试行)》 2026年第50号令','国家发展改革委印发《能源保供中长期合同管理办法（试行）》','国家发展改革委有关负责同志就《能源保供中长期合同管理办法（试行）》答记者问'])assert(relevance(title),title);
 assert(!relevance('能源保供工作座谈会在京召开'));
});
const source={id:'sd-nyj-notices',url:'http://nyj.shandong.gov.cn/col/col59960/index.html',adapter:'jpage'};
test('Shandong dated paths and list dates parse from XML-embedded records',()=>{
 const html=`<script type="text/xml"><record><![CDATA[<li><a href="/art/2022/1/5/art_59960_12.html">关于售电公司管理的通知</a><span>2022-01-06</span></li>]]></record></script>`;
 const rows=parseLinks(html,source.url,source);assert.equal(rows.length,1);assert.equal(rows[0].date,'2022-01-06');assert(rows[0].url.startsWith('http://nyj.shandong.gov.cn/'));
});
test('dated card does not accidentally inherit next card date',()=>{
 const rows=parseLinks('<li><a href="/art/2022/1/5/art_59960_1.html">电价通知</a></li><li><a href="/art/2026/10/1/art_59960_2.html">电价通知</a><span>2026-10-02</span></li>',source.url,source);
 assert.equal(rows[0].date,'2022-01-05');assert.equal(rows[1].date,'2026-10-02');
});
test('relevant topics, download endpoints and domain boundary',()=>{
 assert(relevance('售电公司管理办法征求意见'));assert(relevance('关于加快推动新能源场站配建储能高质量发展的通知'));assert(!relevance('关于煤矿人员领取许可证的通知'));assert(!allowed('https://evilndrc.gov.cn/xxgk/',{id:'ndrc'}));assert.equal(attachments('<a href="/module/download/downfile.jsp?classid=0&amp;filename=file.pdf">附件</a>',source.url)[0].url,'http://nyj.shandong.gov.cn/module/download/downfile.jsp?classid=0&filename=file.pdf');
});
test('challenge HTML is not an empty successful list',async()=>{
 assert(isChallenge('<script src="/usershare/flash.js"></script>'));await assert.rejects(()=>loadSource(source,async()=>'<script src="/usershare/flash.js"></script>'),/验证页/);
});
test('static pagination walks backwards past 2022 instead of first-page truncation',async()=>{
 const s={id:'ndrc',url:'https://www.ndrc.gov.cn/xxgk/zcfb/tz/',adapter:'trs'};let urls=[];
 const result=await loadSource(s,async u=>{urls.push(u);const page=u.includes('index_1')?'20220102':'20260102';return '<li><a href="./'+page.slice(0,6)+'/t'+page+'_123.html">电价通知</a><span>'+page.slice(0,4)+'/'+page.slice(4,6)+'/'+page.slice(6)+'</span></li><script>createPageHTML(2,0,"index","html")</script>'});
 assert.equal(urls.length,2);assert(result.entries.some(r=>r.date==='2022-01-02'));assert.equal(result.stopReason,'declared-page-end');
});

test('China government latest-policy JSON and Shandong price links are supported',async()=>{
 const gov={id:'gov-latest',url:'https://www.gov.cn/zhengce/zuixin/',adapter:'gov-json',allowedHosts:['gov.cn']};
 const result=await loadSource(gov,async url=>url.endsWith('ZUIXINZHENGCE.json')?JSON.stringify([{URL:'/zhengce/content/202610/content_1.htm',TITLE:'国务院关于促进新能源高质量发展的意见',DOCRELPUBTIME:'2026-10-21'}]):'<html></html>');
 assert.equal(result.entries[0].date,'2026-10-21');assert.equal(result.entries[0].url,'https://www.gov.cn/zhengce/content/202610/content_1.htm');
 const price={id:'sd-fgw-price',url:'http://fgw.shandong.gov.cn/col/col91687/index.html',allowedHosts:['fgw.shandong.gov.cn']};
 const rows=parseLinks('<li><a href="/art/2026/9/21/art_91687_1.html">关于印发《山东省电力零售市场价格风险防控实施细则》的通知</a><span>2026-09-21</span></li>',price.url,price);
 assert.equal(rows[0].url,'http://fgw.shandong.gov.cn/art/2026/9/21/art_91687_1.html');
});
