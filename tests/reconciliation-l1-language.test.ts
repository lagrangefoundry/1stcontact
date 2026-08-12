/**
 * Reconciliation UATs — story-d0a8cfad "L1 layout substrate rendered safe by
 * construction", the **language power** (REQ-91) and **language form** (REQ-90)
 * extensions to the substrate:
 *
 *   AC-725  typed pixel-mover axes render as CSS re-derived from their typed fields
 *   AC-726  malformed structured axes are rejected by the envelope
 *   AC-727  a document font resource table binds a family handle to its served face
 *   AC-728  font resource entries are scheme-checked and weight-bounded
 *
 * The original substrate criteria (AC-682/683/684/685/686/687/688/723) are proven
 * in the companion file tests/reconciliation-l1-substrate.test.ts.
 *
 * The validator + emitter probes are engine-free and run everywhere; AC-727's
 * end-to-end font-loading probe skips cleanly on a runner without a browser
 * engine or without a served font asset to bind.
 */
import http from 'node:http'
import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document } from '../packages/site-schema/src/index'
import { renderL1Document, renderL1Page } from '../packages/framework/src/index'
import { createEngineDriver, engineAvailable } from '../tools/generate/src'

const WIDTHS = [320, 1280]

/** The declaration list of the rule for one emitted class (`.l1-N { … }`). */
function ruleFor(css: string, cls: string): string {
  return new RegExp(`\\.${cls} \\{([^}]*)\\}`).exec(css)?.[1] ?? ''
}

// ── AC-725: typed pixel-mover axes render as re-derived CSS ────────────────────

