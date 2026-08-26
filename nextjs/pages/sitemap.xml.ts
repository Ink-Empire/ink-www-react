import { GetServerSideProps } from 'next';

/**
 * Dynamic sitemap: static discovery pages, every public artist profile, and
 * every claimed studio profile with its announcement and guide pages.
 */

const STATIC_PATHS = ['', '/artists', '/tattoos', '/how-it-works', '/faq', '/contact', '/register'];

const SITE = 'https://www.getinked.in';

/** Safety bound so a runaway loop cannot hang the response. */
const MAX_PAGES = 20;
const PER_PAGE = 500;

function url(loc: string, changefreq: string, priority: string, lastmod?: string): string {
  const modified = lastmod ? `<lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>` : '';
  return `<url><loc>${SITE}${loc}</loc>${modified}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
  const appToken = process.env.NEXT_PUBLIC_API_APP_TOKEN || '';
  const headers = { 'Content-Type': 'application/json', 'X-App-Token': appToken };

  const entries: string[] = STATIC_PATHS.map((p) =>
    url(p, p === '' ? 'weekly' : 'daily', p === '' ? '1.0' : '0.8'),
  );

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= MAX_PAGES) {
      const resp = await fetch(`${apiUrl}/api/artists`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ size: PER_PAGE, page }),
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
    // Ship what we have if the API is unreachable
  }

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= MAX_PAGES) {
      const resp = await fetch(`${apiUrl}/api/studios/directory?size=${PER_PAGE}&page=${page}`, {
        method: 'GET',
        headers,
      });
      if (!resp.ok) break;

      const data = await resp.json();
      for (const studio of data.studios || []) {
        if (!studio.slug) continue;

        entries.push(url(`/studios/${studio.slug}`, 'weekly', '0.7', studio.updated_at));

        // Announcements that carry a page of their own. Ephemeral notices are
        // filtered out by the API, so anything returned here is worth indexing.
        for (const post of studio.news || []) {
          if (post.slug) {
            entries.push(url(`/studios/${studio.slug}/news/${post.slug}`, 'weekly', '0.5', post.updated_at));
          }
        }

        // Guides are evergreen, so they rank above announcements and change
        // less often.
        for (const guide of studio.guides || []) {
          if (guide.slug) {
            entries.push(url(`/studios/${studio.slug}/guides/${guide.slug}`, 'monthly', '0.6', guide.updated_at));
          }
        }
      }

      hasMore = Boolean(data.has_more);
      page += 1;
    }
  } catch {
    // Ship what we have if the API is unreachable
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
