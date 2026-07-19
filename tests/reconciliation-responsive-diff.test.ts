import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  run,
  writeMultiState,
  VIEWPORTS,
  type MultiStateCapture,
  type StateProjection,
  type ValueElement,
  type ValueManifest,
  type ViewportName,
} from '../tools/generate/src/cli'

/**
 * Reconciliation UATs for story-2c7069fe — `1c responsive-diff`, the cross-size
 * N-way per-node table + change classifier (REQ-61).
 *
 * These exercise the command at its CLI boundary (`run(argv)`): a persisted
 * viewport ladder (`multistate.json`) is authored in-memory into a bundle, the
 * command is invoked exactly as a user would, and the assertions read the JSON /
 * human output and exit behaviour it emits. Pure/offline — no browser is launched.
 */

// ── shared temp-dir plumbing ─────────────────────────────────────────────────

const tmpDirs: string[] = []
function tmp(prefix = 'ac-rd-'): string {
  const d = mkdtempSync(path.join(tmpdir(), prefix))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

/** A body text run with sane defaults; `over` supplies the size-specific values. */
function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return {
    text,
    role: 'body',
    color: '#111111',
    fontFamily: 'Inter',
    fontSizePx: 16,
    fontWeight: 400,
    ...over,
  }
}

function manifest(elements: ValueElement[], width: number): ValueManifest {
  return { source: `ref@${width}`, elements, sections: [], viewport: { width, height: 800 }, engine: 'chromium', state: 'rest' }
}

/** Persist a viewport ladder bundle from per-size element lists and return its dir. */
function ladderBundle(rungs: Array<{ name: ViewportName; elements: ValueElement[] }>): string {
  const dir = tmp()
  const projections: StateProjection[] = rungs.map(({ name, elements }) => ({
    engine: 'chromium',
    viewport: VIEWPORTS[name],
    state: 'rest',
    manifest: manifest(elements, VIEWPORTS[name].width),
  }))
  const matrix: MultiStateCapture = { url: 'ref', projections, notes: [] }
  writeMultiState(dir, matrix)
  return dir
}

/**
 * Invoke the CLI, capturing stdout, stderr and the resulting process exit code.
 * Resets `process.exitCode` so a non-zero code from one command never leaks into
 * the vitest process (or an adjacent test).
 */
async function runCli(argv: string[]): Promise<{ code: number; out: string; err: string }> {
  const out: string[] = []
  const err: string[] = []
  const logSpy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void out.push(a.join(' ')))
  const errSpy = vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => void err.push(a.join(' ')))
  const prev = process.exitCode
  process.exitCode = 0
  try {
    await run(argv)
    const code = typeof process.exitCode === 'number' ? process.exitCode : 0
    return { code, out: out.join('\n'), err: err.join('\n') }
  } finally {
    logSpy.mockRestore()
    errSpy.mockRestore()
    process.exitCode = prev
  }
}

// ── AC-648 — N-way per-node table with the default size columns ───────────────

describe('story-2c7069fe — responsive-diff produces the N-way table (default sizes)', () => {
  it('test_UAT_AC648_produces_nway_table_with_default_size_columns', async () => {
    // A ladder carrying all three default widths; a Hero node present at each.
    const dir = ladderBundle([
      { name: 'mobile', elements: [el('Hero', { role: 'heading', fontSizePx: 28 })] },
      { name: 'tablet', elements: [el('Hero', { role: 'heading', fontSizePx: 40 })] },
      { name: 'desktop', elements: [el('Hero', { role: 'heading', fontSizePx: 48 })] },
    ])

    const { code, out } = await runCli(['responsive-diff', '--ref', dir, '--json'])
    expect(code).toBe(0)
    const table = JSON.parse(out)

    // Three size columns, default order mobile → tablet → desktop, each carrying its width.
    expect(table.sizes.map((s: { name: string }) => s.name)).toEqual(['mobile', 'tablet', 'desktop'])
    expect(table.sizes.map((s: { width: number }) => s.width)).toEqual([
      VIEWPORTS.mobile.width,
      VIEWPORTS.tablet.width,
      VIEWPORTS.desktop.width,
    ])

    // The known node is one row, identified by its verbatim text, with a value per column.
    const hero = table.rows.find((r: { label: string }) => r.label === 'Hero')
    expect(hero).toBeDefined()
    expect(hero.cells).toHaveLength(3)
    expect(hero.cells.map((c: { element?: { fontSizePx: number } }) => c.element?.fontSizePx)).toEqual([28, 40, 48])
  })
})

