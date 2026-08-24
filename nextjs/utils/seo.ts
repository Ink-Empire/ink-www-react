/**
 * Search-facing copy for public profile pages.
 *
 * Long-tail queries look like "neotraditional tattoo cleveland", so titles and
 * descriptions are composed from the artist's real styles and city rather than
 * a generic template. Everything here is derived from data the profile already
 * shows, so nothing is claimed that is not on the page.
 */

const SITE = 'https://www.getinked.in';

type NamedStyle = { name?: string } | string;

/** "Cleveland, OH, USA" -> "Cleveland, OH" */
export function formatLocation(location?: string | null): string {
  if (!location) return '';
  return location
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && !/^(usa|united states|us)$/i.test(part))
    .join(', ');
}

/** "Cleveland, OH" -> "Cleveland" */
export function localityOnly(location?: string | null): string {
  const formatted = formatLocation(location);
  return formatted ? formatted.split(',')[0].trim() : '';
}

export function styleNames(styles?: NamedStyle[] | null): string[] {
  if (!Array.isArray(styles)) return [];
  return styles
    .map((style) => (typeof style === 'string' ? style : style?.name))
    .filter((name): name is string => Boolean(name));
}

/** ["Neo-Traditional", "Japanese"] -> "Neo-Traditional and Japanese" */
export function joinStyles(styles: string[], max = 2): string {
  const list = styles.slice(0, max);
  if (list.length === 0) return '';
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

export interface ArtistSeoInput {
  name?: string;
  slug?: string;
  location?: string | null;
  styles?: NamedStyle[] | null;
  studio_name?: string | null;
  about?: string | null;
}

export function artistSeoTitle(artist: ArtistSeoInput): string {
  const styles = joinStyles(styleNames(artist.styles));
  const place = formatLocation(artist.location);
  const role = styles ? `${styles} Tattoo Artist` : 'Tattoo Artist';
  const where = place ? ` in ${place}` : '';

  return `${artist.name} - ${role}${where} | InkedIn`;
}

export function artistSeoDescription(artist: ArtistSeoInput): string {
  const styles = joinStyles(styleNames(artist.styles), 3);
  const place = formatLocation(artist.location);

  const opener = styles
    ? `${styles} tattoo artist${place ? ` in ${place}` : ''}.`
    : `Tattoo artist${place ? ` in ${place}` : ''}.`;

  const studio = artist.studio_name ? ` Working out of ${artist.studio_name}.` : '';

  return `${opener}${studio} Browse ${artist.name}'s tattoo portfolio, check availability and book a consultation on InkedIn.`;
}

export interface StudioSeoInput {
  name?: string;
  slug?: string;
  city?: string | null;
  state?: string | null;
  about?: string | null;
  styles?: NamedStyle[] | null;
}

function studioPlace(studio: StudioSeoInput): string {
  return [studio.city, studio.state].filter(Boolean).join(', ');
}

export function studioSeoTitle(studio: StudioSeoInput): string {
  const styles = joinStyles(styleNames(studio.styles));
  const place = studioPlace(studio);
  const role = styles ? `${styles} Tattoo Shop` : 'Tattoo Shop';

  return `${studio.name} - ${role}${place ? ` in ${place}` : ''} | InkedIn`;
}

export function studioSeoDescription(studio: StudioSeoInput): string {
  const styles = joinStyles(styleNames(studio.styles), 3);
  const place = studioPlace(studio);

  const opener = `${studio.name} is a tattoo shop${place ? ` in ${place}` : ''}.`;
  const specialties = styles ? ` Specialising in ${styles} tattoos.` : '';

  return `${opener}${specialties} See the artist roster, browse portfolios and book a tattoo appointment on InkedIn.`;
}

/** Structured data for an artist profile. */
export function artistJsonLd(artist: ArtistSeoInput, slug: string) {
  const styles = styleNames(artist.styles);
  const place = formatLocation(artist.location);
  const locality = localityOnly(artist.location);

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: artist.name,
    url: `${SITE}/artists/${slug}`,
    jobTitle: styles.length ? `${joinStyles(styles)} Tattoo Artist` : 'Tattoo Artist',
    ...(artist.about && { description: artist.about }),
    ...(place && {
      address: { '@type': 'PostalAddress', addressLocality: locality, addressRegion: place.split(',')[1]?.trim() },
      areaServed: { '@type': 'City', name: locality },
    }),
    ...(styles.length && {
      knowsAbout: styles.map((style) => `${style} tattoo`),
    }),
    ...(artist.studio_name && { worksFor: { '@type': 'TattooParlor', name: artist.studio_name } }),
  };
}
