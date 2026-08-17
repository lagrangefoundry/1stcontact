import { createMarkdownProcessor, type MarkdownRenderer } from '@astrojs/markdown-remark'
import { CALLOUT_CSS } from './callout-css'

// Re-exported from its old home: the constant moved so a Worker could reach it
// without the markdown processor, not because callers should now look elsewhere.
export { CALLOUT_CSS }
import { assertSafeHtml } from './safety'
import { resolveTextStyle, type TextRun } from './text-style'

/**
 * Callout / left-bar treatment (REQ-32).
 *
 * A blockquote opened with a GFM-style alert marker — `> [!accent] …`, or
 * `> [!secondary italic] …` — renders as a semantic **left-bar callout**
 * (left bar + indent, optionally italic) rather than markdown's plain quote. The
 * emphasis name is drawn from a closed set, never a raw value, so a pull-quote's
 * emphasis stays structured. Available in any `markdown` content field, since
 * the transform runs in the shared renderer.
 *
 * REQ-114 — these names used to be *palette roles* backing a per-role bar
 * colour. Colour left the token surface for the L1 palette model (DOC-23 §5), so
 * the bar now paints `currentColor` and the set below is a closed emphasis
 * vocabulary rather than a colour one.
 */

/** Emphasis names a callout marker may carry (a closed set). */
const CALLOUT_ROLES = new Set<string>([
  'primary',
  'accent',
  'secondary',
  'muted',
  'neutral-cool',
  'accent-light',
  'accent-deep',
  'accent-mid',
])

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
  // Raw HTML and unsafe URL schemes are this renderer's concern (REQ-46): the
  // module is the sanitization boundary for untrusted content, so `renderMarkdown`
  // rejects dangerous output loudly (see `assertSafeHtml` below) rather than
  // passing a `<script>` or a `javascript:` link through to `set:html`.
  //
  // `smartypants: false` — this is a faithful-repro engine, so content renders
  // *verbatim*. The default (on) silently curls straight quotes and turns `--`
  // into an em-dash, which diverges from the authored/captured source and makes
  // text fail the fidelity value-match (a straight `We're` no longer equals the
  // rendered `We’re`). Punctuation the source wants curled must be authored that
  // way, not injected by the renderer.
  processor ??= createMarkdownProcessor({ smartypants: false })
  return processor
}

/**
 * Styled inline run (REQ-71) — `[text]{key=value …}` inside body prose. A bare
 * `[text]` is not a markdown link, so the syntax survives rendering as literal text;
 * this rewrites it to a `<span style="…">`. Distinct from the callout marker (a whole
 * blockquote): this styles a run *within* a paragraph — the only way to colour/size an
 * emphasised phrase, which discrete TextRuns can do but body markdown could not.
 */
const STYLED_SPAN = /\[([^\][]+)\]\{([^}]+)\}/g
/** The style axes a span may set — the TextRun typography keys (no raw CSS). */
const SPAN_STYLE_KEYS = new Set(['color', 'fontFamily', 'fontSizePx', 'fontWeight', 'letterSpacingPx', 'lineHeightPx'])

function transformStyledSpans(html: string): string {
  return html.replace(STYLED_SPAN, (match, text: string, attrStr: string) => {
    const run: Record<string, unknown> = {}
    let emphasis: string | undefined
    for (const pair of attrStr.trim().split(/\s+/)) {
      const eq = pair.indexOf('=')
      if (eq < 1) return match // malformed attr → leave literal
      const key = pair.slice(0, eq)
      const value = pair.slice(eq + 1)
      if (key === 'emphasis') {
        emphasis = value
        continue
      }
      if (!SPAN_STYLE_KEYS.has(key)) return match // unknown key → no silent mis-style
      // Colour/family are strings (a #hex/role or a family name); the metric axes are a
      // literal px number when numeric, else a token alias string.
      run[key] = key === 'color' || key === 'fontFamily' || Number.isNaN(Number(value)) ? value : Number(value)
    }
    const parts = [resolveTextStyle(run as TextRun)].filter(Boolean)
    if (emphasis === 'italic' || emphasis === 'bold-italic') parts.push('font-style: italic')
    if (emphasis === 'bold' || emphasis === 'bold-italic') parts.push('font-weight: 700')
    if (parts.length === 0) return match
    return `<span style="${parts.join('; ')}">${text}</span>`
  })
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
  // Callouts first (whole blockquote), then styled inline runs (a run within a
  // paragraph — including inside a callout's text).
  const html = transformStyledSpans(transformCallouts(withImgs))
  // Fail loud (REQ-46): a `<script>`, inline handler or `javascript:` link in a
  // markdown content field is rejected here, before it can reach `set:html`.
  return assertSafeHtml(html, 'markdown content')
}
