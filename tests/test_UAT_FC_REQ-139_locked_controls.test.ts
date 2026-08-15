// @vitest-environment jsdom
/**
 * REQ-139 — **a control that cannot express what the element holds is shown
 * unavailable, with the reason.**
 *
 * The rule: a control is offered only when it is FAITHFUL — the value it shows
 * is the whole truth about what the element holds, and setting it produces
 * exactly the change the operator expects. Three ways that breaks (inert, lossy,
 * unsupported) and one treatment for all three.
 *
 * THE CASE THAT PROVOKED IT is the Gigabyte Alchemy wordmark: its glyphs are
 * painted by a `gradientFill`, which the renderer compiles by clipping the
 * background layers to the text and setting `color: transparent`. The colour
 * axis is still there — that run carries `color: {ref: 'neutral'}` under its
 * gradient — so before this ticket the modal offered a real, editable, entirely
 * meaningless colour: pick one, save, and the words do not move. That reads as
 * the editor losing the edit, which is the worst failure this surface has.
 *
 * NEVER HIDDEN. A withdrawn row would say "this build has no colour control"
 * where the truth is "not on this element", and the two have completely
 * different fixes — REQ-135's own argument for locking over dropping, which this
 * generalises rather than re-litigates.
 *
 * THE ONE THAT IS NOT OBVIOUS is the last CLI test. The modal posts every staged
 * field, not only the touched ones, so a locked colour is re-posted on any Save
 * — including one that only rewrote the words. A lock that refused the status
 * quo would therefore not disable a control, it would disable the whole segment:
 * the gradient run is a headline, and its words would have become uneditable the
 * moment its colour became unavailable. Nothing in the feature itself surfaces
 * that; it is only visible from a test that edits something else.
 *
 * REAL EVERYTHING EXCEPT THE ORIGIN'S PORT, on the pattern REQ-135/REQ-140
 * established: the page is what `1c render --edit` wrote, the commands are the
 * real `1c`, and the dialog is the real `defaultModal`.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender, run, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import { mountL1EditBridge } from '../packages/framework/src/l1/edit-client'
import {
  formatL1Path,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_PAGE_ATTR,
  L1_EDIT_PATH_ATTR,
} from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

/** The family as a run asks for it — a stack — against the bare family a face declares. */
const STACK = 'Satoshi, Helvetica Neue, Arial, sans-serif'
const FAMILY = 'Satoshi'

/** The site's palette. The gradient's stops name entries, exactly as the real fold wrote them. */
const PALETTE = {
  neutral: { value: '#f6f7f4' },
  amber: { value: '#d4a017' },
  orange: { value: '#ff7a00' },
  brand: { value: '#2e86a3' },
}

/** The wordmark: glyphs painted by a gradient, with a flat colour underneath it. */
const A_WORDMARK = '0.0'
/** An ordinary run in the same family — the contrast that keeps the lock from being global. */
const A_LEDE = '0.1'
/** A band whose photograph sits under a scrim: a sibling axis, and NOT occlusion. */
const A_BACKDROP = '0.2'
/** A run in a family that declares no faces — nothing is locked here at all. */
const A_SYSTEM = '0.3'

/** Every segment this fixture exposes controls on, for the structural sweep. */
const EVERY_SEGMENT = [A_WORDMARK, A_LEDE, A_BACKDROP, A_SYSTEM]

const HERO = '/assets/hero.png'

const draftPath = (cwd: string, slug: string, ...rest: string[]) =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)

/**
 * A page whose segments differ in exactly the ways that decide whether a control
 * is faithful.
 *
 * `A_WORDMARK` carries a flat `color` UNDER its gradient on purpose — that is
 * the measured shape of the real run, and a node with no colour axis could not
 * tell "the row is locked" from "there was nothing to show".
 */
