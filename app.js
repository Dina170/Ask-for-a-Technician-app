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


// ===================== SITEMAP PRO v3 (No 404s) =====================

// ✳️ احذف السطرين دول لو fs/path متعرفة فوق بالفعل
const fs   = require('fs');     // <-- احذفه لو موجود
const path = require('path');   // <-- احذفه لو موجود

const BASE_URL        = process.env.SITE_URL || 'https://imadaldin.com';
const PUBLIC_DIR      = path.join(__dirname, 'public');
const WRITE_FILES     = true;                      // اكتب نسخ داخل public
const CACHE_TTL_MS    = 6 * 60 * 60 * 1000;       // 6 ساعات
const CHUNK_SIZE      = 49000;
const GROUPS          = ['pages','technicians','posts'];
const VERIFY_HTTP_200 = true;                      // ✅ تأكيد أن اللينك شغال
const VERIFY_CONC     = 3;                         // أقصى توازي للتحقق
const VERIFY_TIMEOUT  = 3500;                      // ms

// صفحات ثابتة — زوّد/عدّل عندك
const STATIC_PAGES = ['/', '/about', '/contact', '/privacy-policy'];

// Helpers
const nowISO = () => new Date().toISOString();
const toAbs  = (p) => new URL(p, BASE_URL).toString();
const unique = (a) => Array.from(new Set(a));
const chunk  = (a,n)=>Array.from({length:Math.ceil(a.length/n)},(_,i)=>a.slice(i*n,(i+1)*n));
const xmlEsc = (s)=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// ========== DB ==========
async function fetchTechnicians() {
  try {
    const Technician = require('./models/technician');
    const docs = await Technician.find(
      { slug: { $exists:true, $ne:'' } },
      { slug:1, updatedAt:1 }
    ).lean();
    return docs.map(d => ({
      path: `/technicians/${String(d.slug)}`,
      lastmod: d.updatedAt ? new Date(d.updatedAt).toISOString() : nowISO()
    }));
  } catch { return []; }
}

async function fetchPosts() {
  try {
    const Post = require('./models/post');
    const docs = await Post.find(
      { slug: { $exists:true, $ne:'' } },   // لو عندك published:true ضيفها هنا
      { slug:1, updatedAt:1 }
    ).lean();
    return docs.map(d => ({
      path: `/blog/${String(d.slug)}`,
      lastmod: d.updatedAt ? new Date(d.updatedAt).toISOString() : nowISO()
    }));
  } catch { return []; }
}

// ========== HTTP 200 verify ==========
async function verifyUrls(items){
  if (!VERIFY_HTTP_200 || typeof fetch !== 'function') return items;
  const out = [];
  let idx = 0;
  async function worker(){
    while (idx < items.length){
      const i = idx++;
      const it = items[i];
      try {
        const ctl = new AbortController();
        const t = setTimeout(()=>ctl.abort(), VERIFY_TIMEOUT);
        const res = await fetch(it.loc, { method:'HEAD', redirect:'follow', signal: ctl.signal });
        clearTimeout(t);
        if (res.ok) out.push(it); // 2xx فقط
      } catch {}
    }
  }
  await Promise.all(Array.from({length:VERIFY_CONC}, worker));
  const ok = new Set(out.map(x=>x.loc));
  return items.filter(x=>ok.has(x.loc));
}

// ========== XML ==========
function urlsToXml(items){
  const L = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];
  for (const {loc,lastmod} of items){
    L.push('  <url>');
    L.push(`    <loc>${xmlEsc(loc)}</loc>`);
    L.push(`    <lastmod>${xmlEsc(lastmod)}</lastmod>`);
    L.push('  </url>');
  }
  L.push('</urlset>');
  return L.join('\n');
}

function indexToXml(sitemaps){
  const L = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];
  for (const {loc,lastmod} of sitemaps){
    L.push('  <sitemap>');
    L.push(`    <loc>${xmlEsc(loc)}</loc>`);
    L.push(`    <lastmod>${xmlEsc(lastmod)}</lastmod>`);
    L.push('  </sitemap>');
  }
  L.push('</sitemapindex>');
  return L.join('\n');
}

// ========== Build & Cache ==========
let CACHE = { builtAt:0, groups:{} }; // groups[g] = [ [items], [items] ... ]

async function buildGroup(name){
  if (name === 'pages') {
    let items = unique(
      STATIC_PAGES.map(p => p === '/' ? '/' : String(p).replace(/\/+$/,'').trim())
    ).map(p => ({ loc: toAbs(p), lastmod: nowISO() }));
    items = await verifyUrls(items);
    return chunk(items, CHUNK_SIZE);
  }
  if (name === 'technicians') {
    let items = (await fetchTechnicians()).map(x => ({ loc: toAbs(x.path), lastmod: x.lastmod }));
    items = await verifyUrls(items);
    return chunk(items, CHUNK_SIZE);
  }
  if (name === 'posts') {
    let items = (await fetchPosts()).map(x => ({ loc: toAbs(x.path), lastmod: x.lastmod }));
    items = await verifyUrls(items);
    return chunk(items, CHUNK_SIZE);
  }
  return [];
}

async function buildAll(){
  const groups = {};
  for (const g of GROUPS) groups[g] = await buildGroup(g);
  CACHE = { builtAt: Date.now(), groups };

  if (WRITE_FILES){
    fs.mkdirSync(PUBLIC_DIR, { recursive:true });

    // children
    for (const g of Object.keys(groups)){
      const chunks = groups[g];
      if (!chunks.length) continue;
      for (let i=0;i<chunks.length;i++){
        const fname = chunks.length===1 ? `sitemap-${g}.xml` : `sitemap-${g}-${i+1}.xml`;
        fs.writeFileSync(path.join(PUBLIC_DIR, fname), urlsToXml(chunks[i]), 'utf8');
      }
    }

    // index
    const entries = [];
    for (const g of Object.keys(groups)){
      const chunks = groups[g];
      for (let i=0;i<chunks.length;i++){
        const fname = chunks.length===1 ? `sitemap-${g}.xml` : `sitemap-${g}-${i+1}.xml`;
        entries.push({ loc: `${BASE_URL}/${fname}`, lastmod: nowISO() });
      }
    }
    fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap_index.xml'), indexToXml(entries), 'utf8');
  }
}

const due = () => (Date.now() - CACHE.builtAt) > CACHE_TTL_MS;
let building = false;
async function ensureBuilt(){
  if (!due() || building) return;
  building = true;
  try { await buildAll(); console.log('[sitemap] rebuilt'); }
  catch(e){ console.error('[sitemap]', e); }
  finally { building = false; }
}
setTimeout(ensureBuilt, 10_000);
setInterval(ensureBuilt, CACHE_TTL_MS);
app.use((req,res,next)=>{ ensureBuilt().catch(()=>{}); next(); });

// Routes
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

// =================== END SITEMAP PRO v3 =====================



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

