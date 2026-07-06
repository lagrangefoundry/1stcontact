import { describe, expect, it } from 'vitest'
import {
  ContentSafetyError,
  assertSafeHtml,
  assertSafeUrl,
  isUnsafeUrl,
  renderMarkdown,
} from '../tools/generate/src'

/**
 * REQ-46 — content-safety boundary unit tests ("every aspect of unsafe").
 *
 * These pin the framework enforcer (`packages/framework/src/modules/safety.ts`
 * + the hardened `renderMarkdown`) directly: every unsafe URL scheme and HTML
 * vector must be *rejected loud* (`ContentSafetyError`), and every safe value
 * must pass unchanged. They are the false-positive guard for the harness
 * extension — the harness counts a rejection as conformant, so clean content
 * being wrongly rejected is caught here, not there.
 */

// ── URL-scheme rejection (assertSafeUrl / isUnsafeUrl) ────────────────────────

const UNSAFE_URLS = [
  'javascript:alert(1)',
  'JavaScript:alert(1)', // scheme match is case-insensitive
  '  javascript:alert(1)', // leading whitespace does not smuggle it past
  'vbscript:msgbox(1)',
  'data:text/html,<script>alert(1)</script>',
  'data:application/javascript,alert(1)',
  'file:///etc/passwd',
]

const SAFE_URLS = [
  'https://example.com/page',
  'http://example.com',
  'mailto:hi@example.com',
  'tel:+15551234',
  '/relative/path',
  './rel',
  '../up',
  '#in-page-anchor',
  'assets/logo.png',
  'data:image/png;base64,iVBORw0KGgo=',
  'data:image/svg+xml,<svg/>',
]

describe('REQ-46 content-safety — URL schemes', () => {
  it.each(UNSAFE_URLS)('test_UAT_FC_REQ-46_url_rejected: %s', (url) => {
    expect(isUnsafeUrl(url)).toBe(true)
    expect(() => assertSafeUrl(url, 'test')).toThrow(ContentSafetyError)
  })

  it.each(SAFE_URLS)('test_UAT_FC_REQ-46_url_passes: %s', (url) => {
    expect(isUnsafeUrl(url)).toBe(false)
    expect(assertSafeUrl(url, 'test')).toBe(url)
  })

  it('test_UAT_FC_REQ-46_url_error_names_field_and_value', () => {
    expect(() => assertSafeUrl('javascript:steal()', 'hero cta href')).toThrow(
      /hero cta href.*javascript:steal/s,
    )
  })
})

// ── HTML rejection (assertSafeHtml) ───────────────────────────────────────────

const UNSAFE_HTML = [
  '<script>window.x=1</script>',
  '<SCRIPT>window.x=1</SCRIPT>',
  '<iframe src="https://evil.example"></iframe>',
  '<object data="x.swf"></object>',
  '<embed src="x.swf">',
  '<img src=x onerror="window.x=1">',
  '<a href="javascript:alert(1)">tap</a>',
  '<img src="data:text/html,<script>1</script>">',
]

const SAFE_HTML = [
  '<p>Ordinary <strong>prose</strong> with a <a href="https://example.com">link</a>.</p>',
  '<img src="/assets/photo.png" loading="lazy" alt="x">',
  '<blockquote class="fc-callout fc-callout--accent"><p>A pull quote.</p></blockquote>',
  '<a href="#anchor">jump</a>',
  '<a href="mailto:hi@example.com">email</a>',
]

describe('REQ-46 content-safety — HTML fragments', () => {
  it.each(UNSAFE_HTML)('test_UAT_FC_REQ-46_html_rejected: %s', (html) => {
    expect(() => assertSafeHtml(html, 'test')).toThrow(ContentSafetyError)
  })

  it.each(SAFE_HTML)('test_UAT_FC_REQ-46_html_passes: %s', (html) => {
    expect(assertSafeHtml(html, 'test')).toBe(html)
  })
})

// ── the hardened markdown renderer (end-to-end through the real processor) ─────

const UNSAFE_MARKDOWN = [
  'Intro <script>window.__x=1</script> outro.',
  'A [tap here](javascript:window.__x=1) link.',
  'An image ![x](javascript:window.__x=1).',
  'Raw <img src=x onerror="window.__x=1"> handler.',
  'An <iframe src="https://evil.example"></iframe> frame.',
]

const SAFE_MARKDOWN = [
  'A perfectly **safe** paragraph of prose.',
  'A [safe link](https://example.com/page) inline.',
  'An image ![logo](/assets/logo.png) inline.',
  '> [!accent] A callout treatment.',
  'A [mail me](mailto:hi@example.com) link and a [jump](#section).',
]

describe('REQ-46 content-safety — renderMarkdown fails loud', () => {
  it.each(UNSAFE_MARKDOWN)('test_UAT_FC_REQ-46_markdown_rejected: %s', async (md) => {
    await expect(renderMarkdown(md)).rejects.toBeInstanceOf(ContentSafetyError)
  })

  it.each(SAFE_MARKDOWN)('test_UAT_FC_REQ-46_markdown_passes: %s', async (md) => {
    await expect(renderMarkdown(md)).resolves.toEqual(expect.any(String))
  })
})
