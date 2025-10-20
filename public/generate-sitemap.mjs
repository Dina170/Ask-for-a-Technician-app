// ===================== SITEMAP PRO (Index + Groups) =====================
const fs = require('fs');
const path = require('path');

// لو Node 18+: fetch متوفر. غير كده هتحتاج node-fetch.
const fetchFn = (...a) => (global.fetch ? global.fetch(...a) : Promise.reject(new Error('Need Node 18+')));

// مهم مع أي بروكسي (DigitalOcean App Platform)
app.set('trust proxy', true);

// ===== إعدادات عامة =====
const BASE_URL   = process.env.SITE_URL || 'https://www.imadaldin.com';
const PUBLIC_DIR = path.join(__dirname, 'public');
const WRITE_FILES = true;                  // يكتب xml فعلية داخل public
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;  // 6 ساعات
const CHUNK_SIZE  = 49000;                // تحت حد 50k
const HEAD_LASTMOD = false;               // HEAD لكل URL (خليه false لتقليل الحمل)
const HEAD_CONCURRENCY = 3;
const CHILD_GROUPS = ['pages','services','posts']; // زوّد/قلّل حسب احتياجك

// ===== مصادر الروابط =====
// 1) صفحات ثابتة (روتات React الثابتة)
const STATIC_PAGES = [
  '/', '/about', '/contact', '/privacy-policy'
  // زوّد اللي عندك هنا
];

// 2) APIs اختيارية (لو موجودة عندك) — رجّع slugs أو URLs
async function fetchServices() {
  try {
    const r = await fetchFn(`${BASE_URL}/api/services/slugs`, { redirect:'follow' });
    if (!r.ok) return []; // لو مفيش API، يطلع فاضي
    const data = await r.json();  // [{slug:"a"}, ...]
    return data.map(x => `/services/${String(x.slug||'').replace(/^\/+/,'')}`).filter(Boolean);
  } catch { return []; }
}
async function fetchPosts() {
  try {
    const r = await fetchFn(`${BASE_URL}/api/posts/slugs`, { redirect:'follow' });
    if (!r.ok) return [];
    const data = await r.json();
    return data.map(x => `/blog/${String(x.slug||'').replace(/^\/+/,'')}`).filter(Boolean);
  } catch { return []; }
}

