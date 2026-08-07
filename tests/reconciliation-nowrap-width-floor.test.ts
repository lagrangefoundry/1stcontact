/**
 * Reconciliation UATs — STORY (story-d0a8cfad) "L1 layout substrate rendered
 * safe by construction", the **captured-width-is-a-floor** group.
 *
 * AC-1009 — a run that cannot wrap treats its captured width as a floor.
 * AC-1010 — the floor begins where the run stops wrapping; a container never relaxes.
 * AC-1011 — a relaxed rung also releases its fixed width, so the ladder keeps overriding.
 * AC-1012 — with unedited text the page lays out identically, floored or fixed.
 *
 * The fold pins `width` to what the *reference* text measured. That is exact
 * while the text is the reference text and silently destructive the moment
 * anyone edits it: a longer string overflows a box pinned to the old string, and
 * where the run is painted the way display headings usually are — a gradient
 * clipped to the glyphs with a transparent `color` — the overflow is not
 * clipped, not ellipsised and not spilling. It falls outside the painting area
 * and the run's own colour paints nothing, so it is never drawn at all.
 *
 * Every width declaration below is **parsed out of its own rule** rather than
 * substring-matched on the stylesheet: `min-width: 686px` CONTAINS
 * `width: 686px`, so a `toContain` check passes with or without the behaviour.
 * That false pass is exactly the shape of the bug under test.
 */
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderL1Document, renderL1Fragment } from '../packages/framework/src/l1/render'
import { validateL1 } from '../packages/site-schema/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import { createEngineDriver, engineAvailable, foldToL1 } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]
const LADDER_H: Record<number, number> = { 320: 800, 375: 800, 768: 1024, 1024: 768, 1280: 800, 1440: 900 }

/** A real engine is needed for the rendered-box halves; they skip cleanly without one. */
const HAVE_CHROMIUM = await engineAvailable('chromium')

// ── Capture fixtures ─────────────────────────────────────────────────────────

function run(over: Partial<ValueElement> & { text: string }): ValueElement {
  return {
    role: 'body',
    color: '#111111',
    fontFamily: 'Inter, sans-serif',
    fontSizePx: 18,
    fontWeight: 400,
    lineHeightPx: 29,
    ...over,
  } as ValueElement
}

/** Mark `el` as having rendered on `n` lines — what the fold reads to decide wrapping. */
function lines(el: ValueElement, n: number): ValueElement {
  const b = el.box!
  return { ...el, renderedTextBox: { x: b.x, y: b.y, width: b.width, height: 29 * n - 8 } }
}

function multi(specs: { width: number; height: number; elements: ValueElement[] }[]): MultiStateCapture {
  const projections: StateProjection[] = specs.map((s) => ({
    engine: 'chromium',
    viewport: { width: s.width, height: s.height },
    state: 'rest',
    manifest: {
      source: `t:${s.width}x${s.height}`,
      elements: s.elements,
      sections: [] as never,
      viewport: { width: s.width, height: s.height },
    },
  })) as never
  return { url: 'http://fixture.test/', notes: [], projections } as never
}

// ── Stylesheet parsing ───────────────────────────────────────────────────────

interface WidthDecl {
  at: number | null
  prop: 'width' | 'min-width' | 'max-width'
  value: string
}

/** The width-ish declarations for one class, each tagged with the rung it sits on. */
function widthDecls(css: string, cls: string): WidthDecl[] {
  const out: WidthDecl[] = []
  let at: number | null = null
  for (const line of css.split('\n')) {
    const media = /^@media\s*\(min-width:\s*(\d+)px\)/.exec(line)
    if (media) {
      at = Number(media[1])
      continue
    }
    if (/^\}/.test(line)) {
      at = null
      continue
    }
    const rule = new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`).exec(line)
    if (!rule) continue
    for (const decl of rule[1].split(';')) {
      const m = /^\s*(min-width|max-width|width)\s*:\s*(.+?)\s*$/.exec(decl)
      if (m) out.push({ at, prop: m[1] as WidthDecl['prop'], value: m[2] })
    }
  }
  return out
}

/** The same declarations, grouped by the rung (media width) they sit on. */
function byRung(decls: WidthDecl[]): Map<number | null, WidthDecl[]> {
  const m = new Map<number | null, WidthDecl[]>()
  for (const d of decls) m.set(d.at, [...(m.get(d.at) ?? []), d])
  return m
}

/** The generated class carrying `text`, read off the rendered markup. */
function classOf(html: string, text: string): string {
  const m = new RegExp(`class="([^"]+)"[^>]*>${text}<`).exec(html)
  if (!m) throw new Error(`no element rendering ${JSON.stringify(text)}`)
  return m[1].split(/\s+/)[0]
}

