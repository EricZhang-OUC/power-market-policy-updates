(function(){
 window.renderMedia=function(){
  const data=window.MEDIA_DATA||{rows:[],sources:[],accounts:[]};
  const rows=data.rows.filter(r=>r.group==='行业观察'&&r.date>='2026-01-01');
  document.querySelector('#desc').textContent='关注电力市场的媒体报道与行业解读。';
  document.querySelector('#updated').textContent=data.updatedAt?'资讯更新于 '+new Date(data.updatedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'';
  document.querySelector('#sync-status').textContent='收录2026年起的公开网站文章，按发布时间排列。'+(data.sources.some(s=>s.status!=='ok')?'部分来源读取不完整。':'');
  const accounts=data.accounts.filter(a=>a.group==='行业观察').map(a=>{
   const n=rows.filter(r=>r.agency===a.name).length;
   const status=n+' 篇';
   return '<div class="media-source"><span>'+(a.url?'<a href="'+esc(a.url)+'" target="_blank" rel="noopener noreferrer">'+esc(a.name)+' ↗</a>':esc(a.name))+'</span><span class="meta">'+status+'</span></div>';
  }).join('');
  document.querySelector('#content').innerHTML='<details class="media-source-list"><summary>资讯来源 · 已收录 '+rows.length+' 篇</summary><div>'+accounts+'</div></details>'+feed(rows,{highlightRecent:false});
 };
})();
