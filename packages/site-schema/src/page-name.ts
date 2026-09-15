/**
 * What a page may be called — its slug and its id ([[BUG-92]]).
 *
 * THE FAILURE THIS EXISTS FOR. The assistant added a page with the address
 * `papers/download`. The write was accepted, because nothing between the tool
 * call and the store looked at the shape of the value. Every later render then
 * threw — `renderSiteFiles` refuses a nested slug, correctly and for a real
 * reason (REQ-109: emitted asset URLs are document-relative, which is only true
 * while every page sits flat at the snapshot root) — and because that guard runs
 * over the whole page loop, ONE bad page took down EVERY page. Draft preview,
 * publish and the published site all went dark together, and the only repair was
 * to edit the stored definition by hand.
 *
 * The invariant was never wrong; its position was. A rule enforced after the
 * value is durable can only report a site that is already broken. Enforced here,
 * it is a refused tool call with a name in it, which is a thing an AI author can
 * act on (DOC-8 §6).
 *
 * ONE RULE FOR THE SLUG AND THE ID, because they are the same kind of thing: a
 * single token concatenated into a path. The slug becomes `<slug>.html` at the
 * snapshot root and the segment a visitor types; the id becomes the store key
 * `<id>.json`. A separator in either produces a nesting nobody asked for.
 *
 * REFUSED, NOT SANITISED — and that is the difference from an asset name
 * ({@link sanitizeAssetName}, REQ-246), which is total because refusing a
 * customer's file over its filename is not a thing this product should do. A
 * page name is not a byte stream arriving from outside: it is an address chosen
 * deliberately, published, and permanent once a revision ships. Quietly filing
 * `papers/download` under `papers-download` would put the page at an address its
 * author does not know, and the nav link they write next would 404.
 */

/**
 * A page name: one addressable segment, bounded.
 *
 * THE CHARACTER SET IS RFC 3986's UNRESERVED SET LESS `~` — deliberately the
 * same set `isUnsafeAssetName`/`sanitizeAssetName` (REQ-246) admit, and the same
 * one `SITE_KEY_PATTERN` (apps/public-site/src/routes.ts) admits, because all
 * three answer the same question: what survives being a URL path segment, an R2
 * key and a filename with no encoding anywhere? Three statements rather than one
 * shared constant is deliberate — the Worker's copy cannot import this package,
 * and each site carries the reasoning for its own rule. If the set ever moves,
 * it moves in all three.
 *
 * THE FIRST CHARACTER MUST BE ALPHANUMERIC, which is what makes `.`, `..` and
 * `.hidden` unreachable without naming them: a traversal is just a name that
 * starts with a dot, and refusing the shape refuses the family.
 *
 * 64 characters is the ceiling, matching `SITE_KEY_PATTERN`'s. Nothing breaks at
 * 65 — the bound is here so a pathological name cannot become a pathological key.
 */
const PAGE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/

/**
 * `index` is the home page's alias, so no other page may claim it.
 *
 * `renderSiteFiles` writes `index.html` from the home page AFTER the page loop,
 * so a page slugged `index` is not refused by anything today — it is rendered,
 * then silently overwritten, and its address serves the home page's bytes. That
 * is the failure this module exists for wearing a different hat: a value taken on
 * write that cannot be served at the address it names.
 *
 * REFUSED FOR EVERY PAGE RATHER THAN FOR EVERY PAGE BUT THE HOME ONE. Deciding
 * which page is home is `homePage`'s rule, in the renderer, and restating it here
 * would be a second copy free to drift from the first. Nothing is lost: the home
 * page is already served at `/`, so `index` is a slug no page needs.
 */
const HOME_ALIAS_SLUG = 'index'

/** Is this a name a page can be addressed and stored by? */
export function isValidPageName(value: string): boolean {
  return PAGE_NAME.test(value)
}

/**
 * Would this slug name a file the snapshot already writes for something else?
 *
 * `index` is the home alias; a `.html` tail collides in the other direction — a
 * page slugged `about.html` renders to `about.html.html`, so the address the
 * author would write, `/about.html`, resolves to whatever `about.html` is. If
 * another page is slugged `about`, that is *that* page's bytes: two addresses,
 * one page, no error anywhere.
 */
export function isReservedPageSlug(slug: string): boolean {
  const lower = slug.toLowerCase()
  return lower === HOME_ALIAS_SLUG || lower.endsWith('.html')
}

/**
 * Why a slug was refused, and what to write instead.
 *
 * It carries its own justification for the reason {@link localeShapedSlugMessage}
 * does: a refusal that reads as arbitrary cannot be told apart from a bug, so the
 * author works around it instead of renaming the page. Naming the flat form of
 * the slug they actually wrote — `papers/download` → `papers-download` — is the
 * part an assistant can act on without another round trip.
 */
export function pageSlugShapeMessage(slug: string): string {
  if (isReservedPageSlug(slug)) {
    return slug.toLowerCase() === HOME_ALIAS_SLUG
      ? `page slug 'index' is reserved: the site's home page is already published there, ` +
          `so a second page at that address would be overwritten by it. Name the page for ` +
          `what it holds instead.`
      : `page slug '${slug}' ends in '.html': a page is published AS '<slug>.html', so this ` +
          `one would be served at '/${slug}.html' and the address '/${slug}' would resolve to ` +
          `a different page. Write '${flatten(slug.replace(/\.html$/i, ''))}'.`
  }
  const flat = flatten(slug)
  return (
    `page slug '${slug}' is not an address a page can be published at: a page sits FLAT at ` +
    `the top level of the site, so a slug is one segment — letters, digits, '-', '_' and '.', ` +
    `starting with a letter or digit, no '/' and no '\\'. ` +
    `Write '${flat}' instead — a page reached from another is still a page beside it.`
  )
}

/** Why a page id was refused. */
export function pageIdShapeMessage(id: string): string {
  return (
    `page id '${id}' is not a name a page can be stored under: an id is one segment — ` +
    `letters, digits, '-', '_' and '.', starting with a letter or digit, no '/' and no '\\'. ` +
    `Write '${flatten(id)}' instead.`
  )
}

/**
 * The name the author probably meant, as one segment.
 *
 * SUGGESTION ONLY — nothing stores this. It exists so the refusal ends in a value
 * the author can paste rather than in a description of one, which is the whole
 * difference between an error an assistant recovers from in one turn and an error
 * it recovers from in three. A name with nothing usable left in it falls back to
 * `page`, because "write ''" is not an instruction.
 */
function flatten(value: string): string {
  const flat = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
  return flat.slice(0, 64) || 'page'
}