// ===== أدوات =====
const nowISO = () => new Date().toISOString();
const toAbs  = (p) => new URL(p, BASE_URL).toString();
const unique = (arr) => Array.from(new Set(arr));
const chunk  = (arr,size)=>Array.from({length:Math.ceil(arr.length/size)},(_,i)=>arr.slice(i*size,(i+1)*size));
function xmlEscape(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// HEAD last-modified (اختياري)
async function addLastMod(urls) {
  if (!HEAD_LASTMOD) return urls.map(u => ({ loc:u, lastmod: nowISO() }));
  const out = new Array(urls.length);
  let i = 0;
  async function worker(){
    while (i < urls.length){
      const idx = i++;
      try {
        const r = await fetchFn(urls[idx], { method:'HEAD', redirect:'follow' });
        const lm = r.headers.get('last-modified');
        out[idx] = { loc: urls[idx], lastmod: lm ? new Date(lm).toISOString() : nowISO() };
      } catch { out[idx] = { loc: urls[idx], lastmod: nowISO() }; }
    }
  }
  await Promise.all(Array.from({length: HEAD_CONCURRENCY}, worker));
  return out;
}

function urlsToXml(items){
  const L = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
  for (const {loc,lastmod} of items){
    L.push('  <url>');
    L.push(`    <loc>${xmlEscape(loc)}</loc>`);
    L.push(`    <lastmod>${xmlEscape(lastmod)}</lastmod>`);
    L.push('  </url>');
  }
  L.push('</urlset>');
  return L.join('\n');
}
function indexToXml(sitemaps){
  const L = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
  for (const {loc,lastmod} of sitemaps){
    L.push('  <sitemap>');
    L.push(`    <loc>${xmlEscape(loc)}</loc>`);
    L.push(`    <lastmod>${xmlEscape(lastmod)}</lastmod>`);
    L.push('  </sitemap>');
  }
  L.push('</sitemapindex>');
  return L.join('\n');
}

// ===== البيلدر =====
let CACHE = { builtAt:0, groups:{} }; // groups: { pages:[chunks...], services:[...], posts:[...] }

async function buildGroup(name){
  let paths = [];
  if (name === 'pages')     paths = STATIC_PAGES;
  else if (name === 'services') paths = await fetchServices();
  else if (name === 'posts')    paths = await fetchPosts();

  paths = unique(paths.map(p => p === '/' ? '/' : String(p).replace(/\/+$/,'').trim())).filter(Boolean);
  const abs = paths.map(toAbs);
  const withDates = await addLastMod(abs);
  return chunk(withDates, CHUNK_SIZE);
}

async function buildAll(){
  const groups = {};
  for (const g of CHILD_GROUPS) groups[g] = await buildGroup(g);
  CACHE = { builtAt: Date.now(), groups };

  if (WRITE_FILES){
    fs.mkdirSync(PUBLIC_DIR, { recursive:true });

    // اكتب ملفات المجموعات
    for (const g of Object.keys(groups)){
      const chunks = groups[g];
      if (!chunks.length) continue;
      for (let i=0;i<chunks.length;i++){
        const file = chunks.length===1 ? `sitemap-${g}.xml` : `sitemap-${g}-${i+1}.xml`;
        fs.writeFileSync(path.join(PUBLIC_DIR, file), urlsToXml(chunks[i]), 'utf8');
      }
    }

    // اكتب الـIndex
    const entries = [];
    for (const g of Object.keys(groups)){
      const chunks = groups[g];
      for (let i=0;i<chunks.length;i++){
        const file = chunks.length===1 ? `sitemap-${g}.xml` : `sitemap-${g}-${i+1}.xml`;
        entries.push({ loc: `${BASE_URL}/${file}`, lastmod: nowISO() });
      }
    }
    fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap_index.xml'), indexToXml(entries), 'utf8');
  }
}

// Lazy trigger + جدولة
const due = () => (Date.now() - CACHE.builtAt) > CACHE_TTL_MS;
let building = false;
async function ensureBuilt(){
  if (!due() || building) return;
  building = true;
  try { await buildAll(); console.log('[sitemap] rebuilt'); }
  catch(e){ console.error('[sitemap]', e.message); }
  finally { building = false; }
}
setTimeout(ensureBuilt, 10_000);                // بعد الإقلاع
setInterval(ensureBuilt, CACHE_TTL_MS);         // كل 6 ساعات
app.use((req,res,next)=>{ ensureBuilt().catch(()=>{}); next(); }); // Lazy trigger

// ===== Routes (ديناميكي وسريع) =====
app.get(['/sitemap.xml','/sitemap_index.xml'], async (req,res)=>{
  await ensureBuilt();
  const maps = [];
  for (const g of Object.keys(CACHE.groups)){
    const chunks = CACHE.groups[g];
    for (let i=0;i<chunks.length;i++){
      const child = chunks.length===1 ? `/sitemap-${g}.xml` : `/sitemap-${g}-${i+1}.xml`;
      maps.push({ loc: `${BASE_URL}${child}`, lastmod: nowISO() });
    }
  }
  res.type('application/xml').send(indexToXml(maps));
});
app.get(['/sitemap-:g.xml','/sitemap-:g-:n.xml'], async (req,res)=>{
  await ensureBuilt();
  const g = req.params.g;
  const n = req.params.n ? (parseInt(req.params.n,10)-1) : 0;
  const chunks = CACHE.groups[g] || [];
  if (!chunks[n]) return res.sendStatus(404);
  res.type('application/xml').send(urlsToXml(chunks[n]));
});
// =================== END SITEMAP PRO ===================
