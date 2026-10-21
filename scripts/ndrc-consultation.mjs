// Public endpoints used by NDRC's own sa.html and article.html pages.
export async function consultationDetail(inputUrl,get){
 let url=new URL(inputUrl);
 if(url.pathname==='/sa.html'){
  const key=url.hash.split('?')[0].replace(/^#\//,'');
  if(!key)throw Error('征求意见短链接缺少标识');
  const result=JSON.parse(await get(new URL('/public/submission-service/article/access-url?shortKey='+encodeURIComponent(key),url.origin).href));
  if(!result.data)throw Error('征求意见短链接未解析成功');
  url=new URL(result.data,url.origin);
 }
 if(url.hostname!=='yyglxxbsgw.ndrc.gov.cn'||url.pathname!=='/htmls/article/article.html')throw Error('非预期征求意见详情地址');
 const id=url.searchParams.get('articleId');if(!id)throw Error('缺少 articleId');
 const response=JSON.parse(await get(new URL('/public/submission-service/column/getArticleDetail?articleId='+encodeURIComponent(id),url.origin).href));
 const data=response.data;if(!data?.articleTitle||!data.publishDate||!data.articleContent)throw Error('征求意见接口缺少标题、日期或正文');
 url.hash='';
 // Convert the dynamic response into the same metadata contract as static pages.
 const safe=v=>String(v).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
 const title=data.articleTitle.replace(/<br\s*\/?\s*>/gi,'');
 return {url:url.href,html:'<meta name="ArticleTitle" content="'+safe(title)+'"><meta name="PubDate" content="'+safe(data.publishDate)+'">'+data.articleContent};
}
