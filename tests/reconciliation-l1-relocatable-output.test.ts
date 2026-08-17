/**
 * Reconciliation UATs — story-d0a8cfad "L1 layout substrate rendered safe by
 * construction", relocatable-emission slice (REQ-109 / BUG-30).
 *
 *   AC-888  a rendered snapshot is relocatable: every root-relative reference is
 *           emitted document-relative, at every sink, with no base-path config
 *   AC-889  absolute, protocol-relative, fragment and already-relative
 *           references emerge byte-identical; a query rides through intact
 *   AC-890  a reference whose first segment is empty or carries a colon keeps
 *           its base (and can never be read back as a URL scheme)
 *   AC-891  a nested page slug fails the render loudly rather than emitting
 *           silently-wrong URLs
 *
 * Two boundaries are probed, both real: the sole L1 emitter
 * (`renderL1Document`) for the per-sink shape rules, and the site renderer
 * (`renderSite` over an on-disk site) for the whole-snapshot claims — including
 * a real HTTP server mounted at a deep path prefix, which is the only way to
 * observe relocatability rather than assert its spelling.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import {
  createReadStream,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderL1Document, type L1Document, type L1Node } from '../packages/framework/src/index'
import { cmdNew } from '../tools/generate/src/cli/commands'
import { loadSite } from '../tools/generate/src/store'
import { renderSite } from '../tools/generate/src/render/write'

/** The repository root — the real `storage/sites/` tree lives beneath it. */
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const WIDTHS = [320, 768, 1440]

/** A document whose root is the subject under test. */
const doc = (root: L1Node): L1Document => ({ widths: WIDTHS, root })

