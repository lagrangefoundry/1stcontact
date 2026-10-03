/**
 * BUG-180 — the reflow-window hold must never write `segments` onto
 * `responsiveLayout`, and a recovery that produces an invalid document is
 * declined, not fatal.
 *
 * The defect: `holdAcrossReflowWindows` found tracks by duck typing — anything
 * on a node with a `keyframes` array — and `responsiveLayout` has one. Its
 * schema is strict and has no `segments` key (a layout mode is discrete; it
 * already snaps), so on every page with a layout switch AND a reflow window the
 * hold wrote a key the validator rejects. hearingzone510 failed at the fold;
 * bluelotus and joyful failed inside `promoteToFlow`, which re-runs the hold.
 *
 * The operator's bar: the engine may produce a poor reproduction, but it must
 * always produce one. The fold's own output has nothing to fall back to, so the
 * hold fix is what keeps it valid; every pass AFTER the fold has the base to
 * fall back to, so an invalid result there costs the pass, never the page.
 */
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { holdAcrossReflowWindows } from '../tools/generate/src/l1/fold'
import { chooseRecovery, foldToL1, InvalidRecoveryError, measuredTextHeights } from '../tools/generate/src/l1'
import { cmdRepro } from '../tools/generate/src/cli/repro'
import { validateL1 } from '../packages/site-schema/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024]
/** 375 → 768 is the window a sibling's geometry snaps across. */
const SNAPPED = 1

/**
 * A row of two cards that stacks below 768 — a `responsiveLayout` with two
 * keyframes — beside a banner whose geometry snaps across 375→768. That pair is
 * exactly the precondition both failing sites shared.
 */
function pageWithLayoutSwitch(): L1Document {
  const card = (i: number): L1Node => ({
    kind: 'text',
    text: `Card ${i}`,
    axes: { fontSizePx: 16, lineHeightPx: 24, color: '#111111', fontFamily: 'Arial', fontWeight: 400 },
    geometry: {
      keyframes: LADDER.map((at) => ({ at, x: 0, y: 0, width: at < 768 ? at - 32 : at / 2 - 32, height: 24 })),
    },
  })
  const row: L1Node = {
    kind: 'container',
    id: 'row-0',
    layout: 'row',
    responsiveLayout: {
      keyframes: [
        { at: 375, value: 'stack' },
        { at: 768, value: 'row' },
      ],
    },
    geometry: { keyframes: LADDER.map((at) => ({ at, x: 16, y: 200, width: at - 32, height: 120 })) },
    children: [card(0), card(1)],
  }
  const banner: L1Node = {
    kind: 'text',
    text: 'Banner',
    axes: { fontSizePx: 24, lineHeightPx: 30, color: '#111111', fontFamily: 'Arial', fontWeight: 400 },
    geometry: {
      keyframes: LADDER.map((at) => ({ at, x: at < 768 ? 16 : 400, y: 40, width: 280, height: 30 })),
      segments: ['interpolate', 'snap', 'interpolate'],
    },
    responsive: { fontSizePx: { keyframes: LADDER.map((at) => ({ at, value: at / 32 })) } },
  }
  return {
    widths: [...LADDER],
    root: {
      kind: 'box',
      geometry: { keyframes: LADDER.map((at) => ({ at, x: 0, y: 0, width: at, height: 400 })) },
      children: [banner, row],
    },
  }
}

const find = (doc: L1Document, id: string): L1Node | undefined => {
  const walk = (n: L1Node): L1Node | undefined => {
    if (n.id === id) return n
    const kids = n.kind === 'container' ? n.children : n.kind === 'box' ? (n.children ?? []) : []
    for (const k of kids) {
      const hit = walk(k)
      if (hit) return hit
    }
    return undefined
  }
  return walk(doc.root)
}

function textEl(t: string, box: ValueElement['box']): ValueElement {
  return {
    text: t,
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 16,
    fontWeight: 400,
    lineHeightPx: 24,
    box,
  }
}

const capture = (): MultiStateCapture => ({
  url: 'http://bug180.test/',
  notes: [],
  projections: LADDER.map(
    (width): StateProjection => ({
      engine: 'chromium',
      viewport: { width, height: 900 },
      state: 'rest',
      manifest: {
        source: `bug180@${width}`,
        viewport: { width, height: 900 },
        sections: [],
        elements: [
          textEl('✓', { x: 20, y: 100, width: 14, height: 24 }),
          textEl('A line of copy beside its glyph', { x: 46, y: 100, width: width - 66, height: 24 }),
        ],
      },
    }),
  ),
})

describe('BUG-180 — the hold leaves responsiveLayout alone; an invalid recovery is declined', () => {
  it('test_UAT_FC_BUG-180_hold_writes_no_segments_onto_responsive_layout', () => {
    const doc = pageWithLayoutSwitch()
    expect(validateL1(doc).ok).toBe(true)

    holdAcrossReflowWindows([doc.root], doc.widths)

    const row = find(doc, 'row-0')!
    expect(row.kind).toBe('container')
    expect(Object.keys((row as { responsiveLayout: object }).responsiveLayout)).toEqual(['keyframes'])

    // The window is still held on every track that carries `segments`: the row's
    // own geometry, and the banner's type track beside its snapping geometry.
    expect(row.geometry?.segments?.[SNAPPED]).toBe('snap')
    const banner = doc.root.kind === 'box' ? doc.root.children![0] : undefined
    expect((banner as { responsive: { fontSizePx: { segments: string[] } } }).responsive.fontSizePx.segments[SNAPPED]).toBe(
      'snap',
    )

    const result = validateL1(doc)
    expect(result.ok, result.ok ? '' : JSON.stringify(result.errors)).toBe(true)
  })

  it('test_UAT_FC_BUG-180_invalid_recovery_is_declined_and_the_base_served', () => {
    const cap = capture()
    const base = foldToL1(cap)
    const detail = '/root/children/7/responsiveLayout: Unrecognized key: "segments"'

    const choice = chooseRecovery(base, cap, {
      measured: measuredTextHeights(cap),
      promote: () => {
        throw new InvalidRecoveryError(detail)
      },
    })

    expect(choice.served).toBe(false)
    expect(choice.doc).toBe(base)
    expect(choice.invalid).toBe(detail)
    expect(choice.promoted).toEqual([])
  })

  it('test_UAT_FC_BUG-180_any_other_recovery_error_still_ends_the_run', () => {
    const cap = capture()
    expect(() =>
      chooseRecovery(foldToL1(cap), cap, {
        promote: () => {
          throw new Error('a genuine bug')
        },
      }),
    ).toThrow('a genuine bug')
  })

  // Real bundles are gitignored, so this leg runs in the main checkout only.
  const root = path.join(process.cwd(), 'storage', 'references')
  const hosts = ['www.hearingzone510.com', 'www.bluelotusintegralhealing.com', 'joyfulculinarycreations.com'].filter(
    (h) => existsSync(path.join(root, h, 'index', 'l1.json')),
  )
  it.skipIf(hosts.length === 0)(
    'test_UAT_FC_BUG-180_real_bundles_with_a_layout_switch_reproduce',
    async () => {
      for (const host of hosts) {
        const workspace = mkdtempSync(path.join(tmpdir(), 'bug180-'))
        try {
          const result = await cmdRepro('bug180', { cwd: workspace, ref: path.join(root, host, 'index') })
          expect(existsSync(result.draftDir), `${host} wrote a page`).toBe(true)
          expect(result.served?.recovery.invalid, `${host} recovery valid`).toBeUndefined()
        } finally {
          rmSync(workspace, { recursive: true, force: true })
        }
      }
    },
    600_000,
  )
})