/** The generated class on the element carrying `id` (`class` is emitted before `id`). */
function classById(html: string, id: string): string {
  const m = new RegExp(`class="([^"]+)"\\s+id="${id}"`).exec(html)
  if (!m) throw new Error(`no element with id ${JSON.stringify(id)}`)
  return m[1].split(/\s+/)[0]
}

/**
 * The **counterfactual** stylesheet: the same document with every floored run's
 * width held fixed again (`width: auto; min-width: V` → `width: V`).
 *
 * The control has to be synthesised from the emitted bytes rather than from a
 * second document, because one axis (`nowrapFromPx`) drives both the floor and
 * `white-space: nowrap`. Dropping it from the document would also unpin the line
 * breaking, so the two renders would differ for a second reason and the
 * comparison would prove nothing.
 */
function holdFixed(css: string): string {
  return css.replace(/width:\s*auto;\s*min-width:\s*([^;}]+)/g, (_m, v: string) => `width: ${v.trim()}`)
}

// ── Browser measurement ──────────────────────────────────────────────────────

function pageUrl(html: string, css: string): string {
  const page = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'ac-floor-')), 'page.html')
  writeFileSync(file, page)
  return pathToFileURL(file).href
}

interface Box {
  cls: string
  x: number
  y: number
  width: number
  height: number
}

/** Every element's own class + bounding box, in document order. */
const BOXES_PROBE = `(() => Array.prototype.slice.call(document.body.querySelectorAll('*')).map(function (n) {
  var r = n.getBoundingClientRect();
  return { cls: (n.className || '').split(/\\s+/)[0], x: r.x, y: r.y, width: r.width, height: r.height };
}))()`

/** Measure `probe` on a page rendered from `html`/`css`, at each width on the ladder. */
async function measure<T>(html: string, css: string, widths: number[], probe: string): Promise<T[]> {
  const url = pageUrl(html, css)
  const driver = await createEngineDriver('chromium')()
  try {
    const out: T[] = []
    for (const w of widths) {
      await driver.navigate(url, { width: w, height: LADDER_H[w] ?? 900 })
      out.push(await driver.query<T>(probe))
    }
    return out
  } finally {
    await driver.close()
  }
}

// ─────────────────────────────────────────────────────────────────────────────