// ── AC-649 — --sizes selects and orders the columns ───────────────────────────

describe('story-2c7069fe — --sizes selects and orders the table columns', () => {
  it('test_UAT_AC649_sizes_flag_selects_and_orders_columns_and_rejects_unknown', async () => {
    const dir = ladderBundle([
      { name: 'mobile', elements: [el('Hero', { fontSizePx: 28 })] },
      { name: 'tablet', elements: [el('Hero', { fontSizePx: 40 })] },
      { name: 'desktop', elements: [el('Hero', { fontSizePx: 48 })] },
    ])

    // `--sizes mobile,desktop` → exactly two columns, in that order, tablet omitted.
    const { code, out } = await runCli(['responsive-diff', '--ref', dir, '--sizes', 'mobile,desktop', '--json'])
    expect(code).toBe(0)
    const table = JSON.parse(out)
    expect(table.sizes.map((s: { name: string }) => s.name)).toEqual(['mobile', 'desktop'])
    expect(table.sizes.some((s: { name: string }) => s.name === 'tablet')).toBe(false)

    // An unrecognised size token is rejected naming the accepted vocabulary, no table emitted.
    const printed: string[] = []
    const logSpy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void printed.push(a.join(' ')))
    try {
      await expect(run(['responsive-diff', '--ref', dir, '--sizes', 'phone', '--json'])).rejects.toThrow(/phone/)
      await expect(run(['responsive-diff', '--ref', dir, '--sizes', 'phone'])).rejects.toThrow(
        /mobile\|tablet\|desktop/,
      )
    } finally {
      logSpy.mockRestore()
    }
    expect(printed.join('\n')).not.toContain('"sizes"')
  })
})

// ── AC-650 — partitions changed vs steady; flags presence flips ───────────────

describe('story-2c7069fe — responsive-diff partitions changed vs steady nodes', () => {
  it('test_UAT_AC650_partitions_changed_steady_and_flags_presence_flips', async () => {
    // (a) Stepper: font size differs across sizes → changed, not a presence flip.
    // (b) Steady: identical across all sizes → not changed.
    // (c) Promo: absent from mobile → presence flip.
    // (d) Jitter: box differs sub-pixel only → rounded away → steady, not changed.
    const stepper = (fs: number) => el('Stepper', { role: 'heading', fontSizePx: fs })
    const steady = () => el('Steady')
    const promo = () => el('Limited offer', { role: 'promo' })
    const jitter = (x: number) => el('Jitter', { box: { x, y: 0, width: 100, height: 20 } })

    const dir = ladderBundle([
      { name: 'mobile', elements: [stepper(32), steady(), jitter(10.1)] },
      { name: 'tablet', elements: [stepper(40), steady(), promo(), jitter(10.3)] },
      { name: 'desktop', elements: [stepper(48), steady(), promo(), jitter(10.4)] },
    ])

    const { code, out } = await runCli(['responsive-diff', '--ref', dir, '--json'])
    expect(code).toBe(0)
    const rows = JSON.parse(out).rows as Array<{ label: string; changed: boolean; presenceFlips: boolean }>

    const rowFor = (label: string) => rows.find((r) => r.label === label)!
    // (a) the stepper is a changed node, not flagged as a presence flip.
    expect(rowFor('Stepper').changed).toBe(true)
    expect(rowFor('Stepper').presenceFlips).toBe(false)
    // (b) the steady node is not changed.
    expect(rowFor('Steady').changed).toBe(false)
    // (c) the promo, present only on tablet+desktop, is a presence flip.
    expect(rowFor('Limited offer').presenceFlips).toBe(true)
    expect(rowFor('Limited offer').changed).toBe(true)
    // (d) sub-pixel box jitter does not mark the node changed.
    expect(rowFor('Jitter').changed).toBe(false)
  })
})

// ── AC-651 — repeated identical text aligns occurrence-by-occurrence ──────────

