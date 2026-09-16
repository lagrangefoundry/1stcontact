/**
 * Where a site is reachable, and WHO IS BEING SENT THERE ([[REQ-149]],
 * [[BUG-97]]).
 *
 * `public-site` owns every published byte (DOC-12 §7), so the builder's job is to
 * point at it rather than to serve a second copy. What this file settles is which
 * ORIGIN each link names, and the answer depends on the audience — which is the
 * distinction it was written without and [[BUG-97]] is.
 *
 * TWO AUDIENCES, AND THEY ARE NOT INTERCHANGEABLE:
 *
 *   - **The operator, inside the builder.** A "view published" click and the
 *     preview channel's redirect to the live site. The destination is this
 *     product's own front door, and {@link publicSiteUrl} names it from a
 *     constant.
 *   - **A stranger, by email.** A gated download's per-contact link. The
 *     destination is THE ADDRESS THAT PARTICULAR SITE HAS, and
 *     {@link recipientSiteUrl} takes it as an argument because no constant in
 *     this file could know it.
 *
 * WHY THE CONSTANT IS STILL A CONSTANT. Its own reasoning — *"a var would invite
 * a per-environment override whose only reachable effect would be to send an
 * operator's 'view published' click somewhere else"* — was written when the
 * operator was the only audience, and it is untouched by this split: nothing
 * below is overridden per deployment, and the recipient's host is read from the
 * store the product already keeps it in rather than from configuration.
 */
export const PUBLIC_SITE_ORIGIN = 'https://1stcontact.io'

/**
 * The path a site's published bytes are served at, under any origin.
 *
 * THE ARGUMENT IS THE SITE'S KEY ([[REQ-190]]). `/site/<slug>/`
 * made the published address a name somebody chose, which had to be unique
 * across every business on the deployment for the URL to name anything — so the
 * slug was a key, a customer could be refused a name another customer had taken,
 * and being refused told them it was taken. The address is the site's own
 * unguessable key now, and since [[REQ-236]] there is no slug at all: the
 * builder addresses the site by the same key, so this takes the value its caller
 * already holds rather than one it had to ask the store to translate.
 *
 * Callers get the key from `TenantSiteStore.siteKeys`, whose statement is scoped
 * to the business, rather than composing one here from whatever they hold.
 */
function sitePath(siteKey: string, rel: string): string {
  const tail = rel.startsWith('/') ? rel : `/${rel}`
  return `/site/${encodeURIComponent(siteKey)}${tail}`
}

/**
 * The public URL for a site, with `rel` appended (`/` for the site root).
 *
 * FOR THE OPERATOR, INSIDE THE BUILDER — see the header. A link a recipient will
 * receive wants {@link recipientSiteUrl}, which names the site's own host rather
 * than the product's.
 */
export function publicSiteUrl(siteKey: string, rel = '/'): string {
  return `${PUBLIC_SITE_ORIGIN}${sitePath(siteKey, rel)}`
}

/**
 * The URL to send a RECIPIENT, on the address the site actually has ([[BUG-97]]).
 *
 * `host` IS THE SITE'S OWN, out of `site_domains` — see `hostname.ts`, which is
 * the one place that table is read, and `addressForLinks`, which decides which
 * of a site's addresses a link should wear. It is a parameter and not a constant
 * because it is a fact about one site rather than about this deployment: a
 * per-environment var here would be exactly what `PUBLIC_SITE_ORIGIN`'s own
 * comment warns against, and the value this takes is not one.
 *
 * WHY SENDING A STRANGER TO THE PRODUCT'S HOST IS A DEFECT AND NOT A DETAIL. The
 * `invite` seed already records that *"an anonymous From is most of what makes an
 * invitation from a domain with no reputation look like phishing"*, and the same
 * argument applies to the link as to the sender: somebody who signed up on
 * `alice.1stc.site` and is mailed a button to a domain they have never seen has
 * been given every reason not to press it.
 *
 * THE PATH IS `/site/<key>/…` AND IS NOT A COMPROMISE TO BE TIDIED AWAY LATER.
 * `public-site` resolves a site from that grammar and from `APEX_SITE_KEY`, and
 * from nothing else — there is no host→site resolution, so a link at
 * `https://alice.1stc.site/api/download/<token>` would name the right host and
 * RESOLVE NOWHERE, which is a worse link than the wrong one it replaced.
 * [[DOC-45]] §4 owns that work and gates it on [[TODO-6]] §§1 and 5 (wildcard
 * DNS, the wildcard certificate, the PSL entry). What this function fixes is the
 * half that is ours to fix today: the recipient is no longer sent to a different
 * domain from the one they signed up on, and the link resolves the moment that
 * host points at `public-site` — with no ordering dependency on an operator task.
 * Dropping the key from the path is the same ticket that deletes the grammar.
 */
export function recipientSiteUrl(host: string, siteKey: string, rel = '/'): string {
  return `https://${host}${sitePath(siteKey, rel)}`
}

/**
 * The path one of a site's DRAFT-SIDE channels is served at, under the builder.
 *
 * ONE SPELLING OF THE PREVIEW GRAMMAR. `/preview/<siteKey>/<channel>/<rel>` is
 * the route `router.ts` matches, the address the preview pane loads, the address
 * a drawing in the assistant's transcript is linked at, and — since [[BUG-97]] —
 * the address a gated download minted from a preview submission opens. It was
 * written out by hand at each of those, and a grammar spelled four times is a
 * grammar three of them eventually disagree with.
 */
export function previewPath(siteKey: string, channel: string, rel = '/'): string {
  const tail = rel.startsWith('/') ? rel : `/${rel}`
  return `/preview/${encodeURIComponent(siteKey)}/${encodeURIComponent(channel)}${tail}`
}

/**
 * A whole URL out of an origin and a same-origin path ([[BUG-97]]).
 *
 * `origin` IS A REQUEST'S OWN AND NEVER CONFIGURATION. The only caller is
 * composing a link back to the builder that took the submission it is answering,
 * and `new URL(request.url).origin` is a fact about that request rather than a
 * value anybody can set wrongly. That is also what makes the link followable on a
 * development machine, which is [[BUG-97]]'s symptom: the operator testing a form
 * in their own preview is mailed a link back into the very server they are
 * looking at.
 *
 * A FUNCTION RATHER THAN A `+`, so the one place a trailing slash on an origin
 * could double a slash in a mailed URL is the one place it is handled.
 */
export function urlOn(origin: string, path: string): string {
  return `${origin.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}
