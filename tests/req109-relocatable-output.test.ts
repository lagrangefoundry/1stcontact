/**
 * REQ-109 — a rendered snapshot is RELOCATABLE.
 *
 * The renderer used to emit root-absolute asset URLs (`url("/assets/…")`,
 * `src="/…"`), so the same bytes only worked when served from a host root.
 * Served from `1stcontact.io/site/<slug>/draft/<sha>/` every reference resolved
 * against the apex and 404'd — and `<base href>` is no fix, because it does not
 * reach `url()` inside CSS, which is exactly where the fonts and background
 * images live.
 *
 * These UATs pin the ticket's acceptance: root-absolute references emerge
 * document-relative; genuinely absolute values (`https://…`, protocol-relative
 * `//host/…`, `#anchor`) pass through byte-identical; the same rendered directory
 * resolves every reference when served under a deep path prefix; and a page that
 * would sit BELOW the snapshot root fails loud rather than emitting a
 * silently-wrong relative URL. The security envelope is untouched — the rewrite
 * runs after every safety check, so it can reshape a vetted value but never admit
 * one.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { createReadStream, existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderL1Document, type L1Document } from '../packages/framework/src/index'
import { cmdNew } from '../tools/generate/src/cli/commands'
import { loadSite } from '../tools/generate/src/store'
import { renderSite } from '../tools/generate/src/render/write'

/** The repository root — the real `storage/sites/` tree lives beneath it. */
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

let out: string
let cwd: string
let server: Server | undefined

beforeEach(() => {
  out = mkdtempSync(path.join(tmpdir(), 'req109-out-'))
  cwd = mkdtempSync(path.join(tmpdir(), 'req109-cwd-'))
})
afterEach(() => {
  server?.close()
  server = undefined
  rmSync(out, { recursive: true, force: true })
  rmSync(cwd, { recursive: true, force: true })
})

/** Render the real in-repo `xgd` site into an isolated temp directory. */
async function renderXgd(): Promise<string[]> {
  const loaded = loadSite({ cwd: REPO, root: 'sites' }, 'xgd', 'draft')
  if (!loaded.ok) throw new Error(`xgd failed to load: ${JSON.stringify(loaded.errors)}`)
  return renderSite(loaded.value, out)
}

/** Every `url("…")`, `src="…"` and `href="…"` value in a rendered document. */
function references(text: string): string[] {
  const refs: string[] = []
  for (const m of text.matchAll(/url\("([^"]*)"\)/g)) refs.push(m[1])
  for (const m of text.matchAll(/\b(?:src|href)="([^"]*)"/g)) refs.push(m[1])
  return refs
}

const WIDTHS = [320, 768, 1440]

/** A one-node document wrapping `root`, at the standard width ladder. */
function doc(root: L1Document['root']): L1Document {
  return { widths: WIDTHS, root }
}

describe('REQ-109 — relocatable rendered output', () => {
  it('test_UAT_FC_REQ-109_relative_asset_urls', async () => {
    await renderXgd()
    const html = readFileSync(path.join(out, 'index.html'), 'utf8')
    const css = readFileSync(path.join(out, 'theme.css'), 'utf8')

    // The site authors `/assets/…` (unchanged — REQ-109 touches no definition),
    // so the fonts and the hero grid are the live proof of the rewrite.
    expect(html).toContain('url("assets/satoshi-400.woff2")')
    expect(html).toContain('url("assets/xgd-grid-hero.svg?v=3")')

    // Nothing root-absolute survives in either emitted artifact.
    for (const [name, text] of [
      ['index.html', html],
      ['theme.css', css],
    ] as const) {
      expect(text, `${name} must not emit a root-absolute url()`).not.toMatch(/url\("\/[^/]/)
      expect(text, `${name} must not emit a root-absolute src/href`).not.toMatch(
        /\b(?:src|href)="\/[^/]/,
      )
    }

    // And the assets the references now point at are actually shipped alongside.
    expect(existsSync(path.join(out, 'assets', 'satoshi-400.woff2'))).toBe(true)
  })

  it('test_UAT_FC_REQ-109_absolute_urls_untouched', () => {
    // Only a leading single `/` is rewritten. Absolute, protocol-relative and
    // fragment values are load-bearing exactly as authored: stripping the first
    // slash of `//cdn.example.com/x.png` would turn a remote host into a local
    // path, which is a correctness AND a safety regression.
    const { html, css } = renderL1Document(
      doc({
        kind: 'container',
        layout: 'stack',
        axes: { backgroundImageUrl: '//cdn.example.com/bg.png' },
        children: [
          { kind: 'image', src: 'https://cdn.example.com/photo.jpg', alt: 'remote' },
          { kind: 'text', text: 'jump', link: { href: '#how' } },
          { kind: 'text', text: 'docs', link: { href: 'https://example.com/docs' } },
          { kind: 'image', src: 'assets/already-relative.svg', alt: 'relative' },
        ],
      }),
    )
    const all = `${html}\n${css}`
    expect(all).toContain('url("//cdn.example.com/bg.png")')
    expect(all).toContain('src="https://cdn.example.com/photo.jpg"')
    expect(all).toContain('href="#how"')
    expect(all).toContain('href="https://example.com/docs"')
    expect(all).toContain('src="assets/already-relative.svg"')
  })

  it('test_UAT_FC_REQ-109_served_under_path_prefix', async () => {
    await renderXgd()

    // Serve the rendered directory from a deep path prefix — the shape the
    // path-based preview URL takes — and resolve every reference the way a
    // browser would: against the URL of the document that carries it.
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
      // bytes: the `public-site` Worker (REQ-113) and `1c serve` both resolve
      // `/whitepapers` to `whitepapers.html`. Modelling it here is what keeps
      // this a test of the RENDERED URLS rather than of a toy server that
      // resolves less than production does.
      if (!path.extname(file) && !existsSync(file) && existsSync(`${file}.html`)) {
        file = `${file}.html`
      }
      // No traversal out of the snapshot, and no directory reads.
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
      { url: base, text: readFileSync(path.join(out, 'index.html'), 'utf8') },
      { url: `${base}theme.css`, text: readFileSync(path.join(out, 'theme.css'), 'utf8') },
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

  it('test_UAT_FC_REQ-109_nested_page_fails_loud', async () => {
    // The relative rewrite is only correct while pages sit flat at the snapshot
    // root. A page one directory down would resolve `assets/…` against its own
    // subdirectory, so the renderer must refuse rather than emit wrong bytes.
    cmdNew('acme', { cwd })
    const loaded = loadSite({ cwd, root: 'sites' }, 'acme', 'draft')
    if (!loaded.ok) throw new Error('acme failed to load')
    loaded.value.site.pages[0].slug = 'docs/intro'

    await expect(renderSite(loaded.value, out)).rejects.toThrow(/nested|flat/i)
    expect(existsSync(path.join(out, 'docs'))).toBe(false)
  })
})