describe('story-2c7069fe — repeated identical text aligns occurrence-by-occurrence', () => {
  it('test_UAT_AC651_aligns_repeated_identical_text_in_document_order', async () => {
    // "Read more" appears twice per size. Occurrence 0 is a heading (fontWeight 700)
    // at every size; occurrence 1 is body (fontWeight 400) at every size. If the
    // command scrambled or collapsed occurrences, the per-row weights would mix.
    const first = () => el('Read more', { fontWeight: 700 })
    const second = () => el('Read more', { fontWeight: 400 })
    const dir = ladderBundle([
      { name: 'mobile', elements: [first(), second()] },
      { name: 'tablet', elements: [first(), second()] },
      { name: 'desktop', elements: [first(), second()] },
    ])

    const { code, out } = await runCli(['responsive-diff', '--ref', dir, '--json'])
    expect(code).toBe(0)
    const rows = JSON.parse(out).rows as Array<{
      label: string
      cells: Array<{ element?: { fontWeight: number } }>
    }>

    // Two distinct rows for the repeated text — not one collapsed row.
    const readMore = rows.filter((r) => r.label === 'Read more')
    expect(readMore).toHaveLength(2)
    // Each occurrence's cells hold its own document-order value at every size,
    // proving occurrence 0 paired to occurrence 0 (not cross-paired).
    expect(readMore[0].cells.map((c) => c.element?.fontWeight)).toEqual([700, 700, 700])
    expect(readMore[1].cells.map((c) => c.element?.fontWeight)).toEqual([400, 400, 400])
  })
})

// ── AC-652 — --classify labels changed nodes; structural moves grouped first ──

describe('story-2c7069fe — --classify labels moves and groups structural first', () => {
  it('test_UAT_AC652_classify_labels_moves_and_groups_structural_first', async () => {
    // Document order deliberately leads with the value-step so that grouping is
    // observable: Title (font step → value-step), Nav (row↔stack → layout-swap),
    // Promo (departs on mobile → presence-flip).
    const title = (fs: number) => el('Title', { role: 'heading', fontSizePx: fs })
    const nav = (arr: 'row' | 'stack') => el('Nav', { arrangement: arr })
    const promo = () => el('Promo', { role: 'promo' })
    const dir = ladderBundle([
      { name: 'mobile', elements: [title(32), nav('stack')] },
      { name: 'tablet', elements: [title(40), nav('row'), promo()] },
      { name: 'desktop', elements: [title(48), nav('row'), promo()] },
    ])

    // JSON: each changed node carries exactly one move label; only changed nodes appear.
    const j = await runCli(['responsive-diff', '--ref', dir, '--classify', '--json'])
    expect(j.code).toBe(0)
    const classifications = JSON.parse(j.out).classifications as Array<{
      kind: string
      row: { label: string }
    }>
    const kindOf = (label: string) => classifications.find((c) => c.row.label === label)!.kind
    expect(kindOf('Title')).toBe('value-step')
    expect(kindOf('Nav')).toBe('layout-swap')
    expect(kindOf('Promo')).toBe('presence-flip')
    // Only the three changed nodes are reported (no steady rows).
    expect(classifications).toHaveLength(3)

    // Human output groups the structural moves (presence-flip, layout-swap) ahead
    // of the value-step group, regardless of document order.
    const h = await runCli(['responsive-diff', '--ref', dir, '--classify'])
    expect(h.code).toBe(0)
    const iPresence = h.out.indexOf('presence-flip')
    const iLayout = h.out.indexOf('layout-swap')
    const iValue = h.out.indexOf('value-step')
    expect(iPresence).toBeGreaterThanOrEqual(0)
    expect(iLayout).toBeGreaterThanOrEqual(0)
    expect(iValue).toBeGreaterThanOrEqual(0)
    expect(iPresence).toBeLessThan(iValue)
    expect(iLayout).toBeLessThan(iValue)

    // A site with no cross-size change reports a single "holds steady" confirmation,
    // with no per-node rows.
    const steadyDir = ladderBundle([
      { name: 'mobile', elements: [el('© 2026')] },
      { name: 'tablet', elements: [el('© 2026')] },
      { name: 'desktop', elements: [el('© 2026')] },
    ])
    const s = await runCli(['responsive-diff', '--ref', steadyDir, '--classify'])
    expect(s.code).toBe(0)
    expect(s.out).toMatch(/holds steady/)
    expect(s.out).not.toMatch(/presence-flip|layout-swap|value-step/)
  })
})

