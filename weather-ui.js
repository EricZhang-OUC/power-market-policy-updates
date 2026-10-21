(function(){
 let region='全国';
 function day(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
 function timestamp(v){return v.includes('T')?v.slice(0,16).replace('T',' '):v}
 function datedState(r){const today=day();if(r.validTo&&r.validTo<today)return '时段已过';if(r.validFrom&&r.validFrom>today)return '未来时段';if(r.category==='气象预警')return '解除状态见原文';if(r.validTo)return '日期范围内 · 具体时段见原文';return '适用时段见原文'}
 function weatherCard(r){return '<article class="item weather-item"><div class="meta"><span>'+esc(r.agency)+' · 发布于 '+esc(timestamp(r.publishedAt))+'</span>'+'</div><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.title)+'</a><p class="weather-period">'+esc(r.periodLabel)+'</p><div class="item-bottom"><span>'+datedState(r)+'</span><span>'+(r.rolling?'滚动产品 · 查看最新原文':'查看官方原文')+' ↗</span></div></article>'}
 window.weatherRegion=function(value){region=value;window.renderWeather()};
 window.renderWeather=function(){
  const data=window.WEATHER_DATA||{rows:[],sources:[]};
  document.querySelector('#desc').textContent=region==='山东'?'山东省气象台短期预报、每日气象与气候预测公报。':'全国天气预报、预警和气候预测分别展示。';
  document.querySelector('#updated').textContent=data.updatedAt?'气象更新于 '+new Date(data.updatedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'';
  document.querySelector('#sync-status').textContent='收录2026年起的产品。滚动产品的链接展示官网最新一期。'+(region==='全国'?'预警是否解除以官方原文为准。':'');
  const today=day();
  const rows=data.rows.filter(r=>r.region===region&&r.date>='2026-01-01'&&(!r.validTo||r.validTo>=today));
  const categories=['天气预报','气象预警','气候预测'].filter(type=>data.rows.some(r=>r.region===region&&r.category===type)||data.sources.some(s=>s.region===region&&s.category===type&&s.status==='link-only'));
  document.querySelector('#content').innerHTML='<div class="feed-switch"><button class="'+(region==='全国'?'selected':'')+'" onclick="window.weatherRegion(&quot;全国&quot;)">全国</button><button class="'+(region==='山东'?'selected':'')+'" onclick="window.weatherRegion(&quot;山东&quot;)">山东</button></div><div class="weather-sections">'+categories.map(type=>{const products=rows.filter(r=>r.category===type).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));const sources=data.sources.filter(s=>s.region===region&&s.category===type);const linkCards=sources.filter(s=>s.status==='link-only').map(s=>'<article class="item weather-item"><div class="meta">官方产品入口</div><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.agency)+'</a><p class="weather-period">'+esc(s.entryLabel||'每日气象 / PDF原文入口')+'</p></article>').join('');return '<section class="weather-section"><h3>'+region+' · '+type+'</h3>'+linkCards+(!products.length&&!linkCards?'<div class="empty">'+(type==='气象预警'?'尚未取得可核实的最新预警记录，请查看官方入口。':'暂无适用时段内的产品，请查看官方入口。')+'</div>':products.map(weatherCard).join(''))+'<div class="source-links">'+sources.filter(s=>s.status!=='link-only').map(s=>'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.agency)+' ↗</a>'+(s.status==='link-only'?'<span>每日气象 / PDF原文入口</span>':s.status==='error'?'<span>暂未读取</span>':s.status==='entry-only'?'<span>官方入口</span>':'')).join(' ')+'</div></section>'}).join('')+'</div>';
 };
})();
