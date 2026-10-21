import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLinks,allowed,attachments,relevance,isChallenge} from '../scripts/parsers.mjs';
import {loadSource} from '../scripts/source-loader.mjs';
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
