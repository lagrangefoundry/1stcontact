// @vitest-environment jsdom
/**
 * story-4300366a — **the palette popup**: see, pick and fix the site's colours
 * in one surface, wherever a colour is needed.
 *
 * This is the browser face of story-ee073693 (palette management, covered by
 * `reconciliation-palette-management.test.ts`). That story owns the census, the
 * four writes and their guards; this one owns what an operator sees and
 * gestures at — and the fact that the surface is *not* the authority.
 *
 * REAL EVERYTHING EXCEPT THE SOCKET. The site is a real draft on disk, the reads
 * and writes go through the real `1c` entry point and the real builder origin's
 * own routing table (`handleBuilderRequest`, exported for exactly this), the
 * client is the shipped `api.js` sending the same root-relative addresses the
 * browser does, the popup and the shared dialog shell are the shipped modules,
 * and the shade arithmetic is imported from the module the render path itself
 * resolves through — a second copy of it here would only prove the test agrees
 * with itself.
 *
 * The origin is driven IN PROCESS rather than over a bound port. Nothing about
 * these criteria is about TCP, and a suite that needs `listen` reports nothing at
 * all in a sandbox that forbids it — which is the difference between "the guards
 * hold" and "we could not ask". The routing table, the guards, the envelopes and
 * the request-time rendering are all the same code either way.
 *
 * WHAT THE SUITE IS SHAPED TO CATCH.
 *
 *  - **The surface is not the authority.** Every refusal criterion posts the
 *    refused write DIRECTLY at the origin as well, with no client in the way,
 *    because a stale tab is exactly the caller the rule exists to refuse. A test
 *    that only clicked a disabled button would pass against a surface with no
 *    guard behind it at all.
 *  - **One walk, one number.** The count on the swatch, the count the rename
 *    control states before it runs, and the number the completed rename reports
 *    are asserted to be the same number — on a site whose references sit at three
 *    different positions in one entry's family, which is where two hand-kept
 *    traversals would disagree.
 *  - **The preview is the renderer's own arithmetic.** The slider's readout is
 *    compared against `resolveL1Color` AND against the hex present in the really
 *    rendered page, so a second implementation in the browser would show up as a
 *    control previewing a colour the page never produces.
 *  - **Nothing writes by accident.** The criteria that claim "changes no state"
 *    compare the whole draft — `site.json` and every page — byte for byte.
 *
 * WHERE THE WORKSPACE IS REACHED FOR. Two criteria are about the *workspace*
 * rather than the popup: the toolbar offering the control in both channels
 * (AC-1241) and the displayed page being refreshed after a write (AC-1249). The
 * shipped workspace mounts real `webui-*` components that arrive from an
 * out-of-band install, so — on the discipline the sibling mounted suite follows
 * — the half of each criterion that needs no components is asserted
 * unconditionally against the real origin, and the mounted half reports itself
 * as unverified out loud rather than passing quietly.
 */

import fs from 'node:fs'
import type http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { Readable, Writable } from 'node:stream'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cmdNew, cmdRender, ctxOf, handleBuilderRequest, run } from '../tools/generate/src/cli'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { resolveL1Color } from '../packages/site-schema/src/l1/palette'
import { shadeHex } from '../packages/site-schema/src/l1/shade'
import { createDisplayPanel } from '../apps/control-app/src/builder/panel.js'
import { openPalettePopup } from '../apps/control-app/src/builder/palette-popup.js'
import { colorsAction, createToolbar } from '../apps/control-app/src/builder/toolbar.js'
import { fetchPalette, previewUrl, writePalette } from '../apps/control-app/src/builder/api.js'
import type { L1Node } from '@1stcontact/site-schema'

const REPO = path.resolve(__dirname, '..')

/** The palette every fixture site carries. `spare` is declared and never used. */
const PALETTE = {
  primary: { value: '#2e86a3' },
  text: { value: '#1f2937' },
  surface: { value: '#fffef8' },
  spare: { value: '#7b3f61' },
} as const

/** Positions far enough from zero to move bytes, and not round numbers. */
const DARKER = -0.42
const LIGHTER = 0.31

/** The census's own order — the store answers sorted, and the surface shows what it is handed. */
const CENSUS = [
  { name: 'primary', value: PALETTE.primary.value, count: 3 },
  { name: 'spare', value: PALETTE.spare.value, count: 0 },
  { name: 'surface', value: PALETTE.surface.value, count: 1 },
  { name: 'text', value: PALETTE.text.value, count: 1 },
]

if (!WEBUI_INSTALLED) console.warn(`story-4300366a mounted halves: ${WEBUI_SKIP_REASON}`)

/** A loud report for evidence this machine genuinely cannot produce. */
function unverified(what: string): void {
  console.warn(`story-4300366a: ${what} NOT VERIFIED here — ${WEBUI_SKIP_REASON}`)
}

// ── the workspace on disk ────────────────────────────────────────────────────

function draftPath(cwd: string, slug: string, ...rest: string[]): string {
  return path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)
}

const siteFile = (cwd: string, slug: string) => draftPath(cwd, slug, 'site.json')
const readText = (file: string) => fs.readFileSync(file, 'utf8')
const readSite = (cwd: string, slug: string) =>
  JSON.parse(readText(siteFile(cwd, slug))) as Record<string, unknown>

/** Every byte of the definition — `site.json` and every page, in a stable order. */
function draftBytes(cwd: string, slug: string): Record<string, string> {
  const pages = draftPath(cwd, slug, 'pages')
  const out: Record<string, string> = { 'site.json': readText(siteFile(cwd, slug)) }
  for (const name of fs.readdirSync(pages).sort()) out[name] = readText(path.join(pages, name))
  return out
}

/**
 * A site whose page references `primary` at THREE positions in its family — the
 * entry itself, a darker shade and a lighter one.
 *
 * That spread is the fixture's whole point. A census counting only unshaded
 * references would say `primary` is used once, and a rename built on that census
 * would orphan the other two.
 */
function seedSite(cwd: string, slug: string): void {
  cmdNew(slug, { cwd })

  const base = readSite(cwd, slug)
  base.palette = { ...PALETTE }
  fs.writeFileSync(siteFile(cwd, slug), `${JSON.stringify(base, null, 2)}\n`)

  const homePath = draftPath(cwd, slug, 'pages', 'home.json')
  const home = JSON.parse(readText(homePath)) as Record<string, unknown>
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    axes: { surfaceFill: { ref: 'surface' } },
    children: [
      { kind: 'text', id: 'a', text: 'Plain primary.', axes: { color: { ref: 'primary' } } },
      {
        kind: 'text',
        id: 'b',
        text: 'Darker primary.',
        axes: { color: { ref: 'primary', shade: DARKER } },
      },
      {
        kind: 'text',
        id: 'c',
        text: 'Lighter primary.',
        axes: { color: { ref: 'primary', shade: LIGHTER } },
      },
      { kind: 'text', id: 'd', text: 'Body copy.', axes: { color: { ref: 'text' } } },
    ],
  }
  home.l1 = { ...(home.l1 as Record<string, unknown>), root }
  fs.writeFileSync(homePath, `${JSON.stringify(home, null, 2)}\n`)
}

