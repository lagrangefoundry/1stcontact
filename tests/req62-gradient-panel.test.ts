import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateModuleContent } from '../packages/framework/src/modules/validate'
import { resolveSurfaceGradient } from '../packages/framework/src/modules/text-style'
import type { ModuleMeta } from '../packages/framework/src/modules/types'
import {
  chromiumAvailable,
  cmdCapturePage,
  diffManifests,
  flattenCapture,
  type Capture,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-62 — a gradient PANEL background is a captured, authorable, and
 * diffable value (not just a text-fill gradient). The text-block panel that first
 * carried it went away with the semantic layout modules (REQ-84), but the three
 * surviving seams the ticket proved are exercised here directly: the shared
 * `resolveSurfaceGradient` resolver (AC-1309 — literal stops only since REQ-114
 * retired the palette-role alias, which is why the old AC-637 is deprecated), the `gradient`
 * content-field validation (`validateModuleContent`, on a synthetic meta), the
 * values-diff `surfaceGradient` axis (present-vs-missing false-match), and the
 * capture recording BOTH the gradient AND the composited solid it sits on.
 */

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

const tmpDirs: string[] = []
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

/** A synthetic meta carrying a `gradient` content field — the field-type under test. */
const gradientMeta = {
  id: 'panel-probe',
  version: 1,
  variants: ['default'],
  dials: {},
  contentSchema: {
    body: { type: 'markdown', required: false },
    panelGradient: { type: 'gradient', required: false },
  },
} as unknown as ModuleMeta

/** A ValueElement with sensible defaults, overridable per field. */
function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}

function mani(source: string, elements: ValueElement[]): ValueManifest {
  return { source, elements }
}

function hasDelta(deltas: { text: string; property: string }[], textSub: string, property: string): boolean {
  return deltas.some((d) => d.text.includes(textSub) && d.property === property)
}

// ── the shared resolver authors a gradient surface fill ──────────────────────

describe('REQ-62 gradient panel — resolver (AC-1309)', () => {
  it('test_UAT_AC1309_surface_gradient_resolves_direction_and_stops', () => {
    // AC-1309: a gradient value (direction + two-or-more stops) resolves, via the
    // shared surface-gradient resolver, to a panel/card
    // `background-image: linear-gradient(...)` surface fill carrying the resolved
    // direction and the stop colours in painted order.
    //
    // REQ-114 — the literal-or-alias stop is now literal-only. The palette-role
    // half of "absolute or overlay" resolved to `var(--color-…)`, a custom property
    // the retired colour token group emitted; the overlay it named is the L1
    // palette, which resolves to a literal before any resolver sees it. The
    // absolute half — reproducing a site with its exact captured values — is
    // exactly what survives, and it was always the load-bearing half.
    const css = resolveSurfaceGradient({ angleDeg: 135, stops: ['#f1f5f9', '#0f9d6e'] })
    expect(css).toBe('background-image: linear-gradient(135deg, #f1f5f9 0%, #0f9d6e 100%)')

    // It is a SURFACE fill, not the text-fill resolver's job: no clip to the
    // glyphs and no forced transparent text ride along with it.
    expect(css).not.toContain('background-clip')
    expect(css).not.toContain('color:')

    // A degrees literal emits `<n>deg`; a direction alias emits its keyword form.
    expect(resolveSurfaceGradient({ angleDeg: 'to-br', stops: ['#f1f5f9', '#0f9d6e'] })).toBe(
      'background-image: linear-gradient(to bottom right, #f1f5f9 0%, #0f9d6e 100%)',
    )
  })

  it('test_UAT_AC1309_stop_positions_are_verbatim_or_evenly_distributed', () => {
    // An authored position is pasted verbatim — the captured offset is the value
    // being reproduced, so the resolver must not redistribute it.
    expect(
      resolveSurfaceGradient({
        angleDeg: 90,
        stops: [
          { color: '#f5e6a3', position: 0 },
          { color: '#f5e6a3', position: 60 },
          { color: '#ff6b35', position: 100 },
        ],
      }),
    ).toBe('background-image: linear-gradient(90deg, #f5e6a3 0%, #f5e6a3 60%, #ff6b35 100%)')

    // Unpositioned stops are distributed evenly across 0–100% so the sweep spans
    // the surface rather than bunching at one end.
    expect(resolveSurfaceGradient({ angleDeg: 90, stops: ['#000000', '#888888', '#ffffff'] })).toBe(
      'background-image: linear-gradient(90deg, #000000 0%, #888888 50%, #ffffff 100%)',
    )
  })

  it('test_UAT_AC1309_no_fill_when_underspecified_or_stop_is_not_a_literal', () => {
    // AC-1309: when fewer than two stops are supplied the value is under-specified
    // and resolves to no fill (empty declaration), so the caller keeps its solid
    // treatment rather than painting a degenerate gradient.
    expect(resolveSurfaceGradient({ angleDeg: 135, stops: ['#f1f5f9'] })).toBe('')
    expect(resolveSurfaceGradient({ angleDeg: 135, stops: [] })).toBe('')

    // A stop colour that is not a `#hex` literal — including a palette-role name,
    // which REQ-114 retired — drops the WHOLE gradient rather than emitting a
    // partial sweep in a colour the author never chose.
    expect(resolveSurfaceGradient({ angleDeg: 135, stops: ['accent', '#0f9d6e'] })).toBe('')
    expect(
      resolveSurfaceGradient({ angleDeg: 135, stops: ['#f1f5f9', { color: 'accent', position: 100 }] }),
    ).toBe('')
  })
})

