import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';
import http from 'http';

interface ResolvedResult {
  finalUrl: string;
  name?: string;
  phone?: string;
  address?: string;
  businessHours?: string;
}

function resolveRedirect(targetUrl: string, maxRedirects = 5): Promise<ResolvedResult> {
  return new Promise((resolve) => {
    if (maxRedirects <= 0) return resolve({ finalUrl: targetUrl });
    try {
      const client = targetUrl.startsWith('https') ? https : http;
      const req = client.get(
        targetUrl,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            let nextUrl = res.headers.location;
            if (!nextUrl.startsWith('http')) {
              const u = new URL(targetUrl);
              nextUrl = u.origin + nextUrl;
            }
            return resolve(resolveRedirect(nextUrl, maxRedirects - 1));
          }

          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            const result: ResolvedResult = { finalUrl: targetUrl };

            // 1. 從 URL 提取店名
            try {
              const u = new URL(targetUrl);
              const q = u.searchParams.get('q') || u.searchParams.get('query');
              if (q && !/^\d+[.,]\d+/.test(q)) {
                result.name = decodeURIComponent(q.replace(/\+/g, ' '));
              }
              const placeMatch = targetUrl.match(/\/maps\/place\/([^/@?]+)/);
              if (placeMatch && placeMatch[1]) {
                result.name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
              }
            } catch {}

            // 2. 從 HTML 內容搜尋電話、地址與營業時間
            if (body) {
              const phoneMatch = body.match(/(?:電話|TEL|Tel)[:：\s]*([+0-9\s-()]{7,20})|0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}/);
              if (phoneMatch) {
                result.phone = (phoneMatch[1] || phoneMatch[0]).trim();
              }
              const addrMatch = body.match(/(?:\d{3,5}\s*)?(?:[台臺]北市|[台臺]中市|[基新]北市|桃園市|新竹[縣市]|苗栗縣|彰化縣|南投縣|雲林縣|嘉義[縣市]|[台臺]南市|高雄市|屏東縣|宜蘭縣|花蓮縣|[台臺]東縣|澎湖縣|金門縣)[^<>"',\n&]{3,40}(?:路|街|巷|弄|號|樓)/);
              if (addrMatch) {
                result.address = addrMatch[0].trim();
              }
              const hoursMatch = body.match(/(?:營業時間|營業|開店)[:：\s]*([^<>"',\n&]{3,35})/);
              if (hoursMatch) {
                result.businessHours = hoursMatch[1].trim();
              }
            }

            resolve(result);
          });
        }
      );
      req.on('error', () => resolve({ finalUrl: targetUrl }));
    } catch {
      resolve({ finalUrl: targetUrl });
    }
  });
}

function unshortenPlugin(): Plugin {
  return {
    name: 'vite-plugin-unshorten',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/unshorten')) {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost:5173');
            const target = parsedUrl.searchParams.get('url');
            if (!target) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing url' }));
              return;
            }
            const resolved = await resolveRedirect(target);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, ...resolved }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
            return;
          }
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), unshortenPlugin()],
  server: {
    host: true,
    port: 5173,
  },
});