/** The rendered draft home page — the bytes an operator actually looks at. */
async function renderedHome(cwd: string, slug: string): Promise<string> {
  const { outDir } = await cmdRender(slug, { cwd, edit: false })
  return readText(path.join(outDir, 'index.html'))
}

/** The hex a reference paints, through the renderer's own resolution. */
const paints = (entryHex: string, shade?: number): string =>
  resolveL1Color({ ref: 'x', ...(shade === undefined ? {} : { shade }) }, { x: { value: entryHex } })

// ── driving the real `1c` entry point ────────────────────────────────────────

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code?: string; message?: string; hint?: string }
  exitCode: number
}

async function cli(cwd: string, ...argv: string[]): Promise<CliResult> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const prevErr = console.error
  const out: string[] = []
  process.chdir(cwd)
  process.exitCode = 0
  console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  try {
    await run([...argv, '--json'])
  } finally {
    console.log = prevLog
    console.error = prevErr
    process.chdir(prevCwd)
  }
  const envelope = JSON.parse(out.join('\n')) as Omit<CliResult, 'exitCode'>
  return { ...envelope, exitCode: Number(process.exitCode ?? 0) }
}

type Entry = { name: string; value: string; count: number }
const censusOf = async (cwd: string, slug: string): Promise<Entry[]> =>
  (await cli(cwd, 'palette', 'get', slug)).data!.entries as Entry[]

// ── the real builder origin, in process ──────────────────────────────────────

/** The address the workspace's own root-relative paths are resolved against. */
const ORIGIN = 'http://builder.test'

/**
 * A `fetch` over the builder origin's REAL routing table, with no socket.
 *
 * `handleBuilderRequest` is exported for exactly this ("so a test can drive the
 * routing table without binding a port"). Everything the criteria below are
 * about — the palette route, its guards, the envelopes a refusal carries, the
 * request-time rendering of a channel — is that function's, and is reached here
 * by the identical addresses the shipped `api.js` sends.
 */
function originFetchFor(opts: { cwd: string; clientDir?: string }): typeof fetch {
  const ctx = ctxOf(opts)
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : String(input)
    const url = new URL(raw, ORIGIN)
    const payload = init?.body == null ? [] : [Buffer.from(String(init.body))]

    const req = Readable.from(payload) as unknown as http.IncomingMessage
    Object.assign(req, {
      url: `${url.pathname}${url.search}`,
      method: (init?.method ?? 'GET').toUpperCase(),
      headers: Object.fromEntries(new Headers(init?.headers ?? {}).entries()),
    })

    const chunks: Buffer[] = []
    const headers: Record<string, string> = {}
    let status = 200
    let finished: () => void
    const done = new Promise<void>((resolve) => {
      finished = resolve
    })

    const res = new Writable({
      write(chunk, _encoding, cb) {
        chunks.push(Buffer.from(chunk as Buffer))
        cb()
      },
    })
    res.on('finish', () => finished())
    Object.assign(res, {
      setHeader(name: string, value: unknown) {
        headers[name.toLowerCase()] = String(value)
        return res
      },
      getHeader: (name: string) => headers[name.toLowerCase()],
      removeHeader: (name: string) => void delete headers[name.toLowerCase()],
      writeHead(code: number, given?: Record<string, unknown>) {
        status = code
        for (const [k, v] of Object.entries(given ?? {})) headers[k.toLowerCase()] = String(v)
        return res
      },
    })

    await handleBuilderRequest(ctx, opts, req, res as unknown as http.ServerResponse)
    await done
    // `content-length` was computed for the socket; undici recomputes it, and a
    // stale value on a re-encoded body is the one header worth dropping.
    delete headers['content-length']
    return new Response(Buffer.concat(chunks), { status, headers })
  }) as typeof fetch
}

// ── the surface, as a person sees it ─────────────────────────────────────────

const dialogIn = (root: ParentNode) => root.querySelector<HTMLElement>('.builder-modal')
const panelIn = (root: ParentNode) => root.querySelector<HTMLElement>('.builder-modal__panel')
const swatchesIn = (root: ParentNode) =>
  [...root.querySelectorAll<HTMLElement>('.builder-palette__swatch')]

/** Name, count and the colour actually painted into the chip, per swatch. */
const swatchTextIn = (root: ParentNode) =>
  swatchesIn(root).map((s) => ({
    name: s.querySelector('.builder-palette__name')!.textContent,
    count: s.querySelector('.builder-palette__count')!.textContent,
    chip: (s.querySelector('.builder-palette__chip') as HTMLElement).style.background,
  }))

/** `#rrggbb` (or `#rgb`) as the style engine reports it back. */
function rgbOf(hex: string): string {
  const body = hex.length === 4 ? [...hex.slice(1)].map((c) => c + c).join('') : hex.slice(1)
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(body.slice(i, i + 2), 16))
  return `rgb(${r}, ${g}, ${b})`
}

