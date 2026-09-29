/**
 * REQ-333 issues 1 and 2 — the capture attributed a photograph's paint to the
 * `<img>` and never looked at the wrapper that frames it.
 *
 * ## Issue 1 — an ancestor's rotation, and the box it inflated
 *
 * `transform` does not inherit, so `getComputedStyle(img).transform` on
 * `<div style="transform:rotate(-5deg)"><img></div>` is `none` — correct for the
 * `<img>`, and wrong for the painted result. A wrapper carrying the rotation is the
 * ordinary way a page tilts a photograph; on faelan.com all four collage
 * photographs did it that way and `capture.json` recorded `transformRotateDeg: 0`
 * for every one. L1 can express the rotation and the renderer emits it, so there was
 * nothing wrong downstream — there was simply nothing there.
 *
 * And the second half, which is the one that also stretches the picture:
 * `getBoundingClientRect()` on a rotated element is the axis-aligned bounding box of
 * the ROTATED element, and everything downstream reads `box` as the layout box. A
 * 450 x 599.7 photograph rotated 4deg was recorded as 490.7 x 629.6 and reproduced
 * unrotated into the inflated rectangle with `object-fit: fill` — a 9% horizontal
 * stretch on top of the lost rotation. Between them: 91.76% of the round's ranked
 * pixel residual and ZERO value deltas, because both sides agreed on the same
 * wrong zero.
 *
 * ## Issue 2 — the framing is on the wrapper too
 *
 * `overflow: hidden` + `border-radius: 50%` on a single-purpose wrapper is the
 * idiomatic way to crop a photograph on the web, and the ring and the shadows go on
 * the same element. Read off the `<img>`, all of it came back blank: a 216px disc
 * with a 4px translucent ring and two shadows reproduced as a bare hard-edged
 * square, again with 0 deltas. The proof that this is attribution and not a missing
 * axis is inside the same page — the photographs that put their radius, shadow and
 * mask on the `<img>` itself were recorded correctly all along.
 *
 * ## How this is measured
 *
 * Both fixes live inside `EXTRACT_SCRIPT`, a string evaluated in a browser. The
 * jsdom block drives the REAL script against a parsed DOM with supplied rects —
 * jsdom does no layout, so the rects ARE the measurement and can be set to the
 * rotated bounding boxes a real engine reports. The Chromium block drives the real
 * `1c capture page` against a real page and skips where no browser is available.
 */
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import {
  EXTRACT_SCRIPT,
  chromiumAvailable,
  cmdCapturePage,
  flattenCapture,
  type Capture,
  type RawField,
  type RawSignals,
} from '../tools/generate/src/cli/capture'
import { fsReferenceStore } from '../tools/generate/src/store/fs-reference-store'

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))

/** The axis-aligned bounding box a real engine reports for a rotated `w x h` box. */
function rotatedAabb(
  x: number,
  y: number,
  w: number,
  h: number,
  deg: number,
): { x: number; y: number; width: number; height: number } {
  const r = (deg * Math.PI) / 180
  const co = Math.abs(Math.cos(r))
  const si = Math.abs(Math.sin(r))
  const W = w * co + h * si
  const H = w * si + h * co
  // A rotation about the element's own centre leaves the centre where it was, which
  // is the property the recovery relies on.
  return { x: x + w / 2 - W / 2, y: y + h / 2 - H / 2, width: W, height: H }
}

/** The four photographs, as layout boxes plus the angle their wrapper (or they) turn by. */
const LAYOUT = {
  circle: { x: 932, y: 64, w: 216, h: 216, deg: -5 },
  torn: { x: 60, y: 40, w: 320, h: 205.7, deg: 3 },
  flat: { x: 80, y: 520, w: 240, h: 160, deg: 0 },
  bare: { x: 420, y: 520, w: 200, h: 140, deg: 0 },
  captioned: { x: 680, y: 520, w: 200, h: 140, deg: 0 },
}

/**
 * The real `EXTRACT_SCRIPT` over a parsed DOM. Every rect is the rotated bounding
 * box a browser would report, so the recovery has the same input it has in Chromium.
 */
