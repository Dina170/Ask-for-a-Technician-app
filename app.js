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


// ===================== SITEMAP PRO v2 (Index + Groups + Images + HTML) =====================
const fs   = require('fs');
const path = require('path');

const BASE_URL      = process.env.SITE_URL || 'https://imadaldin.com';
const PUBLIC_DIR    = path.join(__dirname, 'public');
const WRITE_FILES   = true;                     // اكتب نسخ XML فعلية داخل public
const CACHE_TTL_MS  = 6 * 60 * 60 * 1000;       // 6 ساعات
const CHUNK_SIZE    = 49000;                    // تحت حد 50k

// المجموعات المفعّلة (غيّر الترتيب أو أضف/احذف بحرية)
const CHILD_GROUPS = ['pages','technicians','posts','neighborhoods','jobs','blog-categories'];

// صفحات ثابتة (زود اللي عندك)
const STATIC_PAGES = ['/', '/about', '/contact', '/privacy-policy', '/services'];

// Helpers
const nowISO = () => new Date().toISOString();
const toAbs  = (p) => new URL(p, BASE_URL).toString();
const unique = (a) => Array.from(new Set(a));
const chunk  = (a,n)=>Array.from({length:Math.ceil(a.length/n)},(_,i)=>a.slice(i*n,(i+1)*n));
const xmlEsc = (s)=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const safeSlug = (s)=> String(s||'').trim().toLowerCase()
                    .replace(/[^\w\s-]+/g,'').replace(/\s+/g,'-');

// مسارات كل جروب
const PATHS = {
  pages:          (slug)=> slug,                             // جاهزة
  technicians:    (slug)=> `/technicians/${slug}`,
  posts:          (slug)=> `/blog/${slug}`,
  neighborhoods:  (slug)=> `/neighborhoods/${slug}`,
  jobs:           (slug)=> `/jobs/${slug}`,
  'blog-categories': (slug)=> `/blog/category/${slug}`,
};

