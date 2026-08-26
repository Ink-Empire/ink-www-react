/**
 * The public studio page is served through a short shared cache. An owner who
 * has just published would otherwise be able to land on a cached copy of their
 * own page from before the edit, which reads as though the publish failed.
 *
 * On publish the editor drops a short-lived cookie naming the studio; the
 * page's getServerSideProps sees it and serves that visitor an uncached
 * render. It expires on its own, so the owner rejoins the cache shortly after.
 */
export const RECENTLY_EDITED_COOKIE = 'inkedin_recently_edited_studio';

/** How long the owner bypasses the shared cache for, in seconds. */
const BYPASS_DURATION = 10 * 60;

export function markStudioRecentlyEdited(slug: string): void {
  if (typeof document === 'undefined' || !slug) return;

  document.cookie = `${RECENTLY_EDITED_COOKIE}=${encodeURIComponent(slug)}; path=/; max-age=${BYPASS_DURATION}; samesite=lax`;
}