function jsdomSignals(): RawSignals {
  // jsdom does not expand the `border-radius` / `border` / `box-shadow` shorthands
  // into the longhands the extractor reads, so the fixture writes the longhands. The
  // VALUES are the page's own (`50%`, `4px solid rgba(255,255,255,.3)`, two layers).
  const html = `<!doctype html><html><body>
    <section id="hero">
      <h1 id="title">FAELAN</h1>
      <div id="circle" style="transform: rotate(-5deg);
           border-top-left-radius: 50%; border-top-right-radius: 50%;
           border-bottom-left-radius: 50%; border-bottom-right-radius: 50%;
           overflow: hidden;
           border-top-width: 4px; border-right-width: 4px; border-bottom-width: 4px; border-left-width: 4px;
           border-top-style: solid; border-right-style: solid; border-bottom-style: solid; border-left-style: solid;
           border-top-color: rgba(255, 255, 255, 0.3); border-right-color: rgba(255, 255, 255, 0.3);
           border-bottom-color: rgba(255, 255, 255, 0.3); border-left-color: rgba(255, 255, 255, 0.3);
           box-shadow: rgba(0, 0, 0, 0.6) 0px 20px 60px 0px, rgba(255, 255, 255, 0.2) 0px 0px 40px 0px">
        <img id="circle-img" src="logo.png" alt="Faelan" style="object-fit: cover">
      </div>
      <img id="torn" src="hero.png" alt="Ghostship" style="transform: rotate(3deg); object-fit: cover;
           border-top-left-radius: 8px; border-top-right-radius: 8px;
           border-bottom-left-radius: 8px; border-bottom-right-radius: 8px">
      <img id="flat" src="hero.png" alt="Flat" style="object-fit: cover">
      <div id="bare"><img id="bare-img" src="logo.png" alt="Bare" style="object-fit: cover"></div>
      <div id="captioned" style="border-top-left-radius: 24px; border-top-right-radius: 24px;
           border-bottom-left-radius: 24px; border-bottom-right-radius: 24px; overflow: hidden;
           border-top-width: 6px; border-top-style: solid; border-top-color: rgb(255, 0, 0)">
        <img id="captioned-img" src="logo.png" alt="Captioned" style="object-fit: cover">
        <p id="caption">A caption</p>
      </div>
    </section></body></html>`
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  const win = dom.window as unknown as { eval(s: string): unknown }
  const doc = dom.window.document
  const R = (b: { x: number; y: number; width: number; height: number }) =>
    ({ ...b, left: b.x, top: b.y, right: b.x + b.width, bottom: b.y + b.height, toJSON() {} })
  const rects = new Map<Element, ReturnType<typeof R>>()
  const put = (id: string, b: { x: number; y: number; width: number; height: number }) =>
    rects.set(doc.getElementById(id)!, R(b))

  put('hero', { x: 0, y: 0, width: 1280, height: 900 })
  put('title', { x: 80, y: 400, width: 448, height: 96 })
  // The wrapper's own rect is the rotated AABB of its 224px border box; the image
  // inside it is the rotated AABB of its 216px content box. Both are what a real
  // engine reports, and neither is a layout box.
  put('circle', rotatedAabb(928, 60, 224, 224, LAYOUT.circle.deg))
  put('circle-img', rotatedAabb(LAYOUT.circle.x, LAYOUT.circle.y, LAYOUT.circle.w, LAYOUT.circle.h, LAYOUT.circle.deg))
  put('torn', rotatedAabb(LAYOUT.torn.x, LAYOUT.torn.y, LAYOUT.torn.w, LAYOUT.torn.h, LAYOUT.torn.deg))
  put('flat', { x: LAYOUT.flat.x, y: LAYOUT.flat.y, width: LAYOUT.flat.w, height: LAYOUT.flat.h })
  put('bare', { x: LAYOUT.bare.x, y: LAYOUT.bare.y, width: LAYOUT.bare.w, height: LAYOUT.bare.h })
  put('bare-img', { x: LAYOUT.bare.x, y: LAYOUT.bare.y, width: LAYOUT.bare.w, height: LAYOUT.bare.h })
  put('captioned', { x: LAYOUT.captioned.x, y: LAYOUT.captioned.y, width: LAYOUT.captioned.w, height: 190 })
  put('captioned-img', {
    x: LAYOUT.captioned.x,
    y: LAYOUT.captioned.y,
    width: LAYOUT.captioned.w,
    height: LAYOUT.captioned.h,
  })
  put('caption', { x: LAYOUT.captioned.x, y: LAYOUT.captioned.y + 140, width: LAYOUT.captioned.w, height: 24 })

  dom.window.Element.prototype.getBoundingClientRect = function () {
    return (rects.get(this) ?? R({ x: 0, y: 0, width: 100, height: 20 })) as unknown as DOMRect
  }
  // jsdom reports scrollWidth/Height 0, which the visibility gate reads as
  // off-screen; give the document a real extent so elements are captured.
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 900 })
  return win.eval(EXTRACT_SCRIPT) as RawSignals
}

