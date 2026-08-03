import { buildImgixUrl } from '@inkedin/shared/utils/imgix';

interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function imgixLoader({ src, width, quality }: ImageLoaderParams): string {
  return buildImgixUrl(src, null, { w: width, q: quality || 75 });
}