describe('AC-1009 — a run that cannot wrap treats its captured width as a floor', () => {
  it('test_UAT_AC1009_unwrappable_run_floors_its_captured_width_while_a_wrapping_run_keeps_it_fixed', async () => {
    // (a) one line at every ladder width — the display heading an operator edits;
    // (b) three lines everywhere — its width is what decides its line breaks.
    const ms = multi(
      LADDER.map((width) => ({
        width,
        height: LADDER_H[width],
        elements: [
          lines(run({ text: 'Gigabyte Alchemy', box: { x: 24, y: 100, width: 686, height: 90 } }), 1),
          lines(run({ text: 'A long paragraph of body copy', box: { x: 24, y: 300, width: 800, height: 87 } }), 3),
        ],
      })),
    )
    const doc = foldToL1(ms)
    const { css, html } = renderL1Document(doc)

    const pinned = widthDecls(css, classOf(html, 'Gigabyte Alchemy'))
    expect(pinned.length).toBeGreaterThan(0)
    // The captured pixel value survives as the run's MINIMUM width...
    expect(pinned.some((d) => d.prop === 'min-width' && d.value === '686px')).toBe(true)
    // ...and no hard pixel width survives on the run.
    expect(pinned.filter((d) => d.prop === 'width').every((d) => d.value === 'auto')).toBe(true)

    // The wrapping run keeps hard pixel widths and gains no floor.
    const flowing = widthDecls(css, classOf(html, 'A long paragraph of body copy'))
    expect(flowing.length).toBeGreaterThan(0)
    expect(flowing.every((d) => d.prop === 'width' && d.value !== 'auto')).toBe(true)

    // A `control` leaf is a text leaf on the same axes and relaxes on the same
    // terms — the emitter reads `nowrapFromPx` for `text` and `control` alike.
    const roster = { email: { tag: 'input' as const, attrs: { type: 'email', name: 'email' } } }
    const control: L1Node = {
      kind: 'control',
      control: 'email',
      axes: { color: '#0f172b', nowrapFromPx: 320 },
      geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 240 }] },
    }
    const frag = renderL1Fragment([control], 'cf', roster)
    const ctrlCls = /class="([^"]+)"/.exec(frag.htmls[0])![1].split(/\s+/)[0]
    const ctrlDecls = widthDecls(frag.css, ctrlCls)
    expect(ctrlDecls.some((d) => d.prop === 'min-width' && d.value === '240px')).toBe(true)
    expect(ctrlDecls.filter((d) => d.prop === 'width').every((d) => d.value === 'auto')).toBe(true)

    // Rendered: longer copy grows the box instead of vanishing outside it.
    if (!HAVE_CHROMIUM) return
    // Comfortably longer than the 686px the reference measured, so the box has
    // to grow for the string to be drawn at all.
    const longer =
      'Gigabyte Alchemy — Applied Intelligence for Operating Businesses, End to End, From First Contact to Renewal'
    const edited = JSON.parse(JSON.stringify(doc)) as L1Document
    ;(edited.root as { children: { text?: string }[] }).children[0].text = longer
    const rendered = renderL1Document(edited)
    const probe = `(() => {
      var el = Array.prototype.slice.call(document.body.querySelectorAll('*')).filter(function (n) {
        return !n.children.length && (n.textContent || '').indexOf('Gigabyte Alchemy') === 0;
      })[0];
      var r = document.createRange();
      r.selectNodeContents(el);
      var b = el.getBoundingClientRect(), t = r.getBoundingClientRect();
      return { box: b.width, text: t.width, right: t.right - b.right };
    })()`
    const [at1440] = await measure<{ box: number; text: number; right: number }>(
      rendered.html,
      rendered.css,
      [1440],
      probe,
    )
    // The box grew past the captured 686px to hold the longer string, and the
    // glyphs end inside the box — nothing is painted outside the painting area.
    expect(at1440.box).toBeGreaterThan(686)
    expect(at1440.box).toBeGreaterThanOrEqual(at1440.text - 1)
    expect(at1440.right).toBeLessThanOrEqual(1)
  }, 300000)
})

