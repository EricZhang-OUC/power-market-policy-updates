import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSource} from '../scripts/source-loader.mjs';
import {canonical,relevance} from '../scripts/parsers.mjs';
import {exclusionReason} from '../scripts/policy-cleanup.mjs';
import {sources} from '../scripts/sources.mjs';
const source=sources.find(s=>s.id==='sd-nyj-disclosure');
const article=(date,id,title)=>`<li><a title="${title}" href="http://nyj.shandong.gov.cn/art/${date.replaceAll('-','/')}/art_100393_${id}.html?xxgkhide=1">${title.slice(0,12)}...</a><b>${date}</b></li>`;
const page=(rows,total=2)=>rows.join('')+`<span>页 / 共 ${total} 页</span>`;

test('Shandong disclosure uses the public POST list and follows pagination beyond the shell',async()=>{
 const titles=['政策解读：《关于加快推动新能源场站配建储能高质量发展的通知》','政策解读：《山东省新能源领域场景建设实施方案》','一图读懂：《关于加强和规范绿电直连发展的通知》','政策解读：《关于加强和规范绿电直连发展的通知》','山东省能源局关于印发《山东省新能源领域场景建设实施方案》的通知','关于印发《山东省虚拟电厂建设运行管理办法》的通知','关于加强和规范绿电直连发展的通知'];
 const calls=[];
 const loaded=await loadSource(source,async(url,options)=>{
  calls.push(url);assert.equal(url,'http://nyj.shandong.gov.cn/module/xxgk/search.jsp');assert.equal(options.method,'POST');
  const params=new URLSearchParams(options.body);assert.equal(params.get('infotypeId'),'SD0202');assert.equal(params.get('isAllList'),'1');
  const n=Number(params.get('currpage'));
  return page((n===1?titles.slice(0,3):titles.slice(3)).map((t,i)=>article('2026-07-08',n*10+i,t)));
 },{maxPages:20});
 assert.equal(calls.length,2);assert.equal(loaded.stopReason,'declared-page-end');assert.equal(loaded.entries.length,7);
 for(const r of loaded.entries){assert(!r.url.includes('xxgkhide'));assert(relevance(r.title,source));assert.equal(exclusionReason({...r,region:'山东'}),'');assert.equal(r.date,'2026-07-08')}
 assert.deepEqual(loaded.entries.map(r=>r.title),titles);
});

test('Shandong disclosure stops after a wholly old page, not a single backdated row',async()=>{
 let calls=0;
 const loaded=await loadSource(source,async()=>{
  calls++;
  return page(calls===1?[article('2021-01-01',1,'旧通知'),article('2026-07-08',2,'关于完善电价机制的通知')]:[article('2021-01-01',3,'旧通知二')],17);
 },{maxPages:20});
 assert.equal(calls,2);assert.equal(loaded.stopReason,'passed-history-start');
});

test('Shandong unreadable pagination is reported and empty shells are rejected',async()=>{
 let calls=0;
 const loaded=await loadSource(source,async()=>{
  if(++calls===2)throw Error('HTTP 503');
  return page([article('2026-07-08',1,'关于完善电价机制的通知')]);
 });
 assert.equal(loaded.listErrors.length,1);assert.equal(loaded.stopReason,'page-read-error');
 await assert.rejects(loadSource(source,async()=>'<div>正在加载内容，请稍候...</div>'),/未返回文件列表/);
 await assert.rejects(loadSource(source,async()=>'<script src="/usershare/flash.js"></script>'),/验证页/);
});

test('Shandong disclosure parameter is a display option and does not duplicate an article',()=>{
 const url='http://nyj.shandong.gov.cn/art/2026/7/8/art_100393_10312595.html';
 assert.equal(canonical(url+'?xxgkhide=1'),canonical(url));
 const interpretation=sources.find(s=>s.id==='sd-nyj-interpretation');
 assert.equal(interpretation.adapter,'sd-xxgk');assert.equal(new URL(interpretation.url).searchParams.get('number'),'SD020207');assert(!interpretation.seedRecords);
});

test('official interpretation column retains relevant explanations without a formal-document title',()=>{
 const r={region:'山东',title:'充分发挥价格引导作用 支持新型储能健康发展',url:'http://nyj.shandong.gov.cn/art/2023/11/13/art_100396_10301655.html'};
 assert.equal(exclusionReason(r),'');
 assert(exclusionReason({...r,url:'http://nyj.shandong.gov.cn/art/2023/11/13/art_59960_10301655.html'}));
 assert(exclusionReason({...r,title:'煤矿企业安全生产会议'}));
});