const signals = jsdomSignals()
const fields = signals.bands.flatMap((b) => b.fields)
const field = (alt: string): RawField => {
  const f = fields.find((x) => (x as { alt?: string }).alt === alt)
  if (!f) throw new Error(`no field with alt ${JSON.stringify(alt)} (have ${fields.map((x) => (x as { alt?: string }).alt).join(', ')})`)
  return f
}

describe('REQ-333 issue 1 — the rotation that paints, and the box it did not inflate', () => {
  it('test_UAT_FC_REQ-333_a_wrappers_rotation_is_attributed_to_the_image_it_turns', () => {
    // THE FAILURE: `transformRotateDeg: 0` on a photograph the page paints at -5deg,
    // because `transform` does not inherit and the capture asked the leaf.
    expect(field('Faelan').transformRotateDeg).toBe(-5)

    // The angle the capture could already see is unchanged — this widened where the
    // value is looked for, it did not change what the value means.
    expect(field('Ghostship').transformRotateDeg).toBe(3)

    // And a photograph nothing turns is still reported as unturned: an axis is read
    // from a measurement, never defaulted.
    expect(field('Flat').transformRotateDeg).toBe(0)
    expect(field('Flat').transformScale).toBe(1)
  })

  it('test_UAT_FC_REQ-333_a_rotated_images_box_is_its_layout_box_not_its_bounding_box', () => {
    // THE ARITHMETIC THE ROUND CLOSED TO FOUR DECIMAL PLACES, in both directions.
    // 216 x (cos5 + sin5) = 234.0037 is what the engine reports; 216 is what the page
    // lays out, and what every consumer of `box` believes it is being given.
    const aabb = rotatedAabb(LAYOUT.circle.x, LAYOUT.circle.y, LAYOUT.circle.w, LAYOUT.circle.h, -5)
    expect(aabb.width).toBeCloseTo(234.0037, 3)

    // REQ-347 SUPERSEDES THE SUBJECT OF THIS ASSERTION, not its arithmetic. The
    // un-inflation is unchanged and is still what this test measures; what changed
    // is WHOSE rect is un-inflated. A framed photograph's box is now the FRAME's
    // border box (224, the wrapper's own `width`), because the ring, the radius and
    // the crop are all measured on the wrapper — writing them onto the 216px
    // content box inside it painted the ring 4px in. The rotation recovery is
    // proved on the same terms either way: the engine reports 224 x (cos5 + sin5)
    // = 242.67 for the wrapper, and 224 is what comes back.
    const framedAabb = rotatedAabb(928, 60, 224, 224, -5)
    expect(framedAabb.width).toBeCloseTo(242.6705, 3)

    const circle = field('Faelan').box!
    expect(circle.width).toBeCloseTo(224, 2)
    expect(circle.height).toBeCloseTo(224, 2)
    // The centre is the one thing a rotation about it leaves alone, so the recovered
    // box sits exactly where the layout box sat.
    expect(circle.x).toBeCloseTo(928, 2)
    expect(circle.y).toBeCloseTo(60, 2)

    // The same for a non-square photograph, where the inflation is what stretched it:
    // 490.7 x 629.6 against a 450 x 599.7 layout box was a 9% horizontal stretch
    // under `object-fit: fill`, on top of the lost rotation.
    const torn = field('Ghostship').box!
    expect(torn.width).toBeCloseTo(LAYOUT.torn.w, 1)
    expect(torn.height).toBeCloseTo(LAYOUT.torn.h, 1)
  })

  it('test_UAT_FC_REQ-333_an_unrotated_images_box_is_untouched', () => {
    // THE RAIL. The recovery only runs where the accumulated transform is not the
    // identity, so every page with no rotation on it records exactly what it always
    // did — byte for byte, not "to within a pixel".
    const flat = field('Flat').box!
    expect(flat).toEqual({ x: LAYOUT.flat.x, y: LAYOUT.flat.y, width: LAYOUT.flat.w, height: LAYOUT.flat.h })
  })
})

