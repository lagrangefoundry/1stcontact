/**
 * REQ-90 — L1 document-level resource table (font handle → substance) + renderer
 * `@font-face` wiring.
 *
 * L1 carries font *handles* (`text.axes.fontFamily`, a name) but had no place to
 * bind a handle to its pixel-determining *substance* (the served `.woff2`), so a
 * named face rendered as a serif fallback. These UATs cover the closed form hole:
 *
 *   - schema      the document accepts a typed `resources.fonts` table.
 *   - envelope    a font `src` clears the same URL-scheme allowlist as an image;
 *                 an out-of-range weight is rejected.
 *   - renderer    `renderL1Document` / `renderL1Page` emit an `@font-face` rule
 *                 binding family → served asset (with format/weight/style), through
 *                 the safe sink — an unsafe `src` is dropped, never emitted.
 *   - fold        `foldToL1` populates the table only for families a text leaf
 *                 actually paints (an entry earns its place iff it moves a pixel).
 *   - end-to-end  a served page + real webfont resolves the named face in a real
 *                 browser (no serif fallback); the control without the table falls
 *                 back. Gated on Chromium + the captured woff2; skips cleanly.
 */
import { createServer, type Server } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { validateL1 } from '../packages/site-schema/src/index'
import type { L1Document } from '../packages/site-schema/src/index'
import { renderL1Document, renderL1Page } from '../packages/framework/src/index'
import { foldToL1 } from '../tools/generate/src'
import {
  chromiumAvailable,
  createEngineDriver,
  type MultiStateCapture,
  type StateProjection,
  type ValueElement,
} from '../tools/generate/src/cli/capture'

const LADDER = [320, 768, 1280]

/** A minimal folded-shape text element carrying a family handle + a box. */
function text(t: string, family: string, box: ValueElement['box']): ValueElement {
  return {
    text: t,
    role: 'body',
    color: '#111827',
    fontFamily: family,
    fontSizePx: 40,
    fontWeight: 600,
    lineHeightPx: 48,
    box,
  }
}

