/**
 * L1 round-trip gate (REQ-82 / REQ-79 D6) — wires the L1 renderer to the
 * existing capture / values-diff spine to measure the identity property
 * `capture(render(L1)) ≈ L1`.
 *
 * The renderer emits the declared L1 leaf axes as HTML/CSS; a real browser
 * renders and the capture extractor reads the axes back; {@link diffManifests}
 * compares the reproduced manifest against the manifest projected straight from
 * the L1 document. Because L1 declares authored (Type-A) axes as literals,
 * reproduction is near-mechanical and the diff closes to ~0 on those axes at
 * every captured width.
 */
import http from 'node:http'
import { renderL1Page } from '@1stcontact/framework'
import type { L1Document, L1Node } from '@1stcontact/site-schema'
import {
  createEngineDriver,
  diffManifests,
  engineAvailable,
  EXTRACT_SCRIPT,
  flattenSignals,
  type DiffOptions,
  type RawSignals,
  type RenderEngine,
  type StateProjection,
  type ValueElement,
  type ValueManifest,
  type ValuesDiffReport,
  type Viewport,
} from '../cli/capture'

/** A live loopback server hosting one rendered L1 page. */
export interface L1Serve {
  url: string
  close: () => Promise<void>
}

/** Render an L1 document and serve it over loopback (the `1c shot` seam). */
export async function serveL1(doc: L1Document): Promise<L1Serve> {
  const page = renderL1Page(doc)
  const body = Buffer.from(page, 'utf-8')
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(body)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  const addr = server.address()
  const port = typeof addr === 'object' && addr ? addr.port : 0
  return {
    url: `http://127.0.0.1:${port}/`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

export interface L1CaptureOptions {
  /** Engines to capture across (default `['chromium']`). */
  engines?: RenderEngine[]
  /** Viewport widths (default the document's own ladder). */
  widths?: number[]
}

/**
 * Render → serve → capture the document across `engines × widths`, returning one
 * flattened {@link ValueManifest} per `{engine, width}` (the resting state).
 *
 * Captures directly (navigate → extract → flatten) rather than via the
 * multi-state loop: the round-trip gate only needs the resting frame, and the
 * multi-state actuation path is Chromium-only (CDP), which would break the
 * WebKit / Gecko cross-browser probe. Unavailable engines are skipped.
 */
export async function captureL1(
  doc: L1Document,
  opts: L1CaptureOptions = {},
): Promise<StateProjection[]> {
  const engines = opts.engines ?? ['chromium']
  const widths = opts.widths ?? doc.widths
  const serve = await serveL1(doc)
  const projections: StateProjection[] = []
  try {
    for (const engine of engines) {
      if (!(await engineAvailable(engine))) continue
      for (const width of widths) {
        const viewport: Viewport = { width, height: 900 }
        const driver = await createEngineDriver(engine)()
        try {
          await driver.navigate(serve.url, viewport)
          const signals = await driver.query<RawSignals>(EXTRACT_SCRIPT)
          const manifest = flattenSignals(signals, `l1@${engine}:${width}`)
          manifest.viewport = viewport
          manifest.engine = engine
          manifest.state = 'rest'
          projections.push({ engine, viewport, state: 'rest', manifest })
        } finally {
          await driver.close()
        }
      }
    }
  } finally {
    await serve.close()
  }
  return projections
}

/** All text nodes in the tree, in document order. */
function textNodes(node: L1Node, out: L1Node[] = []): L1Node[] {
  if (node.kind === 'text') out.push(node)
  if (node.kind === 'container' || node.kind === 'box') {
    for (const child of node.children ?? []) textNodes(child, out)
  }
  return out
}

/**
 * Project an L1 document's text leaves into the manifest the renderer is
 * *expected* to reproduce: one {@link ValueElement} per text leaf carrying its
 * declared Type-A axes. No `box` is set, so geometry is not compared here — the
 * geometry track is asserted separately (it is emergent Type-B, per the codebase
 * A/B model).
 */
export function expectedTextManifest(doc: L1Document, viewport: Viewport): ValueManifest {
  const elements: ValueElement[] = textNodes(doc.root)
    .filter((n) => n.kind === 'text' && n.text.trim() !== '')
    .map((n) => {
      const node = n as Extract<L1Node, { kind: 'text' }>
      const a = node.axes ?? {}
      const el: ValueElement = {
        text: node.text,
        role: 'body',
        color: a.color ?? '#000000',
        fontFamily: a.fontFamily ?? '',
        fontSizePx: a.fontSizePx ?? 16,
        fontWeight: a.fontWeight ?? 400,
      }
      if (a.letterSpacingPx !== undefined) el.letterSpacingPx = a.letterSpacingPx
      if (a.lineHeightPx !== undefined) el.lineHeightPx = a.lineHeightPx
      if (a.textAlign !== undefined) el.textAlign = a.textAlign
      return el
    })
  return { source: 'l1:expected', elements, sections: [], viewport }
}

/**
 * The round-trip report for one captured projection: diff the reproduced
 * manifest against the projected-from-L1 expectation at that projection's
 * viewport. Zero (or only Type-B) deltas means the render faithfully reproduced
 * every authored axis.
 */
export function roundTripReport(
  doc: L1Document,
  actual: ValueManifest,
  opts: DiffOptions = {},
): ValuesDiffReport {
  const viewport = actual.viewport ?? { width: doc.widths[0], height: 900 }
  const expected = expectedTextManifest(doc, viewport)
  return diffManifests(expected, actual, opts)
}
