<?xml version="1.0" encoding="UTF-8"?>
<!--
  XSL for pretty-viewing XML Sitemaps in the browser.
  - Supports both <sitemapindex> and <urlset>
  - Arabic UI (RTL), clickable links, counts, basic sorting.
  - SEO-safe: search engines ignore XSL, it’s just for human view.
-->
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  exclude-result-prefixes="sm image">

  <xsl:output method="html" encoding="UTF-8" omit-xml-declaration="yes"/>

  <!-- Utilities -->
  <xsl:variable name="nl" select="'&#10;'" />

  <!-- Extract host from a full URL: https://host/...  -->
  <xsl:template name="hostOf">
    <xsl:param name="u"/>
    <xsl:variable name="afterProto" select="substring-after($u, '://')" />
    <xsl:value-of select="substring-before($afterProto, '/')" />
  </xsl:template>

  <!-- Extract path part from URL for nicer file name display -->
  <xsl:template name="pathOf">
    <xsl:param name="u"/>
    <xsl:variable name="afterProto" select="substring-after($u, '://')" />
    <xsl:variable name="afterHost"  select="substring-after($afterProto, concat(substring-before($afterProto, '/'), '/'))" />
    <xsl:value-of select="$afterHost"/>
  </xsl:template>

  <!-- Human page -->
  <xsl:template match="/">
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <title>خريطة الموقع</title>
        <style>
          :root{--bg:#0f172a;--card:#111827;--muted:#94a3b8;--line:#1f2937;--brand:#60a5fa}
          *{box-sizing:border-box}
          body{margin:0;background:var(--bg);color:#e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
          .wrap{max-width:1050px;margin:40px auto;padding:0 16px}
          .card{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.35)}
          .hdr{background:linear-gradient(90deg,#3b82f6,#22d3ee);padding:18px 22px;color:#081425;font-weight:800}
          .box{padding:20px 22px}
          .muted{color:var(--muted);font-size:14px;margin:6px 0 18px}
          table{width:100%;border-collapse:collapse}
          th,td{padding:12px 10px;border-bottom:1px solid var(--line);text-align:right;vertical-align:top}
          th{color:#bfdbfe;font-weight:700}
          a{color:#93c5fd;text-decoration:none}
          a:hover{text-decoration:underline}
          .badge{display:inline-block;background:#0ea5e9;color:#031318;border-radius:999px;padding:2px 8px;font-size:12px;margin-inline-start:8px}
          code{background:#0b1220;padding:2px 6px;border-radius:6px}
          .topline{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
          .pill{background:#0b1220;border:1px solid #1e293b;border-radius:999px;padding:6px 10px;color:#93c5fd;font-size:12px}
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="card">
            <div class="hdr">خريطة الموقع (Sitemap)</div>
            <div class="box">
              <xsl:choose>

                <!-- ===================== SITEMAP INDEX ===================== -->
                <xsl:when test="/*[local-name()='sitemapindex']">
                  <div class="topline">
                    <span class="pill">
                      النطاق:
                      <xsl:variable name="firstLoc" select="/*[local-name()='sitemapindex']/*[local-name()='sitemap'][1]/*[local-name()='loc']" />
                      <xsl:call-template name="hostOf"><xsl:with-param name="u" select="$firstLoc"/></xsl:call-template>
                    </span>
                    <span class="pill">عدد الملفات: <xsl:value-of select="count(//*[local-name()='sitemap'])"/></span>
                  </div>
                  <p class="muted">هذه الصفحة تعرض ملفات السايت ماب الفرعية. اضغط على اسم الملف لعرض محتواه.</p>

                  <table>
                    <thead>
                      <tr><th>الملف</th><th>آخر تعديل</th></tr>
                    </thead>
                    <tbody>
                      <xsl:for-each select="/*[local-name()='sitemapindex']/*[local-name()='sitemap']">
                        <xsl:sort select="*[local-name()='lastmod']" order="descending"/>
                        <tr>
                          <td>
                            <xsl:variable name="l" select="normalize-space(*[local-name()='loc'])"/>
                            <a target="_blank" rel="noopener">
                              <xsl:attribute name="href"><xsl:value-of select="$l"/></xsl:attribute>
                              <xsl:call-template name="pathOf">
                                <xsl:with-param name="u" select="$l"/>
                              </xsl:call-template>
                            </a>
                          </td>
                          <td><xsl:value-of select="*[local-name()='lastmod']"/></td>
                        </tr>
                      </xsl:for-each>
                    </tbody>
                  </table>
                </xsl:when>

                <!-- ===================== URL SET (CHILD SITEMAP) ===================== -->
                <xsl:otherwise>
                  <div class="topline">
                    <span class="pill">عدد الروابط: <xsl:value-of select="count(//*[local-name()='url'])"/></span>
                    <span class="pill">
                      النطاق:
                      <xsl:variable name="firstLocURL" select="/*[local-name()='urlset']/*[local-name()='url'][1]/*[local-name()='loc']" />
                      <xsl:call-template name="hostOf"><xsl:with-param name="u" select="$firstLocURL"/></xsl:call-template>
                    </span>
                    <span class="pill">
                      إجمالي الصور:
                      <xsl:value-of select="count(//*[namespace-uri()='http://www.google.com/schemas/sitemap-image/1.1' and local-name()='image'])"/>
                    </span>
                  </div>
                  <p class="muted">هذا الملف يعرض الروابط الموجودة داخل هذا القسم. مُرتَّبة بأحدث تاريخ تعديل.</p>

                  <table>
                    <thead><tr><th>الرابط</th><th>الصور</th><th>آخر تعديل</th></tr></thead>
                    <tbody>
                      <xsl:for-each select="/*[local-name()='urlset']/*[local-name()='url']">
                        <xsl:sort select="*[local-name()='lastmod']" order="descending"/>
                        <tr>
                          <td>
                            <xsl:variable name="u" select="normalize-space(*[local-name()='loc'])"/>
                            <a target="_blank" rel="noopener">
                              <xsl:attribute name="href"><xsl:value-of select="$u"/></xsl:attribute>
                              <xsl:value-of select="$u"/>
                            </a>
                          </td>
                          <td>
                            <span class="badge">
                              <xsl:value-of select="count(*[namespace-uri()='http://www.google.com/schemas/sitemap-image/1.1' and local-name()='image'])"/>
                            </span>
                          </td>
                          <td><xsl:value-of select="*[local-name()='lastmod']"/></td>
                        </tr>
                      </xsl:for-each>
                    </tbody>
                  </table>
                </xsl:otherwise>

              </xsl:choose>

              <p class="muted" style="margin-top:16px">
                ملاحظة: هذا العرض مخصص للبشر فقط. محركات البحث تقرأ ملفات <code>XML</code> مباشرة وتتجاهل طبقة <code>XSL</code>.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
