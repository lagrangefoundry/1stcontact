/**
 * REQ-350 (decision D3) — a stored site written before named text styles, lifted
 * to them on load.
 *
 * The theme's `typography` group was a second answer to "what is the type": its
 * families reached an L1 page through the page shell (`body` and `h1`–`h4`
 * font-family rules), its scale, weights, line heights, tracking and sub-scales
 * reached nothing live. It is retired from the schema, so a site stored with one
 * would no longer validate — and refusing to load it is refusing over a change
 * the platform knows how to make. This is that change, made where the store is
 * read (`assembleSite`, and the edit commands' reads), so the next write persists
 * it and nothing is ever written in the old shape again.
 *
 * WHAT IT PRESERVES, exactly:
 *  - the body family becomes the `body` style and the site default — what the
 *    shell's `body { font-family }` gave every run and control with none of its
 *    own;
 *  - the heading family becomes the `heading` style, and a heading run (levels
 *    1–4, what the shell's `h1, h2, h3, h4` rule matched) that sets no family
 *    and names no style is pointed at it — only when the two families differ,
 *    since otherwise the default already gives it the same face;
 *  - a `display` or `label` family becomes a style of that name, so the
 *    `--font-family-display`/`-label` properties are still generated from it.
 * Nothing else the group held had a reader, so nothing else is carried.
 */

type Json = Record<string, unknown>

const isRecord = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)

/** The families a legacy theme declared, or `null` when the site has no legacy typography. */
function legacyFamilies(base: unknown): Record<string, string> | null {
  if (!isRecord(base) || !isRecord(base.theme) || !isRecord(base.theme.typography)) return null
  const family = base.theme.typography.family
  if (!isRecord(family)) return {}
  const out: Record<string, string> = {}
  for (const name of ['body', 'heading', 'display', 'label']) {
    if (typeof family[name] === 'string' && family[name]) out[name] = family[name] as string
  }
  return out
}

/** `site.json` with a legacy `theme.typography` turned into named text styles. Identity when there is none. */
export function liftLegacyTypography<T>(base: T): T {
  const families = legacyFamilies(base)
  if (families === null) return base
  const site = base as unknown as Json
  const { typography: _retired, ...theme } = site.theme as Json
  const styles: Json = { ...(isRecord(site.textStyles) ? site.textStyles : {}) }
  for (const [name, fontFamily] of Object.entries(families)) {
    if (!(name in styles)) styles[name] = { fontFamily }
  }
  const lifted: Json = { ...site, theme }
  if (Object.keys(styles).length > 0) lifted.textStyles = styles
  if (lifted.textDefault === undefined && isRecord(styles.body)) lifted.textDefault = 'body'
  return lifted as T
}

/**
 * A page whose headings relied on the shell's heading family, pointed at the
 * `heading` style — read against the site AS STORED, since it is the legacy
 * theme that says whether there is anything to preserve.
 */
export function liftLegacyHeadings<T>(page: T, storedBase: unknown): T {
  const families = legacyFamilies(storedBase)
  if (!families?.heading || families.heading === families.body) return page
  const walk = (v: unknown, typed: boolean): unknown => {
    if (Array.isArray(v)) return v.map((item) => walk(item, typed))
    if (!isRecord(v)) return v
    const node: Json = { ...v }
    if (node.kind === 'text') {
      const level = isRecord(node.heading) ? node.heading.level : undefined
      const axes = isRecord(node.axes) ? node.axes : {}
      if (typeof level === 'number' && level <= 4 && !typed && axes.fontFamily === undefined && axes.textStyle === undefined) {
        node.axes = { ...axes, textStyle: 'heading' }
      }
      return node
    }
    const inner = typed || (typeof node.kind === 'string' && isRecord(node.type))
    for (const [key, item] of Object.entries(node)) node[key] = walk(item, inner)
    return node
  }
  return walk(page, false) as T
}