/** Select an entry the way a person does — through its radio. */
function selectIn(root: ParentNode, name: string): void {
  const input = root.querySelector<HTMLInputElement>(
    `.builder-palette__swatch[data-name="${name}"] input`,
  )
  if (!input) throw new Error(`no swatch for "${name}"`)
  input.checked = true
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

const selectedNameIn = (root: ParentNode) =>
  swatchesIn(root).find((s) => s.querySelector<HTMLInputElement>('input')!.checked)?.dataset.name ??
  null

/** Click a dialog button by label — scoped to the modal, never the surrounding chrome. */
function clickIn(root: ParentNode, label: string): void {
  const btn = buttonIn(root, label)
  if (!btn) throw new Error(`no button labelled "${label}"`)
  btn.click()
}

function buttonIn(root: ParentNode, label: string): HTMLButtonElement | null {
  const panel = panelIn(root)
  if (!panel) throw new Error('no dialog is open')
  return (
    [...panel.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === label) ??
    null
  )
}

/** The note beside a control — the surface's explanation of a rule. */
const noteBeside = (el: Element) => el.parentElement!.querySelector('.builder-palette__note')!.textContent

const detailIn = (root: ParentNode) => root.querySelector<HTMLElement>('.builder-palette__detail')!
const sliderIn = (root: ParentNode) => root.querySelector<HTMLInputElement>('.builder-palette__shade')
const readoutIn = (root: ParentNode) => root.querySelector<HTMLElement>('.builder-palette__readout')

const statusTextIn = (root: ParentNode) => {
  const el = root.querySelector<HTMLElement>('.builder-palette__status')
  return el && !el.hidden ? (el.textContent ?? '') : ''
}
const errorTextIn = (root: ParentNode) => {
  const el = root.querySelector<HTMLElement>('.builder-modal__error')
  return el && !el.hidden ? (el.textContent ?? '') : ''
}

const tick = () => new Promise((r) => setTimeout(r, 5))

/** Wait for the popup's first paint — it mounts its skeleton, then loads. */
async function settled(root: ParentNode): Promise<void> {
  for (let i = 0; i < 400; i += 1) {
    if (root.querySelector('.builder-palette__swatch, .builder-palette__empty')) return
    await tick()
  }
  throw new Error('the popup never painted')
}

/** Let a posted write land and the popup redraw. */
async function written(root: ParentNode): Promise<void> {
  for (let i = 0; i < 400; i += 1) {
    await tick()
    if (statusTextIn(root) || errorTextIn(root)) return
  }
  throw new Error('the write never reported')
}

/**
 * The opener's answer, with a deadline.
 *
 * The deadline is half the criterion: "no route can leave an opener waiting
 * forever" is only evidence if the test would actually fail when one does,
 * rather than hanging until the suite timeout says nothing about which route.
 */
function answered<T>(p: Promise<T>, what = 'the opener'): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${what} was never answered`)), 5000),
    ),
  ])
}

/** A `Storage`-shaped map, so a mount never leaks state into the next one. */
function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  }
}

describe('story-4300366a the palette popup', () => {
  let cwd: string
  let toOrigin: typeof fetch
  let restoreFetch: () => void
  /** Every popup a test opens is hosted here, and closed before the next one. */
  let host: HTMLElement

  /**
   * The popup's transport is the SHIPPED CLIENT — `api.js`'s own `fetchPalette`
   * and `writePalette`, composing the same addresses and unwrapping the same
   * `CopyError` envelope the browser does. Only the socket underneath differs.
   */
  const transport = {
    get: (slug: string) => fetchPalette(slug, toOrigin),
    write: (body: Record<string, unknown>) => writePalette(body, toOrigin),
  }
  const post = (body: Record<string, unknown>) =>
    toOrigin(`${ORIGIN}/api/palette`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })

  /** Open the real popup against the real origin, hosted in this test's host. */
  const open = (slug: string, extra: Record<string, unknown> = {}) =>
    openPalettePopup({ host, slug, transport, shadeHex, ...extra }) as Promise<{
      ref: string
      shade?: number
    } | null>

  beforeAll(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-palette-popup-'))
    toOrigin = originFetchFor({ cwd, clientDir: path.join(REPO, 'apps/control-app/src/builder') })

    // Root-relative addresses are what the workspace sends; jsdom is not that
    // origin, so the global is pointed at the in-process one for anything that
    // does not take an injected `fetch`.
    const real = globalThis.fetch
    globalThis.fetch = toOrigin
    restoreFetch = () => {
      globalThis.fetch = real
    }

    // jsdom ships neither; the split primitive observes its container.
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as never
    globalThis.matchMedia ??= ((q: string) => ({
      matches: false,
      media: q,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      onchange: null,
      dispatchEvent: () => false,
    })) as never
  })

  afterAll(() => {
    restoreFetch?.()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  beforeEach(() => {
    document.body.replaceChildren()
    host = document.createElement('div')
    document.body.append(host)
  })

  afterEach(() => {
    // A popup left open keeps a document-level Escape listener alive, which the
    // next test's Escape would reach. Closing is hygiene, not behaviour.
    for (const btn of document.querySelectorAll<HTMLButtonElement>('.builder-modal__btn')) {
      if (btn.textContent === 'Close' || btn.textContent === 'Cancel') btn.click()
    }
    document.body.replaceChildren()
  })

  // ── AC-1242: what a swatch carries ─────────────────────────────────────────

  it('test_UAT_AC1242_every_entry_is_a_swatch_with_its_name_its_colour_and_its_usage_count', async () => {
    const slug = 'swatches'
    seedSite(cwd, slug)

    const answer = open(slug)
    await settled(host)

    // ONE SWATCH PER ENTRY, and every entry the palette holds — nothing dropped
    // and nothing invented. Each carries three things: the name, the colour SHOWN
    // AS COLOUR, and how many places reference it.
    expect(swatchTextIn(host)).toEqual(
      CENSUS.map((e) => ({ name: e.name, count: `used ${e.count}×`, chip: rgbOf(e.value) })),
    )

    // The surface shows what the store handed it, in the order it was handed —
    // it is not re-ordering, filtering or re-counting the census.
    expect(swatchesIn(host).map((s) => s.dataset.name)).toEqual(
      (await censusOf(cwd, slug)).map((e) => e.name),
    )

    // `primary` is referenced three times AT THREE DIFFERENT POSITIONS in its
    // family — counted at any position, so a census that saw only the unshaded
    // reference would report 1 here.
    expect(swatchTextIn(host)[0]).toEqual({
      name: 'primary',
      count: 'used 3×',
      chip: rgbOf(PALETTE.primary.value),
    })

    // AN ENTRY NOTHING REFERENCES IS LISTED AT ZERO, not omitted: zero is the
    // fact the removal rule is entirely about, so it is the count that must be
    // reportable at all.
    expect(swatchesIn(host).map((s) => s.dataset.name)).toContain('spare')
    expect(swatchTextIn(host).find((s) => s.name === 'spare')!.count).toBe('used 0×')

    clickIn(host, 'Close')
    expect(await answered(answer)).toBeNull()
  })

  // ── AC-1243: an empty palette is a starting state, not a fault ─────────────

  it('test_UAT_AC1243_a_site_with_no_colours_opens_on_an_invitation_to_add_the_first_one', async () => {
    const slug = 'unpainted'
    // A site with NO PALETTE AT ALL — the state two of the stored sites are
    // genuinely in, because their colours are still literals.
    cmdNew(slug, { cwd })
    expect(readSite(cwd, slug).palette).toBeUndefined()
    expect(await censusOf(cwd, slug)).toEqual([])

    const answer = open(slug)
    await settled(host)

    // No swatches, and in their place an invitation that NAMES THE SITE, says it
    // has no colours yet, and asks for one.
    expect(swatchesIn(host)).toHaveLength(0)
    const empty = host.querySelector('.builder-palette__empty')!.textContent!
    expect(empty).toContain(slug)
    expect(empty).toMatch(/no colors yet/i)
    expect(empty).toMatch(/add one/i)

    // NO ERROR REGION. An empty palette is a legitimate state; reporting it as a
    // failure is the whole thing this criterion forbids.
    expect(errorTextIn(host)).toBe('')

    // The add control is present and usable — THE SAME add control a populated
    // palette offers, name field and colour field both.
    const name = host.querySelector<HTMLInputElement>('.builder-palette__new-name')!
    const hex = host.querySelector<HTMLInputElement>('.builder-palette__add .builder-palette__hex')!
    expect(name.disabled).toBe(false)
    expect(hex.disabled).toBe(false)
    expect(hex.type).toBe('color')

    // ...and using it produces a swatch, which is what makes the invitation an
    // OFFER rather than advice.
    name.value = 'brand-teal'
    hex.value = '#0f766e'
    clickIn(host, 'Add color')
    await written(host)

    expect(errorTextIn(host)).toBe('')
    expect(swatchTextIn(host)).toEqual([
      { name: 'brand-teal', count: 'used 0×', chip: rgbOf('#0f766e') },
    ])
    expect(host.querySelector('.builder-palette__empty')).toBeNull()
    expect(await censusOf(cwd, slug)).toEqual([{ name: 'brand-teal', value: '#0f766e', count: 0 }])

    clickIn(host, 'Close')
    expect(await answered(answer)).toBeNull()
  })

  // ── AC-1244: the position control, and whose arithmetic it previews ───────

  it('test_UAT_AC1244_selecting_an_entry_reveals_a_continuous_position_control_previewing_what_the_page_paints', async () => {
    const slug = 'position'
    seedSite(cwd, slug)
    const rendered = await renderedHome(cwd, slug)

    const answer = open(slug)
    await settled(host)

    // WITH NOTHING SELECTED THERE IS NO CONTROL. A position relative to nothing
    // is meaningless, so it is absent rather than disabled.
    expect(sliderIn(host)).toBeNull()
    expect(readoutIn(host)).toBeNull()
    expect(detailIn(host).children).toHaveLength(0)

    selectIn(host, 'primary')
    const slider = sliderIn(host)!
    expect(slider).not.toBeNull()

    // CONTINUOUS, spanning the full declared range: darkest through the colour
    // itself to lightest, at a resolution far finer than a handful of stops.
    expect(slider.type).toBe('range')
    expect([slider.min, slider.max]).toEqual(['-1', '1'])
    expect(slider.value).toBe('0')
    const positions = (Number(slider.max) - Number(slider.min)) / Number(slider.step)
    expect(positions).toBeGreaterThanOrEqual(100)
    expect(positions).toBe(2000)

    // At the centre the preview is the entry itself.
    expect(readoutIn(host)!.textContent).toBe(PALETTE.primary.value)

    // THE PREVIEW IS THE RENDERER'S OWN ARITHMETIC — asserted twice, because
    // agreeing with `resolveL1Color` and agreeing with the bytes a page actually
    // carries are different claims and only the second one is about painting.
    const move = (to: number) => {
      slider.value = String(to)
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    }
    for (const at of [DARKER, LIGHTER, 0.617, -1, 1]) {
      move(at)
      expect(readoutIn(host)!.textContent, `shade ${at}`).toBe(paints(PALETTE.primary.value, at))
    }
    // The two positions the fixture page genuinely paints `primary` at: the
    // readout is the hex present in the rendered document, byte for byte.
    for (const at of [DARKER, LIGHTER]) {
      move(at)
      expect(rendered, `shade ${at}`).toContain(readoutIn(host)!.textContent!)
    }

    // MOVING THE CONTROL DOES NOT LOSE THE DRAG. The detail is updated in place
    // rather than rebuilt, so the control that is being dragged is still the
    // control that has focus after each frame.
    slider.focus()
    expect(document.activeElement).toBe(slider)
    for (const at of [-0.9, -0.2, 0.05, 0.8]) {
      move(at)
      expect(document.activeElement, `shade ${at}`).toBe(slider)
      expect(sliderIn(host), `shade ${at}`).toBe(slider)
      expect(readoutIn(host)!.textContent).toBe(paints(PALETTE.primary.value, at))
    }

    clickIn(host, 'Close')
    expect(await answered(answer)).toBeNull()
  })

  // ── AC-1245: the position control writes nothing ──────────────────────────

  it('test_UAT_AC1245_moving_the_position_control_while_managing_writes_nothing', async () => {
    const slug = 'preview-only'
    seedSite(cwd, slug)
    const captured = draftBytes(cwd, slug)

    // Opened TO MANAGE — nothing is waiting for a value.
    const answer = open(slug)
    await settled(host)
    selectIn(host, 'primary')

    const slider = sliderIn(host)!
    // Each end of the range, and an intermediate point.
    for (const at of [-1, 1, 0.37]) {
      slider.value = String(at)
      slider.dispatchEvent(new Event('input', { bubbles: true }))
      expect(readoutIn(host)!.textContent).toBe(paints(PALETTE.primary.value, at))
    }
    // Give any write this might have provoked time to land before we look.
    await tick()

    clickIn(host, 'Close')
    // THE OPENER RECEIVES NO SELECTION: in manage mode there is nobody waiting,
    // and the control is a preview of the entry's family, not an edit of it.
    expect(await answered(answer)).toBeNull()

    // BYTE-IDENTICAL. A position belongs to a *use*, never to an entry, so there
    // is nothing here for a slider to have written to.
    expect(draftBytes(cwd, slug)).toEqual(captured)
    expect(await censusOf(cwd, slug)).toEqual(CENSUS)
  })

  // ── AC-1246: a pick resolves to a reference, never a colour ────────────────

  it('test_UAT_AC1246_confirming_a_pick_resolves_to_a_palette_reference_with_a_position_only_when_it_is_not_the_colour_itself', async () => {
    const slug = 'picking'
    seedSite(cwd, slug)

    // Off-centre: the reference carries the entry AND the position, and nothing
    // else at all.
    const offCentre = open(slug, { mode: 'pick' })
    await settled(host)
    selectIn(host, 'primary')
    const slider = sliderIn(host)!
    slider.value = String(LIGHTER)
    slider.dispatchEvent(new Event('input', { bubbles: true }))
    clickIn(host, 'Use this color')

    const shaded = await answered(offCentre)
    expect(shaded).toEqual({ ref: 'primary', shade: LIGHTER })
    expect(Object.keys(shaded!).sort()).toEqual(['ref', 'shade'])

    // AT THE COLOUR ITSELF THE POSITION KEY IS ABSENT — not a position of zero.
    // The two resolve identically, but an absent position is the reference a
    // plain literal converts to byte-for-byte.
    const centred = open(slug, { mode: 'pick' })
    await settled(host)
    selectIn(host, 'text')
    expect(sliderIn(host)!.value).toBe('0')
    clickIn(host, 'Use this color')

    const plain = await answered(centred)
    expect(plain).toEqual({ ref: 'text' })
    expect(Object.keys(plain!)).toEqual(['ref'])
    expect('shade' in plain!).toBe(false)

    // NEVER A TYPED COLOUR AND NEVER TRANSPARENCY. Asserted on the serialised
    // value, so a colour smuggled under any key would show.
    for (const value of [shaded, plain]) {
      expect(JSON.stringify(value)).not.toMatch(/#[0-9a-fA-F]{3}/)
      expect(JSON.stringify(value)).not.toContain('alpha')
      expect(Object.keys(value!).every((k) => k === 'ref' || k === 'shade')).toBe(true)
    }

    // CONFIRMING IS UNAVAILABLE UNTIL AN ENTRY HAS BEEN CHOSEN: with nothing
    // selected the surface stays open and resolves nothing.
    const nothingChosen = open(slug, { mode: 'pick' })
    await settled(host)
    expect(selectedNameIn(host)).toBeNull()
    clickIn(host, 'Use this color')
    await tick()
    expect(dialogIn(host)).not.toBeNull()
    expect(swatchesIn(host)).toHaveLength(CENSUS.length)

    clickIn(host, 'Cancel')
    expect(await answered(nothingChosen)).toBeNull()
  })

  // ── AC-1247: every route out answers once, and changes nothing ─────────────

  it('test_UAT_AC1247_closing_without_confirming_answers_the_opener_with_nothing_exactly_once', async () => {
    const slug = 'closing'
    seedSite(cwd, slug)
    const captured = draftBytes(cwd, slug)

    const escape = () =>
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    /**
     * Each route, resolved to a callable AFTER the dialog is open — and held, so
     * the "inert afterwards" step below re-takes the very same control once it is
     * detached. A control the operator can still click is exactly the one that
     * must not answer twice.
     */
    const routes: Array<[string, () => () => void]> = [
      ['the cancel control', () => {
        const btn = buttonIn(host, 'Cancel')!
        return () => btn.click()
      }],
      ['Escape', () => escape],
      ['a click outside the panel', () => {
        const backdrop = host.querySelector<HTMLElement>('.builder-modal__backdrop')!
        return () => backdrop.click()
      }],
    ]

    for (const [what, resolveRoute] of routes) {
      // Opened to supply a value, so there IS an opener waiting for an answer.
      let settlements = 0
      const answer = open(slug, { mode: 'pick' }).then((v) => {
        settlements += 1
        return v
      })
      await settled(host)
      selectIn(host, 'primary')
      expect(selectedNameIn(host)).toBe('primary')

      const leave = resolveRoute()
      leave()

      // Answered — with NO VALUE — and the dialog is gone from the page.
      expect(await answered(answer, what), what).toBeNull()
      expect(dialogIn(host), what).toBeNull()
      expect(dialogIn(document), what).toBeNull()

      // EXACTLY ONCE: re-taking this route and every other one afterwards is
      // inert. None of them can answer a second time, and none re-opens anything.
      leave()
      escape()
      await tick()
      expect(settlements, what).toBe(1)
      expect(dialogIn(document), what).toBeNull()

      // ...and the stored definition never moved.
      expect(draftBytes(cwd, slug), what).toEqual(captured)
    }

    // ESCAPE DURING A CLOSE ALREADY UNDER WAY. The re-entrant press is dispatched
    // from a listener registered BEFORE the dialog's own, so the second Escape is
    // genuinely delivered while the first close is still running — and it must
    // not answer a second time.
    let reentered = false
    const reenter = (ev: KeyboardEvent) => {
      if (ev.key !== 'Escape' || reentered) return
      reentered = true
      escape()
    }
    document.addEventListener('keydown', reenter)
    try {
      let settlements = 0
      const answer = open(slug, { mode: 'pick' }).then((v) => {
        settlements += 1
        return v
      })
      await settled(host)
      selectIn(host, 'primary')

      escape()
      expect(reentered).toBe(true)
      expect(await answered(answer, 'a re-entrant Escape')).toBeNull()
      await tick()
      expect(settlements).toBe(1)
      expect(dialogIn(document)).toBeNull()
      expect(draftBytes(cwd, slug)).toEqual(captured)
    } finally {
      document.removeEventListener('keydown', reenter)
    }
  })

  // ── AC-1248: opened over a colour the caller already holds ─────────────────

  it('test_UAT_AC1248_opened_over_a_held_reference_the_surface_starts_on_that_entry_at_that_position', async () => {
    const slug = 'held'
    seedSite(cwd, slug)

    // Opened to supply a value, holding a reference the caller already has, at an
    // OFF-CENTRE position.
    const answer = open(slug, { mode: 'pick', value: { ref: 'primary', shade: DARKER } })
    await settled(host)

    // It starts on that entry, at that position — so opening a picker can never
    // silently change the colour it was opened over.
    expect(selectedNameIn(host)).toBe('primary')
    expect(sliderIn(host)!.value).toBe(String(DARKER))
    expect(readoutIn(host)!.textContent).toBe(paints(PALETTE.primary.value, DARKER))

    // MOVING THE SELECTION RESETS THE POSITION to the colour itself: a position is
    // a place within ONE entry's family, so carrying it across would silently
    // darken a colour the operator chose by its swatch.
    selectIn(host, 'text')
    expect(selectedNameIn(host)).toBe('text')
    expect(sliderIn(host)!.value).toBe('0')
    expect(readoutIn(host)!.textContent).toBe(PALETTE.text.value)
    expect(host.querySelector('.builder-palette__shade-label')!.textContent).toMatch(
      /the color itself/i,
    )

    // Returning to the originally held entry restores the position it was opened
    // with.
    selectIn(host, 'primary')
    expect(sliderIn(host)!.value).toBe(String(DARKER))
    expect(readoutIn(host)!.textContent).toBe(paints(PALETTE.primary.value, DARKER))

    clickIn(host, 'Cancel')
    expect(await answered(answer)).toBeNull()

    // HELD ENTRY GONE FROM THE PALETTE: nothing selected, and every entry the
    // palette DOES hold still listed — rather than a detail panel describing a
    // colour the site no longer has.
    const stale = open(slug, { mode: 'pick', value: { ref: 'nonesuch', shade: 0.5 } })
    await settled(host)

    expect(selectedNameIn(host)).toBeNull()
    expect(sliderIn(host)).toBeNull()
    expect(detailIn(host).children).toHaveLength(0)
    expect(errorTextIn(host)).toBe('')
    expect(swatchesIn(host).map((s) => s.dataset.name)).toEqual(CENSUS.map((e) => e.name))

    clickIn(host, 'Cancel')
    expect(await answered(stale)).toBeNull()
  })

  // ── AC-1249: a colour is typed here, and the page follows ──────────────────

  it('test_UAT_AC1249_a_colour_is_typed_here_and_applying_repaints_the_displayed_page', async () => {
    const slug = 'typing'
    seedSite(cwd, slug)

    const before = await renderedHome(cwd, slug)
    for (const at of [0, DARKER, LIGHTER]) {
      expect(before).toContain(paints(PALETTE.primary.value, at))
    }

    const answer = open(slug)
    await settled(host)
    selectIn(host, 'primary')

    const detail = detailIn(host)
    const native = detail.querySelector<HTMLInputElement>('.builder-palette__hex')!
    const text = detail.querySelector<HTMLInputElement>('.builder-palette__hex-text')!
    expect(native.type).toBe('color')
    expect([native.value, text.value]).toEqual([PALETTE.primary.value, PALETTE.primary.value])

    // ONE VALUE, TWO CONTROLS. Dragging the native control updates the text field…
    native.value = '#a33b12'
    native.dispatchEvent(new Event('input', { bubbles: true }))
    expect(text.value).toBe('#a33b12')

    // …and typing into the text field updates the native control.
    text.value = '#0f766e'
    text.dispatchEvent(new Event('input', { bubbles: true }))
    expect(native.value).toBe('#0f766e')

    // A FORM THE NATIVE CONTROL CANNOT EXPRESS is accepted: `#rgb` shorthand is
    // valid for an entry, and a native colour input holds only `#rrggbb`.
    const SHORT = '#a3c'
    text.value = SHORT
    text.dispatchEvent(new Event('input', { bubbles: true }))

    // Applying submits whichever the operator last set — the text field here.
    clickIn(host, 'Change color')
    await written(host)
    expect(errorTextIn(host)).toBe('')

    // IT REPORTS HOW MANY USES WERE REPAINTED, in the count the swatch shows.
    expect(statusTextIn(host)).toMatch(/3 uses repainted/)
    expect(swatchTextIn(host).find((s) => s.name === 'primary')!.count).toBe('used 3×')
    expect((await censusOf(cwd, slug)).find((e) => e.name === 'primary')!.value).toBe(SHORT)

    clickIn(host, 'Close')
    expect(await answered(answer)).toBeNull()

    // THE PAGE THE PANE DISPLAYS NOW PAINTS THE NEW COLOUR AT EVERY POSITION the
    // entry is used at — asserted on the bytes the displayed address actually
    // serves, with no rebuild and no other command in between, because both
    // draft-side channels render at request time.
    const displayed = await (await toOrigin(previewUrl(slug, 'draft'))).text()
    for (const at of [0, DARKER, LIGHTER]) {
      expect(displayed, `shade ${at}`).toContain(paints(SHORT, at))
      expect(displayed, `shade ${at}`).not.toContain(paints(PALETTE.primary.value, at))
    }
    // …and the other entries are untouched.
    expect(displayed).toContain(PALETTE.text.value)

    if (!WEBUI_INSTALLED) {
      unverified('the workspace REFRESHING the displayed frame after a write (the chrome needs the components)')
      return
    }

    // ── and the refresh itself, at the workspace where it is wired ────────────
    const { mountBuilder } = (await import('../apps/control-app/src/builder/app.js')) as {
      mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => {
        panel: { frame: HTMLIFrameElement; getSite: () => string | null; getSrc: () => string }
        toolbar: { get: (id: string) => HTMLElement | null }
        destroy: () => void
      }
    }
    const wsSlug = 'typing-workspace'
    seedSite(cwd, wsSlug)

    const root = document.createElement('div')
    document.body.append(root)
    const app = mountBuilder(root, {
      sites: [{ slug: wsSlug, latest: null }],
      storage: memoryStorage(),
      shadeHex,
      paletteTransport: transport,
      // The assistant is the one true external boundary in this composition, and
      // opening a session is not what this criterion is about.
      chatTransport: { openSession: async () => ({ sessionId: 'ws', turns: [], ready: false }) },
    })
    expect(app.panel.getSite()).toBe(wsSlug)
    expect(app.panel.getSrc()).toBe(previewUrl(wsSlug, 'draft'))

    // The refresh is observed at the frame's own `contentWindow` seam: jsdom's
    // `location.reload` is non-configurable, and jsdom does not navigate an
    // iframe anyway, so the reachable evidence is that the workspace ASKED the
    // displayed frame to reload — and the fetch below shows what that ask gets.
    // Exactly one frame is in the document, so the ask cannot be another's.
    expect(document.querySelectorAll('iframe')).toHaveLength(1)
    expect(document.querySelector('iframe')).toBe(app.panel.frame)

    let reloads = 0
    const contentWindow = vi
      .spyOn(HTMLIFrameElement.prototype, 'contentWindow', 'get')
      .mockReturnValue({ location: { reload: () => void (reloads += 1) } } as unknown as Window)
    try {
      app.toolbar.get('colors')!.click()
      await settled(document)
      selectIn(document, 'primary')

      // Nothing has asked for a refresh yet.
      expect(reloads).toBe(0)

      const wsText = detailIn(document).querySelector<HTMLInputElement>(
        '.builder-palette__hex-text',
      )!
      wsText.value = '#123456'
      wsText.dispatchEvent(new Event('input', { bubbles: true }))
      clickIn(document, 'Change color')
      await written(document)
      expect(statusTextIn(document)).toMatch(/3 uses repainted/)

      // WITHOUT ANY FURTHER OPERATOR ACTION the displayed frame is refreshed —
      // a palette write that left a stale page on screen would read as a write
      // that did nothing.
      expect(reloads).toBeGreaterThan(0)

      // ...and what that refresh fetches is the repainted page.
      const refetched = await (await toOrigin(app.panel.getSrc())).text()
      for (const at of [0, DARKER, LIGHTER]) {
        expect(refetched, `shade ${at}`).toContain(paints('#123456', at))
        expect(refetched, `shade ${at}`).not.toContain(paints(PALETTE.primary.value, at))
      }

      clickIn(document, 'Close')
    } finally {
      contentWindow.mockRestore()
      app.destroy()
      root.remove()
    }
  })

  // ── AC-1250: redraw from the census, selection where the edit left it ──────

  it('test_UAT_AC1250_after_every_accepted_edit_the_surface_redraws_from_the_returned_census', async () => {
    const slug = 'redraw'
    seedSite(cwd, slug)

    const answer = open(slug)
    await settled(host)

    // ── an ADDED entry appears immediately, at zero, and is selectable ────────
    const name = host.querySelector<HTMLInputElement>('.builder-palette__new-name')!
    const hex = host.querySelector<HTMLInputElement>('.builder-palette__add .builder-palette__hex')!
    name.value = 'brand-teal'
    hex.value = '#0f766e'
    clickIn(host, 'Add color')
    await written(host)

    expect(statusTextIn(host)).toMatch(/Added brand-teal/)
    expect(swatchTextIn(host)).toContainEqual({
      name: 'brand-teal',
      count: 'used 0×',
      chip: rgbOf('#0f766e'),
    })
    // Selectable: the edit left the selection on what it created, and the detail
    // describes it.
    expect(selectedNameIn(host)).toBe('brand-teal')
    expect(sliderIn(host)).not.toBeNull()
    expect(readoutIn(host)!.textContent).toBe('#0f766e')

    // ── a REMOVED entry disappears and nothing is left selected ──────────────
    selectIn(host, 'spare')
    expect(selectedNameIn(host)).toBe('spare')
    clickIn(host, 'Delete')
    await written(host)

    expect(statusTextIn(host)).toMatch(/Deleted spare/)
    expect(swatchesIn(host).map((s) => s.dataset.name)).not.toContain('spare')
    // NO DETAIL DESCRIBES AN ENTRY THAT IS GONE.
    expect(selectedNameIn(host)).toBeNull()
    expect(detailIn(host).children).toHaveLength(0)
    expect(sliderIn(host)).toBeNull()

    // ── a RENAMED entry appears under its new name, selected, with its count ──
    selectIn(host, 'primary')
    const renameField = host.querySelector<HTMLInputElement>('.builder-palette__rename')!
    renameField.value = 'brand'
    clickIn(host, 'Rename')
    await written(host)

    // Confirmed in words naming the entry and the number of uses affected.
    expect(statusTextIn(host)).toMatch(/primary/)
    expect(statusTextIn(host)).toMatch(/brand/)
    expect(statusTextIn(host)).toMatch(/3 references rewritten/)

    expect(swatchesIn(host).map((s) => s.dataset.name)).toContain('brand')
    expect(swatchesIn(host).map((s) => s.dataset.name)).not.toContain('primary')
    expect(selectedNameIn(host)).toBe('brand')
    expect(swatchTextIn(host).find((s) => s.name === 'brand')!.count).toBe('used 3×')

    // ── THE REDRAWN COUNTS ARE A FRESH READ'S COUNTS ─────────────────────────
    // Not the surface's own guess at what each edit changed: what it shows equals
    // what the palette independently reports, entry for entry.
    expect(swatchTextIn(host)).toEqual(
      (await censusOf(cwd, slug)).map((e) => ({
        name: e.name,
        count: `used ${e.count}×`,
        chip: rgbOf(e.value),
      })),
    )

    clickIn(host, 'Close')
    expect(await answered(answer)).toBeNull()

    // The added entry is PICKABLE, which is what "part of the palette" has to
    // mean — the same surface, opened to supply a value, resolves to it.
    const picked = open(slug, { mode: 'pick' })
    await settled(host)
    selectIn(host, 'brand-teal')
    clickIn(host, 'Use this color')
    expect(await answered(picked)).toEqual({ ref: 'brand-teal' })
  })

  // ── AC-1251: a refusal is the store's own words ───────────────────────────

  it('test_UAT_AC1251_a_refused_edit_leaves_the_surface_open_and_shows_the_stores_own_message_and_hint', async () => {
    const slug = 'refusal'
    seedSite(cwd, slug)

    // THE STORE'S OWN WORDS, taken from the store itself so the comparison below
    // is against the origin's text rather than a copy of it written here.
    const duplicate = await cli(cwd, 'palette', 'add', slug, 'primary', '#123456')
    expect(duplicate.ok).toBe(false)
    expect(duplicate.error?.code).toBe('CONFLICT')
    const malformed = await cli(cwd, 'palette', 'add', slug, 'Brand Teal', '#123456')
    expect(malformed.ok).toBe(false)
    expect(malformed.error?.code).toBe('SCHEMA_INVALID')

    const captured = draftBytes(cwd, slug)
    const answer = open(slug)
    await settled(host)
    const listBefore = swatchTextIn(host)
    expect(listBefore).toHaveLength(CENSUS.length)

    const name = host.querySelector<HTMLInputElement>('.builder-palette__new-name')!
    const hex = host.querySelector<HTMLInputElement>('.builder-palette__add .builder-palette__hex')!

    for (const [attempt, refusal] of [
      ['primary', duplicate.error!],
      ['Brand Teal', malformed.error!],
    ] as const) {
      name.value = attempt
      hex.value = '#123456'
      clickIn(host, 'Add color')
      await written(host)

      // The surface is STILL OPEN and its listing is identical to before.
      expect(dialogIn(host), attempt).not.toBeNull()
      expect(swatchTextIn(host), attempt).toEqual(listBefore)
      // The stored definition is unchanged.
      expect(draftBytes(cwd, slug), attempt).toEqual(captured)

      // THE STORE'S OWN MESSAGE AND HINT, VERBATIM — not a paraphrase the
      // surface invented. The message says which rule refused; the hint says
      // what to do instead, and dropping it would leave the operator with a
      // "no" and no next step.
      const shown = errorTextIn(host)
      expect(shown, attempt).toContain(refusal.message)
      expect(refusal.hint, attempt).toBeTruthy()
      expect(shown, attempt).toContain(refusal.hint)
      // ...and no confirmation is showing alongside the refusal.
      expect(statusTextIn(host), attempt).toBe('')
    }

    // A SUBSEQUENT SUCCESSFUL EDIT CLEARS THE REFUSAL and replaces it with the
    // confirmation.
    name.value = 'brand-teal'
    hex.value = '#0f766e'
    clickIn(host, 'Add color')
    await written(host)

    expect(errorTextIn(host)).toBe('')
    expect(statusTextIn(host)).toMatch(/Added brand-teal/)
    expect(swatchesIn(host).map((s) => s.dataset.name)).toContain('brand-teal')

    clickIn(host, 'Close')
    expect(await answered(answer)).toBeNull()

    // AND THE REFUSAL IS THE STORE'S, NOT THE SURFACE'S. Posted directly, exactly
    // as a tab left open while the site changed underneath it would post.
    const stale = await post({ slug, op: 'add', name: 'primary', value: '#123456' })
    expect(stale.status).toBe(400)
    expect(((await stale.json()) as { code?: string }).code).toBe('CONFLICT')
  })

  // ── AC-1252: the surface states what an edit costs ────────────────────────

  it('test_UAT_AC1252_the_surface_states_the_cost_of_removal_and_rename_from_the_counts_it_shows', async () => {
    const slug = 'cost'
    seedSite(cwd, slug)

    const answer = open(slug)
    await settled(host)

    // AN ENTRY NOTHING REFERENCES: the removal control is offered AND enabled,
    // with a note saying it is safe to remove.
    selectIn(host, 'spare')
    const safe = buttonIn(host, 'Delete')!
    expect(safe).not.toBeNull()
    expect(safe.disabled).toBe(false)
    expect(noteBeside(safe)).toMatch(/unused, safe to delete/i)

    // AN ENTRY IN USE: the control is PRESENT and unavailable — shown rather than
    // hidden, because "why can't I remove this" is exactly the question the count
    // exists to answer. The note gives the usage count as the reason and says
    // what to do instead.
    selectIn(host, 'primary')
    const shownCount = swatchTextIn(host).find((s) => s.name === 'primary')!.count
    expect(shownCount).toBe('used 3×')

    const blocked = buttonIn(host, 'Delete')!
    expect(blocked).not.toBeNull()
    expect(blocked.disabled).toBe(true)
    const reason = noteBeside(blocked)!
    expect(reason).toContain('used 3×')
    expect(reason).toMatch(/ask the assistant/i)

    // THE RENAME CONTROL STATES HOW MANY USES IT WILL REWRITE, BEFORE IT IS RUN —
    // and that number is the number the swatch shows.
    const renameField = host.querySelector<HTMLInputElement>('.builder-palette__rename')!
    expect(noteBeside(renameField)).toBe('renames 3 uses')
    expect(noteBeside(renameField)).toContain('3')
    expect(shownCount).toContain('3')

    // ...and it is the number the completed rename reports rewriting. One walk,
    // one number: the fixture references `primary` at three different positions,
    // which is where two hand-kept traversals would disagree.
    renameField.value = 'brand'
    clickIn(host, 'Rename')
    await written(host)
    expect(errorTextIn(host)).toBe('')
    expect(statusTextIn(host)).toMatch(/3 references rewritten/)

    clickIn(host, 'Close')
    expect(await answered(answer)).toBeNull()

    // THE UNAVAILABLE CONTROL IS AN EXPLANATION OF A RULE, NEVER THE RULE.
    // Submitted directly to the store as a stale client would, with no surface in
    // the way at all, the removal is refused there too — and the refusal names the
    // same count.
    const captured = draftBytes(cwd, slug)
    const refused = await post({ slug, op: 'rm', name: 'brand' })
    expect(refused.status).toBe(400)
    const body = (await refused.json()) as { code?: string; message?: string }
    expect(body.code).toBe('CONFLICT')
    expect(body.message).toMatch(/used 3 times and cannot be deleted/)

    // The surface's display had no bearing on the outcome: nothing moved.
    expect(draftBytes(cwd, slug)).toEqual(captured)
    expect(Object.keys(readSite(cwd, slug).palette as object)).toContain('brand')
  })

  // ── AC-1241: the toolbar's colour control ─────────────────────────────────

  it('test_UAT_AC1241_the_toolbars_colour_control_opens_the_surface_for_the_displayed_site_in_both_channels', async () => {
    const slug = 'toolbar'
    const other = 'toolbar-other'
    seedSite(cwd, slug)
    seedSite(cwd, other)

    // ── the toolbar contract, on every machine ───────────────────────────────
    // The control is ONE MORE REGISTERED ACTION: it is rendered because the
    // active channel names it, and a channel that does not name it does not get
    // it. Real panel, real toolbar, real action spec — nothing stubbed but the
    // opener, so that "which slug was it opened for" is observable.
    const opened: Array<{ slug: string }> = []
    const panel = createDisplayPanel({ site: slug })
    panel
      .registerMode({
        id: 'view',
        label: 'View',
        src: ({ site }: { site: string }) => previewUrl(site, 'draft'),
        actions: ['colors'],
      })
      .registerMode({
        id: 'edit',
        label: 'Edit',
        src: ({ site }: { site: string }) => previewUrl(site, 'edit'),
        actions: ['colors'],
      })
      .registerMode({ id: 'listing', label: 'Listing', mount: () => {}, actions: [] })

    const toolbar = createToolbar({
      panel,
      actions: [
        colorsAction((s: string) => {
          opened.push({ slug: s })
          return Promise.resolve(null)
        }),
      ],
    })

    // Offered in the viewing channel, and activating it opens for the displayed
    // site.
    expect(toolbar.ids()).toContain('colors')
    toolbar.get('colors')!.click()
    expect(opened).toEqual([{ slug }])

    // Offered in the editing channel too — a palette is a property of the site,
    // not of one rendering of it.
    panel.setMode('edit')
    expect(toolbar.ids()).toContain('colors')
    toolbar.get('colors')!.click()
    expect(opened).toEqual([{ slug }, { slug }])

    // It follows the DISPLAYED site.
    panel.setSite(other)
    toolbar.get('colors')!.click()
    expect(opened[2]).toEqual({ slug: other })

    // NO SITE DISPLAYED: nothing is opened and nothing is reported.
    panel.setSite(null)
    toolbar.get('colors')!.click()
    expect(opened).toHaveLength(3)

    // ...and it is not special-cased by the toolbar: a channel that does not
    // name the action does not render it.
    panel.setSite(slug)
    panel.setMode('listing')
    expect(toolbar.ids()).not.toContain('colors')
    expect(toolbar.get('colors')).toBeNull()

    toolbar.destroy()
    panel.destroy()

    if (!WEBUI_INSTALLED) {
      unverified("the SHIPPED workspace's own registration of the control in both channels")
      return
    }

    // ── and the shipped workspace itself ─────────────────────────────────────
    const { mountBuilder } = (await import('../apps/control-app/src/builder/app.js')) as {
      mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => {
        panel: {
          getModes: () => Array<{ id: string; actions?: string[] }>
          setMode: (id: string) => void
          setSite: (slug: string | null) => void
          getSite: () => string | null
        }
        toolbar: { ids: () => string[]; get: (id: string) => HTMLElement | null }
        destroy: () => void
      }
    }
    const root = document.createElement('div')
    document.body.append(root)
    const app = mountBuilder(root, {
      sites: [
        { slug, latest: null },
        { slug: other, latest: null },
      ],
      storage: memoryStorage(),
      shadeHex,
      paletteTransport: transport,
      chatTransport: { openSession: async () => ({ sessionId: 'ws', turns: [], ready: false }) },
    })

    try {
      // BOTH CHANNELS LIST IT — no mode registered here; these came out of the
      // shipped workspace.
      const modes = app.panel.getModes()
      expect(modes.map((m) => m.id)).toEqual(expect.arrayContaining(['view', 'edit']))
      for (const id of ['view', 'edit']) {
        expect(modes.find((m) => m.id === id)!.actions, id).toContain('colors')
      }

      /** Open through the toolbar and report which site the surface is bound to. */
      const openThroughToolbar = async () => {
        app.toolbar.get('colors')!.click()
        await settled(document)
        // The radio group is namespaced by slug, so the binding is observable on
        // the surface itself rather than inferred from what opened it.
        const group = document.querySelector<HTMLInputElement>(
          '.builder-palette__swatch input, .builder-palette__list input',
        )
        return group?.name ?? null
      }

      // Viewing channel → bound to the displayed site.
      expect(app.panel.getSite()).toBe(slug)
      expect(app.toolbar.ids()).toContain('colors')
      expect(await openThroughToolbar()).toBe(`palette-${slug}`)
      expect(swatchesIn(document).map((s) => s.dataset.name)).toEqual(CENSUS.map((e) => e.name))
      clickIn(document, 'Close')

      // Editing channel → still offered, still the same site.
      app.panel.setMode('edit')
      expect(app.toolbar.ids()).toContain('colors')
      expect(await openThroughToolbar()).toBe(`palette-${slug}`)
      clickIn(document, 'Close')

      // A different site displayed → the surface opens for the NEWLY displayed one.
      app.panel.setSite(other)
      expect(await openThroughToolbar()).toBe(`palette-${other}`)
      clickIn(document, 'Close')

      // NO SITE DISPLAYED → nothing opens, and nothing is reported.
      app.panel.setSite(null)
      app.toolbar.get('colors')!.click()
      await tick()
      expect(dialogIn(document)).toBeNull()
      expect(document.querySelector('.builder-modal__error')).toBeNull()
    } finally {
      app.destroy()
      root.remove()
    }
  })
})