describe('AC-725 typed pixel-mover axes render as CSS re-derived from their typed fields', () => {
  it('test_UAT_AC725_structured_axes_emit_derived_css_and_identity_values_are_omitted', () => {
    // REQ-136 widened this AC with the colour-adjustment axes, whose structured
    // typed form and per-function identity are proven by their own siblings:
    // test_UAT_AC1125_* / AC1126_* / AC1127_* in
    // tests/reconciliation-l1-image-framing.test.ts. This test remains the
    // general statement of the rule over the axes it already sampled.
    //
    // ── text: gradient fill, decoration, glyph shadow, small-caps, list marker ──
    const textCss = renderL1Document({
      widths: WIDTHS,
      root: {
        kind: 'text',
        text: 'Wordmark',
        axes: {
          color: '#111111',
          gradientFill: {
            angleDeg: 90,
            stops: [{ color: '#d4a017' }, { color: '#ff7a00', position: 100 }],
          },
          textDecoration: 'underline',
          textShadow: { offsetXPx: 0, offsetYPx: 2, blurPx: 6, color: '#00000080' },
          fontVariantCaps: 'small-caps',
          listMarker: 'disc',
        },
      },
    }).css
    const text = ruleFor(textCss, 'l1-0')
    // The gradient paints the glyphs themselves: a text-clipped background with a
    // transparent fill overriding the flat colour. Angle + stops are re-derived
    // from the typed angle/hex/position fields, not carried as a CSS string.
    expect(text).toContain('background-image: linear-gradient(90deg, #d4a017, #ff7a00 100%)')
    expect(text).toContain('background-clip: text')
    expect(text).toContain('-webkit-text-fill-color: transparent')
    expect(text).toContain('color: transparent')
    // Decoration, glyph shadow, small-caps and list marker each appear as declared.
    expect(text).toContain('text-decoration-line: underline')
    expect(text).toContain('text-shadow: 0px 2px 6px #00000080')
    expect(text).toContain('font-variant-caps: small-caps')
    expect(text).toContain('display: list-item')
    expect(text).toContain('list-style-type: disc')

    // ── box: scrim + gradient + background image as ordered layers, plus effects ─
    const boxCss = renderL1Document({
      widths: WIDTHS,
      root: {
        kind: 'box',
        axes: {
          surfaceFill: '#0b0b0b',
          overlay: { color: '#000000', opacity: 0.5 },
          surfaceGradient: { angleDeg: 180, stops: [{ color: '#00d492' }, { color: '#0b0b0b' }] },
          backgroundImageUrl: '/assets/hero.jpg',
          border: { widthPx: 2, color: '#00d492', style: 'dashed' },
          boxShadow: { offsetXPx: 0, offsetYPx: 8, blurPx: 24, spreadPx: -4, color: '#00000040' },
          backdropBlurPx: 12,
          blendMode: 'multiply',
        },
      },
    }).css
    const box = ruleFor(boxCss, 'l1-0')
    // The three composite as ordered background layers — scrim above gradient,
    // gradient above image — all above the solid fill. The scrim's hex + opacity
    // are folded into an 8-digit hex rather than emitted as a raw rgba() string.
    expect(box).toContain(
      'background-image: linear-gradient(#00000080, #00000080), ' +
        // REQ-109 — emitted document-relative; the axis still authors `/assets/…`.
        'linear-gradient(180deg, #00d492, #0b0b0b), url("assets/hero.jpg")',
    )
    expect(box).toContain('background-color: #0b0b0b')
    expect(box).toContain('border: 2px dashed #00d492')
    expect(box).toContain('box-shadow: 0px 8px 24px -4px #00000040')
    expect(box).toContain('backdrop-filter: blur(12px)')
    expect(box).toContain('mix-blend-mode: multiply')

    // ── image: blend mode, border, drop shadow ─────────────────────────────────
    const imageCss = renderL1Document({
      widths: WIDTHS,
      root: {
        kind: 'image',
        src: '/assets/p.jpg',
        alt: 'p',
        axes: {
          blendMode: 'screen',
          border: { widthPx: 1, color: '#ffffff' },
          boxShadow: { offsetXPx: 2, offsetYPx: 2, color: '#000000' },
        },
      },
    }).css
    const image = ruleFor(imageCss, 'l1-0')
    expect(image).toContain('mix-blend-mode: screen')
    expect(image).toContain('border: 1px solid #ffffff')
    expect(image).toContain('box-shadow: 2px 2px #000000')

    // ── any node kind: a transform and a mask emit on slot / text / box alike ───
    const anyCss = renderL1Document({
      widths: WIDTHS,
      root: {
        kind: 'container',
        layout: 'stack',
        children: [
          { kind: 'slot', name: 'promo', transform: { rotateDeg: -3, scale: 1.05 } },
          { kind: 'text', text: 'faded', mask: { shape: 'featherBottom', featherPx: 40 } },
          { kind: 'box', mask: { shape: 'circle' } },
        ],
      },
    }).css
    expect(ruleFor(anyCss, 'l1-1')).toContain('transform: rotate(-3deg) scale(1.05)')
    expect(ruleFor(anyCss, 'l1-2')).toContain(
      'mask-image: linear-gradient(to top, transparent 0, #000 40px)',
    )
    expect(ruleFor(anyCss, 'l1-3')).toContain('clip-path: circle(50%)')

    // ── identity / no-op values are omitted rather than emitted ────────────────
    const identityCss = renderL1Document({
      widths: WIDTHS,
      root: {
        kind: 'container',
        layout: 'stack',
        children: [
          {
            kind: 'text',
            text: 'plain',
            axes: { textDecoration: 'none', fontVariantCaps: 'normal', listMarker: 'none' },
            transform: { rotateDeg: 0, scale: 1 },
          },
          { kind: 'box', axes: { blendMode: 'normal' } },
          { kind: 'image', src: '/a.png', alt: 'a', axes: { blendMode: 'normal' } },
        ],
      },
    }).css
    // A unit transform, a `normal` blend, a `none` decoration, `normal` caps and a
    // `none` marker each produce no corresponding declaration at all. (The
    // transform check excludes the unrelated `text-transform` property.)
    expect(identityCss).not.toMatch(/(?<![-\w])transform:/)
    expect(identityCss).not.toContain('mix-blend-mode')
    expect(identityCss).not.toContain('text-decoration-line')
    expect(identityCss).not.toContain('font-variant-caps')
    expect(identityCss).not.toContain('list-style-type')
  })
})