describe('REQ-333 issue 2 — a single-purpose wrapper frames the image it holds', () => {
  it('test_UAT_FC_REQ-333_a_wrappers_clip_ring_and_shadows_are_attributed_to_the_image', () => {
    const circle = field('Faelan')

    // THE FAILURE, all five values at once: `borderRadiusPx: 0, borderWidthPx: 0,
    // borderColor: null, borderStyle: null, boxShadow: null` against a stylesheet
    // that says `border-radius:50%; overflow:hidden; border:4px solid
    // rgba(255,255,255,.3); box-shadow: <two layers>`.
    //
    // The radius resolves against the box it is attributed to. REQ-333 attributed
    // it to the 216px photograph, which read 108; REQ-347 attributes it to the
    // 224px FRAME the page actually declares the radius on, which reads 112 — and
    // 112 is the radius that draws a 224px disc. Read as `parseFloat('50%')` it was
    // 50, which is the defect both numbers replace.
    expect(circle.borderRadiusPx).toBe(112)
    expect(circle.borderWidthPx).toBe(4)
    // REQ-336 — and at the ring's OWN ALPHA. This read `#ffffff` when the value
    // above it was written, against the `rgba(255,255,255,.3)` this test's own
    // comment quotes: the capture flattened every border colour to opaque by
    // contract, so a 30%-white hairline was recorded as solid white and painted as
    // a white frame. The width and the attribution are REQ-333's finding; the
    // fourth channel is REQ-336's.
    expect(circle.borderColor).toBe('#ffffff4d')
    expect(circle.borderStyle).toBe('solid')
    expect(circle.boxShadow).toContain('rgba(0, 0, 0, 0.6)')
    // BOTH layers — the pale outer glow is what separates a photograph from the dark
    // montage behind it.
    expect(circle.boxShadow).toContain('rgba(255, 255, 255, 0.2)')
  })

  it('test_UAT_FC_REQ-333_an_image_that_frames_itself_is_unchanged', () => {
    // The contrast inside one page that located the fault: a photograph whose radius
    // is on the `<img>` was always recorded correctly, and still is.
    expect(field('Ghostship').borderRadiusPx).toBe(8)
    // And a photograph with no framing anywhere gains none.
    const flat = field('Flat')
    expect(flat.borderRadiusPx).toBe(0)
    expect(flat.borderWidthPx).toBe(0)
    expect(flat.boxShadow).toBeNull()
  })

  it('test_UAT_FC_REQ-333_a_wrapper_that_paints_nothing_is_not_a_frame', () => {
    // THE RAIL. "Has one child" is not the test — a layout div wrapping an image is
    // the commonest markup there is. A frame is a wrapper that PAINTS, and one that
    // paints nothing must contribute nothing rather than a set of zeroes that look
    // like a measurement.
    const bare = field('Bare')
    expect(bare.borderRadiusPx).toBe(0)
    expect(bare.borderWidthPx).toBe(0)
    expect(bare.boxShadow).toBeNull()
  })

  it('test_UAT_FC_REQ-333_a_wrapper_with_copy_of_its_own_is_not_a_frame', () => {
    // THE OTHER RAIL, and the one that bounds the rule: a card with a caption is a
    // card, and its rounded outline belongs to the card and not to the photograph
    // inside it. Attributing it to the image would round the picture and drop the
    // caption outside the crop.
    const captioned = field('Captioned')
    expect(captioned.borderRadiusPx).toBe(0)
    expect(captioned.borderWidthPx).toBe(0)
  })
})

// ── The reason issue 1 was invisible even where the element carried the angle ──

