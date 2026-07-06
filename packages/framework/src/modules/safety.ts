/**
 * REQ-46 — content-safety boundary (fail loud on dangerous content).
 *
 * The product thesis is untrusted content (AI-/customer-supplied text and URLs),
 * so a module is the sanitization boundary. Rather than silently neutralize a
 * dangerous value, the renderer **rejects** it loudly: a `javascript:` href, a
 * raw `<script>`, an inline `on*` handler — each throws {@link ContentSafetyError}
 * naming the field and value, so the generating AI *sees the error and adjusts*
 * the content it produced (a recoverable failure, not a silent strip).
 *
 * This is the single definition of "unsafe" for the render path, mirroring the
 * conformance harness `SECURITY_PROBE` ([[REQ-40]]) so the detector and the
 * enforcer agree on exactly what they forbid.
 */

/** Thrown at render time when a content value would emit a dangerous artefact. */
export class ContentSafetyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContentSafetyError'
  }
}

/** URL schemes that are always safe to emit. */
const SAFE_SCHEMES = new Set(['http', 'https', 'mailto', 'tel'])

/** The scheme of a URL (lowercased), or '' for a relative / hash / scheme-less URL. */
function schemeOf(url: string): string {
  const m = /^([a-z][a-z0-9+.-]*):/i.exec(url.trim())
  return m ? m[1].toLowerCase() : ''
}

/**
 * Whether a URL's scheme is unsafe to emit on a link/resource attribute. Relative
 * URLs, in-page `#` anchors and scheme-less values are safe; `data:` is safe only
 * as `data:image/*` (an inline image asset); everything else outside the safe set
 * (`javascript:`, `vbscript:`, `data:text/html`, `file:`, …) is unsafe.
 */
export function isUnsafeUrl(url: string): boolean {
  const scheme = schemeOf(url)
  if (!scheme) return false
  if (SAFE_SCHEMES.has(scheme)) return false
  if (scheme === 'data') return !/^\s*data:image\//i.test(url)
  return true
}

/**
 * Assert a URL is safe to emit, returning it unchanged. Throws
 * {@link ContentSafetyError} (naming `context` and the value) when the scheme is
 * unsafe — the caller is a raw `href`/`src`/`action` sink, so this is the point
 * the injection would otherwise reach the DOM.
 */
export function assertSafeUrl(url: string, context: string): string {
  if (isUnsafeUrl(url)) {
    throw new ContentSafetyError(
      `unsafe URL scheme in ${context}: ${JSON.stringify(url.slice(0, 120))} — ` +
        `only http(s), mailto, tel, relative, #anchor, or data:image/* URLs may be rendered`,
    )
  }
  return url
}

/** A `<script>`/`<iframe>`/`<object>`/`<embed>` opening tag. */
const DANGEROUS_TAG = /<\s*(script|iframe|object|embed)\b/i
/** An inline `on*` event-handler attribute (`onerror=`, `onclick=`, …). */
const EVENT_HANDLER = /<[^>]*\son[a-z]+\s*=/i
/** A URL-bearing attribute and its value (quoted or bare). */
const URL_ATTR = /\b(?:href|src|action|formaction|xlink:href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi

/**
 * Assert an HTML fragment carries no dangerous artefact, returning it unchanged.
 * Rejects (throws {@link ContentSafetyError}) a dangerous tag, an inline event
 * handler, or a link/resource attribute with an unsafe URL scheme — the same
 * artefacts the [[REQ-40]] `SECURITY_PROBE` flags. Called on rendered markdown
 * before it reaches a `set:html` sink, so raw HTML in a content field fails loud
 * instead of executing.
 */
export function assertSafeHtml(html: string, context: string): string {
  if (DANGEROUS_TAG.test(html)) {
    throw new ContentSafetyError(
      `dangerous HTML tag in ${context}: content may not emit <script>/<iframe>/<object>/<embed>`,
    )
  }
  if (EVENT_HANDLER.test(html)) {
    throw new ContentSafetyError(
      `inline event handler in ${context}: content may not emit an on* attribute`,
    )
  }
  for (const m of html.matchAll(URL_ATTR)) {
    const value = m[1] ?? m[2] ?? m[3] ?? ''
    if (isUnsafeUrl(value)) {
      throw new ContentSafetyError(
        `unsafe URL scheme in ${context}: ${JSON.stringify(value.slice(0, 120))} — ` +
          `only http(s), mailto, tel, relative, #anchor, or data:image/* URLs may be rendered`,
      )
    }
  }
  return html
}
