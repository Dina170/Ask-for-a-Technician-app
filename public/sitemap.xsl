<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
        <title>Sitemap</title>
        <style type="text/css">
          body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 2rem; }
          h1 { margin: 0 0 1rem 0; font-size: 1.6rem; }
          p { color: #555; }
          ul { margin: 1rem 0; padding: 0; list-style: none; }
          li { margin: .4rem 0; }
          a { text-decoration: none; color: #0366d6; }
          a:hover { text-decoration: underline; }
          .dim { color: #777; }
        </style>
      </head>
      <body>
        <xsl:choose>
          <xsl:when test="/sitemap:sitemapindex">
            <h1>Sitemap index</h1>
            <p>This index contains <strong><xsl:value-of select="count(/sitemap:sitemapindex/sitemap:sitemap)"/></strong> sitemaps.</p>
            <ul>
              <xsl:for-each select="/sitemap:sitemapindex/sitemap:sitemap">
                <li>
                  <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                  <xsl:if test="sitemap:lastmod">
                    <span class="dim"> — <xsl:value-of select="sitemap:lastmod"/></span>
                  </xsl:if>
                </li>
              </xsl:for-each>
            </ul>
          </xsl:when>
          <xsl:otherwise>
            <h1>Sitemap</h1>
            <p>This sitemap contains <strong><xsl:value-of select="count(/sitemap:urlset/sitemap:url)"/></strong> URLs.</p>
            <ul>
              <xsl:for-each select="/sitemap:urlset/sitemap:url">
                <li>
                  <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                  <xsl:if test="sitemap:lastmod">
                    <span class="dim"> — <xsl:value-of select="sitemap:lastmod"/></span>
                  </xsl:if>
                </li>
              </xsl:for-each>
            </ul>
          </xsl:otherwise>
        </xsl:choose>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>