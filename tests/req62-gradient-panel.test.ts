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
 * `resolveSurfaceGradient` resolver (absolute-or-overlay stops), the `gradient`
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

describe('REQ-62 gradient panel — resolver', () => {
  it('test_UAT_FC_REQ-62_panel_gradient_stops_absolute_or_overlay', () => {
    // Each stop is literal-or-alias (REQ-58 T11): a `#hex` stays absolute; a
    // palette role becomes the overlay `var(--color-…)` — so a site reproduces
    // with exact captured values, not just the role vocabulary.
    const css = resolveSurfaceGradient({ angleDeg: 135, stops: ['#f1f5f9', 'accent'] })
    expect(css).toBe('background-image: linear-gradient(135deg, #f1f5f9 0%, var(--color-accent) 100%)')
  })
})

// ── validation accepts a well-formed gradient, rejects a malformed one ────────

describe('REQ-62 gradient panel — validation', () => {
  it('test_UAT_FC_REQ-62_validation_accepts_gradient_panel', () => {
    const errors = validateModuleContent(gradientMeta, {
      body: 'x',
      panelGradient: { angleDeg: 'to-br', stops: ['#f1f5f9', 'accent'] },
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
    server = await serveDir(FIXTURES)
    if (browserOk) {
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
