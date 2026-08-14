import React from 'react';

/**
 * Renders a JSON-LD structured data block. Place inside <Head>.
 * Answer engines and search crawlers read these to understand
 * entities (artists, studios, FAQs) without parsing the UI.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https')
  ? process.env.NEXT_PUBLIC_APP_URL
  : 'https://www.getinked.in';

/** Flatten a ReactNode tree to plain text (for FAQ answers). */
export function nodeToText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join(' ').replace(/\s+/g, ' ').trim();
  if (React.isValidElement(node)) return nodeToText((node.props as { children?: React.ReactNode }).children);
  return '';
}