// ── AC-653 — terminal-fails on a stale reference with re-capture guidance ─────

describe('story-2c7069fe — responsive-diff terminal-fails on a stale reference', () => {
  it('test_UAT_AC653_terminal_fails_on_stale_reference_with_recapture_guidance', async () => {
    // A bundle with no persisted ladder (no multistate.json).
    const empty = tmp('ac-rd-stale-')

    const printed: string[] = []
    const logSpy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void printed.push(a.join(' ')))
    try {
      // Fails loudly, naming the missing reference and advising a re-capture…
      await expect(run(['responsive-diff', '--ref', empty])).rejects.toThrow(/multistate\.json[\s\S]*re-capture/i)
      await expect(run(['responsive-diff', '--ref', empty])).rejects.toThrow(new RegExp(empty))
    } finally {
      logSpy.mockRestore()
    }
    // …and produces no table — it does not silently fall back to a single width.
    expect(printed).toHaveLength(0)
  })
})

// ── AC-654 — terminal-fails on an un-captured requested width ─────────────────

describe('story-2c7069fe — responsive-diff fails on an un-captured requested width', () => {
  it('test_UAT_AC654_terminal_fails_on_uncaptured_width_listing_available_widths', async () => {
    // The ladder only ever reached mobile; the default tablet/desktop columns
    // cannot be built. The command must not drop a column — it fails naming the
    // missing width and enumerating the widths the ladder does carry.
    const dir = ladderBundle([{ name: 'mobile', elements: [el('Solo')] }])

    const printed: string[] = []
    const logSpy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void printed.push(a.join(' ')))
    try {
      await expect(run(['responsive-diff', '--ref', dir])).rejects.toThrow(
        new RegExp(`no projection at width ${VIEWPORTS.tablet.width}px[\\s\\S]*${VIEWPORTS.mobile.width}`),
      )
      await expect(run(['responsive-diff', '--ref', dir])).rejects.toThrow(/re-capture/i)
    } finally {
      logSpy.mockRestore()
    }
    // No partial table was emitted for the run.
    expect(printed).toHaveLength(0)
  })
})

// ── AC-655 — --json is machine-readable; --ref is required ────────────────────

describe('story-2c7069fe — --json emits machine-readable output; --ref is required', () => {
  it('test_UAT_AC655_json_is_parseable_and_ref_is_required', async () => {
    const dir = ladderBundle([
      { name: 'mobile', elements: [el('Hero', { fontSizePx: 28 })] },
      { name: 'tablet', elements: [el('Hero', { fontSizePx: 40 })] },
      { name: 'desktop', elements: [el('Hero', { fontSizePx: 48 })] },
    ])

    // --json → stdout parses as JSON exposing the size columns and the node rows.
    const table = await runCli(['responsive-diff', '--ref', dir, '--json'])
    expect(table.code).toBe(0)
    const parsed = JSON.parse(table.out)
    expect(Array.isArray(parsed.sizes)).toBe(true)
    expect(parsed.sizes.map((s: { name: string }) => s.name)).toEqual(['mobile', 'tablet', 'desktop'])
    expect(Array.isArray(parsed.rows)).toBe(true)
    expect(parsed.rows.some((r: { label: string }) => r.label === 'Hero')).toBe(true)

    // --classify --json → stdout parses as JSON exposing the labelled changed nodes.
    const classified = await runCli(['responsive-diff', '--ref', dir, '--classify', '--json'])
    expect(classified.code).toBe(0)
    const parsedClass = JSON.parse(classified.out)
    expect(Array.isArray(parsedClass.classifications)).toBe(true)
    const hero = parsedClass.classifications.find((c: { row: { label: string } }) => c.row.label === 'Hero')
    expect(hero).toBeDefined()
    expect(typeof hero.kind).toBe('string')

    // No --ref → an error naming the required reference, a non-zero exit, no output.
    const missing = await runCli(['responsive-diff', '--json'])
    expect(missing.code).not.toBe(0)
    expect(missing.err).toMatch(/--ref/)
    expect(missing.out).toBe('')
  })
})
