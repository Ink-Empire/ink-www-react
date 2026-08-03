import { GetServerSideProps } from 'next';

/**
 * Dynamic sitemap: static discovery pages plus every public artist profile.
 * Studio profiles can be added once a public list endpoint exists.
 */

const STATIC_PATHS = ['', '/artists', '/tattoos', '/how-it-works', '/faq', '/contact', '/register'];

const SITE = 'https://www.getinked.in';

function url(loc: string, changefreq: string, priority: string): string {
  return `<url><loc>${SITE}${loc}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
  const appToken = process.env.NEXT_PUBLIC_API_APP_TOKEN || '';

  const entries: string[] = STATIC_PATHS.map((p) =>
    url(p, p === '' ? 'weekly' : 'daily', p === '' ? '1.0' : '0.8'),
  );

  try {
    let page = 1;
    let hasMore = true;
    // Cap at 20 pages (10k artists) as a safety bound
    while (hasMore && page <= 20) {
      const resp = await fetch(`${apiUrl}/api/artists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Token': appToken },
        body: JSON.stringify({ size: 500, page }),
      });
      if (!resp.ok) break;
      const data = await resp.json();
      for (const artist of data.response || []) {
        if (artist.slug) entries.push(url(`/artists/${artist.slug}`, 'weekly', '0.7'));
      }
      hasMore = Boolean(data.has_more);
      page += 1;
    }
  } catch {
    // Ship the static entries if the API is unreachable
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml);
  res.end();

  return { props: {} };
};

export default function Sitemap() {
  return null;
}
