import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BASE_URL = "https://continentalexpresscargo.com";

const STATIC_PAGES = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/services", changefreq: "monthly", priority: "0.9" },
  { loc: "/destinations", changefreq: "monthly", priority: "0.9" },
  { loc: "/tarification", changefreq: "monthly", priority: "0.8" },
  { loc: "/tracking", changefreq: "monthly", priority: "0.8" },
  { loc: "/actualites", changefreq: "weekly", priority: "0.8" },
  { loc: "/faq", changefreq: "monthly", priority: "0.7" },
  { loc: "/guide", changefreq: "monthly", priority: "0.7" },
  { loc: "/about", changefreq: "monthly", priority: "0.7" },
  { loc: "/legal", changefreq: "yearly", priority: "0.3" },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: articles, error } = await supabase
      .from("articles")
      .select("slug, date_publication, updated_at")
      .eq("published", true)
      .order("date_publication", { ascending: false });

    if (error) throw error;

    const today = new Date().toISOString().slice(0, 10);

    const staticUrls = STATIC_PAGES.map(
      (page) => `
  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    ).join("");

    const articleUrls = (articles ?? []).map((a) => {
      const lastmod = (a.updated_at || a.date_publication || today).slice(0, 10);
      return `
  <url>
    <loc>${BASE_URL}/article/${a.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }).join("");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticUrls}
${articleUrls}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