describe('AC-1010 — the floor is gated by wrap threshold and by node kind', () => {
  it('test_UAT_AC1010_floor_begins_at_the_wrap_threshold_and_never_reaches_a_container', () => {
    // Three lines at 320/375, one line from 768 up: the width is load-bearing at
    // mobile and inert above it. A blanket swap would reflow the mobile layout;
    // a blanket refusal would leave the desktop heading truncating silently.
    const singleFrom = 768
    const ms = multi(
      LADDER.map((width) => ({
        width,
        height: LADDER_H[width],
        elements: [
          lines(
            run({
              text: 'Designed for developers',
              box: { x: 24, y: 100, width: Math.min(414, width - 48), height: 24 },
            }),
            width >= singleFrom ? 1 : 3,
          ),
        ],
      })),
    )
    const { css, html } = renderL1Document(foldToL1(ms))
    const decls = widthDecls(css, classOf(html, 'Designed for developers'))
    expect(decls.length).toBeGreaterThan(0)

    // Below the threshold — including under the un-mediated base rule, which is
    // in force at the smallest widths — a hard pixel width and no floor.
    for (const d of decls.filter((x) => x.at === null || x.at < singleFrom)) {
      expect(d.prop, `at ${d.at ?? 'base'}`).toBe('width')
      expect(d.value, `at ${d.at ?? 'base'}`).not.toBe('auto')
    }
    // At and above it, the floor.
    for (const [at, ds] of byRung(decls)) {
      if (at === null || at < singleFrom) continue
      expect(ds.some((d) => d.prop === 'min-width'), `rung ${at}`).toBe(true)
    }
    // Both sides of the threshold are genuinely present in this fixture.
    expect(decls.some((d) => d.prop === 'width' && d.value !== 'auto')).toBe(true)
    expect(decls.some((d) => d.prop === 'min-width')).toBe(true)

    // ── By node kind: a container's width is structure and never relaxes. ────
    //
    // Authored rather than folded on purpose: no fold fixture cheap enough to
    // build here produces a container carrying captured geometry, so the gate
    // (which reads `nowrapFromPx` only for `text` / `control`) can only be
    // exercised against a hand-authored document.
    const authored: L1Document = {
      widths: [320, 1440],
      root: {
        kind: 'box',
        children: [
          {
            kind: 'container',
            id: 'panel',
            layout: 'stack',
            // The same axis a run would floor on — a container must ignore it.
            geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 300 }, { at: 1440, x: 0, y: 0, width: 900 }] },
            children: [
              {
                kind: 'text',
                id: 'headline',
                text: 'Gigabyte Alchemy',
                axes: { color: '#111111', fontSizePx: 40, nowrapFromPx: 320 },
                geometry: {
                  keyframes: [{ at: 320, x: 0, y: 0, width: 280 }, { at: 1440, x: 0, y: 0, width: 686 }],
                },
              },
            ],
          },
        ],
      },
    }
    expect(validateL1(authored).ok, 'the authored fixture is inside the envelope').toBe(true)
    const out = renderL1Document(authored)

    const panel = widthDecls(out.css, classById(out.html, 'panel'))
    expect(panel.length).toBeGreaterThan(0)
    // Every rung: a fixed width, never a floor, never released to `auto`.
    expect(panel.every((d) => d.prop === 'width')).toBe(true)
    expect(panel.every((d) => d.value !== 'auto')).toBe(true)

    // ...while the run sitting inside it, on the identical axis, is floored —
    // so the container's fixed width is the gate firing, not the fixture failing
    // to reach the relaxation at all.
    const headline = widthDecls(out.css, classById(out.html, 'headline'))
    expect(headline.some((d) => d.prop === 'min-width')).toBe(true)
    expect(headline.filter((d) => d.prop === 'width').every((d) => d.value === 'auto')).toBe(true)

    // And the relaxation is structurally unreachable for a container rather than
    // merely unexercised: the surface axis group is `.strict()`, so a container
    // reaching for the axis that drives the floor is refused as an unknown key.
    // Two independent layers therefore hold "a container never relaxes" — this
    // one, and the emitter reading the axis only for `text` / `control`.
    const smuggled = validateL1({
      widths: [320],
      root: {
        kind: 'box',
        children: [
          {
            kind: 'container',
            layout: 'stack',
            axes: { nowrapFromPx: 320 },
            geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 300 }] },
            children: [],
          },
        ],
      },
    })
    expect(smuggled.ok).toBe(false)
    if (smuggled.ok) throw new Error('unreachable')
    expect(smuggled.errors.some((e) => /nowrapFromPx/.test(e.message))).toBe(true)
  })
})

describe('AC-1011 — a relaxed rung also releases its fixed width', () => {
  it('test_UAT_AC1011_every_floored_rung_resets_its_width_so_no_lower_segment_extrapolation_survives', async () => {
    // Widths that GROW across the ladder, so the lowest segment's fitted line
    // extrapolates wildly above its own segment. With the reset missing, the
    // upper rungs emit only `min-width`, stop overriding `width`, and the base
    // rule's `calc()` sizes the run at every width above it.
    const captured: Record<number, number> = { 320: 280, 375: 420, 768: 520, 1024: 600, 1280: 660, 1440: 686 }
    const ms = multi(
      LADDER.map((width) => ({
        width,
        height: LADDER_H[width],
        elements: [
          lines(run({ text: 'Gigabyte Alchemy', box: { x: 24, y: 100, width: captured[width], height: 90 } }), 1),
        ],
      })),
    )
    const { css, html } = renderL1Document(foldToL1(ms))
    const cls = classOf(html, 'Gigabyte Alchemy')
    const decls = widthDecls(css, cls)
    const rungs = byRung(decls)
    expect(rungs.size).toBeGreaterThan(1)

    // Per rung, not in aggregate: the property names alone do not reveal this.
    let floored = 0
    for (const [at, ds] of rungs) {
      if (!ds.some((d) => d.prop === 'min-width')) continue
      floored++
      expect(ds.some((d) => d.prop === 'width' && d.value === 'auto'), `rung ${at ?? 'base'} resets width`).toBe(true)
    }
    expect(floored, 'the fixture actually floors some rungs').toBeGreaterThan(1)

    // What the lowest segment's fitted line reaches at the top of the ladder,
    // had it stayed live. It runs to several times the viewport, which is the
    // whole reason the reset matters.
    const extrapolated = captured[320] + ((captured[375] - captured[320]) / (375 - 320)) * (1440 - 320)
    expect(extrapolated, 'the fixture discriminates: the low segment extrapolates wildly').toBeGreaterThan(2 * 1440)

    if (!HAVE_CHROMIUM) return
    const probe = `(() => {
      var el = document.querySelector('.${cls}');
      return { width: el.getBoundingClientRect().width };
    })()`
    const measured = await measure<{ width: number }>(html, css, LADDER, probe)
    for (const [i, w] of LADDER.entries()) {
      const got = measured[i].width
      // The run tracks its content against THAT rung's floor — its own captured
      // value — and never the lower segment's extrapolated value.
      expect(got, `at ${w}px`).toBeGreaterThanOrEqual(captured[w] - 1.5)
      expect(got, `at ${w}px`).toBeLessThanOrEqual(captured[w] + 1.5)
      expect(got, `at ${w}px`).toBeLessThan(extrapolated)
    }
  }, 300000)
})

