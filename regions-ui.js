(function(){
 window.renderRegions=function(){
  const data=window.REGIONAL_DATA||{rows:[],sources:[]};
  const rows=data.rows.filter(r=>r.date>='2026-01-01');
  document.querySelector('#desc').textContent='区域市场与各省区的规则发布、修订、征求意见及官方解读。';
  document.querySelector('#updated').textContent=data.updatedAt?'动态更新于 '+new Date(data.updatedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'';
  document.querySelector('#sync-status').textContent='收录2026年起的动态，按发布时间排列。'+(data.sources.some(s=>s.status!=='ok')?'部分来源尚未完整读取。':'');
  document.querySelector('#content').innerHTML='<p class="regional-count meta">已收录 '+rows.length+' 条 · 省份或区域见卡片标注</p>'+feed(rows);
 };
})();
