import { createMarkdownProcessor, type MarkdownRenderer } from '@astrojs/markdown-remark'
import { TREATMENT_ROLE_DIAL } from './dials'

/**
 * Callout / left-bar treatment (REQ-32).
 *
 * A blockquote opened with a GFM-style alert marker — `> [!accent] …`, or
 * `> [!secondary italic] …` — renders as a semantic **left-bar callout**
 * (accent border + indent, optionally italic) rather than markdown's plain
 * quote. The accent is a palette **role** (closed set), never a raw colour, so a
 * pull-quote's emphasis is structured and token-backed. Available in any
 * `markdown` content field, since the transform runs in the shared renderer.
 */

/** Palette roles a callout marker may name (the shared token-backed set). */
const CALLOUT_ROLES = new Set<string>(TREATMENT_ROLE_DIAL)

/**
 * A rendered blockquote whose first paragraph opens with `[!<role>]` or
 * `[!<role> italic]`. The role is captured for validation; `italic` is an
 * optional flag; the trailing marker text is consumed so it never shows.
 */
const CALLOUT_MARKER = /<blockquote>\s*<p>\[!([a-z-]+)(\s+italic)?\]\s*/gi

/** Rewrite alert-marked blockquotes into semantic left-bar callouts. */
function transformCallouts(html: string): string {
  return html.replace(CALLOUT_MARKER, (match, role: string, italic?: string) => {
    // Unknown role → leave the quote untouched (no silent mis-styling).
    if (!CALLOUT_ROLES.has(role)) return match
    const classes = ['fc-callout', `fc-callout--${role}`]
    if (italic) classes.push('fc-callout--italic')
    return `<blockquote class="${classes.join(' ')}"><p>`
  })
}

/**
 * Static CSS backing the callout treatment (REQ-32). Folded into the per-site
 * stylesheet after the module component CSS so the two-class `blockquote.fc-*`
 * selectors win the specificity tie against a module's own `:global(blockquote)`
 * rule by source order. Each role border resolves to a semantic token; nothing
 * here is site-specific.
 */
export const CALLOUT_CSS = `/* callout / left-bar treatment (REQ-32) */
blockquote.fc-callout {
  margin: 0;
  border-inline-start: var(--space-1) solid var(--color-muted);
  padding-inline-start: var(--space-6);
  color: inherit;
}
blockquote.fc-callout--primary { border-inline-start-color: var(--color-primary); }
blockquote.fc-callout--accent { border-inline-start-color: var(--color-accent); }
blockquote.fc-callout--secondary { border-inline-start-color: var(--color-secondary); }
blockquote.fc-callout--muted { border-inline-start-color: var(--color-muted); }
blockquote.fc-callout--neutral-cool { border-inline-start-color: var(--color-neutral-cool); }
blockquote.fc-callout--italic { font-style: italic; }`

/**
 * Markdown → HTML rendering for content fields typed `markdown` (DOC-7 §3.2).
 *
 * The processor is the same remark/rehype stack Astro uses for `.md` files, so
 * module-authored markdown renders identically to page content. It is created
 * lazily and memoised: construction is relatively expensive (it wires the full
 * plugin chain) and the result is a pure function of its input, so one instance
 * is shared for the lifetime of the build / dev server.
 */
let processor: Promise<MarkdownRenderer> | undefined

function getProcessor(): Promise<MarkdownRenderer> {
  // GFM is on by default; syntax highlighting is left at the default theme.
  // Raw HTML in content fields is the validator's concern (DOC-7 §6.5 layer 1),
  // not this renderer's — we render trusted, already-validated markdown.
  processor ??= createMarkdownProcessor({})
  return processor
}

/** `<img>` without an explicit `loading` attribute, so we can default it lazy. */
const BARE_IMG = /<img(?![^>]*\bloading=)([^>]*)>/g

/**
 * Render a markdown string to an HTML fragment suitable for `set:html`.
 *
 * Images gain `loading="lazy"` + `decoding="async"` for free responsive
 * behaviour (DOC-7's mobile-first default). `srcset` generation depends on the
 * asset pipeline and is deferred to a later REQ; lazy loading is the portion
 * available without it.
 */
export async function renderMarkdown(md: string): Promise<string> {
  const { code } = await (await getProcessor()).render(md)
  const withImgs = code.replace(BARE_IMG, '<img loading="lazy" decoding="async"$1>')
  return transformCallouts(withImgs)
}
