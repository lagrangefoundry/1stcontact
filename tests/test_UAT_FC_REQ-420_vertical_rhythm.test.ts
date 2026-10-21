/**
 * [[REQ-420]] — vertical rhythm: text styles carry space above and below, so a
 * heading attaches to the paragraph it introduces.
 *
 * REAL ENTRY POINTS over a real site: a site made by `cmdNew`, changed through
 * the assistant's Toolbox (`add_text_style`, `set_config`, `set_l1`) and the
 * `1c type assign` command, and judged by the page a visitor is served
 * (`cmdRender`) and — where a browser is available — by a real browser laying
 * that page out (`captureL1`, the REQ-82 round trip, and the REQ-415 layout
 * check).
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender, run } from '../tools/generate/src/cli'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox'
import { engineAvailable, createPlaywrightDriver } from '../tools/generate/src'
import { captureL1, serveL1 } from '../tools/generate/src/l1'
import { readRhythm, rhythmBlocksOfManifest } from '../tools/generate/src/l1/read-rhythm'
import { checkLayoutAt } from '../tools/generate/src/cli/ai/layout-check'
import { SECTIONS_SCRIPT } from '../tools/generate/src/cli/picture'
import { renderL1Document } from '../packages/framework/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'

const browserOk = await engineAvailable('chromium')

let cwd: string
let seq = 0

const AXES = { color: '#111827', fontFamily: 'Arial', fontSizePx: 16, fontWeight: 400, lineHeightPx: 20 }
const H2 = { color: '#111827', fontFamily: 'Arial', fontSizePx: 28, fontWeight: 700, lineHeightPx: 34 }

function p(text: string, extra: Record<string, unknown> = {}): L1Node {
  return { kind: 'text', text, axes: AXES, ...extra } as L1Node
}
function h(level: number, text: string, extra: Record<string, unknown> = {}): L1Node {
  return { kind: 'text', text, axes: H2, heading: { level }, ...extra } as L1Node
}
/** A page of sections; each section is a plain stack, so it spaces by rhythm. */
function doc(sections: L1Node[]): L1Document {
  return {
    widths: [375, 1280],
    background: '#ffffff',
    root: { kind: 'container', layout: 'stack', gapPx: 0, children: sections },
  }
}
const SERVICES: L1Node = {
  kind: 'container',
  layout: 'stack',
  padding: { topPx: 40, rightPx: 24, bottomPx: 40, leftPx: 24 },
  children: [
    h(2, 'Our services'),
    p('We cut, colour and style hair for the whole family.'),
    p('Walk-ins are welcome every weekday morning.'),
    h(2, 'Opening hours'),
    p('Monday to Saturday, nine until six.'),
  ],
}

/** A new site whose home page is `page`. */
function site(page: L1Document): string {
  const slug = `rhythm-${++seq}`
  const { draftDir } = cmdNew(slug, { cwd, sandbox: true })
  const file = path.join(draftDir, 'pages', 'home.json')
  const home = JSON.parse(fs.readFileSync(file, 'utf8'))
  fs.writeFileSync(file, JSON.stringify({ ...home, modules: [], l1: page }, null, 2))
  return slug
}
const siteJson = (slug: string) => JSON.parse(fs.readFileSync(path.join(cwd, 'storage', 'sandbox', slug, 'draft', 'site.json'), 'utf8'))
const homeJson = (slug: string) =>
  JSON.parse(fs.readFileSync(path.join(cwd, 'storage', 'sandbox', slug, 'draft', 'pages', 'home.json'), 'utf8'))

/** The draft home page exactly as a visitor is served it. */
async function served(slug: string): Promise<string> {
  const { outDir } = await cmdRender(slug, { cwd, sandbox: true, edit: false })
  return fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
}

