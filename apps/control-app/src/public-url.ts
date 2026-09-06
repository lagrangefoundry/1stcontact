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

/**
 * The public URL for a site, with `rel` appended (`/` for the site root).
 *
 * THE ARGUMENT IS THE SITE'S KEY, NOT ITS SLUG ([[REQ-190]]). `/site/<slug>/`
 * made the published address a name somebody chose, which had to be unique
 * across every business on the deployment for the URL to name anything — so the
 * slug was a key, a customer could be refused a name another customer had taken,
 * and being refused told them it was taken. The address is the site's own
 * unguessable key now; the slug is what its business calls it and never leaves
 * the builder.
 *
 * Callers get the key from `TenantSiteStore.siteKey`, whose lookup is scoped to
 * the business, rather than composing one here from whatever they hold.
 */
export function publicSiteUrl(siteKey: string, rel = '/'): string {
  const tail = rel.startsWith('/') ? rel : `/${rel}`
  return `${PUBLIC_SITE_ORIGIN}/site/${encodeURIComponent(siteKey)}${tail}`
}