// محاولة ذكية لالتقاط صورة من الدوكيومنت (لو فيه URL)
function pickImagesFromDoc(doc) {
  const urls = [];
  const pushIfUrl = (v) => {
    if (typeof v === 'string' && /^https?:\/\//i.test(v)) urls.push(v);
  };
  // حقول شائعة
  ['image','photo','thumbnail','avatar','cover','mainImage','featuredImage','hero','img','url']
    .forEach(k => pushIfUrl(doc[k]));
  // لو عندك media داخل مصفوفة
  Object.values(doc).forEach(v=>{
    if (Array.isArray(v)) v.forEach(x=>{
      if (typeof x === 'string') pushIfUrl(x);
      else if (x && typeof x === 'object') Object.values(x).forEach(pushIfUrl);
    });
  });
  // رجّع حتى 5 صور بحد أقصى
  return Array.from(new Set(urls)).slice(0,5);
}

// ـــــ جلب البيانات من موديولات مونجوز (بدون API) ـــــ //
async function fetchTechnicians() {
  try {
    const Technician = require('./models/technician');
    const docs = await Technician.find({}, { slug:1, name:1, updatedAt:1, image:1 }).lean();
    return docs.map(d => ({
      path: PATHS.technicians((d.slug && String(d.slug)) || safeSlug(d.name)),
      lastmod: d.updatedAt ? new Date(d.updatedAt).toISOString() : nowISO(),
      images: pickImagesFromDoc(d)
    }));
  } catch { return []; }
}

async function fetchPosts() {
  try {
    const Post = require('./models/post');
    const docs = await Post.find({}, { slug:1, title:1, updatedAt:1, image:1 }).lean();
    return docs.map(d => ({
      path: PATHS.posts((d.slug && String(d.slug)) || safeSlug(d.title)),
      lastmod: d.updatedAt ? new Date(d.updatedAt).toISOString() : nowISO(),
      images: pickImagesFromDoc(d)
    }));
  } catch { return []; }
}

async function fetchNeighborhoods() {
  try {
    const Neighborhood = require('./models/neighborhood');
    const docs = await Neighborhood.find({}, { slug:1, name:1, updatedAt:1 }).lean();
    return docs.map(d => ({
      path: PATHS.neighborhoods((d.slug && String(d.slug)) || safeSlug(d.name)),
      lastmod: d.updatedAt ? new Date(d.updatedAt).toISOString() : nowISO(),
      images: pickImagesFromDoc(d)
    }));
  } catch { return []; }
}

async function fetchJobs() {
  try {
    const Job = require('./models/job');
    const docs = await Job.find({}, { slug:1, title:1, updatedAt:1 }).lean();
    return docs.map(d => ({
      path: PATHS.jobs((d.slug && String(d.slug)) || safeSlug(d.title)),
      lastmod: d.updatedAt ? new Date(d.updatedAt).toISOString() : nowISO(),
      images: pickImagesFromDoc(d)
    }));
  } catch { return []; }
}

async function fetchBlogCategories() {
  try {
    const Blog = require('./models/blog'); // لاحظ: عندك موديل اسمه blog
    const docs = await Blog.find({}, { slug:1, blog:1, updatedAt:1 }).lean();
    return docs.map(d => ({
      path: PATHS['blog-categories']((d.slug && String(d.slug)) || safeSlug(d.blog)),
      lastmod: d.updatedAt ? new Date(d.updatedAt).toISOString() : nowISO(),
      images: pickImagesFromDoc(d)
    }));
  } catch { return []; }
}

// كتابة XML (مع XSL) + صور
function urlsToXml(items){
  const L = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
  ];
  for (const it of items){
    L.push('  <url>');
    L.push(`    <loc>${xmlEsc(it.loc)}</loc>`);
    L.push(`    <lastmod>${xmlEsc(it.lastmod)}</lastmod>`);
    if (Array.isArray(it.images)) {
      for (const img of it.images) {
        L.push('    <image:image>');
        L.push(`      <image:loc>${xmlEsc(img)}</image:loc>`);
        L.push('    </image:image>');
      }
    }
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

// البناء والكاش
let CACHE = { builtAt:0, groups:{} };  // groups[g] = [chunk[], chunk[]...]

async function buildGroup(name){
  if (name === 'pages') {
    const items = unique(STATIC_PAGES.map(p => p === '/' ? '/' : String(p).replace(/\/+$/,'').trim()))
      .map(p => ({ loc: toAbs(p), lastmod: nowISO(), images: [] }));
    return chunk(items, CHUNK_SIZE);
  }
  if (name === 'technicians')   return chunk((await fetchTechnicians()).map(x=>({loc:toAbs(x.path),lastmod:x.lastmod,images:x.images})), CHUNK_SIZE);
  if (name === 'posts')         return chunk((await fetchPosts()).map(x=>({loc:toAbs(x.path),lastmod:x.lastmod,images:x.images})), CHUNK_SIZE);
  if (name === 'neighborhoods') return chunk((await fetchNeighborhoods()).map(x=>({loc:toAbs(x.path),lastmod:x.lastmod,images:x.images})), CHUNK_SIZE);
  if (name === 'blog-categories')return chunk((await fetchBlogCategories()).map(x=>({loc:toAbs(x.path),lastmod:x.lastmod,images:x.images})), CHUNK_SIZE);
  return [];
}

async function buildAll(){
  const groups = {};
  for (const g of CHILD_GROUPS) groups[g] = await buildGroup(g);
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

// جدولة + Lazy trigger
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

// Routes: index + children
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

// صفحة بشرية بسيطة للمراجعة اليدوية
app.get('/sitemap', async (req,res)=>{
  await ensureBuilt();
  const groups = CACHE.groups;
  const rows = [];
  for (const g of Object.keys(groups)){
    const chunks = groups[g];
    let total = 0;
    const links = [];
    for (let i=0;i<chunks.length;i++){
      const fname = chunks.length===1 ? `sitemap-${g}.xml` : `sitemap-${g}-${i+1}.xml`;
      const loc = `${BASE_URL}/${fname}`;
      const count = chunks[i].length;
      total += count;
      links.push({ loc, count });
    }
    rows.push({ group:g, total, links });
  }

  const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>خريطة الموقع – ${xmlEsc(new URL(BASE_URL).host)}</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0f172a;color:#e5e7eb;margin:0}
  .wrap{max-width:1000px;margin:40px auto;padding:0 16px}
  .card{background:#111827;border:1px solid #1f2937;border-radius:14px;box-shadow:0 6px 20px rgba(0,0,0,.35)}
  .hdr{background:linear-gradient(90deg,#3b82f6,#22d3ee);padding:18px 20px;color:#081425;font-weight:800}
  .box{padding:18px 20px}
  table{width:100%;border-collapse:collapse}
  th,td{padding:12px 10px;border-bottom:1px solid #1f2937;text-align:right}
  th{color:#bfdbfe}
  a{color:#93c5fd;text-decoration:none}
  a:hover{text-decoration:underline}
  .badge{display:inline-block;background:#0ea5e9;color:#031318;border-radius:999px;padding:2px 8px;font-size:12px;margin-inline-start:6px}
  .muted{color:#94a3b8;font-size:14px}
</style></head><body>
<div class="wrap"><div class="card">
<div class="hdr">خريطة الموقع (Sitemap)</div>
<div class="box">
<table><thead><tr><th>القسم</th><th>عدد الروابط</th><th>الملفات</th></tr></thead><tbody>
${rows.map(r => `
<tr>
  <td>${xmlEsc(r.group)}</td>
  <td>${r.total}</td>
  <td>
    ${r.links.map(l => {
      const name = new URL(l.loc).pathname.replace('/','');
      return `<a href="${xmlEsc(l.loc)}" target="_blank" rel="noopener nofollow">${xmlEsc(name)}</a><span class="badge">${l.count}</span>`;
    }).join(' ')}
  </td>
</tr>`).join('')}
</tbody></table>
<p class="muted">ملف الإندكس: <a href="${xmlEsc(BASE_URL)}/sitemap_index.xml" target="_blank" rel="noopener nofollow">sitemap_index.xml</a></p>
</div></div></div></body></html>`;
  res.type('html').send(html);
});
// =================== END SITEMAP PRO v2 ==================================



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