/** The class of the element whose text is `text`, and the declarations of its base rule. */
function ruleOf(html: string, text: string): { cls: string; tag: string; decls: string } {
  const m = new RegExp(`<(h[1-6]|p)\\b[^>]*class="([^"]+)"[^>]*>${text}<`).exec(html)
  if (!m) throw new Error(`no element reads "${text}"`)
  const cls = m[2].split(' ')[0]
  const css = html
  const rule = new RegExp(`(?:^|\\s)\\.${cls} \\{([^}]*)\\}`).exec(css)
  return { cls, tag: m[1], decls: rule?.[1] ?? '' }
}
/** The rhythm units of a node's `margin-top`, or 0 when it has none. */
function leadUnits(html: string, text: string): number {
  const m = /margin-top: calc\(var\(--l1-ru, [\d.]+px\) \* ([\d.]+)\)/.exec(ruleOf(html, text).decls)
  return m ? Number(m[1]) : 0
}

type Box = { run: (tool: string, input: Record<string, unknown>) => Promise<unknown> }
const ask = async (box: Box, tool: string, input: Record<string, unknown>): Promise<string> => {
  const out = await box.run(tool, input)
  return typeof out === 'string' ? out : JSON.stringify(out)
}
async function cli(...argv: string[]): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: { message?: string } }> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const prevErr = console.error
  const out: string[] = []
  process.chdir(cwd)
  console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  try {
    await run([...argv, '--sandbox', '--json'])
  } finally {
    console.log = prevLog
    console.error = prevErr
    process.chdir(prevCwd)
    process.exitCode = 0
  }
  return JSON.parse(out.join('\n'))
}

beforeAll(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req420-'))
})
afterAll(() => {
  if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
})