/** A one-heading oracle whose single text leaf paints `family`. */
function oracleWith(family: string): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `req90@${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements: [text('Front door heading', family, { x: 20, y: 100, width: width - 40, height: 48 })],
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/**
 * A document with one text leaf that paints `family`. Left in normal flow (no
 * pinned geometry) so the glyph box takes the font's natural width — which lets the
 * end-to-end probe tell a real face apart from a fallback by measured width.
 */
function docPainting(family: string, resources?: L1Document['resources']): L1Document {
  const doc: L1Document = {
    widths: [1280],
    root: {
      kind: 'box',
      children: [
        {
          kind: 'text',
          text: 'Front door heading',
          axes: { fontFamily: family, fontSizePx: 40 },
        },
      ],
    },
  }
  if (resources) doc.resources = resources
  return doc
}

describe('REQ-90 — L1 font resource table + @font-face', () => {
  it('test_UAT_FC_REQ-90_schema_accepts_resource_table', () => {
    const doc = docPainting('Poppins', {
      fonts: [{ family: 'Poppins', src: 'assets/poppins.woff2', weight: 600, style: 'normal' }],
    })
    const result = validateL1(doc)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.resources?.fonts?.[0]).toMatchObject({
        family: 'Poppins',
        src: 'assets/poppins.woff2',
        weight: 600,
      })
    }
  })

  it('test_UAT_FC_REQ-90_envelope_rejects_unsafe_font_src', () => {
    // A `data:` URL is exactly the remote/inline-fetch smuggle the sink must refuse.
    const doc = docPainting('Poppins', {
      fonts: [{ family: 'Poppins', src: 'data:font/woff2;base64,AAAA' }],
    })
    const result = validateL1(doc)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === '/resources/fonts/0/src')).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-90_envelope_rejects_out_of_range_weight', () => {
    const doc = docPainting('Poppins', {
      fonts: [{ family: 'Poppins', src: 'assets/poppins.woff2', weight: 5000 }],
    })
    const result = validateL1(doc)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === '/resources/fonts/0/weight')).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-90_renderer_emits_font_face_binding', () => {
    const doc = docPainting('Poppins', {
      fonts: [{ family: 'Poppins', src: 'assets/poppins.woff2', weight: 600, style: 'italic' }],
    })
    const { css } = renderL1Document(doc)
    expect(css).toContain('@font-face')
    expect(css).toContain('font-family: "Poppins"')
    expect(css).toContain('src: url("assets/poppins.woff2") format("woff2")')
    expect(css).toContain('font-weight: 600')
    expect(css).toContain('font-style: italic')
    expect(css).toContain('font-display: swap')
    // The handle is still bound on the text leaf, so the face is actually used.
    expect(css).toContain('font-family: Poppins')
    // A full page carries the same face rules through the standalone template.
    expect(renderL1Page(doc)).toContain('@font-face')
  })

  it('test_UAT_FC_REQ-90_renderer_drops_unsafe_font_src', () => {
    // The renderer validates independently (defense in depth): an unsafe src that
    // somehow reached it is never emitted as a `url()`.
    const doc = docPainting('Evil', {
      fonts: [{ family: 'Evil', src: 'javascript:alert(1)' }],
    })
    const { css } = renderL1Document(doc)
    expect(css).not.toContain('@font-face')
    expect(css).not.toContain('javascript:')
  })

  it('test_UAT_FC_REQ-90_font_src_cannot_break_out_of_the_css_string', () => {
    // A scheme-clean URL carrying a raw newline: the newline terminates the CSS
    // string, the following `}` closes the `@font-face` rule, and the remainder
    // becomes live CSS (plus an off-allowlist remote `url()`). Both layers must
    // refuse it — the envelope (Layer 1) and the renderer (Layer 2, defence in
    // depth: safe even if the validator were bypassed). DOC-2 §2.
    const payload = '/a.woff2\n} body { display: none } .x{background:url(https://evil.example/x'
    const doc = docPainting('Poppins', { fonts: [{ family: 'Poppins', src: payload }] })

    const result = validateL1(doc)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === '/resources/fonts/0/src')).toBe(true)
    }

    // Renderer, fed the unvalidated document directly: the face is dropped whole.
    const { css } = renderL1Document(doc)
    expect(css).not.toContain('@font-face')
    expect(css).not.toContain('display: none')
    expect(css).not.toContain('evil.example')
    // No fragment of the payload reaches the stylesheet at all, so its `}` can
    // never close a rule; braces stay balanced.
    expect(css).not.toContain('/a.woff2')
    expect(css).not.toContain('} body')
    expect((css.match(/}/g) ?? []).length).toBe((css.match(/{/g) ?? []).length)
  })

  it('test_UAT_FC_REQ-90_fold_populates_only_painted_families', () => {
    // Oswald is painted by the leaf; Ghost is not — only Oswald earns a table entry.
    const doc = foldToL1(oracleWith('Oswald'), {
      fonts: [
        { family: 'Oswald', src: 'assets/oswald.woff2', weight: 700 },
        { family: 'Ghost', src: 'assets/ghost.woff2' },
      ],
    })
    const families = (doc.resources?.fonts ?? []).map((f) => f.family)
    expect(families).toEqual(['Oswald'])
    expect(doc.resources?.fonts?.[0]).toMatchObject({ src: 'assets/oswald.woff2', weight: 700 })
  })

  it('test_UAT_FC_REQ-90_fold_without_fonts_has_no_table', () => {
    const doc = foldToL1(oracleWith('Oswald'))
    expect(doc.resources).toBeUndefined()
  })

  // ── End-to-end acceptance: a named face resolves in a real browser ────────────
  const FONT = path.join(
    process.cwd(),
    'storage/references/joyfulculinarycreations.com/index/assets/oswald-tk3iwkuhhaijg752gt8g.woff2',
  )
  const CUSTOM = 'Req90CustomFace' // a fictitious name so no system font can mask the result
  const servers: Server[] = []
  afterAll(() => servers.forEach((s) => s.close()))

  /** Serve one L1 page at `/` and the woff2 bytes at `/face.woff2`. */
  async function servePageWithFont(doc: L1Document, fontBytes: Buffer): Promise<string> {
    const page = Buffer.from(renderL1Page(doc), 'utf-8')
    const server = createServer((req, res) => {
      if (req.url === '/face.woff2') {
        res.writeHead(200, { 'content-type': 'font/woff2' })
        res.end(fontBytes)
      } else {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
        res.end(page)
      }
    })
    servers.push(server)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
    const port = (server.address() as AddressInfo).port
    return `http://127.0.0.1:${port}/`
  }

  /**
   * Navigate the served page (the driver awaits `document.fonts.ready`) and read,
   * straight from the real browser, the loaded font-face set and the painted glyph
   * width of the heading. The count/status prove the renderer's `@font-face`
   * produced a *loaded* face; the width proves those glyphs are what actually paint.
   */
  const PROBE = `(() => {
    const p = document.querySelector('p')
    // A Range around the text content measures the glyph run itself, not the
    // full-width block box — so it varies with the actual face that paints it.
    let width = 0
    if (p) {
      const range = document.createRange()
      range.selectNodeContents(p)
      width = range.getBoundingClientRect().width
    }
    return {
      fontCount: document.fonts.size,
      families: Array.from(document.fonts).map((f) => f.family + ':' + f.status),
      width: Math.round(width),
    }
  })()`
  interface Probe {
    fontCount: number
    families: string[]
    width: number
  }
  async function probe(url: string): Promise<Probe> {
    const driver = await createEngineDriver('chromium')()
    try {
      await driver.navigate(url, { width: 1280, height: 900 })
      return await driver.query<Probe>(PROBE)
    } finally {
      await driver.close()
    }
  }

  it('test_UAT_FC_REQ-90_e2e_named_face_resolves_vs_fallback', async () => {
    if (!existsSync(FONT) || !(await chromiumAvailable())) {
      // Honest gap: the captured webfont or the engine is unavailable here.
      return
    }
    const fontBytes = readFileSync(FONT)
    const withTable = docPainting(CUSTOM, { fonts: [{ family: CUSTOM, src: '/face.woff2', weight: 600 }] })
    const withoutTable = docPainting(CUSTOM)

    const bound = await probe(await servePageWithFont(withTable, fontBytes))
    const fallback = await probe(await servePageWithFont(withoutTable, fontBytes))

    // The resource table binds the handle to its substance: a real face loads.
    expect(bound.fontCount).toBe(1)
    expect(bound.families).toContain(`${CUSTOM}:loaded`)
    // Without the table nothing serves the handle — no face exists to load.
    expect(fallback.fontCount).toBe(0)
    // And the bound glyphs actually paint from the custom face: a different width
    // than the serif fallback the same text renders at without the table.
    expect(bound.width).toBeGreaterThan(0)
    expect(bound.width).not.toBe(fallback.width)
  }, 60000)
})
