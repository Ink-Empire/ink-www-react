import type { ImageEditParams } from '../types';

interface DisplayParams {
  w?: number;
  h?: number;
  fit?: string;
  q?: number;
  [key: string]: string | number | undefined;
}

function isImgixUrl(url: string): boolean {
  return url.includes('imgix.net');
}

// RN-safe query string builder (URLSearchParams.set is not available in Hermes)
function buildQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

export function buildImgixUrl(
  baseUri: string,
  editParams?: ImageEditParams | null,
  displayParams?: DisplayParams
): string {
  if (!baseUri || !isImgixUrl(baseUri)) {
    return baseUri;
  }

  const [urlBase] = baseUri.split('?');
  const params: Record<string, string> = {};

  // Always use auto format and compress for optimal delivery
  params.auto = 'format,compress';

  // Apply edit params
  if (editParams) {
    if (editParams.bri != null && editParams.bri !== 0) {
      params.bri = String(editParams.bri);
    }
    if (editParams.con != null && editParams.con !== 0) {
      params.con = String(editParams.con);
    }
    if (editParams.sat != null && editParams.sat !== 0) {
      params.sat = String(editParams.sat);
    }
    if (editParams.sharp != null && editParams.sharp !== 0) {
      params.sharp = String(editParams.sharp);
    }
    if (editParams.rot != null && editParams.rot !== 0) {
      params.rot = String(editParams.rot);
    }
    if (editParams.sepia != null && editParams.sepia !== 0) {
      params.sepia = String(editParams.sepia);
    }
    if (editParams.hue_shift != null && editParams.hue_shift !== 0) {
      params['hue-shift'] = String(editParams.hue_shift);
    }
    if (editParams.mono) {
      params.monochrome = '000000';
    }
    if (editParams.auto_enhance) {
      params.auto = 'format,compress,enhance';
    }
    if (editParams.crop) {
      const { x, y, w, h } = editParams.crop;
      params.rect = `${x},${y},${w},${h}`;
    }
  }

  // Apply display params (size, fit, etc.)
  if (displayParams) {
    Object.entries(displayParams).forEach(([key, value]) => {
      if (value != null) {
        params[key] = String(value);
      }
    });
  }

  const queryString = buildQueryString(params);
  return queryString ? `${urlBase}?${queryString}` : urlBase;
}

export function tattooCardUrl(
  uri: string,
  editParams?: ImageEditParams | null
): string {
  return buildImgixUrl(uri, editParams, { w: 600 });
}

export function tattooModalUrl(
  uri: string,
  editParams?: ImageEditParams | null
): string {
  return buildImgixUrl(uri, editParams, { w: 1200 });
}

export function profileImageUrl(
  uri: string,
  editParams?: ImageEditParams | null
): string {
  return buildImgixUrl(uri, editParams, { w: 256, h: 256, fit: 'crop' });
}