// ── AC-726: malformed structured axes are rejected by the envelope ────────────

describe('AC-726 malformed structured axes are rejected by the envelope', () => {
  it('test_UAT_AC726_structured_axis_violations_rejected_with_offending_path', () => {
    // Each document violates exactly one structured-axis rule and must be
    // rejected with the offending field located in the returned error list.
    const violations: Record<string, { doc: unknown; path: string }> = {
      nonHexGradientStop: {
        doc: {
          widths: WIDTHS,
          root: {
            kind: 'box',
            axes: { surfaceGradient: { stops: [{ color: 'red' }, { color: '#ffffff' }] } },
          },
        },
        path: '/root/axes/surfaceGradient/stops/0/color',
      },
      nonHexBorderColour: {
        doc: {
          widths: WIDTHS,
          root: { kind: 'box', axes: { border: { widthPx: 1, color: 'rgb(0,0,0)' } } },
        },
        path: '/root/axes/border/color',
      },
      javascriptBackgroundImage: {
        doc: {
          widths: WIDTHS,
          root: { kind: 'box', axes: { backgroundImageUrl: 'javascript:alert(1)' } },
        },
        path: '/root/axes/backgroundImageUrl',
      },
      dataBackgroundImage: {
        doc: {
          widths: WIDTHS,
          root: { kind: 'box', axes: { backgroundImageUrl: 'data:image/svg+xml,<svg/>' } },
        },
        path: '/root/axes/backgroundImageUrl',
      },
      shadowOffsetOutOfRange: {
        doc: {
          widths: WIDTHS,
          root: {
            kind: 'box',
            axes: { boxShadow: { offsetXPx: 50000, offsetYPx: 0, color: '#000000' } },
          },
        },
        path: '/root/axes/boxShadow/offsetXPx',
      },
      shadowBlurOutOfRange: {
        doc: {
          widths: WIDTHS,
          root: {
            kind: 'box',
            axes: { boxShadow: { offsetXPx: 0, offsetYPx: 0, blurPx: 20000, color: '#000000' } },
          },
        },
        path: '/root/axes/boxShadow/blurPx',
      },
      shadowSpreadOutOfRange: {
        doc: {
          widths: WIDTHS,
          root: {
            kind: 'box',
            axes: { boxShadow: { offsetXPx: 0, offsetYPx: 0, spreadPx: -50000, color: '#000000' } },
          },
        },
        path: '/root/axes/boxShadow/spreadPx',
      },
      glyphShadowOutOfRange: {
        doc: {
          widths: WIDTHS,
          root: {
            kind: 'text',
            text: 'x',
            axes: { textShadow: { offsetXPx: 0, offsetYPx: 99999, color: '#000000' } },
          },
        },
        path: '/root/axes/textShadow/offsetYPx',
      },
      maskFeatherOutOfRange: {
        doc: {
          widths: WIDTHS,
          root: { kind: 'box', mask: { shape: 'featherTop', featherPx: 99999 } },
        },
        path: '/root/mask/featherPx',
      },
      borderWidthOutOfRange: {
        doc: {
          widths: WIDTHS,
          root: { kind: 'box', axes: { border: { widthPx: 20000, color: '#000000' } } },
        },
        path: '/root/axes/border/widthPx',
      },
      transformRotationOutOfRange: {
        doc: { widths: WIDTHS, root: { kind: 'box', transform: { rotateDeg: 50000 } } },
        path: '/root/transform/rotateDeg',
      },
      transformScaleTooLarge: {
        doc: { widths: WIDTHS, root: { kind: 'box', transform: { scale: 500 } } },
        path: '/root/transform/scale',
      },
      transformScaleTooSmall: {
        doc: { widths: WIDTHS, root: { kind: 'box', transform: { scale: 0.001 } } },
        path: '/root/transform/scale',
      },
      singleStopGradient: {
        doc: {
          widths: WIDTHS,
          root: { kind: 'box', axes: { surfaceGradient: { stops: [{ color: '#000000' }] } } },
        },
        path: '/root/axes/surfaceGradient/stops',
      },
    }

    for (const [name, { doc, path }] of Object.entries(violations)) {
      const result = validateL1(doc)
      expect(result.ok, `${name} must be rejected`).toBe(false)
      if (result.ok) continue
      expect(result.errors.map((e) => e.path), `${name} names the offending path`).toContain(path)
    }

    // A structured form carrying a freeform key is *refused*, not silently
    // ignored — so no raw-CSS escape hatch can be smuggled in beside a typed
    // field. The node schema is a union, but the report is still localised to
    // the branch the author meant, so the path names the offending *structure*
    // — `/root/axes/surfaceGradient`, not a bare `/root`.
    const extraKeyForms: Record<string, { doc: unknown; at: string; key: string }> = {
      gradient: {
        at: '/root/axes/surfaceGradient',
        key: 'sheen',
        doc: {
          widths: WIDTHS,
          root: {
            kind: 'box',
            axes: {
              surfaceGradient: {
                stops: [{ color: '#000000' }, { color: '#ffffff' }],
                sheen: 'x',
              },
            },
          },
        },
      },
      gradientStop: {
        at: '/root/axes/surfaceGradient/stops/0',
        key: 'glow',
        doc: {
          widths: WIDTHS,
          root: {
            kind: 'box',
            axes: {
              surfaceGradient: { stops: [{ color: '#000000', glow: 1 }, { color: '#ffffff' }] },
            },
          },
        },
      },
      shadow: {
        at: '/root/axes/boxShadow',
        key: 'css',
        doc: {
          widths: WIDTHS,
          root: {
            kind: 'box',
            axes: { boxShadow: { offsetXPx: 0, offsetYPx: 0, color: '#000000', css: 'x' } },
          },
        },
      },
      border: {
        at: '/root/axes/border',
        key: 'style2',
        doc: {
          widths: WIDTHS,
          root: { kind: 'box', axes: { border: { widthPx: 1, color: '#000000', style2: 'x' } } },
        },
      },
      mask: {
        at: '/root/mask',
        key: 'raw',
        doc: { widths: WIDTHS, root: { kind: 'box', mask: { shape: 'circle', raw: 'x' } } },
      },
      transform: {
        at: '/root/transform',
        key: 'skew',
        doc: { widths: WIDTHS, root: { kind: 'box', transform: { rotateDeg: 1, skew: 2 } } },
      },
      scrim: {
        at: '/root/axes/overlay',
        key: 'blur',
        doc: {
          widths: WIDTHS,
          root: { kind: 'box', axes: { overlay: { color: '#000000', blur: 2 } } },
        },
      },
    }
    for (const [name, { doc, at, key }] of Object.entries(extraKeyForms)) {
      const result = validateL1(doc)
      expect(result.ok, `${name} with an extra key must be rejected`).toBe(false)
      if (result.ok) continue
      // The report locates the offending structure AND names the key it refused,
      // which is what an author self-corrects from.
      const named = result.errors.find((e) => e.path === at)
      expect(named, `${name} names the offending path (got ${result.errors.map((e) => e.path).join(', ')})`).toBeDefined()
      expect(named?.message, `${name} names the refused key`).toContain(key)
    }

    // Positive control — every structured family at once, in range, hex-coloured
    // and allowlisted, is accepted. The boundary is the value's range and scheme,
    // not the presence of the axis.
    const wellFormed: L1Document = {
      widths: WIDTHS,
      root: {
        kind: 'box',
        axes: {
          surfaceFill: '#0b0b0b',
          surfaceGradient: {
            angleDeg: 90,
            stops: [
              { color: '#00d492', position: 0 },
              { color: '#0b0b0b', position: 100 },
            ],
          },
          backgroundImageUrl: 'https://cdn.example.com/hero.jpg',
          overlay: { color: '#000000', opacity: 0.4 },
          border: { widthPx: 1, color: '#ffffff', style: 'solid' },
          boxShadow: {
            offsetXPx: 0,
            offsetYPx: 10,
            blurPx: 30,
            spreadPx: 2,
            color: '#00000040',
            inset: false,
          },
          backdropBlurPx: 8,
          blendMode: 'multiply',
        },
        transform: { rotateDeg: 2, scale: 1.02 },
        mask: { shape: 'featherRadial', featherPx: 24 },
        children: [
          {
            kind: 'text',
            text: 'GIGABYTE',
            axes: {
              gradientFill: { angleDeg: 90, stops: [{ color: '#d4a017' }, { color: '#ff7a00' }] },
              textDecoration: 'underline',
              textShadow: { offsetXPx: 0, offsetYPx: 2, blurPx: 4, color: '#00000080' },
              fontVariantCaps: 'small-caps',
              listMarker: 'disc',
            },
            transform: { rotateDeg: -1 },
            mask: { shape: 'ellipse' },
          },
          {
            kind: 'image',
            src: '/assets/p.jpg',
            alt: 'p',
            axes: {
              blendMode: 'screen',
              border: { widthPx: 2, color: '#00d492' },
              boxShadow: { offsetXPx: 1, offsetYPx: 1, color: '#000000' },
            },
          },
        ],
      },
    }
    const accepted = validateL1(wellFormed)
    expect(
      accepted.ok,
      accepted.ok ? '' : `well-formed doc rejected: ${JSON.stringify(accepted.errors)}`,
    ).toBe(true)
  })
})

