import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSource} from '../scripts/source-loader.mjs';
import {parseLinks,relevance,canonical} from '../scripts/parsers.mjs';
import {exclusionReason} from '../scripts/policy-cleanup.mjs';
import {sources} from '../scripts/sources.mjs';
const url='http://fgw.shandong.gov.cn/col/col91687/index.html';
const price=sources.find(s=>s.id==='sd-fgw-price');
const row=(n,date='2026-09-21',title='关于进一步优化分时电价机制的函')=>`<record><![CDATA[<li><a href="http://fgw.shandong.gov.cn/art/${date.replaceAll('-','/')}/art_91687_${n}.html" title="${title}">${title}</a><span>${date}</span></li>]]></record>`;
const first=rows=>`<script><datastore><recordset>${rows.join('')}</recordset></datastore></script><script>var param_233913 = {col:1,webid:408,path:'http://fgw.shandong.gov.cn/',columnid:91687,sourceContentType:1,unitid:'233913',webname:'shandong',permissiontype:0}; var config={totalRecord:8,perPage:1,groupSize:2};</script>`;

test('FGW JPage sends record ranges via POST and scans through the history boundary',async()=>{
 const calls=[];const result=await loadSource(price,async(u,o)=>{
  calls.push(u);if(u===url)return first([row(1),row(2)]);
  assert.equal(o.method,'POST');assert.equal(new URLSearchParams(o.body).get('webid'),'408');
  const p=new URL(u).searchParams;assert.equal(p.get('perpage'),'1');
  if(p.get('startrecord')==='3'){assert.equal(p.get('endrecord'),'4');return `<recordset>${row(3,'2023-09-21')}${row(4,'2023-09-20')}</recordset>`}
  assert.equal(p.get('startrecord'),'5');assert.equal(p.get('endrecord'),'6');return `<recordset>${row(5,'2021-09-21')}${row(6,'2021-09-20')}</recordset>`;
 },{maxPages:30});
 assert.equal(calls.length,3);assert.equal(result.entries.length,6);assert.equal(result.stopReason,'passed-history-start');
});

test('FGW JPage records empty, repeated and failed groups as incomplete',async()=>{
 const empty=await loadSource(price,async u=>u===url?first([row(1)]):'<recordset></recordset>');assert.equal(empty.stopReason,'unparsed-page');
 const repeated=await loadSource(price,async u=>u===url?first([row(1)]):`<recordset>${row(1)}</recordset>`);assert.equal(repeated.stopReason,'repeated-next-page');
 const failed=await loadSource(price,async u=>{if(u===url)return first([row(1)]);throw Error('HTTP 503')});assert.equal(failed.listErrors.length,1);assert.equal(failed.stopReason,'page-read-error');
});

test('FGW template title placeholders fall back to visible text even with a quoted greater-than sign',()=>{
 const html='<li><a title="<!--articletitle-->" href="/art/2026/9/21/art_306787_87829.html">关于新能源机制电价竞价有关事项的函</a><span>2026-09-21</span></li>';
 const rows=parseLinks(html,url,price);assert.equal(rows[0].title,'关于新能源机制电价竞价有关事项的函');assert(relevance(rows[0].title,price));
 assert.equal(canonical(rows[0].url+'?xxgkhide=1'),rows[0].url);
});

test('all reported price documents survive selection and Shandong cleanup',()=>{
 const titles=['关于新能源机制电价竞价有关事项的函','关于印发《山东省电力零售市场价格风险防控实施细则（修订稿）》的通知','工商业非电网直供环节电价政策明白纸','关于进一步优化分时电价机制的函','关于2025-2027年开工抽水蓄能电站电价政策有关事项的通知(鲁发改价格〔2026〕627号)','山东省发展和改革委员会 山东省能源局关于贯彻发改价格〔2025〕1192号文件支持新能源就近消纳价格政策有关事项的通知（鲁发改价格〔2026〕554号）','关于山东电网第四监管周期输配电价及有关事项的通知（鲁发改价格〔2026〕556号）'];
 for(const title of titles){assert(relevance(title,price),title);assert.equal(exclusionReason({title,region:'山东',url:'http://fgw.shandong.gov.cn/art/2026/9/21/art_91687_10513645.html'}),'',title)}
 assert(relevance('关于电力零售市场价格风险防控的通知'));assert(!relevance('关于消费品零售市场发展的通知'));
 assert(!relevance('关于机动车驾驶许可考试收费标准的通知',price));
});

test('FGW disclosure uses its own website identity and keeps policy explanations',async()=>{
 const source=sources.find(s=>s.id==='sd-fgw-interpretation');
 const title='媒体解读 | 关于印发《山东省新能源上网电价市场化改革实施方案》的通知';
 const loaded=await loadSource(source,async(u,o)=>{
  const p=new URLSearchParams(o.body);assert.equal(p.get('jdid'),'408');assert.equal(p.get('divid'),'div91105');assert.equal(p.get('infotypeId'),'SD020207');
  return `<li><a href="http://fgw.shandong.gov.cn/art/2025/8/7/art_91410_1.html?xxgkhide=1" title="${title}">${title}</a><b>2025-08-07</b></li><span>共1页</span>`;
 });
 assert.equal(loaded.entries.length,1);assert(relevance(loaded.entries[0].title,source));assert.equal(exclusionReason({...loaded.entries[0],region:'山东'}),'');
 for(const id of ['sd-fgw','sd-fgw-price','sd-fgw-other','sd-fgw-interpretation','sd-fgw-consultation'])assert(sources.find(s=>s.id===id)?.maxPages>=20);
 assert.equal(sources.find(s=>s.id==='sd-fgw-other').adapter,'sd-xxgk');
});