/** Every `url("…")`, `src="…"` and `href="…"` value in a rendered document. */
function references(text: string): string[] {
  const refs: string[] = []
  for (const m of text.matchAll(/url\("([^"]*)"\)/g)) refs.push(m[1])
  for (const m of text.matchAll(/\b(?:src|href)="([^"]*)"/g)) refs.push(m[1])
  return refs
}

/** Every `href="…"` value in a rendered document. */
function hrefs(html: string): string[] {
  return [...html.matchAll(/\bhref="([^"]*)"/g)].map((m) => m[1])
}

let out: string
let cwd: string
let server: Server | undefined

beforeEach(() => {
  out = mkdtempSync(path.join(tmpdir(), 'reconcile-reloc-out-'))
  cwd = mkdtempSync(path.join(tmpdir(), 'reconcile-reloc-cwd-'))
})
afterEach(() => {
  server?.close()
  server = undefined
  rmSync(out, { recursive: true, force: true })
  rmSync(cwd, { recursive: true, force: true })
})

/** Render the real in-repo `xgd` site — a genuinely multi-asset site — into `out`. */
async function renderXgd(): Promise<string[]> {
  const loaded = loadSite({ cwd: REPO, root: 'sites' }, 'xgd', 'draft')
  if (!loaded.ok) throw new Error(`xgd failed to load: ${JSON.stringify(loaded.errors)}`)
  return renderSite(loaded.value, out)
}

/**
 * Build a real TWO-page snapshot in `cwd` and render it into `out`: the starter
 * `home` page (also emitted as `index.html`) plus a `whitepapers` page whose L1
 * body carries `links`. Returns the rendered HTML of the NON-ROOT page — the
 * only document that can tell a correct relativization from an incorrect one,
 * because on a single-page site the two readings are indistinguishable.
 */
async function renderTwoPageSite(links: string[], slug = 'acme'): Promise<string> {
  cmdNew(slug, { cwd })
  const loaded = loadSite({ cwd, root: 'sites' }, slug, 'draft')
  if (!loaded.ok) throw new Error(`${slug} failed to load: ${JSON.stringify(loaded.errors)}`)
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

describe('AC-888 a rendered snapshot is relocatable', () => {
  it('test_UAT_AC888_root_relative_references_are_emitted_document_relative_and_serve_under_a_prefix', async () => {
    // The site keeps AUTHORING `/assets/…` — REQ-109 changed no definition — so
    // the fonts and the hero grid, both declared root-absolutely, are the live
    // proof that only the emitted bytes moved.
    await renderXgd()
    const html = readFileSync(path.join(out, 'index.html'), 'utf8')
    const css = readFileSync(path.join(out, 'theme.css'), 'utf8')

    expect(html).toContain('url("assets/satoshi-400.woff2")') // a @font-face src
    expect(html).toContain('url("assets/xgd-grid-hero.svg?v=3")') // a background image

    // Nothing root-absolute survives at any sink in either emitted artifact.
    for (const [name, text] of [
      ['index.html', html],
      ['theme.css', css],
    ] as const) {
      expect(text, `${name} must not emit a root-absolute url()`).not.toMatch(/url\("\/[^/]/)
      expect(text, `${name} must not emit a root-absolute src/href`).not.toMatch(
        /\b(?:src|href)="\/[^/]/,
      )
    }

    // The referenced assets ship INSIDE the snapshot, alongside the pages.
    expect(existsSync(path.join(out, 'assets', 'satoshi-400.woff2'))).toBe(true)
    expect(existsSync(path.join(out, 'assets', 'xgd-grid-hero.svg'))).toBe(true)

    // Now the behavioural claim: serve those same bytes from a DEEP path prefix
    // — not the host root — and resolve every reference the way a browser does,
    // against the URL of the document that carries it.
    const PREFIX = '/site/xgd/draft/deadbeef01/'
    server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://localhost')
      if (!url.pathname.startsWith(PREFIX)) {
        res.writeHead(404).end()
        return
      }
      const rel = decodeURIComponent(url.pathname.slice(PREFIX.length)) || 'index.html'
      let file = path.join(out, rel)
      // Extensionless → sibling `.html`, mirroring what actually serves these
      // bytes (the public-site Worker and `1c serve`), so this stays a test of
      // the RENDERED URLS rather than of a toy server that resolves less.
      if (!path.extname(file) && !existsSync(file) && existsSync(`${file}.html`)) {
        file = `${file}.html`
      }
      if (!file.startsWith(out) || !existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404).end()
        return
      }
      res.writeHead(200)
      createReadStream(file).pipe(res)
    })
    await new Promise<void>((r) => server!.listen(0, r))
    const port = (server.address() as { port: number }).port
    const base = `http://127.0.0.1:${port}${PREFIX}`

    const docs = [
      { url: base, text: html },
      { url: `${base}theme.css`, text: css },
    ]
    let checked = 0
    for (const d of docs) {
      for (const ref of references(d.text)) {
        // Fragment-only and off-host references are not this snapshot's to serve.
        if (!ref || ref.startsWith('#') || /^([a-z]+:)?\/\//i.test(ref)) continue
        const resolved = new URL(ref, d.url)
        const got = await fetch(resolved)
        expect(got.status, `${ref} (from ${d.url}) resolved to ${resolved} → 404`).toBe(200)
        checked += 1
      }
    }
    // Guard the guard: an over-eager skip filter would make this vacuously green.
    expect(checked).toBeGreaterThan(5)
  })
})

describe('AC-889 only a root-relative reference changes shape', () => {
  it('test_UAT_AC889_absolute_protocol_relative_fragment_and_relative_references_emerge_unchanged', () => {
    // Every sink at once: the stylesheet's `url()` (a @font-face source and two
    // background images), an image's `src`, and a link's `href`.
    const document: L1Document = {
      widths: WIDTHS,
      resources: {
        fonts: [
          { family: 'Local Face', src: '/assets/local.woff2' },
          { family: 'Remote Face', src: 'https://cdn.example.com/remote.woff2' },
        ],
      },
      root: {
        kind: 'container',
        layout: 'stack',
        axes: { backgroundImageUrl: '//cdn.example.com/bg.png' },
        children: [
          { kind: 'box', axes: { backgroundImageUrl: '/assets/grid.svg?v=3' } },
          { kind: 'image', src: 'https://cdn.example.com/photo.jpg', alt: 'remote' },
          { kind: 'image', src: 'assets/already-relative.svg', alt: 'relative' },
          { kind: 'image', src: '/assets/x.svg?v=3', alt: 'root-relative with a query' },
          { kind: 'text', text: 'same page', link: { href: '#how' } },
          { kind: 'text', text: 'docs', link: { href: 'https://example.com/docs' } },
        ],
      },
    }
    const { html, css } = renderL1Document(document)
    const all = `${html}\n${css}`

    // Byte-identical passthrough — an absolute URL, a protocol-relative remote
    // host, a bare fragment, and an already-relative value.
    expect(all).toContain('url("https://cdn.example.com/remote.woff2")')
    expect(all).toContain('url("//cdn.example.com/bg.png")')
    expect(all).toContain('src="https://cdn.example.com/photo.jpg"')
    expect(all).toContain('src="assets/already-relative.svg"')
    expect(all).toContain('href="#how"')
    expect(all).toContain('href="https://example.com/docs"')

    // Only the root-relative values moved — and their query strings rode along,
    // so `?v=` cache-busting on an asset keeps working.
    expect(all).toContain('url("assets/local.woff2")')
    expect(all).toContain('url("assets/grid.svg?v=3")')
    expect(all).toContain('src="assets/x.svg?v=3"')

    // …and no sink anywhere reintroduces a leading slash.
    expect(all).not.toMatch(/url\("\/[^/]/)
    expect(all).not.toMatch(/\b(?:src|href)="\/[^/]/)
  })
})

describe('AC-890 an empty or colon-bearing first segment keeps its base', () => {
  it('test_UAT_AC890_root_fragment_query_and_colon_references_resolve_against_the_snapshot_root', async () => {
    const html = await renderTwoPageSite([
      '/#how',
      '/?q=1',
      '/',
      '/javascript:alert`1`',
      '/a:b/c',
      '/assets/x.svg?v=3',
    ])
    const emitted = hrefs(html)

    // ── the empty first segment ────────────────────────────────────────────
    // A bare `#how` on whitepapers.html is THIS page's anchor. The reference
    // must keep a path segment so it still names the snapshot root.
    expect(emitted).not.toContain('#how')
    expect(emitted).toContain('./#how')
    expect(emitted).toContain('./?q=1')
    expect(emitted).not.toContain('?q=1')
    expect(emitted).toContain('./')

    // Resolved the way a browser resolves it — against the URL of the document
    // carrying it — which is what makes this a claim about behaviour rather
    // than about spelling.
    const base = 'https://1stcontact.io/site/acme/draft/deadbeef01/'
    const fromWhitepapers = new URL('./#how', `${base}whitepapers.html`)
    expect(fromWhitepapers.href).toBe(`${base}#how`) // the snapshot ROOT's anchor
    expect(new URL('./#how', `${base}index.html`).href).toBe(fromWhitepapers.href) // same from every page
    expect(fromWhitepapers.href).not.toBe(`${base}whitepapers.html#how`) // NOT the current page's

    // ── a colon in the first segment ───────────────────────────────────────
    // `isSafeUrl` clears `/javascript:…` BECAUSE the leading slash makes it
    // relative; no emitted reference may be readable as a URL scheme.
    for (const href of emitted) {
      expect(href, `${href} must not be readable as a URL scheme`).not.toMatch(
        /^[A-Za-z][A-Za-z0-9+.-]*:/,
      )
    }
    expect(emitted).toContain('./javascript:alert`1`')
    expect(emitted).toContain('./a:b/c')
    const colon = new URL('./a:b/c', `${base}whitepapers.html`)
    expect(colon.protocol).toBe('https:') // an ordinary path, not a live scheme
    expect(colon.href).toBe(`${base}a:b/c`) // under the snapshot, not the page

    // An ordinary path reference is untouched by the `./` rule — the fix is
    // surgical, not a blanket prefix.
    expect(emitted).toContain('assets/x.svg?v=3')
  })
})

describe('AC-891 a nested page slug fails the render loudly', () => {
  it('test_UAT_AC891_nested_page_slug_is_rejected_before_anything_is_written_and_flat_sites_are_unaffected', async () => {
    // Every argument about resolving against the snapshot DIRECTORY breaks at
    // once if a page sits below the root, so the renderer must refuse rather
    // than emit a page whose every reference is silently wrong.
    cmdNew('acme', { cwd })
    const nested = loadSite({ cwd, root: 'sites' }, 'acme', 'draft')
    if (!nested.ok) throw new Error(`acme failed to load: ${JSON.stringify(nested.errors)}`)
    nested.value.site.pages[0].slug = 'docs/intro'

    await expect(renderSite(nested.value, out)).rejects.toThrow(
      /page slug 'docs\/intro' is nested.*flat/s,
    )
    // No nested directory, and no partial snapshot: not one page was emitted.
    expect(existsSync(path.join(out, 'docs'))).toBe(false)
    expect(readdirSync(out).filter((f) => f.endsWith('.html'))).toEqual([])

    // An ordinary FLAT multi-page site is unaffected — the guard is a boundary
    // check on the slug, not a refusal of multi-page snapshots.
    const flat = await renderTwoPageSite(['/#how'], 'flatco')
    expect(flat).toContain('./#how')
    expect(existsSync(path.join(out, 'home.html'))).toBe(true)
    expect(existsSync(path.join(out, 'whitepapers.html'))).toBe(true)
    expect(existsSync(path.join(out, 'index.html'))).toBe(true)
  })
})