function seedSite(cwd: string, slug: string): void {
  fs.mkdirSync(draftPath(cwd, slug, 'assets'), { recursive: true })
  fs.writeFileSync(draftPath(cwd, slug, 'assets', 'hero.png'), 'bytes:hero')

  const homePath = draftPath(cwd, slug, 'pages', 'home.json')
  const home = JSON.parse(fs.readFileSync(homePath, 'utf8'))
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    axes: { surfaceFill: '#0b1220' },
    children: [
      {
        kind: 'text',
        id: 'wordmark',
        text: 'Gigabyte Alchemy',
        axes: {
          fontFamily: STACK,
          fontSizePx: 48,
          fontWeight: 700,
          color: { ref: 'neutral' },
          gradientFill: {
            angleDeg: 90,
            stops: [
              { color: { ref: 'amber' }, position: 0 },
              { color: { ref: 'orange' }, position: 100 },
            ],
          },
        },
      },
      {
        kind: 'text',
        id: 'lede',
        text: 'An ordinary run, painted by its colour axis.',
        axes: { fontFamily: STACK, fontSizePx: 18, color: '#f6f7f4' },
      },
      {
        kind: 'container',
        id: 'backdrop',
        layout: 'stack',
        // A scrim over a photograph, over a fill. Three painting axes, none of
        // which hides the other two: the whole point of AC-3's contrast.
        axes: {
          backgroundImageUrl: HERO,
          surfaceFill: '#101822',
          overlay: { color: '#000000', opacity: 0.35 },
        },
        children: [{ kind: 'text', id: 'over', text: 'Over the backdrop.' }],
      },
      {
        kind: 'text',
        id: 'system',
        text: 'Set in whatever the reader has.',
        axes: { fontFamily: 'system-ui, sans-serif', fontSizePx: 16, color: '#101820' },
      },
    ],
  } as L1Node
  home.l1 = {
    ...(home.l1 as Record<string, unknown>),
    root,
    // Two weights, NO italic — which is what locks italic on every run set in
    // this family, and leaves the system run's alone.
    resources: {
      fonts: [400, 700].map((weight) => ({
        family: FAMILY,
        src: `/assets/satoshi-${weight}.woff2`,
        weight,
        style: 'normal',
      })),
    },
  }
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))

  const sitePath = draftPath(cwd, slug, 'site.json')
  const site = JSON.parse(fs.readFileSync(sitePath, 'utf8'))
  site.palette = PALETTE
  fs.writeFileSync(sitePath, JSON.stringify(site, null, 2))
}

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  human?: string
  error?: { code: string; message: string; path?: string }
  exitCode: number
}

/** Drive the real `1c` entry point — argv in, envelope and exit code out. */
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
  const exitCode = typeof process.exitCode === 'number' ? process.exitCode : 0
  process.exitCode = 0
  return { ...(JSON.parse(out[out.length - 1]) as CliResult), exitCode }
}

interface Field {
  name: string
  label: string
  type: string
  locked?: boolean
  reason?: string
}

