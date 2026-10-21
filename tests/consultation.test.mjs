import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {consultationDetail} from '../scripts/ndrc-consultation.mjs';
const dataset=JSON.parse(fs.readFileSync(new URL('../data/policies.json',import.meta.url),'utf8'));
test('three reported missing consultations have official dates, detail links and attachments',()=>{
 for(const [title,date] of [['电力现货市场基本规则','2026-10-19'],['售电公司管理办法','2026-09-04'],['电力市场风险防控管理办法','2026-09-30']]){
  const rows=dataset.rows.filter(r=>r.title.startsWith('国家发展改革委关于向社会公开征求')&&r.title.includes(title));assert.equal(rows.length,1);assert.equal(rows[0].date,date);assert.equal(new URL(rows[0].url).pathname,'/htmls/article/article.html');assert(rows[0].attachments.length>0);assert(!('state' in rows[0]));
 }
 assert.equal(new Set(dataset.rows.map(r=>r.url)).size,dataset.rows.length);
});
test('NDRC short link resolves through public API, preserving canonical article URL',async()=>{
 const calls=[];const detail='https://yyglxxbsgw.ndrc.gov.cn/htmls/article/article.html?articleId=sample';
 const result=await consultationDetail('https://yyglxxbsgw.ndrc.gov.cn/sa.html#/dlxhsc',async url=>{calls.push(url);return JSON.stringify(url.includes('access-url')?{data:detail}:{data:{articleTitle:'电力现货市场<BR>基本规则',publishDate:'2026-10-19',articleContent:'<p>公告</p>'}})});
 assert.equal(result.url,detail);assert(calls[0].endsWith('shortKey=dlxhsc'));assert(calls[1].endsWith('articleId=sample'));assert(result.html.includes('电力现货市场基本规则'));
});
test('unreadable dynamic response is rejected, rather than storing empty shell as success',async()=>{
 await assert.rejects(()=>consultationDetail('https://yyglxxbsgw.ndrc.gov.cn/htmls/article/article.html?articleId=sample',async()=>JSON.stringify({data:{}})),/缺少标题/);
});
test('national timeline renders reported notices without library or admin routes',()=>{
 const elements={};const ctx={window:{POLICY_DATA:dataset},document:{querySelector:q=>elements[q]??={textContent:'',innerHTML:'',value:'',style:{}},querySelectorAll:()=>[]},setTimeout:()=>{}};vm.createContext(ctx);const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);for(const title of ['电力现货市场基本规则','售电公司管理办法','电力市场风险防控管理办法'])assert(elements['#results'].innerHTML.includes(title));assert(!html.includes('政策一览'));assert(!html.includes('管理员'));assert(!html.includes('人工确认入库'));assert(html.includes('2022-01-01'));elements['#year'].value='2026';elements['#year'].onchange();assert(elements['#results'].innerHTML.includes('电力现货市场基本规则'));
});
