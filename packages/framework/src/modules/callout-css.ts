/**
 * The callout treatment's stylesheet, alone (REQ-145).
 *
 * WHY IT IS NOT IN `markdown.ts`. It is a string constant, but it lived beside
 * `createMarkdownProcessor`, so importing it imported `@astrojs/markdown-remark`
 * — and through it Shiki and Prism, which reach a `virtual:` specifier and a
 * wasm package that no Worker bundle can resolve. `render.ts` composes
 * `theme.css` from this constant and runs in workerd, so the two had to part.
 *
 * Nothing about the treatment moved: `markdown.ts` re-exports this, and the
 * markdown transform that PRODUCES the markup it styles is unchanged.
 */

/**
 * Static CSS backing the callout treatment (REQ-32). Folded into the per-site
 * stylesheet after the module component CSS so the two-class `blockquote.fc-*`
 * selectors win the specificity tie against a module's own `:global(blockquote)`
 * rule by source order. Nothing here is site-specific.
 *
 * REQ-114 — the bar takes `currentColor` and there are no per-role colour rules.
 * They were the last `--color-*` consumers outside the retired token palette; a
 * bar that follows the text colour needs no token at all, and a colour a site
 * actually wants to choose belongs in its L1 palette (DOC-23 §5).
 */
export const CALLOUT_CSS = `/* callout / left-bar treatment (REQ-32) */
blockquote.fc-callout {
  margin: 0;
  border-inline-start: var(--space-1) solid currentColor;
  padding-inline-start: var(--space-6);
  color: inherit;
  /* A callout is a weight-emphasised statement — medium (500), a subtle step
     above body copy without the slab of full bold. This is the one place a
     callout's weight is defined; a site-def never sets a raw font-weight. */
  font-weight: var(--font-weight-medium);
}
blockquote.fc-callout--italic { font-style: italic; }`
