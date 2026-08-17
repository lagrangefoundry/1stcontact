/**
 * BUG-30 — a root-relative link keeps its BASE through relativization.
 *
 * REQ-109 made a rendered snapshot relocatable by dropping the leading slash of
 * every root-absolute URL. That is a change of *shape* for `/assets/x.svg`, but a
 * change of *meaning* for `/#how`: with no path left, the reference resolves
 * against the current DOCUMENT rather than its directory, so "the `how` anchor on
 * the site root" silently became "…on whatever page this is". The two are
 * indistinguishable on a single-page site — which is why it survived until
 * xgd.dev grew a second page — so every UAT here renders a genuinely TWO-page
 * snapshot and asserts from the non-root page (AC4).
 *
 * The same question — does the remainder still read as a relative *path*? —
 * catches a second, security-relevant case the audit turned up: a colon in the
 * first segment. `isSafeUrl` clears `/javascript:…` precisely BECAUSE the leading
 * slash makes it relative; stripping that slash behind its back would hand back
 * the live `javascript:` URL it just refused.
 *
 * Coverage: AC1 (fragment resolves to the root page from any page), AC2 (asset
 * relativization unchanged, and still resolves under a path prefix), AC3 (the
 * `//host` guard holds; no leading slash reintroduced), AC4 (two-page case).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { renderL1Document, type L1Document, type L1Node } from '../packages/framework/src/index'
import { cmdNew } from '../tools/generate/src/cli/commands'
import { loadSite } from '../tools/generate/src/store'
import { renderSite } from '../tools/generate/src/render/write'

let out: string
let cwd: string

beforeEach(() => {
  out = mkdtempSync(path.join(tmpdir(), 'bug30-out-'))
  cwd = mkdtempSync(path.join(tmpdir(), 'bug30-cwd-'))
})
afterEach(() => {
  rmSync(out, { recursive: true, force: true })
  rmSync(cwd, { recursive: true, force: true })
})

const WIDTHS = [320, 768, 1440]

/** A one-node document wrapping `root`, at the standard width ladder. */
function doc(root: L1Node): L1Document {
  return { widths: WIDTHS, root }
}

/** Every `href="…"` value in a rendered document. */
function hrefs(html: string): string[] {
  return [...html.matchAll(/\bhref="([^"]*)"/g)].map((m) => m[1])
}

/**
 * Render a real two-page snapshot: a `home` page (also emitted as `index.html`)
 * and a `whitepapers` page whose L1 body carries `links`. Returns the rendered
 * HTML of the NON-ROOT page — the only document that can tell a correct
 * relativization from an incorrect one.
 */
async function renderTwoPageSite(links: string[]): Promise<string> {
  cmdNew('acme', { cwd })
  const loaded = loadSite({ cwd, root: 'sites' }, 'acme', 'draft')
  if (!loaded.ok) throw new Error(`acme failed to load: ${JSON.stringify(loaded.errors)}`)
  const home = loaded.value.site.pages[0]
  home.id = 'home'
  home.slug = 'home'
  loaded.value.site.pages = [
    home,
    {
      id: 'whitepapers',
      slug: 'whitepapers',
      title: 'Whitepapers',
      modules: [],
      l1: doc({
        kind: 'container',
        layout: 'stack',
        children: links.map((href) => ({ kind: 'text', text: 'go', link: { href } })),
      }),
    },
  ]
  const written = await renderSite(loaded.value, out)
  // The snapshot really is two-page-plus-alias, not a single page in disguise.
  expect(written).toContain('whitepapers.html')
  expect(written).toContain('index.html')
  return readFileSync(path.join(out, 'whitepapers.html'), 'utf8')
}

