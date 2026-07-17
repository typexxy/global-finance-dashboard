// ============================================================
// Cloudflare Worker - 东方财富 API HTTPS 代理
// 免费额度: 每天 10万 请求，完全够用
// 
// 部署方式:
// 1. 登录 https://dash.cloudflare.com/
// 2. 进入 Workers & Pages -> Create application -> Create Worker
// 3. 粘贴此文件全部内容 -> Deploy
// 4. 记下 Worker URL (如 https://east-proxy.xxx.workers.dev)
// ============================================================

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const apiUrl = url.searchParams.get('url');
    
    if (!apiUrl) {
      return new Response('Missing ?url= parameter', { status: 400 });
    }

    try {
      // Remove JSONP callback params and fetch raw data
      const cleanUrl = new URL(apiUrl);
      cleanUrl.searchParams.delete('cb');
      cleanUrl.searchParams.delete('callback');
      
      const resp = await fetch(cleanUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://quote.eastmoney.com/'
        }
      });
      
      let text = await resp.text();
      
      // Strip JSONP wrapper: cb({...}); or cb({...}) -> {...}
      text = text.replace(/^[^(]*\(/, '').replace(/\);?\s*$/, '').trim();
      
      return new Response(text, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
