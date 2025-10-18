// public/.generate-sitemap.mjs
// Node 18+ (فيه fetch مدمج). يشبّع خفيف على موقعك ويولّد sitemap.xml بجانب الملف.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ===== إعدادات بسيطة عدّلها لو لزم =====
const BASE_URL = 'https://www.imadaldin.com'; // عدّل الدومين لو مختلف
const OUTPUT   = path.resolve(__dirname, './sitemap.xml'); // يكتب داخل public
const MAX_PAGES = 1500;                       // حد أمان للزحف
const POLITENESS_DELAY_MS = 120;              // تأخير بسيط بين الطلبات
const EXCLUDE_PREFIXES = [
  '/dashboard', '/admin', '/api', '/user', '/account',
  '/login', '/register', '/cgi-bin'
];
const STRIP_QUERYSTRING = true;               // تجاهل الاستعلامات لتقليل التكرار

// ===== مساعدات =====
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const sameHost = (u) => {
  try { return new URL(u).host === new URL(BASE_URL).host; } catch { return false; }
};
function normalize(u) {
  try {
    const url = new URL(u, BASE_URL);
    url.hash = '';
    if (STRIP_QUERYSTRING) url.search = '';
    if (url.pathname !== '/' && url.pathname.endsWith('/')) url.pathname = url.pathname.slice(0, -1);
    return url.toString();
  } catch { return null; }
}
function isExcluded(u) {
  try {
    const p = new URL(u).pathname;
    return EXCLUDE_PREFIXES.some(pref => p.startsWith(pref));
  } catch { return true; }
}
function lastmodFromHeaders(h) {
  const lm = h.get('last-modified');
  return lm ? new Date(lm) : new Date();
}
function iso8601(d) { return (d instanceof Date ? d : new Date(d)).toISOString(); }

// ===== الزحف الخفيف =====
async function crawl(startUrl) {
  const queue = [normalize(startUrl)];
  const visited = new Set();
  const urls = new Map(); // loc -> Date

  while (queue.length && visited.size < MAX_PAGES) {
    const current = queue.shift();
    if (!current || visited.has(current) || isExcluded(current)) continue;
    visited.add(current);

    try {
      const res = await fetch(current, { redirect: 'follow' });
      if (!res.ok) continue;

      urls.set(current, lastmodFromHeaders(res.headers));

      const type = res.headers.get('content-type') || '';
      if (!type.includes('text/html')) continue;

      const html = await res.text();
      const hrefs = Array.from(html.matchAll(/href\s*=\s*"(.*?)"/gi)).map(m => m[1]).filter(Boolean);

      for (const h of hrefs) {
        if (/^(mailto:|tel:|javascript:|#)/i.test(h)) continue;
        const abs = normalize(h);
        if (!abs) continue;
        if (!sameHost(abs)) continue;
        if (isExcluded(abs)) continue;
        if (!visited.has(abs) && !queue.includes(abs)) queue.push(abs);
      }
      await sleep(POLITENESS_DELAY_MS);
    } catch {
      // تجاهل أخطاء الصفحة الواحدة
    }
  }
  return urls;
}

// ===== توليد XML =====
function toXml(urlMap) {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  const entries = [...urlMap.entries()].sort((a,b) => a[0].localeCompare(b[0]));
  for (const [loc, lm] of entries) {
    const pathname = new URL(loc).pathname;
    const depth = pathname === '/' ? 0 : pathname.split('/').filter(Boolean).length;
    const changefreq = depth === 0 ? 'weekly' : (depth === 1 ? 'monthly' : 'monthly');
    const priority   = depth === 0 ? '0.9'    : (depth === 1 ? '0.7'     : '0.5');

    lines.push('  <url>');
    lines.push(`    <loc>${loc}</loc>`);
    lines.push(`    <lastmod>${iso8601(lm)}</lastmod>`);
    lines.push(`    <changefreq>${changefreq}</changefreq>`);
    lines.push(`    <priority>${priority}</priority>`);
    lines.push('  </url>');
  }
  lines.push('</urlset>');
  return lines.join('\n');
}

// ===== تشغيل =====
(async () => {
  console.log('[sitemap] crawling:', BASE_URL);
  const urlMap = await crawl(BASE_URL);
  fs.writeFileSync(OUTPUT, toXml(urlMap), 'utf8');
  console.log(`[sitemap] written: ${OUTPUT} (URLs: ${urlMap.size})`);
})();