describe('BUG-30 — root-relative links keep their base', () => {
  it('test_UAT_FC_BUG-30_root_fragment_resolves_to_root_page', async () => {
    const html = await renderTwoPageSite(['/#how'])

    // The bug, stated as the assertion that fails without the fix: a bare
    // `#how` on `whitepapers.html` is THIS page's anchor, and the anchor does
    // not exist here, so the link does nothing.
    expect(hrefs(html)).not.toContain('#how')
    expect(hrefs(html)).toContain('./#how')

    // Resolved the way a browser resolves it — against the URL of the document
    // that carries it — the target is the snapshot DIRECTORY, which every
    // serving path (`1c serve`, the public-site worker) maps to `index.html`.
    // Asserting on the resolved URL rather than the emitted string is what makes
    // this a claim about behaviour instead of about spelling.
    const base = 'https://1stcontact.io/site/acme/draft/deadbeef01/'
    const fromWhitepapers = new URL('./#how', `${base}whitepapers.html`)
    expect(fromWhitepapers.href).toBe(`${base}#how`)
    // …and it names the SAME target from the root page, which is the whole point
    // of a root-relative URL.
    expect(new URL('./#how', `${base}index.html`).href).toBe(fromWhitepapers.href)

    // The pre-fix emission, resolved the same way, points at the wrong document.
    expect(new URL('#how', `${base}whitepapers.html`).href).toBe(`${base}whitepapers.html#how`)
  })

  it('test_UAT_FC_BUG-30_root_query_resolves_to_root_page', async () => {
    // Same defect, same rule: `/?q=1` has no path either, so the strip would
    // aim it at the current page. A query on a path (`/x.svg?v=3`) is a
    // different shape entirely and must stay untouched — the site's `?v=`
    // cache-busting rides on it.
    const html = await renderTwoPageSite(['/?q=1', '/assets/x.svg?v=3'])
    expect(hrefs(html)).toContain('./?q=1')
    expect(hrefs(html)).toContain('assets/x.svg?v=3')
    expect(hrefs(html)).not.toContain('?q=1')
  })

  it('test_UAT_FC_BUG-30_colon_first_segment_stays_a_path', async () => {
    // `isSafeUrl` admits `/javascript:…` BECAUSE the leading slash makes it a
    // relative path. Dropping that slash would promote the first segment into a
    // URL SCHEME and re-admit the live `javascript:` URL the validator just
    // refused — so the emitted href must never begin with a bare `javascript:`.
    // (No parens/quotes: those are already blocked by the character allowlist,
    // so a payload that avoids them is the one that actually reaches this code.)
    const html = await renderTwoPageSite(['/javascript:alert`1`', '/a:b/c'])
    for (const href of hrefs(html)) {
      expect(href, `${href} must not be readable as a URL scheme`).not.toMatch(
        /^[A-Za-z][A-Za-z0-9+.-]*:/,
      )
    }
    expect(hrefs(html)).toContain('./javascript:alert`1`')
    expect(hrefs(html)).toContain('./a:b/c')
    // And the resolution is a path under the snapshot, not a scheme.
    const base = 'https://1stcontact.io/site/acme/draft/deadbeef01/'
    expect(new URL('./a:b/c', `${base}whitepapers.html`).protocol).toBe('https:')
  })

  it('test_UAT_FC_BUG-30_asset_and_absolute_urls_unchanged', () => {
    // AC2 + AC3 — the fix is surgical. Everything REQ-109 already got right must
    // emerge byte-identical: a path keeps its slash dropped (no `./` noise), and
    // protocol-relative / absolute / already-relative / already-fragment values
    // pass through untouched. Stripping a slash off `//cdn…` would turn a remote
    // host into a local path, which is a safety regression as well as a bug.
    const { html, css } = renderL1Document(
      doc({
        kind: 'container',
        layout: 'stack',
        axes: { backgroundImageUrl: '//cdn.example.com/bg.png' },
        children: [
          { kind: 'image', src: '/assets/x.svg?v=3', alt: 'root-relative asset' },
          { kind: 'image', src: 'https://cdn.example.com/photo.jpg', alt: 'remote' },
          { kind: 'image', src: 'assets/already-relative.svg', alt: 'relative' },
          { kind: 'text', text: 'same page', link: { href: '#how' } },
          { kind: 'text', text: 'sibling', link: { href: '/whitepapers#how' } },
          { kind: 'text', text: 'docs', link: { href: 'https://example.com/docs' } },
        ],
      }),
    )
    const all = `${html}\n${css}`
    expect(all).toContain('src="assets/x.svg?v=3"')
    expect(all).toContain('url("//cdn.example.com/bg.png")')
    expect(all).toContain('src="https://cdn.example.com/photo.jpg"')
    expect(all).toContain('src="assets/already-relative.svg"')
    expect(all).toContain('href="#how"')
    expect(all).toContain('href="whitepapers#how"')
    expect(all).toContain('href="https://example.com/docs"')

    // No leading-slash reintroduction anywhere (AC3).
    expect(all).not.toMatch(/\b(?:src|href)="\/[^/]/)
    expect(all).not.toMatch(/url\("\/[^/]/)
  })

  it('test_UAT_FC_BUG-30_flat_snapshot_invariant_still_fires', async () => {
    // Every argument above is about resolving against the snapshot DIRECTORY,
    // and all of it breaks at once if a page sits below the root. That guard was
    // unreachable until sites genuinely had a second page, so pin that it still
    // fires — and that it fires BEFORE anything is written.
    cmdNew('acme', { cwd })
    const loaded = loadSite({ cwd, root: 'sites' }, 'acme', 'draft')
    if (!loaded.ok) throw new Error('acme failed to load')
    loaded.value.site.pages[0].slug = 'docs/intro'

    await expect(renderSite(loaded.value, out)).rejects.toThrow(/nested|flat/i)
    expect(existsSync(path.join(out, 'docs'))).toBe(false)
  })
})
