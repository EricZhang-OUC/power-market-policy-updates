import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {publication,climatePeriod,sdForecast} from '../scripts/weather-parsers.mjs';
test('weather publication uses official author timestamp rather than fetch time',()=>{assert.equal(publication('<div class=author>签发：张 <b>2026</b>&nbsp;年 <b>10</b>月21日08时</div>'),'2026-10-21T08:00:00+08:00')});
test('climate periods handle month, leap-year and year-crossing ranges',()=>{assert.equal(climatePeriod('2026年11月气候趋势预测').validTo,'2026-11-30');assert.equal(climatePeriod('2028年2月气候趋势预测').validTo,'2028-02-29');assert.equal(climatePeriod('2026年12月25日至1月9日气候趋势预测').validTo,'2027-01-09');assert.equal(climatePeriod('2026年11月2日至11月17日气候趋势预测').validFrom,'2026-11-02')});
test('Shandong forecast publication and day-only range are separate',()=>{const x=sdForecast('<p>31日下午到1日白天</p><p>1日夜间到2日白天</p><p>山东省气象台</p><p>2026年10月31日11时</p>');assert.equal(x.publishedAt,'2026-10-31T11:00:00+08:00');assert.equal(x.validTo,'2026-11-02')});
// Rendering tests use fixed products and a fixed clock, never the live collected data.
const product={date:'2026-10-24',publishedAt:'2026-10-24T08:00:00+08:00',validTo:'2026-10-26',periodLabel:'24日至26日',url:'https://example.test/forecast',rolling:true};
const weatherFixture={rows:[
 {...product,region:'山东',category:'天气预报',agency:'山东省气象台',title:'山东省气象台短期天气预报'},
 {...product,region:'全国',category:'气象预警',agency:'中央气象台',title:'全国预警样例'},
 {...product,region:'全国',category:'气候预测',agency:'国家气候中心',title:'气候预测样例'}
],sources:[
 {id:'sd-daily',region:'山东',category:'天气预报',agency:'山东省气象局每日气象',status:'link-only',url:'https://example.test/daily'},
 {id:'sd-climate',region:'山东',category:'气候预测',agency:'山东气候预测',status:'link-only',entryLabel:'延伸期、月度、季节与年度预测',url:'https://sd.cma.gov.cn/qxfw_3576/qhyc/202201/t20220127_4471990.html'}
]};
function renderAt(now){
 const elements={};class FixedDate extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return new Date(now).getTime()}}
 const c={window:{WEATHER_DATA:weatherFixture},document:{querySelector:q=>elements[q]??={textContent:'',innerHTML:''}},esc:s=>String(s??''),Intl,Date:FixedDate};
 vm.createContext(c);vm.runInContext(fs.readFileSync(new URL('../weather-ui.js',import.meta.url),'utf8'),c);c.window.renderWeather();return {c,elements};
}
test('weather UI separates regions and preserves official PDF links using a fixed clock',()=>{
 const {c,elements}=renderAt('2026-10-26T04:00:00Z');
 assert(elements['#content'].innerHTML.includes('全国 · 气象预警'));
 assert(!elements['#content'].innerHTML.includes('每日气象 / PDF原文入口'));
 c.window.weatherRegion('山东');
 for(const title of ['山东省气象台短期天气预报','每日气象 / PDF原文入口','山东 · 气候预测','延伸期、月度、季节与年度预测','https://sd.cma.gov.cn/qxfw_3576/qhyc/202201/t20220127_4471990.html'])assert(elements['#content'].innerHTML.includes(title),title);
 assert(!elements['#content'].innerHTML.includes('国家气候中心'));
 assert(!elements['#content'].innerHTML.includes('山东 · 气象预警'));
 c.window.weatherRegion('全国');
 assert(elements['#content'].innerHTML.includes('国家气候中心'));
 for(const title of ['山东省气象台短期天气预报','type="checkbox"','item-recent','近三天'])assert(!elements['#content'].innerHTML.includes(title),title);
});
test('expired forecast disappears at Shanghai midnight while official entry links remain',()=>{
 const before=renderAt('2026-10-26T15:59:59Z');before.c.window.weatherRegion('山东');
 assert(before.elements['#content'].innerHTML.includes('山东省气象台短期天气预报'));
 const after=renderAt('2026-10-26T16:00:00Z');after.c.window.weatherRegion('山东');
 assert(!after.elements['#content'].innerHTML.includes('山东省气象台短期天气预报'));
 assert(after.elements['#content'].innerHTML.includes('每日气象 / PDF原文入口'));
 assert(after.elements['#content'].innerHTML.includes('延伸期、月度、季节与年度预测'));
});
