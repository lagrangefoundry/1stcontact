// @vitest-environment jsdom
/**
 * story-3bf94bd4 — **a control that cannot tell the truth is shown unavailable,
 * and says why** (AC-1282), **and one that can carries nothing at all** (AC-1283).
 *
 * These are the two halves of one rule and are asserted against one page, because
 * the interesting claim is the CONTRAST: the same colour axis, on two runs side by
 * side, locked on one and ordinary on the other, with neither leaking into the
 * other. A suite that only ever opened the locked run would pass with a dialog
 * that marked every row unavailable.
 *
 * WHY BOTH CONTROL FAMILIES ARE IN ONE ASSERTION. The parameter sheet is drawn by
 * two different things: `mountFields` renders the typed rows, and the dialog draws
 * the colour row itself because a palette reference is a typed object the shared
 * component has no seam for. `mountFields` marks its own locked rows but has no
 * vocabulary for a REASON, so the dialog hangs every reason itself, in one pass,
 * matching on the field name — which is why the colour row stamps the same
 * attribute and the same row class the component does. *Which control happened to
 * draw a row* is exactly the detail the operator must never be shown, so the
 * evidence takes one locked row from each family and asserts they are
 * indistinguishable.
 *
 * WHAT "UNAVAILABLE" HAS TO MEAN. Being visibly faded closes none of the three
 * routes into a control — pointer, keyboard, screen reader — and the picker behind
 * a merely dimmed row can still write a colour the page would never paint. So the
 * assertion is that activating the locked control reaches no picker and stages
 * nothing, natively rather than by styling.
 *
 * THE FIXTURE is the shape that provoked the rule: a wordmark whose glyphs are
 * painted by a gradient (so its colour axis, which the run really carries, paints
 * nothing) set in a family that declares no italic face (so italics would be
 * faked). Two locks, one per control family, on one region.
 *
 * REAL EVERYTHING, on the neighbouring copy-edit suites' pattern: the document is
 * what `1c render --edit` wrote, the bridge is the browser's, the dialog is the
 * real `defaultModal`, and the descriptors — including the exact sentence each
 * lock carries — come from the real `1c`, never from a string written here.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender, run } from '../tools/generate/src/cli'
import { mountL1EditBridge } from '../packages/framework/src/l1/edit-client'
import {
  formatL1Path,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_PAGE_ATTR,
  L1_EDIT_PATH_ATTR,
} from '../packages/site-schema/src/l1/edit'
import { shadeHex } from '../packages/site-schema/src/l1/shade'
import type { L1Node } from '@1stcontact/site-schema'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { openOrigin, type InstalledFetch, type OriginHandle } from './support/builder-origin'

const REPO = path.resolve(__dirname, '..')
const BUILDER_CSS = path.join(REPO, 'apps/control-app/src/builder/builder.css')

/** The family as a run asks for it — a stack — against the bare family a face declares. */
const STACK = 'Satoshi, Helvetica Neue, Arial, sans-serif'
const FAMILY = 'Satoshi'

const PALETTE = {
  neutral: { value: '#f6f7f4' },
  amber: { value: '#d4a017' },
  orange: { value: '#ff7a00' },
  brand: { value: '#2e86a3' },
}

/** The wordmark: glyphs painted by a gradient, with a palette colour underneath it. */
const A_WORDMARK = '0.0'
/** An ordinary run in the same family — the contrast that keeps the lock from being global. */
const A_LEDE = '0.1'

if (!WEBUI_INSTALLED) console.warn(`story-3bf94bd4 availability suite: ${WEBUI_SKIP_REASON}`)

function unverified(what: string): void {
  console.warn(`story-3bf94bd4: ${what} NOT VERIFIED here`)
}

const draftPath = (cwd: string, slug: string, ...rest: string[]): string =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)

/**
 * Two runs that differ only in whether their controls can tell the truth.
 *
 * The wordmark carries a flat `color` UNDER its gradient on purpose: that is the
 * measured shape of the real run, and a node with no colour axis could not tell
 * "the row is locked" from "there was nothing to show". The family declares two
 * upright weights and NO italic, which is what locks `italic` on both runs — the
 * component-drawn lock this criterion needs beside the dialog-drawn one.
 */
function seedSite(cwd: string, slug: string): void {
  const homePath = draftPath(cwd, slug, 'pages', 'home.json')
  const home = JSON.parse(fs.readFileSync(homePath, 'utf8')) as Record<string, unknown>
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
    ],
  } as L1Node
  home.l1 = {
    ...(home.l1 as Record<string, unknown>),
    root,
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
  const site = JSON.parse(fs.readFileSync(sitePath, 'utf8')) as Record<string, unknown>
  site.palette = PALETTE
  fs.writeFileSync(sitePath, JSON.stringify(site, null, 2))
}

interface Field {
  name: string
  label: string
  type: string
  locked?: boolean
  reason?: string
}

