/**
 * BUG-199 — a linked icon read `link` on the reference and `img` on the
 * reproduction, so bluelotusintegralhealing.com's four social icons (drawn,
 * placed and linked correctly) were four CRITICAL "missing" plus four unpaired.
 *
 * The reference is Zyro's `<a href title="Go to Facebook page"><svg>`; the L1
 * reproduction is `<a href style="display:contents"><img alt="Go to Facebook page">`.
 * Both are a link whose only ink is a picture — the a11y tree's "link named by
 * its image" — and both now record that: `a11yRole: 'link'`, and the link's name.
 *
 * Both sides run the REAL `EXTRACT_SCRIPT` under jsdom (jsdom lays nothing out,
 * so the fixture states the boxes a browser would report — the REQ-380 pattern),
 * are flattened by the real `flattenSignals` and compared by the real
 * `diffManifests`. Every box is the bundle's own. No mocks.
 */
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import {
  CAPTURE_SCHEMA,
  EXTRACT_SCRIPT,
  diffManifests,
  flattenSignals,
  staleCaptureAxes,
  type Capture,
  type RawSignals,
  type ValueManifest,
} from '../tools/generate/src/cli/capture'

type Rect = { x: number; y: number; w: number; h: number }

function extract(bodyHtml: string, boxes: Record<string, Rect>): RawSignals {
  const dom = new JSDOM(`<!doctype html><html><body style="margin:0">${bodyHtml}</body></html>`, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://www.example.test/',
  })
  const fallback: Rect = { x: 0, y: 0, w: 1280, h: 400 }
  dom.window.Element.prototype.getBoundingClientRect = function (this: Element) {
    const b = boxes[this.id] ?? fallback
    return { x: b.x, y: b.y, width: b.w, height: b.h, left: b.x, top: b.y, right: b.x + b.w, bottom: b.y + b.h, toJSON() {} } as DOMRect
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 3200 })
  return (dom.window as unknown as { eval(s: string): unknown }).eval(EXTRACT_SCRIPT) as RawSignals
}

const ICONS = [
  { id: 'fb', name: 'Go to Facebook page', href: 'https://www.facebook.com/profile.php?id=61559658360969', x: 59.97 },
  { id: 'ig', name: 'Go to Instagram page', href: 'https://www.instagram.com/x/', x: 87.97 },
]
const SECTION: Rect = { x: 0, y: 2554, w: 1280, h: 392 }
const boxes = (): Record<string, Rect> => {
  const out: Record<string, Rect> = { s: SECTION, p: { x: 58, y: 2824, w: 503, h: 18 } }
  for (const i of ICONS) {
    out[i.id] = { x: i.x, y: 2784.22, w: 24, h: 24 }
    out[`${i.id}i`] = { x: i.x, y: 2784.22, w: 24, h: 24 }
  }
  return out
}
const PATH = '<path fill="currentColor" d="M0 0h24v24H0z"></path>'

/** The reference footer: Zyro's title-named links, each holding one inline SVG. */
const referenceHtml = (): string =>
  `<footer id="s" style="background-color:#249ed3">
    <p id="p" style="color:#ffffff">© 2025. All rights reserved.</p>
    ${ICONS.map(
      (i) =>
        `<a id="${i.id}" href="${i.href}" title="${i.name}" class="social-icons__link" style="color:#ffffff"><svg id="${i.id}i" width="24" height="24" viewBox="0 0 24 24">${PATH}</svg></a>`,
    ).join('')}
  </footer>`

/** The reproduction as L1 renders it: a display:contents link wrapping an image leaf. */
const reproductionHtml = (srcs: string[]): string =>
  `<footer id="s" style="background-color:#249ed3">
    <p id="p" style="color:#ffffff">© 2025. All rights reserved.</p>
    ${ICONS.map(
      (i, n) =>
        `<a href="${i.href}" style="display:contents"><img id="${i.id}i" class="l1-47" src="${srcs[n]}" alt="${i.name}" style="object-fit:contain" /></a>`,
    ).join('')}
  </footer>`