describe('REQ-139 — controls that cannot express what the element holds', () => {
  let cwd: string

  const get = (addr: string) => cli(cwd, 'copy', 'get', 'acme', 'home', addr)
  const set = (addr: string, values: Record<string, unknown>) =>
    cli(cwd, 'copy', 'set', 'acme', 'home', addr, '--values', JSON.stringify(values))

  const fieldsOf = async (addr: string): Promise<Field[]> =>
    (await get(addr)).data!.fields as Field[]
  const fieldNamed = async (addr: string, name: string): Promise<Field | undefined> =>
    (await fieldsOf(addr)).find((f) => f.name === name)

  /** The draft page file, byte for byte — what a refused edit must not touch. */
  const draftBytes = () => fs.readFileSync(draftPath(cwd, 'acme', 'pages', 'home.json'), 'utf8')

  /** The node at a dotted address, out of the draft on disk. */
  function draftNode(addr: string): Record<string, unknown> {
    let node = JSON.parse(draftBytes()).l1.root as Record<string, unknown>
    for (const i of addr.split('.').map(Number).slice(1)) {
      node = (node.children as Record<string, unknown>[])[i]
    }
    return node
  }

  const axesOf = (addr: string) => draftNode(addr).axes as Record<string, unknown>

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req139-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
  })
  afterEach(() => {
    fs.rmSync(cwd, { recursive: true, force: true })
  })

  // AC-1 — the INERT case. A run whose glyphs are painted by a gradient still
  // offers its colour row, in the same place, still reporting what the axis
  // holds — and marked unavailable, because the axis it would write is compiled
  // to `transparent`.
  it('test_UAT_FC_REQ-139_a_gradient_painted_run_locks_its_colour_and_says_why', async () => {
    const fields = await fieldsOf(A_WORDMARK)
    const colour = fields.find((f) => f.name === 'color')!

    expect(colour.locked).toBe(true)
    // Plain English, naming what the element is doing and the way round it.
    // Never an axis name: "gradientFill overrides color" tells a non-technical
    // operator nothing they can act on.
    expect(colour.reason).toMatch(/gradient/i)
    expect(colour.reason).toMatch(/chat/i)
    expect(colour.reason).not.toMatch(/gradientFill|transparent/)

    // STILL OFFERED, still reporting the truth, still where the derivation put
    // it. A withdrawn row would read as "this build has no colour control".
    expect(fields.map((f) => f.name).slice(0, 2)).toEqual(['text', 'color'])
    expect((await get(A_WORDMARK)).data!.values).toMatchObject({ color: { ref: 'neutral' } })

    // NOT GLOBAL. The identical control on the run below it is untouched — the
    // lock is a statement about one element, and a lock that spread would be
    // indistinguishable from having deleted the feature.
    const lede = (await fieldNamed(A_LEDE, 'color'))!
    expect(lede.locked).toBeUndefined()
    expect(lede.reason).toBeUndefined()
  })

  // AC-2 — a lock is a PAIR: the flag and the sentence. Structural rather than
  // per-case, because the failure this prevents is the one that arrives with the
  // next lock somebody adds: a greyed-out control with no cause reads as a bug,
  // and the operator's only next move is the one the sentence has to name.
  it('test_UAT_FC_REQ-139_every_locked_control_carries_a_reason', async () => {
    const locked: Field[] = []
    for (const addr of EVERY_SEGMENT) {
      for (const field of await fieldsOf(addr)) {
        if (field.locked) locked.push(field)
      }
    }
    // The fixture holds locks at all — an empty sweep would pass vacuously.
    expect(locked.map((f) => f.name).sort()).toEqual(['color', 'italic', 'italic'])
    for (const field of locked) {
      expect(field.reason, field.name).toBeTruthy()
    }

    // REQ-135's italic lock now says WHY, and says it about the font rather than
    // about the build — the fix is a face on this site, and the AI is the
    // surface that adds one. It shipped silent, which is what this closes.
    const italic = (await fieldNamed(A_WORDMARK, 'italic'))!
    expect(italic.reason).toMatch(/italic/i)

    // And the run in a family that declares nothing keeps a working control: the
    // reader's own font has real italics, so locking it would disable something
    // that works.
    expect((await fieldNamed(A_SYSTEM, 'italic'))!.locked).toBeUndefined()
  })

  // AC-3 — THE CONTRAST. The test is "is the write observable and complete?",
  // not "is another axis present". A scrim tints the photograph it sits over
  // rather than hiding it, and the fill paints under both — so all three
  // controls stay open on a band carrying all three.
  it('test_UAT_FC_REQ-139_a_scrim_over_a_photograph_is_not_occlusion', async () => {
    const fields = await fieldsOf(A_BACKDROP)
    for (const name of ['backgroundImageUrl', 'surfaceFill']) {
      const field = fields.find((f) => f.name === name)!
      expect(field.locked, name).toBeUndefined()
    }

    // And the write actually lands — the row is not merely unmarked.
    expect((await set(A_BACKDROP, { surfaceFill: { ref: 'brand' } })).ok).toBe(true)
    expect(axesOf(A_BACKDROP).surfaceFill).toEqual({ ref: 'brand' })
    expect(axesOf(A_BACKDROP).overlay).toEqual({ color: '#000000', opacity: 0.35 })
  })

  // AC-4 — the lock is ENFORCED, not decorative, and the refusal is the same
  // sentence the control shows. A client that ignored the descriptor is the only
  // way a value gets here, and it must not be able to write a colour the page
  // would never paint.
  it('test_UAT_FC_REQ-139_a_change_to_a_locked_control_is_refused_with_its_reason', async () => {
    const before = draftBytes()
    const colour = (await fieldNamed(A_WORDMARK, 'color'))!

    const refused = await set(A_WORDMARK, { color: { ref: 'brand' } })
    expect(refused.ok).toBe(false)
    expect(refused.error!.path).toBe(`${A_WORDMARK}/color`)
    // ONE sentence with one definition site: what the greyed-out row says and
    // what a refused write returns cannot be two different stories.
    expect(refused.error!.message).toBe(colour.reason)

    const italic = await set(A_WORDMARK, { italic: true })
    expect(italic.ok).toBe(false)
    expect(italic.error!.message).toBe((await fieldNamed(A_WORDMARK, 'italic'))!.reason)

    // NOTHING LANDED — the file is byte-identical.
    expect(draftBytes()).toBe(before)
  })

  // AC-5 — THE SUBTLE ONE. A lock refuses a CHANGE, never the status quo. The
  // modal posts every staged field, so the locked colour comes back on a Save
  // that only rewrote the words; refusing it would make an unavailable control
  // freeze the entire segment, which on this fixture means a headline nobody can
  // retype.
  it('test_UAT_FC_REQ-139_a_locked_control_does_not_freeze_the_rest_of_the_segment', async () => {
    const saved = await set(A_WORDMARK, {
      text: 'Gigabyte Alchemy Labs',
      // Exactly what the derivation just reported — the modal's whole buffer,
      // not a change.
      color: { ref: 'neutral' },
      italic: false,
    })
    expect(saved.ok).toBe(true)
    expect(saved.data!.changed).toEqual(['text'])

    expect(draftNode(A_WORDMARK).text).toBe('Gigabyte Alchemy Labs')
    // The locked axis is untouched, and so is the gradient that locked it.
    expect(axesOf(A_WORDMARK).color).toEqual({ ref: 'neutral' })
    expect(axesOf(A_WORDMARK).gradientFill).toBeTruthy()
  })

  // AC-6 — the lock reaches the CLI listing, which is what the AI and a human at
  // the terminal both read. A locked field that looks like every other one is a
  // field they will try to set and be refused for, with no way to have known.
  it('test_UAT_FC_REQ-139_the_cli_listing_marks_a_locked_field', async () => {
    const prevCwd = process.cwd()
    const out: string[] = []
    const prevLog = console.log
    process.chdir(cwd)
    console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
    try {
      await run(['copy', 'get', 'acme', 'home', A_WORDMARK])
    } finally {
      console.log = prevLog
      process.chdir(prevCwd)
    }
    const listing = out.join('\n')
    const colourLine = listing.split('\n').find((l) => l.startsWith('color\t'))!
    expect(colourLine).toContain('(locked:')
    expect(colourLine).toMatch(/gradient/i)
    // An unlocked field is listed exactly as it was — the marker is not noise on
    // every row.
    expect(listing.split('\n').find((l) => l.startsWith('text\t'))).not.toContain('locked')
  })

  // AC-7 — in the real dialog. Both control families draw a lock the same way:
  // the colour row is drawn by the builder itself (a palette reference is a
  // typed object the component has no seam for), the typography rows by
  // `mountFields` — and an operator must not be able to tell which is which.
  describe.skipIf(!WEBUI_INSTALLED)(`the dialog (${WEBUI_SKIP_REASON})`, () => {
    let html: string
    let pageId: string
    let builder: BuilderHandle
    let mountEditor: (doc: Document, options: Record<string, unknown>) => { destroy(): void }
    let editor: { destroy(): void } | undefined
    let restoreFetch: () => void
    let picked: unknown[]

    beforeAll(async () => {
      ;({ mountEditor } = await import('../apps/control-app/src/builder/editor.js'))
    }, 240000)

    afterAll(async () => {
      await builder?.close()
    })

    beforeEach(async () => {
      const { outDir } = await cmdRender('acme', { cwd, edit: true })
      html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
      pageId = new RegExp(`${L1_EDIT_PAGE_ATTR}="([^"]+)"`).exec(html)![1]
      builder = await startBuilder({ cwd })
      const real = globalThis.fetch
      const origin = builder.url
      globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
        real(typeof input === 'string' ? new URL(input, origin) : input, init)) as typeof fetch
      restoreFetch = () => {
        globalThis.fetch = real
      }
      picked = []
      document.body.replaceChildren()
    }, 240000)

    afterEach(async () => {
      editor?.destroy()
      editor = undefined
      for (const m of document.querySelectorAll('.builder-modal')) m.remove()
      restoreFetch?.()
      await builder?.close()
    })

    const modals = () => [...document.querySelectorAll('.builder-modal')]

    async function settle(want: number): Promise<void> {
      for (let i = 0; i < 400 && modals().length !== want; i += 1) {
        await new Promise((r) => setTimeout(r, 5))
      }
    }

    /** Open a segment with a stub picker standing in for REQ-133's popup. */
    async function openAt(address: string): Promise<Element> {
      document.documentElement.innerHTML = /<html[^>]*>([\s\S]*)<\/html>/.exec(html)![1]
      document.body.setAttribute(L1_EDIT_MARKER_ATTR, '')
      document.body.setAttribute(L1_EDIT_PAGE_ATTR, pageId)
      editor = mountEditor(document, {
        slug: 'acme',
        bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
        colors: {
          open: (value: unknown) => {
            picked.push(value)
            return Promise.resolve({ ref: 'brand' })
          },
        },
      })
      const el = document.querySelector(`[${L1_EDIT_PATH_ATTR}="${address}"]`)
      if (!el) throw new Error(`nothing rendered at ${address}`)
      el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      await settle(1)
      return modals()[0]
    }

    const reasonAfter = (row: Element): string =>
      row.nextElementSibling?.classList.contains('builder-lock')
        ? (row.nextElementSibling.textContent ?? '')
        : ''

    it('test_UAT_FC_REQ-139_a_locked_control_is_drawn_unavailable_and_shows_why', async () => {
      const modal = await openAt(A_WORDMARK)
      const sheet = modal.querySelector('.builder-modal__props')!

      // The colour row — drawn by the dialog itself, marked with the SAME class
      // `mountFields` uses, so one stylesheet rule dresses both families.
      const colour = sheet.querySelector('.builder-color')!
      expect(colour.classList.contains('is-locked')).toBe(true)
      expect(reasonAfter(colour)).toMatch(/gradient/i)

      // DISABLED, not merely dimmed: clicking must not reach the picker, which
      // could otherwise write a colour the page would never paint.
      const swatch = colour.querySelector('.builder-color__swatch') as HTMLButtonElement
      expect(swatch.disabled).toBe(true)
      swatch.click()
      await new Promise((r) => setTimeout(r, 0))
      expect(picked).toEqual([])

      // The typography row, drawn by the component, gets the same treatment —
      // the reason is rendered by the dialog because the component has no
      // vocabulary for one.
      const italic = sheet.querySelector('[data-field="italic"]')!
      expect(italic.classList.contains('is-locked')).toBe(true)
      expect(reasonAfter(italic)).toMatch(/italic/i)
    })

    it('test_UAT_FC_REQ-139_an_ordinary_run_keeps_a_working_colour_control', async () => {
      const modal = await openAt(A_LEDE)
      const colour = modal.querySelector('.builder-color')!

      expect(colour.classList.contains('is-locked')).toBe(false)
      // NO note where there is nothing to explain — a reason on every row would
      // make the ones that matter invisible.
      expect(reasonAfter(colour)).toBe('')

      const swatch = colour.querySelector('.builder-color__swatch') as HTMLButtonElement
      expect(swatch.disabled).toBe(false)
      swatch.click()
      await new Promise((r) => setTimeout(r, 0))
      expect(picked).toEqual([null])
    })
  })
})
