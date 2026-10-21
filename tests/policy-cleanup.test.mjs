import test from 'node:test';import assert from 'node:assert/strict';import {cleanPolicies} from '../scripts/policy-cleanup.mjs';
const record=(id,title,date='2026-01-01')=>({id,title,date,region:'国家',agency:'国家能源局',url:'https://www.nea.gov.cn/'+id,detailStatus:'read',attachments:[]});
test('same official document across portals is merged and all links retained',()=>{const a=record('a','国家发展改革委 国家能源局关于印发《电力市场规则》的通知 发改能源〔2026〕12号');const b={...record('b','关于印发《电力市场规则》的通知(发改能源〔2026〕12号)','2026-01-03'),url:'https://www.ndrc.gov.cn/b',agency:'国家发展改革委'};const result=cleanPolicies([a,b]);assert.equal(result.rows.length,1);assert.equal(result.rows[0].url,b.url);assert.equal(result.rows[0].otherSources[0].url,a.url);assert.equal(result.rows[0].sourceCount,2)});
test('drafts, revisions, interpretation and later same-title releases remain separate',()=>{const titles=['关于印发《电力市场规则》的通知 发改能源〔2026〕12号','关于印发《电力市场规则（修订版）》的通知 发改能源〔2026〕12号','关于《电力市场规则》的通知（征求意见稿） 发改能源〔2026〕12号','关于《电力市场规则》的通知解读 发改能源〔2026〕12号'];assert.equal(cleanPolicies(titles.map((t,i)=>record('r'+i,t))).rows.length,4);assert.equal(cleanPolicies([record('x','电力市场规则通知'),record('y','电力市场规则通知','2026-02-10')]).rows.length,2)});
test('policy and two different interpretations referring to same number are not combined',()=>{const titles=['关于电力市场规则的通知 发改能源〔2026〕12号','专家甲解读电力市场规则 发改能源〔2026〕12号','专家乙解读电力市场规则 发改能源〔2026〕12号'];assert.equal(cleanPolicies(titles.map((t,i)=>record('t'+i,t))).rows.length,3)});
test('irrelevant and local news exclusions are reviewable, source array is not mutated',()=>{const input=[record('x','江苏能源监管办召开电力市场座谈会'),record('y','关于企业中长期外债的通知'),record('z','关于完善电价机制的通知')];assert.equal(cleanPolicies(input).report.excluded.length,2);assert.equal(input.length,3)});

test('Shandong removes work updates even when they mention a named rule',()=>{
 const titles=['山东能源监管办扎实开展电力市场秩序现场检查工作','山东能源监管办召开《山东电力市场规则》宣贯会','山东能源监管办以市场化手段推动储能高质量规模化发展','山东能源监管办组织开展电力市场交易规则修订工作'];
 const input=titles.map((t,i)=>({...record('sd-work'+i,t),region:'山东'}));
 const result=cleanPolicies(input);assert.equal(result.rows.length,0);assert.equal(result.report.excluded.length,4);assert.equal(input.length,4);
});

test('Shandong retains releases, drafts, explanations and unquoted formal notices',()=>{
 const titles=['关于印发《山东电力市场规则(试行)》的通知','关于公开征求《山东省电力市场监管办法》意见的通知','《山东电力市场规则(试行)》编制说明','山东能源监管办修订《山东省电力并网运行管理实施细则》','关于山东电力现货市场由试运行转正式运行的通知','关于印发《山东电力市场参数（试行）》的通知'];
 assert.equal(cleanPolicies(titles.map((t,i)=>({...record('sd-rule'+i,t),region:'山东'}))).rows.length,titles.length);
 const work=record('national-work','国家能源局推进电力市场建设工作');assert.equal(cleanPolicies([work]).rows.length,1);
});
