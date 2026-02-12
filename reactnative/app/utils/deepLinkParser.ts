export type DeepLinkTarget =
  | { type: 'artist'; slug: string }
  | { type: 'tattoo'; id: number }
  | { type: 'conversation'; conversationId: number }
  | { type: 'inbox' }
  | null;

export function parseDeepLink(url: string): DeepLinkTarget {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/+$/, '');

    // /artists/:slug
    const artistMatch = pathname.match(/^\/artists\/([^/]+)$/);
    if (artistMatch) {
      return { type: 'artist', slug: decodeURIComponent(artistMatch[1]) };
    }

    // /tattoos/:id (path-based)
    const tattooPathMatch = pathname.match(/^\/tattoos\/(\d+)$/);
    if (tattooPathMatch) {
      return { type: 'tattoo', id: Number(tattooPathMatch[1]) };
    }

    // /tattoos?id=123 (query-based, current web format)
    if (pathname === '/tattoos') {
      const idParam = parsed.searchParams.get('id');
      if (idParam && /^\d+$/.test(idParam)) {
        return { type: 'tattoo', id: Number(idParam) };
      }
    }

    // /inbox/:conversationId
    const inboxMatch = pathname.match(/^\/inbox\/(\d+)$/);
    if (inboxMatch) {
      return { type: 'conversation', conversationId: Number(inboxMatch[1]) };
    }

    // /inbox
    if (pathname === '/inbox') {
      return { type: 'inbox' };
    }

    return null;
  } catch {
    return null;
  }
}