const fieldsOf = (s: RawSignals) => s.bands.flatMap((b) => b.fields)
const iconsOf = (s: RawSignals) => fieldsOf(s).filter((f) => f.href != null)

const refSignals = extract(referenceHtml(), boxes())
const srcs = iconsOf(refSignals).map((f) => f.src as string)
const actSignals = extract(reproductionHtml(srcs), boxes())

describe('BUG-199 — media that is a link’s only ink is that link, on both sides', () => {
  it('test_UAT_FC_BUG-199_the_reference_svg_icon_link_records_role_link_and_the_links_title_as_its_name', () => {
    const icons = iconsOf(refSignals)
    expect(icons.map((f) => f.href)).toEqual(ICONS.map((i) => i.href))
    for (const [n, f] of icons.entries()) {
      expect(f.a11yRole).toBe('link')
      expect(f.accessibleName).toBe(ICONS[n].name)
      expect(f.nameSource).toBe('title')
    }
  })

  it('test_UAT_FC_BUG-199_the_reproduction_img_icon_link_records_role_link_and_its_alt_as_its_name', () => {
    const icons = iconsOf(actSignals)
    expect(icons.map((f) => f.href)).toEqual(ICONS.map((i) => i.href))
    for (const [n, f] of icons.entries()) {
      expect(f.a11yRole).toBe('link')
      expect(f.accessibleName).toBe(ICONS[n].name)
      expect(f.nameSource).toBe('alt')
    }
  })

  it('test_UAT_FC_BUG-199_the_icons_pair_no_missing_no_unpaired_and_are_compared_as_media', () => {
    const ref: ValueManifest = flattenSignals(refSignals, 'reference')
    const act: ValueManifest = flattenSignals(actSignals, 'reproduction')
    const report = diffManifests(ref, act)
    expect(report.deltas.filter((d) => d.property === 'missing')).toEqual([])
    expect(report.unpairedActual).toEqual([])
    // Paired, the icons' media axes are compared: a reproduction that crops the
    // icon (`cover`) where the reference fits it (`contain`) is now a delta, not
    // hidden behind a pairing failure.
    const cropped = extract(reproductionHtml(srcs).replace(/object-fit:contain/g, 'object-fit:cover'), boxes())
    const croppedReport = diffManifests(ref, flattenSignals(cropped, 'reproduction'))
    expect(croppedReport.deltas.filter((d) => d.property === 'missing')).toEqual([])
    expect(croppedReport.deltas.filter((d) => d.property === 'objectFit').map((d) => d.text)).toEqual(
      ICONS.map((i) => i.name),
    )
  })

  it('test_UAT_FC_BUG-199_a_picture_beside_its_links_own_copy_keeps_role_img', () => {
    const signals = extract(
      `<section id="s"><a id="card" href="/about"><img id="pic" src="/a.jpg" alt="Our team" /><span id="t">About us</span></a></section>`,
      { s: { x: 0, y: 0, w: 1280, h: 600 }, card: { x: 40, y: 40, w: 300, h: 300 }, pic: { x: 40, y: 40, w: 300, h: 260 }, t: { x: 40, y: 310, w: 120, h: 24 } },
    )
    const pic = fieldsOf(signals).find((f) => f.alt === 'Our team')!
    expect(pic.a11yRole).toBe('img')
    expect(pic.accessibleName).toBe('Our team')
    expect(pic.href).toBe('/about')
  })

  it('test_UAT_FC_BUG-199_a_pre_20_bundle_with_a_nameless_titled_icon_is_reported_behind', () => {
    expect(CAPTURE_SCHEMA).toBeGreaterThanOrEqual(20)
    const bundle = (accessibleName: string) =>
      ({
        captureSchema: 19,
        sections: [
          { content: [], items: [], fields: [{ src: 'assets/inline-svg-0000abcd.svg', alt: 'Go to Facebook page', accessibleName }] },
        ],
      }) as unknown as Capture
    const named = (c: Capture) => staleCaptureAxes(c).map((a) => a.axis).filter((a) => a.includes('linked icon'))
    expect(named(bundle(''))).toHaveLength(1)
    expect(named(bundle('Go to Facebook page'))).toEqual([])
  })
})
