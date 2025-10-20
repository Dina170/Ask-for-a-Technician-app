const express = require("express");
const createError = require("http-errors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const session = require("express-session");
require("dotenv").config();
const expressLayouts = require("express-ejs-layouts");
const seedAdmin = require("./utils/seedAdmin");
const MongoStore = require("connect-mongo");

const app = express();
app.use(express.static('public'));
app.disable("x-powered-by");   // Remove X-Powered-By header for security

// HSTS (اختياري في الإنتاج)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
}
// 🔁 التحويل الموحّد: non-www + https (قفزة واحدة)
const PROD_HOST = 'imadaldin.com';
app.use((req, res, next) => {
  const host  = (req.headers.host || '').replace(/:\d+$/, '');
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || '').toLowerCase();

  // الحالة الوحيدة المسموحة للدخول بدون تحويل
  if (proto === 'https' && host === PROD_HOST) return next();

  // أي شيء غير كده → 301 إلى النسخة الموحّدة
  return res.redirect(301, `https://${PROD_HOST}${req.originalUrl}`);
});


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



// Routers
const neighborhoodRouter = require("./routes/dashboard/neighborhood.route");
const jobRouter = require("./routes/dashboard/job.route");
const technicianRouter = require("./routes/dashboard/technician.route");
const blogRouter = require("./routes/dashboard/blog.route");
const postRouter = require("./routes/dashboard/post.route");
const Job = require("./models/job");
const Neighborhood = require("./models/neighborhood");
const Technician = require("./models/technician");

const publicHomeRouter = require("./routes/public/home.route");
const publicTechnicianRouter = require("./routes/public/technician.route");
const authRouter = require("./routes/auth/auth.route");

const loadBlogs = require("./middlewares/loadBlogs");
const technician = require("./models/technician");
const post = require("./models/post");
const blog = require("./models/blog");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    await seedAdmin();
    const blogs = await blog.find({});

    for (const blog of blogs) {
      // only set slug if it doesn't exist
      if (!blog.slug) {
        blog.slug = blog.blog.trim().replace(/\s+/g, "-");
        await blog.save();
        console.log(`Updated slug for: ${blog.blog}`);
      }
    }
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(morgan("dev"));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      // secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  })
);

// Middleware: إضافة رقم أول فني بشكل جلوبال للفيوز
app.use(async (req, res, next) => {
  try {
    const technician = await Technician.findOne();
    res.locals.mainPhone = technician ? technician.phoneNumber : "05075813050";
  } catch (err) {
    console.error("Error fetching technician:", err);
    res.locals.mainPhone = "05075813050";
  }
  next();
});

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "secret",
//     resave: false,
//     saveUninitialized: false,
//   })
// );

app.use(express.static("public"));
// cashing static files
app.use(express.static("public", {
  maxAge: "30d", 
  etag: true,
  lastModified: true
}));

// chache control for all routes
app.use((req, res, next) => {
  res.set("Cache-Control", "public, max-age=31536000"); // 1 year
  next();
});


app.use("/uploads", express.static("uploads"));
app.use("/uploads/posts", express.static("uploads/posts"));
app.use("/static", express.static("public"));
app.use(loadBlogs);

// ---------------- Dashboard Routes ----------------
app.use(
  "/dashboard/neighborhoods",
  expressLayouts,
  (req, res, next) => {
    res.locals.layout = "dashboard/layouts/sidebar";
    next();
  },
  neighborhoodRouter
);

app.use(
  "/dashboard/jobs",
  expressLayouts,
  (req, res, next) => {
    res.locals.layout = "dashboard/layouts/sidebar";
    next();
  },
  jobRouter
);

app.use(
  "/dashboard/technicians",
  expressLayouts,
  (req, res, next) => {
    res.locals.layout = "dashboard/layouts/sidebar";
    next();
  },
  technicianRouter
);

app.use(
  "/dashboard/blogs",
  expressLayouts,
  (req, res, next) => {
    res.locals.layout = "dashboard/layouts/sidebar";
    next();
  },
  blogRouter
);

app.use(
  "/dashboard/posts",
  expressLayouts,
  (req, res, next) => {
    res.locals.layout = "dashboard/layouts/sidebar";
    next();
  },
  postRouter
);

// ---------------- Public Routes ----------------
app.use("/", publicHomeRouter); //landing page
app.use("/technicians", publicTechnicianRouter);
app.use("/auth", authRouter);

// Custom 404 Page
app.use((req, res) => {
  res.status(404).render("public/404", { message: "الصفحة غير موجودة." });
});


// ---------------- Error Handling ----------------

app.use((req, res, next) => {
  next(createError.NotFound());
});

// تصحيح Error Handler - ليعرض صفحة خطأ بدلاً من JSON
app.use((err, req, res, next) => {
  console.error("❌ Internal Error:", err.stack || err);

  // Show full error details in browser (⚠️ remove in production!)
  res.status(500).send(`
    <h1>Internal Server Error</h1>
    <pre>${err.stack || err}</pre>
  `);
});

// ---------------- Server ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Running @ http://localhost:${PORT}`));

// === SIMPLE SITEMAP FROM EXPRESS ROUTES (auto + file in /public) ===
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.SITE_URL || 'https://www.imadaldin.com'; // عدّل الدومين لو مختلف
const EXCLUDE_PREFIXES = ['/dashboard','/admin','/api','/user','/account','/login','/register','/cgi-bin'];

function collectGetPaths(app) {
  const paths = new Set(['/']); // ضمّن الهوم
  function walk(stack) {
    for (const layer of stack) {
      if (layer.route && layer.route.methods && layer.route.methods.get) {
        const p = layer.route.path;
        if (typeof p === 'string'
            && !p.includes(':')                       // استبعد المسارات الباراميترية /:id
            && !EXCLUDE_PREFIXES.some(pr => p.startsWith(pr))) {
          paths.add(p === '/' ? '/' : p.replace(/\/+$/,''));
        }
      } else if (layer.name === 'router' && layer.handle?.stack) {
        walk(layer.handle.stack);
      }
    }
  }
  if (app && app._router && app._router.stack) walk(app._router.stack);
  return Array.from(paths).sort();
}

function toXml(urlList) {
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>',
                 '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
  for (const u of urlList) {
    const depth = u.pathname === '/' ? 0 : u.pathname.split('/').filter(Boolean).length;
    const changefreq = depth === 0 ? 'weekly' : 'monthly';
    const priority   = depth === 0 ? '0.9'    : (depth === 1 ? '0.7' : '0.5');
    lines.push('  <url>');
    lines.push(`    <loc>${u.loc}</loc>`);
    lines.push(`    <lastmod>${new Date().toISOString()}</lastmod>`);
    lines.push(`    <changefreq>${changefreq}</changefreq>`);
    lines.push(`    <priority>${priority}</priority>`);
    lines.push('  </url>');
  }
  lines.push('</urlset>');
  return lines.join('\n');
}