describe('REQ-333 — every escape inside the in-page script survives into the script', () => {
  it('test_UAT_FC_REQ-333_no_regex_in_the_extract_script_has_lost_its_backslash', () => {
    // THE ROOT CAUSE UNDER ISSUE 1, and a whole class of defect with it.
    // `EXTRACT_SCRIPT` is a TEMPLATE LITERAL, so `\(` in the source is the escape
    // sequence for `(` and the backslash never reaches the emitted script. A regex
    // written `/matrix\(([^)]+)\)/` therefore ships as `/matrix(([^)]+))/`, which
    // matches `matrix` followed by a capture of everything up to the first `)` —
    // parens INCLUDED — so `parseFloat('(1')` is NaN and `transformOf` returned the
    // identity for EVERY transform on EVERY page. That is why the round's four
    // photographs reported `transformRotateDeg: 0`, and why the one case the ticket
    // reasoned would already work (a rotation on the element itself) did not either.
    //
    // The fix is `\\(` in the source. Nothing about that is visible at the call
    // site and nothing about it fails loudly — the regex still compiles and still
    // matches something — so the invariant is pinned here rather than left to the
    // next person to notice: inside the template literal, every backslash is either
    // doubled (a real escape in the emitted script) or escapes a backtick.
    const src = readFileSync(
      fileURLToPath(new URL('../tools/generate/src/cli/capture/extract.ts', import.meta.url)),
      'utf8',
    )
    const start = src.indexOf('export const EXTRACT_SCRIPT = `')
    expect(start, 'the script literal was found').toBeGreaterThan(0)
    const lost: string[] = []
    const lines = src.slice(start).split('\n')
    lines.forEach((line, i) => {
      // A prose comment may contain a stray backslash; it reaches the emitted script
      // as a comment and means nothing. Code may not.
      if (line.trim().startsWith('//')) return
      for (let k = 0; k < line.length; k++) {
        if (line[k] !== '\\') continue
        const next = line[k + 1]
        if (next === '\\' || next === '`') {
          k++
          continue
        }
        lost.push(`line ${i + 1}: ${line.trim()}`)
      }
    })
    expect(lost, 'every backslash in the in-page script is doubled or escapes a backtick').toEqual([])
  })
})

// ── The same two issues, read off a real page by a real browser ──────────────

describe('REQ-333 — a real Chromium reads a real tilted, framed collage', () => {
  let server: { origin: string; close: () => Promise<void> }
  let cwd: string | undefined
  let capture: Capture | undefined

  beforeAll(async () => {
    server = await serveDir(FIXTURES)
    if (await chromiumAvailable()) {
      cwd = mkdtempSync(path.join(tmpdir(), 'req333-'))
      capture = (await cmdCapturePage(`${server.origin}/req333-framed-collage.html`, fsReferenceStore(cwd))).capture
    }
  }, 180000)

  afterAll(async () => {
    await server?.close()
    if (cwd) rmSync(cwd, { recursive: true, force: true })
  })

  // Chromium is not available everywhere (a sandboxed CI box has no Mach bootstrap
  // port for it), and a test that returns early there would report GREEN while
  // proving nothing. `ctx.skip()` is a runtime decision — the capability is not
  // known until `beforeAll` has tried — so the run reports these as skipped, which
  // is the honest reading: no browser, no evidence.
  const itB = (name: string, fn: () => void) =>
    it(name, (ctx) => {
      if (!capture) ctx.skip()
      fn()
    })

  itB('test_UAT_FC_REQ-333_a_real_browser_reports_the_wrappers_angle_and_the_layout_box', () => {
    const el = flattenCapture(capture!).elements.find((e) => e.alt === 'Faelan')!
    expect(el.transformRotateDeg).toBe(-5)
    // The page lays the image out at 216 (a 224px border box less two 4px borders);
    // the rect Chromium reports for it is 234.0.
    expect(el.box!.width).toBeCloseTo(216, 0)
    expect(el.box!.height).toBeCloseTo(216, 0)
  })

  itB('test_UAT_FC_REQ-333_a_real_browser_reports_the_wrappers_ring_clip_and_shadows', () => {
    const el = flattenCapture(capture!).elements.find((e) => e.alt === 'Faelan')!
    expect(el.borderRadiusPx).toBe(108)
    expect(el.borderWidthPx).toBe(4)
    expect(el.boxShadow).toBeTruthy()
    // The rail, on the same page: the captioned card's outline stays the card's.
    const captioned = flattenCapture(capture!).elements.find((e) => e.alt === 'Captioned')!
    expect(captioned.borderRadiusPx).toBe(0)
  })
})

async function serveDir(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
    const file = path.join(dir, rel || 'index.html')
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.statusCode = 404
      res.end()
      return
    }
    res.setHeader(
      'content-type',
      path.extname(file) === '.html' ? 'text/html; charset=utf-8' : 'application/octet-stream',
    )
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}
