(function(){
 function calendarDay(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const time=Date.parse(value+'T00:00:00Z');return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===value?time/86400000:null}
 function isRecent(publishedDate,now=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const values=Object.fromEntries(parts.map(p=>[p.type,p.value]));const today=calendarDay(values.year+'-'+values.month+'-'+values.day);const published=calendarDay(publishedDate);return published!==null&&today-published>=0&&today-published<3;
 }
 const badge='<span class="recent-badge" title="按北京时间，含今天在内的三个自然日发布">近三天</span>';
 window.RecentUpdates={isRecent,badge};
})();