/** Drive the real `1c` entry point — argv in, envelope out. */
async function cli(cwd: string, ...argv: string[]): Promise<{ ok: boolean; data?: Record<string, unknown> }> {
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
  process.exitCode = 0
  return JSON.parse(out[out.length - 1]) as { ok: boolean; data?: Record<string, unknown> }
}

describe('story-3bf94bd4 unavailable controls, and the ordinary ones beside them', () => {
  let cwd: string
  let html: string
  let pageId: string
  let origin: OriginHandle
  let mountEditor: (doc: Document, options: Record<string, unknown>) => { destroy(): void }

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-3bf94bd4-lock-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
    const { outDir } = await cmdRender('acme', { cwd, edit: true })
    html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
    pageId = new RegExp(`${L1_EDIT_PAGE_ATTR}="([^"]+)"`).exec(html)![1]
    origin = await openOrigin(cwd)
    if (WEBUI_INSTALLED) {
      ;({ mountEditor } = await import('../apps/control-app/src/builder/editor.js'))
    }
  }, 240000)

  afterAll(async () => {
    await origin?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  const dialogs = () => [...document.querySelectorAll('.builder-modal')]
  const editDialogs = () => dialogs().filter((d) => d.getAttribute('aria-label') !== 'Choose a color')

  async function settle(want: number): Promise<void> {
    for (let i = 0; i < 600 && editDialogs().length !== want; i += 1) {
      await new Promise((r) => setTimeout(r, 5))
    }
  }

  let net: InstalledFetch
  let editor: { destroy(): void } | undefined
  /** Every value the dialog asked the palette with — empty means no picker was reached. */
  let asked: unknown[]

  beforeEach(() => {
    editor?.destroy()
    editor = undefined
    for (const d of dialogs()) d.remove()
    document.body.replaceChildren()
    seedSite(cwd, 'acme')
    net = origin.install()
    asked = []
  })

  const posts = () => net.calls.filter((c) => c.method === 'POST')

  async function openAt(address: string): Promise<Element> {
    editor?.destroy()
    editor = undefined
    for (const d of dialogs()) d.remove()
    document.documentElement.innerHTML = /<html[^>]*>([\s\S]*)<\/html>/.exec(html)![1]
    document.body.setAttribute(L1_EDIT_MARKER_ATTR, '')
    document.body.setAttribute(L1_EDIT_PAGE_ATTR, pageId)
    editor = mountEditor(document, {
      slug: 'acme',
      bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
      colors: {
        shadeHex,
        open: (value: unknown) => {
          asked.push(value)
          return Promise.resolve({ ref: 'brand' })
        },
      },
    })
    const el = document.querySelector(`[${L1_EDIT_PATH_ATTR}="${address}"]`)
    if (!el) throw new Error(`nothing rendered at ${address}`)
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    await settle(1)
    expect(editDialogs()).toHaveLength(1)
    return editDialogs()[0]
  }

  /** The descriptors the surface really declares — the authority on which rows lock. */
  const fieldsOf = async (address: string): Promise<Field[]> =>
    (await cli(cwd, 'copy', 'get', 'acme', pageId, address)).data!.fields as Field[]

  /** The explanation hung under a row, or `''` where there is none. */
  const noteAfter = (row: Element): string =>
    row.nextElementSibling?.classList.contains('builder-lock')
      ? (row.nextElementSibling.textContent ?? '')
      : ''

  const rowIn = (root: Element, name: string) => root.querySelector(`[data-field="${name}"]`)!

  it(
    'test_UAT_AC1282_a_locked_control_is_drawn_unavailable_and_its_reason_is_body_text_under_the_row',
    async () => {
      // A lock has to be VISIBLE as well as enforced. The first lock this surface
      // shipped was enforced on the write side and drawn by nothing at all, which
      // is the failure mode the presentation rule exists to end — so the rule is
      // asserted to exist, and the routes it cannot close are asserted below.
      const css = fs.readFileSync(BUILDER_CSS, 'utf8')
      expect(css, 'a locked row is dressed as unavailable').toMatch(/\.is-locked\s*\{/)
      expect(css, 'and the reason is styled as body text').toMatch(/\.builder-lock\s*\{/)

      if (!WEBUI_INSTALLED) {
        unverified(`AC-1282 the locked control (${WEBUI_SKIP_REASON})`)
        return
      }

      // The surface's own declaration — the sentences below are ITS words, read
      // from the real command, never a string written in this file.
      const declared = await fieldsOf(A_WORDMARK)
      const locked = declared.filter((f) => f.locked)
      expect(
        locked.map((f) => f.name).sort(),
        'the region carries a lock in each control family',
      ).toEqual(['color', 'italic'])
      for (const field of locked) expect(field.reason, `${field.name} carries a reason`).toBeTruthy()

      const modal = await openAt(A_WORDMARK)
      const sheet = modal.querySelector('.builder-modal__props')!

      // ── both rows present, both marked, each explained beneath itself ────────
      //
      // `color` is drawn by the dialog and `italic` by the shared component, and
      // the assertions do not distinguish them — that is the criterion.
      for (const field of locked) {
        const row = rowIn(sheet, field.name)
        expect(row, `${field.name} keeps its row rather than being withdrawn`).toBeTruthy()
        expect(row.classList.contains('is-locked'), `${field.name} is marked unavailable`).toBe(true)
        expect(row.textContent, `${field.name} keeps its label`).toContain(field.label)
        expect(noteAfter(row), `${field.name}'s reason is rendered directly beneath it`).toBe(
          field.reason,
        )
        // BODY TEXT, not a hover affordance: a tooltip hides the explanation from
        // exactly the reader who needs it, and does not exist on a touch device.
        expect(row.nextElementSibling!.tagName).toBe('P')
        expect(row.getAttribute('title')).toBeNull()
      }

      // ONCE each, and only where there is something to explain.
      expect(modal.querySelectorAll('.builder-lock')).toHaveLength(locked.length)

      // ── the locked colour cannot be operated by any route ────────────────────
      const colour = sheet.querySelector('.builder-color[data-field="color"]')!
      const swatch = colour.querySelector('.builder-color__swatch') as HTMLButtonElement
      // NATIVE, not styled: `disabled` is the one thing that closes the pointer,
      // the keyboard and the screen reader at once. A class closes none of them.
      expect(swatch.disabled).toBe(true)
      swatch.click()
      for (let i = 0; i < 100; i += 1) await new Promise((r) => setTimeout(r, 1))
      expect(asked, 'activating it reaches no picker').toEqual([])

      // ...and it still reports the colour the element actually paints, because a
      // missing row would read as "this build has no such control".
      expect(colour.querySelector('.builder-color__name')!.textContent).toBe('neutral')
      expect(
        (colour.querySelector('.builder-color__chip') as HTMLElement).style.getPropertyValue(
          '--builder-color-chip',
        ),
      ).toBe(PALETTE.neutral.value)

      // Nothing was staged through it, so an untouched dialog still writes nothing.
      modal
        .querySelector('.builder-modal__btn--primary')!
        .dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      await settle(0)
      expect(posts(), 'nothing could be staged through a locked control').toEqual([])
    },
    240000,
  )

  it(
    'test_UAT_AC1283_an_unlocked_control_carries_no_explanation_and_is_not_marked_unavailable',
    async () => {
      if (!WEBUI_INSTALLED) {
        unverified(`AC-1283 the ordinary control (${WEBUI_SKIP_REASON})`)
        return
      }

      // The same axis, on a run the surface declares nothing about.
      const declared = await fieldsOf(A_LEDE)
      const colourField = declared.find((f) => f.name === 'color')!
      expect(colourField.locked, 'the ordinary run’s colour is not declared unavailable').toBeFalsy()
      expect(colourField.reason).toBeUndefined()

      const modal = await openAt(A_LEDE)
      const sheet = modal.querySelector('.builder-modal__props')!
      const colour = sheet.querySelector('.builder-color[data-field="color"]')!

      expect(colour.classList.contains('is-locked'), 'it is not marked unavailable').toBe(false)
      // NO NOTE WHERE THERE IS NOTHING TO EXPLAIN. A reason on every row would
      // make the rows that matter invisible.
      expect(noteAfter(colour), 'it carries no explanation under it').toBe('')

      // It opens, and it reaches the palette — asked with nothing, because this
      // run holds a hex literal and a literal names no entry to pre-select.
      const swatch = colour.querySelector('.builder-color__swatch') as HTMLButtonElement
      expect(swatch.disabled).toBe(false)
      swatch.click()
      for (let i = 0; i < 200; i += 1) await new Promise((r) => setTimeout(r, 1))
      expect(asked, 'it reaches the palette exactly as it always does').toEqual([null])
      expect(colour.querySelector('.builder-color__name')!.textContent).toBe('brand')

      // ── and neither run's controls affect the other's ────────────────────────
      //
      // The lede sits beside a locked row of its own (`italic`, locked by the
      // family), which stays locked while the colour beside it is live — so
      // "unlocked" is per control rather than per dialog.
      const italic = rowIn(sheet, 'italic')
      expect(italic.classList.contains('is-locked')).toBe(true)
      expect(noteAfter(italic)).toBe(declared.find((f) => f.name === 'italic')!.reason)
      expect(
        modal.querySelectorAll('.builder-lock'),
        'only the locked row is explained',
      ).toHaveLength(1)

      // ...and the locked run beside it is unaffected by the ordinary one: the
      // wordmark's colour is still shut, opened after the lede's was driven.
      const other = await openAt(A_WORDMARK)
      const otherColour = other.querySelector('.builder-color[data-field="color"]')!
      expect(otherColour.classList.contains('is-locked')).toBe(true)
      expect(
        (otherColour.querySelector('.builder-color__swatch') as HTMLButtonElement).disabled,
      ).toBe(true)
    },
    240000,
  )
})