// ── validation accepts a well-formed gradient, rejects a malformed one ────────

describe('REQ-62 gradient panel — validation', () => {
  it('test_UAT_FC_REQ-62_validation_accepts_gradient_panel', () => {
    const errors = validateModuleContent(gradientMeta, {
      body: 'x',
      panelGradient: { angleDeg: 'to-br', stops: ['#f1f5f9', '#0f9d6e'] },
    })
    expect(errors).toEqual([])
  })

  it('test_UAT_FC_REQ-62_validation_rejects_malformed_gradient', () => {
    const errors = validateModuleContent(gradientMeta, {
      body: 'x',
      panelGradient: { angleDeg: 'sideways', stops: ['not-a-colour'] },
    })
    expect(errors.some((e) => e.field.startsWith('panelGradient'))).toBe(true)
  })
})

// ── the diff flags a present-vs-missing surface gradient (the false match) ────

describe('REQ-62 gradient panel — values-diff', () => {
  const grad = { angleDeg: 135, stops: [
    { color: '#f1f5f9', position: 0 },
    { color: '#e2e8f0', position: 100 },
  ] }

  it('test_UAT_FC_REQ-62_surface_gradient_missing_flags', () => {
    // Reference panel has a gradient; the reproduction lost it (composites to the
    // band). Before REQ-62 there was no axis for this — a false match.
    const ref = mani('ref', [el('What We are exploring', { surfaceGradient: grad })])
    const act = mani('a', [el('What We are exploring', { surfaceGradient: null })])
    expect(hasDelta(diffManifests(ref, act).deltas, 'exploring', 'surfaceGradient')).toBe(true)
  })

  it('test_UAT_FC_REQ-62_matching_surface_gradient_no_flag', () => {
    const ref = mani('ref', [el('What We are exploring', { surfaceGradient: grad })])
    const act = mani('a', [el('What We are exploring', { surfaceGradient: { ...grad, stops: grad.stops.map((s) => ({ ...s })) } })])
    expect(hasDelta(diffManifests(ref, act).deltas, 'exploring', 'surfaceGradient')).toBe(false)
  })

  it('test_UAT_FC_REQ-62_both_null_surface_gradient_no_flag', () => {
    // A run on a solid surface (or the band) carries surfaceGradient: null on both
    // sides — the axis is active but never fabricates a delta.
    const ref = mani('ref', [el('Plain body', { surfaceGradient: null })])
    const act = mani('a', [el('Plain body', { surfaceGradient: null })])
    expect(hasDelta(diffManifests(ref, act).deltas, 'Plain body', 'surfaceGradient')).toBe(false)
  })
})

// ── the capture reads BOTH the gradient and the composited solid out of a DOM ─

describe('REQ-62 gradient panel — real Chromium capture', () => {
  let server: { origin: string; close: () => Promise<void> }
  let capture: Capture

  beforeAll(async () => {
    // Probe the browser before binding a socket — a serveDir-first hook hard-fails
    // rather than skipping where 127.0.0.1 cannot be bound, taking the file down.
    if (browserOk) {
      server = await serveDir(FIXTURES)
      const cwd = mkdtempSync(path.join(tmpdir(), 'req62-cap-'))
      tmpDirs.push(cwd)
      const res = await cmdCapturePage(`${server.origin}/gradient-panel.html`, { cwd })
      capture = res.capture
    }
  }, 120000)

  afterAll(async () => {
    await server?.close()
  })

  itB('test_UAT_FC_REQ-62_capture_records_panel_gradient_and_solid', () => {
    const run = flattenCapture(capture).elements.find((e) => e.text.includes('Exploring'))
    expect(run, 'panel body run present').toBeDefined()
    // The gradient itself is captured (the sweep surfaceFillOf skipped past).
    expect(run?.surfaceGradient?.angleDeg).toBe(135)
    expect(run?.surfaceGradient?.stops).toEqual([
      { color: '#f1f5f9', position: 0 },
      { color: '#e2e8f0', position: 100 },
    ])
    // BOTH captured (per the ticket): surfaceFill still records the composited
    // SOLID the run sits on — the band showing through the panel's transparent
    // background-color, distinct from the gradient.
    expect(run?.surfaceFill?.toLowerCase()).toBe('#e8dfd3')
  })

  itB('test_UAT_FC_REQ-62_text_fill_gradient_not_a_surface_gradient', () => {
    // A text-FILL gradient (background-clip: text) is the run's own glyph paint,
    // captured by `gradient` — it must NOT be mistaken for a panel surface.
    const wm = flattenCapture(capture).elements.find((e) => e.text === 'Gigabyte Alchemy')
    expect(wm, 'wordmark run present').toBeDefined()
    expect(wm?.gradient?.stops.length).toBe(2)
    expect(wm?.surfaceGradient ?? null).toBeNull()
  })
})

// ── local fixture server ─────────────────────────────────────────────────────

const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8' }

async function serveDir(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
    const file = path.join(dir, rel || 'index.html')
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.statusCode = 404
      res.end()
      return
    }
    res.setHeader('content-type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream')
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}
