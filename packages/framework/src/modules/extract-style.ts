/**
 * Pulling a module's chrome out of its `.astro` source (BUG-1, REQ-145).
 *
 * These two functions used to live in `styles.ts`, beside the `readFileSync`
 * that fed them. They are separated now because the READ moved to build time
 * (REQ-145: a Worker has no filesystem) while the extraction itself must stay
 * one implementation — the build step that precompiles `module-assets.ts` and
 * the UAT that checks it has not drifted both call exactly this, so a
 * regenerated file and a checked-in one cannot disagree about what the source
 * says.
 *
 * Both are pure string functions with no imports, so they load anywhere.
 */

/**
 * An Astro component's **template**: everything after the frontmatter fence.
 *
 * The frontmatter is TypeScript, not markup, so a `<style>` occurring there is
 * always prose or a string — never a style element. Scanning it anyway is not a
 * harmless over-read: a doc comment that merely *mentions* `<style>` opens a
 * match that runs to the first real `</style>`, folding the component's imports,
 * props interface, script body and markup into the generated `theme.css` as if
 * they were CSS. `carousel`'s comment does exactly that.
 *
 * A source with no fence is already all template.
 */
export function templateOf(astroSource: string): string {
  const m = /^---\r?\n[\s\S]*?\r?\n---/.exec(astroSource)
  return m ? astroSource.slice(m[0].length) : astroSource
}

/**
 * Concatenated text of every **static** `<style>…</style>` block in
 * `astroSource` — the module's own chrome, folded once into `theme.css`.
 *
 * A module also emits per-instance CSS as a *self-closing*
 * `<style set:html={…} />` in its body, because that content varies per instance
 * and must survive `renderToString` rather than be hoisted. Such a tag has no
 * closing partner, so treating it as an opening one makes the scan run on to the
 * next real `</style>` and swallow all the markup in between — which is how the
 * component's own HTML ended up inside the generated stylesheet.
 */
export function extractStyleBlocks(astroSource: string): string {
  const blocks: string[] = []
  // Removed rather than skipped: a self-closing tag has no `</style>` of its own,
  // so a match starting at one would consume the NEXT block's closing tag and
  // take the real chrome CSS down with it.
  const template = templateOf(astroSource).replace(/<style\b[^>]*\/>/g, '')
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/g
  let match: RegExpExecArray | null
  while ((match = re.exec(template)) !== null) {
    const css = match[1].trim()
    if (css) blocks.push(css)
  }
  return blocks.join('\n')
}