describe('AC-1012 — the relaxation is invisible for content that has not been edited', () => {
  it('test_UAT_AC1012_unedited_page_lays_out_identically_whether_the_run_is_floored_or_fixed', async () => {
    const ms = multi(
      LADDER.map((width) => ({
        width,
        height: LADDER_H[width],
        elements: [
          lines(run({ text: 'Gigabyte Alchemy', box: { x: 24, y: 100, width: 686, height: 90 } }), 1),
          lines(run({ text: 'Applied intelligence', box: { x: 24, y: 220, width: 412, height: 29 } }), 1),
          lines(run({ text: 'A long paragraph of body copy', box: { x: 24, y: 300, width: 800, height: 87 } }), 3),
        ],
      })),
    )
    const { css, html } = renderL1Document(foldToL1(ms))
    const fixed = holdFixed(css)

    // The counterfactual is a real counterfactual: the floor is gone from the
    // floored run's own rules, and the captured pixel value it carried is back
    // as a hard width. (`min-width` still appears as a MEDIA condition — that is
    // the ladder, not a declaration, which is why this is parsed per rule.)
    const heroCls = classOf(html, 'Gigabyte Alchemy')
    expect(widthDecls(css, heroCls).some((d) => d.prop === 'min-width' && d.value === '686px')).toBe(true)
    const heroFixed = widthDecls(fixed, heroCls)
    expect(heroFixed.every((d) => d.prop === 'width' && d.value !== 'auto')).toBe(true)
    expect(heroFixed.some((d) => d.value === '686px')).toBe(true)
    // Nothing but the width declarations differs between the two stylesheets.
    const strip = (s: string): string =>
      s
        .replace(/(min-)?width:\s*[^;}\n]+/g, '')
        .replace(/;\s*(?=[;}])/g, '')
        .replace(/\{\s*;/g, '{')
    expect(strip(fixed)).toBe(strip(css))

    if (!HAVE_CHROMIUM) return
    const floorBoxes = await measure<Box[]>(html, css, LADDER, BOXES_PROBE)
    const fixedBoxes = await measure<Box[]>(html, fixed, LADDER, BOXES_PROBE)

    for (const [i, w] of LADDER.entries()) {
      const a = floorBoxes[i]
      const b = fixedBoxes[i]
      expect(a.length, `node count at ${w}px`).toBe(b.length)
      expect(a.length).toBeGreaterThan(1)
      for (const [j, box] of a.entries()) {
        const other = b[j]
        expect(box.cls, `class at ${w}px #${j}`).toBe(other.cls)
        // Every node's bounding box is identical while the text is the
        // reference text — the floor's value IS the captured width, so
        // relaxing it costs no reproduction fidelity.
        for (const axis of ['x', 'y', 'width', 'height'] as const) {
          expect(box[axis], `${box.cls}.${axis} at ${w}px`).toBeCloseTo(other[axis], 1)
        }
      }
    }
  }, 300000)
})