// ── AC-727: the document font resource table binds a handle to its face ───────

/** A served font asset to bind — the probe skips cleanly when none is present. */
const FONT_ASSET =
  [
    '/System/Library/Fonts/Supplemental/Arial Narrow.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSansNarrow-Regular.ttf',
  ].find((p) => fs.existsSync(p)) ?? null

const chromiumReady = await engineAvailable('chromium')

/** Serve one rendered L1 page plus a single font asset over loopback. */
async function serveWithFont(
  doc: L1Document,
  fontPath: string,
  fontUrlPath: string,
): Promise<{ url: string; close: () => Promise<void> }> {
  const page = Buffer.from(renderL1Page(doc), 'utf-8')
  const font = fs.readFileSync(fontPath)
  const server = http.createServer((req, res) => {
    if ((req.url ?? '/').split('?')[0] === fontUrlPath) {
      res.writeHead(200, { 'content-type': 'font/ttf' })
      res.end(font)
      return
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(page)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  const addr = server.address()
  const port = typeof addr === 'object' && addr ? addr.port : 0
  return {
    url: `http://127.0.0.1:${port}/`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

describe('AC-727 a document font resource table binds a family handle to its served face', () => {
  it(
    'test_UAT_AC727_resource_table_emits_font_face_rules_ahead_of_use_and_binds_the_face',
    async () => {
      // One entry per bound family; each is emitted through the same single safe
      // sink as every other value.
      const doc: L1Document = {
        widths: WIDTHS,
        resources: {
          fonts: [
            { family: 'Bound Face', src: '/fonts/bound.woff2', weight: 600, style: 'italic' },
            { family: 'Plain', src: '/fonts/plain.ttf' },
            { family: 'NoExt', src: '/fonts/mystery' },
          ],
        },
        root: { kind: 'text', text: 'bound', axes: { fontFamily: 'Bound Face' } },
      }
      const { css } = renderL1Document(doc)

      // A well-formed rule per entry: quoted sanitised family, allowlisted URL, a
      // format hint derived from the asset's own extension, the declared weight
      // and style, and `font-display: swap` to keep text visible while loading.
      expect(css).toContain(
        // REQ-109 — the one `url()` sink emits document-relative, fonts included.
        '@font-face { font-family: "Bound Face"; src: url("fonts/bound.woff2") format("woff2"); ' +
          'font-weight: 600; font-style: italic; font-display: swap }',
      )
      // The hint follows the extension — and is omitted when unrecognised.
      expect(css).toContain('src: url("fonts/plain.ttf") format("truetype")')
      expect(css).toContain('src: url("fonts/mystery"); font-display: swap')

      // The rules are emitted *before* the rules that reference the family, so no
      // rule resolves against a fallback first.
      const lastFace = css.lastIndexOf('@font-face')
      const firstUse = css.search(/\.l1-\d+ \{[^}]*font-family: "Bound Face"/)
      expect(lastFace).toBeGreaterThanOrEqual(0)
      expect(firstUse).toBeGreaterThan(lastFace)

      // A document without a resource table emits no @font-face rules at all.
      const bare = renderL1Document({
        widths: WIDTHS,
        root: { kind: 'text', text: 'bound', axes: { fontFamily: 'Bound Face' } },
      }).css
      expect(bare).not.toContain('@font-face')

      // An entry that cannot be emitted safely produces *no* rule rather than a
      // broken or unsafe one: an off-allowlist source, a family that sanitises
      // away to nothing, and — because CSS has no entity escaping — a source
      // carrying any character that could close the `url("…")` token, the
      // declaration, or the rule (a raw quote, a newline). Neutralising such a
      // value is not an option in a CSS context; the only safe emit is none.
      const unsafe = renderL1Document({
        widths: WIDTHS,
        resources: {
          fonts: [
            { family: 'Blocked', src: 'data:font/woff2;base64,AAAA' },
            { family: 'AlsoBlocked', src: 'javascript:alert(1)' },
            { family: '{}@;', src: '/fonts/x.woff2' },
            { family: 'Quoted', src: '/fonts/a".ttf' },
            { family: 'Breakout', src: '/fonts/a.ttf\n} body { display: none } .x{' },
          ],
        },
        root: { kind: 'text', text: 'x' },
      }).css
      expect(unsafe).not.toContain('Blocked')
      expect(unsafe).not.toContain('data:font')
      expect(unsafe).not.toContain('javascript:')
      expect(unsafe).not.toContain('Quoted')
      expect(unsafe).not.toContain('Breakout')
      expect(unsafe).not.toContain('display: none')
      // No entry survived — every one of them was unsafe.
      expect(unsafe).not.toContain('@font-face')
      // …and the stylesheet's braces stay balanced (nothing broke out of a rule).
      expect((unsafe.match(/}/g) ?? []).length).toBe((unsafe.match(/{/g) ?? []).length)

      // ── End-to-end: the bound face actually paints the glyphs ────────────────
      // Skips cleanly where no engine or no font asset is available.
      if (!chromiumReady || !FONT_ASSET) return

      const FAMILY = 'L1BoundProbeFace' // deliberately not installed on any host
      const FONT_URL = '/fonts/bound.ttf'
      const textDoc = (withTable: boolean): L1Document => ({
        widths: WIDTHS,
        ...(withTable ? { resources: { fonts: [{ family: FAMILY, src: FONT_URL }] } } : {}),
        root: {
          kind: 'text',
          text: 'Handgloves ABC',
          axes: { fontFamily: FAMILY, fontSizePx: 48 },
        },
      })

      // The glyph run width of the text node (a Range rect, not the block box).
      const PROBE = `(() => {
        const p = document.querySelector('p')
        const r = document.createRange()
        r.selectNodeContents(p)
        const loaded = Array.from(document.fonts).filter((f) => f.status === 'loaded').map((f) => f.family)
        return { runWidth: r.getBoundingClientRect().width, loaded }
      })()`

      const measure = async (withTable: boolean) => {
        const serve = await serveWithFont(textDoc(withTable), FONT_ASSET, FONT_URL)
        const driver = await createEngineDriver('chromium')()
        try {
          await driver.navigate(serve.url, { width: 1280, height: 900 })
          return await driver.query<{ runWidth: number; loaded: string[] }>(PROBE)
        } finally {
          await driver.close()
          await serve.close()
        }
      }

      const bound = await measure(true)
      const fallback = await measure(false)

      // The bound face reports as loaded; without the table nothing binds it.
      expect(bound.loaded, 'bound face loaded').toContain(FAMILY)
      expect(fallback.loaded, 'nothing binds the handle without the table').not.toContain(FAMILY)

      // The observable consequence: the text paints at that face's own glyph
      // metrics rather than the generic fallback's — a measurably different run.
      expect(bound.runWidth).toBeGreaterThan(0)
      expect(fallback.runWidth).toBeGreaterThan(0)
      expect(
        Math.abs(bound.runWidth - fallback.runWidth),
        `bound ${bound.runWidth}px vs fallback ${fallback.runWidth}px`,
      ).toBeGreaterThan(1)
    },
    180000,
  )
})

// ── AC-728: font resource entries are scheme-checked and weight-bounded ───────

describe('AC-728 font resource entries are scheme-checked and weight-bounded by the envelope', () => {
  it('test_UAT_AC728_font_entry_scheme_and_weight_violations_rejected_with_path', () => {
    const fontDoc = (fonts: unknown[]): unknown => ({
      widths: WIDTHS,
      resources: { fonts },
      root: { kind: 'text', text: 'x', axes: { fontFamily: 'A' } },
    })

    // A face cannot be smuggled through the @font-face sink to fetch or execute
    // something the image allowlist would refuse.
    const violations: Record<string, { fonts: unknown[]; path: string }> = {
      dataScheme: {
        fonts: [{ family: 'A', src: 'data:font/woff2;base64,AA' }],
        path: '/resources/fonts/0/src',
      },
      javascriptScheme: {
        fonts: [{ family: 'A', src: 'javascript:alert(1)' }],
        path: '/resources/fonts/0/src',
      },
      vbscriptScheme: {
        fonts: [{ family: 'A', src: 'vbscript:msgbox(1)' }],
        path: '/resources/fonts/0/src',
      },
      fileScheme: {
        fonts: [{ family: 'A', src: 'file:///etc/passwd' }],
        path: '/resources/fonts/0/src',
      },
      weightTooHigh: {
        fonts: [{ family: 'A', src: '/f.woff2', weight: 5000 }],
        path: '/resources/fonts/0/weight',
      },
      weightTooLow: {
        fonts: [{ family: 'A', src: '/f.woff2', weight: 0 }],
        path: '/resources/fonts/0/weight',
      },
    }
    for (const [name, { fonts, path }] of Object.entries(violations)) {
      const result = validateL1(fontDoc(fonts))
      expect(result.ok, `${name} must be rejected`).toBe(false)
      if (result.ok) continue
      expect(result.errors.map((e) => e.path), `${name} names the offending entry`).toContain(path)
    }

    // Each rejection is reported with the path locating the offending entry, so a
    // caller can correct several entries in one pass.
    const many = validateL1(
      fontDoc([
        { family: 'Good', src: '/fonts/good.woff2', weight: 400 },
        { family: 'BadSrc', src: 'data:font/woff2;base64,AA' },
        { family: 'BadWeight', src: '/fonts/ok.woff2', weight: 5000 },
      ]),
    )
    expect(many.ok).toBe(false)
    if (!many.ok) {
      const paths = many.errors.map((e) => e.path)
      expect(paths).toContain('/resources/fonts/1/src')
      expect(paths).toContain('/resources/fonts/2/weight')
      for (const err of many.errors) {
        expect(typeof err.message).toBe('string')
        expect(err.message.length).toBeGreaterThan(0)
      }
    }

    // An entry with an allowlisted source and an in-range weight is accepted —
    // relative, root-relative and absolute http(s) all pass, as for an image src.
    const accepted = validateL1(
      fontDoc([
        { family: 'Relative', src: 'fonts/rel.woff2', weight: 1 },
        { family: 'RootRelative', src: '/fonts/root.woff2', weight: 1000 },
        { family: 'Https', src: 'https://cdn.example.com/f.woff2', style: 'italic' },
        { family: 'Http', src: 'http://cdn.example.com/f.ttf' },
      ]),
    )
    expect(
      accepted.ok,
      accepted.ok ? '' : `allowlisted entries rejected: ${JSON.stringify(accepted.errors)}`,
    ).toBe(true)
  })
})
