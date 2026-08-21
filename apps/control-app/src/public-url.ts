/**
 * Where a published site is served from (REQ-149).
 *
 * `public-site` owns every published byte (DOC-12 §7), so the builder's job is to
 * point at it rather than to serve a second copy. The origin is a constant, not a
 * var: it is the product's own address, the same in every deployment that exists,
 * and a var would invite a per-environment override whose only reachable effect
 * would be to send an operator's "view published" click somewhere else.
 */
export const PUBLIC_SITE_ORIGIN = 'https://1stcontact.io'

/** The public URL for `slug`, with `rel` appended (`/` for the site root). */
export function publicSiteUrl(slug: string, rel = '/'): string {
  const tail = rel.startsWith('/') ? rel : `/${rel}`
  return `${PUBLIC_SITE_ORIGIN}/site/${encodeURIComponent(slug)}${tail}`
}