describe('REQ-420 — vertical rhythm', () => {
  it('test_UAT_FC_REQ-420_text_styles_and_the_unit_carry_bounded_space', async () => {
    const slug = site(doc([SERVICES]))
    const box = (await createL1Toolbox(slug, { cwd, sandbox: true })) as unknown as Box

    // A style accepts space above and below, in rhythm units, and keeps it.
    const added = await ask(box, 'add_text_style', {
      name: 'lead-in',
      style: { fontSizePx: 18, spaceAbove: 2.5, spaceBelow: 0.5 },
    })
    expect(added).not.toMatch(/SCHEMA_INVALID|error/i)
    expect(siteJson(slug).textStyles['lead-in']).toMatchObject({ spaceAbove: 2.5, spaceBelow: 0.5 })

    // Out of range, and a freeform key in its place, are refused whole.
    for (const style of [{ spaceAbove: 17 }, { spaceBelow: -1 }, { marginTop: 12 }]) {
      const refused = await ask(box, 'add_text_style', { name: 'bad', style })
      expect(refused).toMatch(/SCHEMA_INVALID/)
    }
    expect(siteJson(slug).textStyles.bad).toBeUndefined()

    // The site's unit is a setting, bounded the same way, and per width when it varies.
    expect(await ask(box, 'set_config', { key: 'rhythm', settings: { unitPx: 0 } })).toMatch(/SCHEMA_INVALID/)
    await ask(box, 'set_config', {
      key: 'rhythm',
      settings: { unitPx: 24, responsive: { unitPx: { keyframes: [{ at: 375, value: 18 }, { at: 1280, value: 24 }] } } },
    })
    expect(siteJson(slug).rhythm).toMatchObject({ unitPx: 24 })
    const html = await served(slug)
    // The unit is declared once, for the page, and tightens towards a phone.
    expect(html).toMatch(/:root \{[^}]*--l1-ru: 18px/)
    expect(html).toMatch(/@media \(min-width: 1280px\) \{[^@]*:root \{[^}]*--l1-ru: 24px/)
  })

  it('test_UAT_FC_REQ-420_a_rhythm_stack_attaches_each_heading_to_its_text', async () => {
    const slug = site(doc([SERVICES]))
    const box = (await createL1Toolbox(slug, { cwd, sandbox: true })) as unknown as Box
    await ask(box, 'set_config', { key: 'rhythm', settings: { unitPx: 20 } })
    const html = await served(slug)

    // max(previous below, next above), in units: H2 → paragraph is max(0.5, 0);
    // paragraph → paragraph max(1, 0); paragraph → H2 max(1, 2.5). The first
    // child's space above is dropped at the stack's edge.
    expect(leadUnits(html, 'Our services')).toBe(0)
    expect(leadUnits(html, 'We cut, colour and style hair for the whole family.')).toBe(0.5)
    expect(leadUnits(html, 'Walk-ins are welcome every weekday morning.')).toBe(1)
    expect(leadUnits(html, 'Monday to Saturday, nine until six.')).toBe(0.5)
    // The second heading's space is on the group it heads (below).
    const group = new RegExp(
      `<div class="(l1-\\d+)" data-l1-keep role="group" aria-labelledby="([^"]+)"><h2 class="[^"]*" id="\\2"[^>]*>Opening hours</h2><p[^>]*>Monday to Saturday, nine until six.</p></div>`,
    ).exec(html)
    expect(group, 'the heading and its text are one labelled group').not.toBeNull()
    const css = html
    expect(new RegExp(`\\.${group![1]} \\{[^}]*margin-top: calc\\(var\\(--l1-ru, 20px\\) \\* 2\\.5\\)`).test(css)).toBe(true)
    expect(css).toMatch(/:root \{[^}]*--l1-ru: 20px/)
    // No uniform gap is emitted for a rhythm stack.
    expect(ruleOf(html, 'Our services').decls).not.toMatch(/gap:/)
  })

  it('test_UAT_FC_REQ-420_the_style_sets_every_use_and_an_override_one', async () => {
    const page = doc([
      {
        kind: 'container',
        layout: 'stack',
        children: [
          h(2, 'First', { axes: { ...H2, textStyle: 'section-title' } }),
          p('One'),
          h(2, 'Second', { axes: { ...H2, textStyle: 'section-title' } }),
          p('Two'),
          h(2, 'Third', { axes: { ...H2, textStyle: 'section-title' }, spaceAbove: 4 }),
          p('Three'),
        ],
      },
    ])
    const slug = site(page)
    const box = (await createL1Toolbox(slug, { cwd, sandbox: true })) as unknown as Box
    await ask(box, 'add_text_style', { name: 'section-title', style: { spaceAbove: 3, spaceBelow: 0.25 } })
    const html = await served(slug)
    // The style's space reaches every heading naming it…
    expect(leadUnits(html, 'One')).toBe(0.25)
    expect(leadUnits(html, 'Two')).toBe(0.25)
    // …and the one heading with its own value takes it, alone.
    const groups = [...html.matchAll(/<div class="(l1-\d+)" data-l1-keep role="group"/g)].map((m) => m[1])
    const css = html
    const leadOf = (cls: string) => Number(new RegExp(`\\.${cls} \\{[^}]*\\* ([\\d.]+)\\)`).exec(css)?.[1] ?? 0)
    expect(groups.map(leadOf)).toEqual([0, 3, 4])

    // Changing the style changes every use but the override.
    await ask(box, 'set_text_style', { name: 'section-title', style: { spaceAbove: 2, spaceBelow: 0.5 } })
    const after = await served(slug)
    const cssAfter = after
    const groupsAfter = [...after.matchAll(/<div class="(l1-\d+)" data-l1-keep role="group"/g)].map((m) => m[1])
    expect(groupsAfter.map((c) => Number(new RegExp(`\\.${c} \\{[^}]*\\* ([\\d.]+)\\)`).exec(cssAfter)?.[1] ?? 0))).toEqual([0, 2, 4])
    expect(leadUnits(after, 'One')).toBe(0.5)
  })

  it('test_UAT_FC_REQ-420_gap_documents_render_unchanged', async () => {
    // Every container here carries a `gapPx`, as every page written before rhythm
    // did: rhythm must not touch it — not with any unit, and not when `gap` is
    // stated rather than implied.
    const gapped = doc([{ ...SERVICES, gapPx: 16 } as L1Node])
    const plain = renderL1Document(gapped)
    expect(renderL1Document(gapped, { rhythm: { unitPx: 37 } })).toEqual(plain)
    const stated = doc([{ ...SERVICES, gapPx: 16, spacing: 'gap' } as L1Node])
    expect(renderL1Document(stated)).toEqual(plain)
    expect(plain.css).toMatch(/gap: 16px/)
    expect(plain.css).not.toMatch(/--l1-ru/)
    expect(plain.html).not.toMatch(/role="group"/)

    // The same holds for a stored site's served page.
    const slug = site(gapped)
    const box = (await createL1Toolbox(slug, { cwd, sandbox: true })) as unknown as Box
    const before = await served(slug)
    await ask(box, 'set_config', { key: 'rhythm', settings: { unitPx: 31 } })
    expect(await served(slug)).toBe(before)
  })

  it('test_UAT_FC_REQ-420_type_assign_keeps_the_rhythm_a_reproduction_was_laid_out_with', async () => {
    // A reproduction places its runs by measured offsets, not by rhythm: 10px
    // under each heading, 20px between paragraphs, 50px above each heading, in
    // 20px lines. `1c type assign` names the styles and records that rhythm.
    const at = (y: number) => ({ place: 'flow', keyframes: [{ at: 1280, x: 0, y, width: 600 }] })
    const stack: L1Node = {
      kind: 'container',
      layout: 'stack',
      spacing: 'gap',
      children: [
        h(2, 'Our services', { geometry: at(0) }),
        p('We cut, colour and style hair for the whole family.', { geometry: at(10) }),
        p('Walk-ins are welcome every weekday morning.', { geometry: at(20) }),
        h(2, 'Opening hours', { geometry: at(50) }),
        p('Monday to Saturday, nine until six.', { geometry: at(10) }),
        h(2, 'Find us', { geometry: at(50) }),
        p('On the high street, opposite the library.', { geometry: at(10) }),
        p('Parking is free after six.', { geometry: at(20) }),
      ],
    } as L1Node
    const slug = site({ widths: [1280], background: '#ffffff', root: stack })
    const before = await served(slug)
    const out = await cli('type', 'assign', slug)
    expect(out.ok, JSON.stringify(out.error)).toBe(true)
    const s = siteJson(slug)
    expect(s.rhythm).toEqual({ unitPx: 20 })
    expect(s.textStyles['heading-2']).toMatchObject({ spaceAbove: 2.5, spaceBelow: 0.5 })
    // Body text's space goes on the style the paragraphs were given.
    const prose = (homeJson(slug).l1.root.children as Array<{ heading?: unknown; axes?: { textStyle?: string } }>).find(
      (n) => !n.heading,
    )!.axes!.textStyle!
    expect(s.textStyles[prose]).toMatchObject({ spaceAbove: 0, spaceBelow: 1 })
    // A change of description: the reproduction paints exactly as it did.
    expect(await served(slug)).toBe(before)
    // And the runs name their styles rather than carrying the spacing themselves.
    const runs = (homeJson(slug).l1.root.children as Array<Record<string, unknown>>).filter((n) => n.kind === 'text')
    expect(runs.every((r) => r.spaceAbove === undefined && r.spaceBelow === undefined)).toBe(true)
  })
})

describe.runIf(browserOk)('REQ-420 — vertical rhythm in a browser', () => {
  const closers: (() => Promise<void>)[] = []
  afterEach(async () => {
    while (closers.length) await closers.pop()!()
  })

  it('test_UAT_FC_REQ-420_round_trip_recovers_the_unit_and_the_style_spacing', async () => {
    const page = doc([
      {
        ...SERVICES,
        children: [
          ...(SERVICES as { children: L1Node[] }).children,
          h(3, 'Prices'),
          p('A cut is twenty pounds.'),
          p('Colour starts at fifty.'),
          h(3, 'Gift cards'),
          p('Ask at the desk.'),
        ],
      } as L1Node,
    ])
    const [desktop] = await captureL1(page, { widths: [1280], render: { rhythm: { unitPx: 20 } } })
    const blocks = rhythmBlocksOfManifest(desktop.manifest)
    const top = (text: string) => desktop.manifest.elements.find((e) => e.text === text)!.box!
    // Measured by the browser: 10px under a heading, 20px between paragraphs,
    // 50px above an H2 and 40px above an H3.
    const gap = (upper: string, lower: string) => Math.round(top(lower).y - (top(upper).y + top(upper).height))
    expect(gap('Our services', 'We cut, colour and style hair for the whole family.')).toBe(10)
    expect(gap('We cut, colour and style hair for the whole family.', 'Walk-ins are welcome every weekday morning.')).toBe(20)
    expect(gap('Walk-ins are welcome every weekday morning.', 'Opening hours')).toBe(50)
    expect(gap('Monday to Saturday, nine until six.', 'Prices')).toBe(40)
    // And read back: the unit, and each style's space.
    const read = readRhythm([blocks])
    expect(read).toEqual({
      unitPx: 20,
      body: { spaceAbove: 0, spaceBelow: 1 },
      headings: { 2: { spaceAbove: 2.5, spaceBelow: 0.5 }, 3: { spaceAbove: 2, spaceBelow: 0.5 } },
    })
  }, 120000)

  it('test_UAT_FC_REQ-420_a_heading_is_kept_with_its_text_when_a_row_wraps', async () => {
    // Four columns' worth of heading and text in one wrapping row: at phone width
    // the row wraps, and each heading must land in the same column as its text.
    const card = (title: string, body: string) => [h(3, title), p(body, { sizing: { width: { mode: 'fixed', px: 150 } } })]
    const page = doc([
      {
        kind: 'container',
        layout: 'row',
        wrap: true,
        spacing: 'rhythm',
        children: [...card('Cut', 'Wash, cut and finish.'), ...card('Colour', 'All-over or roots.'), ...card('Style', 'Blow-dry or set.')],
      } as L1Node,
    ])
    const [phone] = await captureL1(page, { widths: [375], render: { rhythm: { unitPx: 20 } } })
    const box = (text: string) => phone.manifest.elements.find((e) => e.text === text)!.box!
    for (const [title, body] of [['Cut', 'Wash, cut and finish.'], ['Colour', 'All-over or roots.'], ['Style', 'Blow-dry or set.']]) {
      const t = box(title)
      const b = box(body)
      // The text is directly under its own heading — same column, just below it.
      expect(Math.abs(b.x - t.x), `${title} sits over its text`).toBeLessThan(1)
      expect(b.y).toBeGreaterThanOrEqual(t.y + t.height - 1)
      expect(b.y - (t.y + t.height)).toBeLessThan(20)
    }
  }, 120000)

  it('test_UAT_FC_REQ-420_a_group_is_transparent_to_section_addresses', async () => {
    // A page whose ROOT is a stack of text: its headings are grouped with their
    // text, and the page's sections are still its nodes, one address each.
    const page: L1Document = { widths: [1280], background: '#ffffff', root: SERVICES }
    const served = await serveL1(page, { rhythm: { unitPx: 20 } })
    closers.push(served.close)
    const driver = await createPlaywrightDriver()
    try {
      await driver.navigate(served.url, { width: 1280, height: 900 })
      const sections = await driver.query<{ address: string }[]>(SECTIONS_SCRIPT)
      expect(sections.map((s) => s.address)).toEqual(['0.0', '0.1', '0.2', '0.3', '0.4'])
    } finally {
      await driver.close()
    }
  }, 120000)

  it('test_UAT_FC_REQ-420_the_layout_check_names_a_floating_heading', async () => {
    // Evenly spaced, the old way: every heading floats halfway between paragraphs,
    // and [[BUG-238]]'s `loose_heading` says so. By rhythm it does not.
    const footer: L1Node = { kind: 'container', layout: 'stack', gapPx: 0, children: [p('Book a visit')] }
    const even = doc([{ ...SERVICES, gapPx: 24 } as L1Node, footer])
    const served1 = await serveL1(even)
    closers.push(served1.close)
    const found = (await checkLayoutAt(served1.url, 'home', createPlaywrightDriver)).filter((f) => f.kind === 'loose_heading')
    expect(found.map((f) => f.text)).toEqual(
      expect.arrayContaining([expect.stringMatching(/^has the heading "Opening hours" with 24px of space below it and 24px above/)]),
    )
    // By rhythm, nothing to report.
    const served2 = await serveL1(doc([SERVICES, footer]), { rhythm: { unitPx: 20 } })
    closers.push(served2.close)
    expect((await checkLayoutAt(served2.url, 'home', createPlaywrightDriver)).filter((f) => f.kind === 'loose_heading')).toEqual([])
  }, 120000)
})
