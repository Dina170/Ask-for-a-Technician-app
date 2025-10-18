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

// مسار يقدّم السايت ماب مباشرة (بدون حفظ)
app.get('/sitemap.xml', (req, res) => {
  const paths = collectGetPaths(app);
  const urls = paths.map(p => {
    const url = new URL(p, BASE_URL);
    return { loc: url.toString(), pathname: url.pathname };
  });
  res.type('application/xml').send(toXml(urls));
});

// (اختياري لكن مفيد) اكتب نسخة فعلية داخل public عند الإقلاع، ومرّة كل 6 ساعات
function writePhysicalSitemap() {
  try {
    const paths = collectGetPaths(app);
    const urls = paths.map(p => {
      const url = new URL(p, BASE_URL);
      return { loc: url.toString(), pathname: url.pathname };
    });
    const xml = toXml(urls);
    const out = path.join(__dirname, 'public', 'sitemap.xml');
    fs.writeFileSync(out, xml, 'utf8');
    console.log('[sitemap] wrote', out, '(', urls.length, 'URLs )');
  } catch (e) {
    console.error('[sitemap] error:', e.message);
  }
}

// اكتب مرة بعد 10 ثواني من تشغيل السيرفر + حدّث كل 6 ساعات تلقائيًا
setTimeout(writePhysicalSitemap, 10_000);
setInterval(writePhysicalSitemap, 6 * 60 * 60 * 1000);
// === END SIMPLE SITEMAP ===

