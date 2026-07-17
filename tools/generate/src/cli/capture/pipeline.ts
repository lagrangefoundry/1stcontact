/**
 * The capture pipeline (DOC-13 §3): navigate live → intercept-cache every
 * response → query computed signals → screenshot → segment → assemble the
 * in-memory {@link CaptureResult}. Browser failure retries; there is **no**
 * static fallback (DOC-13 §2.1, §3).
 */
import { EXTRACT_SCRIPT, type RawSignals } from './extract'
import { createEngineDriver, createPlaywrightDriver, engineAvailable } from './playwright-driver'
import { buildSections } from './sections'
import { buildTheme } from './theme'
import {
  flattenSignals,
  RESPONSIVE_VIEWPORTS,
  type MultiStateCapture,
  type StateProjection,
} from './values-diff'
import type {
  BrowserDriver,
  BrowserDriverFactory,
  Capture,
  CaptureAsset,
  CaptureResult,
  CapturedResponse,
  InteractionState,
  RenderEngine,
  Viewport,
} from './types'

export interface CapturePipelineOptions {
  /** Injectable driver factory; defaults to local Playwright (DOC-13 §2.2). */
  driverFactory?: BrowserDriverFactory
  /** Extra navigation attempts on browser failure (default 2). */
  retries?: number
}

interface AssetBuild {
  assets: CaptureAsset[]
  assetBytes: Map<string, Uint8Array>
  urlToLocal: Map<string, string>
}

function kindOf(url: string, contentType: string | null): CaptureAsset['kind'] {
  const ct = contentType ?? ''
  const ext = url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() ?? ''
  if (ct.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(ext)) return 'image'
  if (ct.startsWith('font/') || ct.includes('font') || ['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(ext)) return 'font'
  if (ct.includes('css') || ext === 'css') return 'stylesheet'
  if (ct.includes('javascript') || ['js', 'mjs', 'cjs'].includes(ext)) return 'script'
  return 'other'
}

function basename(url: string): string {
  const pathname = new URL(url).pathname
  const base = pathname.split('/').filter(Boolean).pop() ?? ''
  return base || 'index'
}

/** Mirror every cached subresource into `assets/`, minus the main document. */
function buildAssets(responses: CapturedResponse[], documentUrl: string, images: RawSignals['images']): AssetBuild {
  const assets: CaptureAsset[] = []
  const assetBytes = new Map<string, Uint8Array>()
  const urlToLocal = new Map<string, string>()
  const usedNames = new Set<string>()
  const dims = new Map(images.map((i) => [i.src, { width: i.width, height: i.height, role: i.role }]))

  for (const resp of responses) {
    if (resp.url === documentUrl) continue // that's raw.html, not an asset
    if (resp.status >= 400 || resp.body.length === 0) continue
    if (urlToLocal.has(resp.url)) continue

    let name = basename(resp.url)
    while (usedNames.has(name)) {
      const dot = name.lastIndexOf('.')
      name = dot > 0 ? `${name.slice(0, dot)}-1${name.slice(dot)}` : `${name}-1`
    }
    usedNames.add(name)

    const localPath = `assets/${name}`
    urlToLocal.set(resp.url, localPath)
    assetBytes.set(localPath, resp.body)

    const dim = dims.get(resp.url)
    const asset: CaptureAsset = {
      id: name,
      kind: kindOf(resp.url, resp.contentType),
      src: resp.url,
      localPath,
    }
    if (dim) {
      asset.width = dim.width
      asset.height = dim.height
      asset.role = dim.role
    }
    assets.push(asset)
  }
  return { assets, assetBytes, urlToLocal }
}

/** Pull the original server HTML (the AI's cheap archive, DOC-13 §4). */
function rawHtmlOf(responses: CapturedResponse[], documentUrl: string): string {
  const doc =
    responses.find((r) => r.url === documentUrl && (r.contentType ?? '').includes('text/html')) ??
    responses.find((r) => (r.contentType ?? '').includes('text/html'))
  return doc ? new TextDecoder().decode(doc.body) : ''
}

async function captureOnce(url: string, factory: BrowserDriverFactory): Promise<CaptureResult> {
  const driver = await factory()
  try {
    await driver.navigate(url)
    const signals = await driver.query<RawSignals>(EXTRACT_SCRIPT)
    const screenshot = await driver.screenshot()
    const renderedHtml = await driver.content()
    const responses = driver.responses()

    const { assets, assetBytes, urlToLocal } = buildAssets(responses, url, signals.images)

    const fontFilesByFamily = new Map<string, string[]>()
    for (const face of signals.fontFaces) {
      const files = face.srcUrls.map((u) => urlToLocal.get(u)).filter((p): p is string => Boolean(p))
      if (files.length) fontFilesByFamily.set(face.family, files)
    }

    const u = new URL(url)
    const capture: Capture = {
      url,
      host: u.hostname,
      path: u.pathname,
      capturedAt: new Date().toISOString(),
      viewport: signals.viewport,
      theme: buildTheme(signals, fontFilesByFamily),
      sections: buildSections(signals, (src) => urlToLocal.get(src)),
      assets,
    }

    return { capture, screenshot, renderedHtml, rawHtml: rawHtmlOf(responses, url), assetBytes }
  } finally {
    await driver.close()
  }
}

export async function runCapturePipeline(url: string, opts: CapturePipelineOptions = {}): Promise<CaptureResult> {
  const factory = opts.driverFactory ?? createPlaywrightDriver
  const attempts = Math.max(1, (opts.retries ?? 2) + 1)
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await captureOnce(url, factory)
    } catch (err) {
      lastErr = err // retry — never fall back to a blind static path (DOC-13 §3)
    }
  }
  throw new Error(
    `Capture failed for ${url} after ${attempts} attempt(s): ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
  )
}

// ── REQ-48 (items 1, 5, 6) — multi-state capture orchestration ────────────────

export interface MultiStateCaptureOptions {
  /** Engines to shoot across (default `['chromium']`). Unavailable ones are skipped, noted. */
  engines?: RenderEngine[]
  /** Viewport ladder (default {@link RESPONSIVE_VIEWPORTS}). */
  viewports?: readonly Viewport[]
  /** Interaction states (default `['rest', 'hover']`). Non-rest needs an actuating driver. */
  states?: InteractionState[]
  /** Per-engine driver factory (default {@link createEngineDriver}); tests inject a fake. */
  driverFactoryFor?: (engine: RenderEngine) => BrowserDriverFactory
  /** Engine-availability probe (default {@link engineAvailable}); tests inject a stub. */
  isEngineAvailable?: (engine: RenderEngine) => Promise<boolean>
}

/**
 * REQ-48 (items 1, 5, 6) — project a live URL across the full state matrix:
 * `engines × viewports × interaction-states`. Navigation happens once per
 * `{engine, viewport}` and the interaction states are actuated *on that open
 * page* (cheap: no re-navigation per hover/focus). Each projection is flattened to
 * a {@link ValueManifest} tagged with its `{engine, viewport, state}` provenance,
 * ready for {@link diffMultiState} to pair reference↔repro cell-for-cell.
 *
 * The matrix is honest about gaps: an unavailable engine is skipped and noted; a
 * driver that can't actuate (a non-Blink engine, a bare fake) is held to `rest`
 * and noted — never a hover/focus cell filled with an unactuated frame that would
 * read as a false "clean".
 */
export async function runMultiStateCapture(
  url: string,
  opts: MultiStateCaptureOptions = {},
): Promise<MultiStateCapture> {
  const engines = opts.engines ?? ['chromium']
  const viewports = opts.viewports ?? RESPONSIVE_VIEWPORTS
  const requestedStates = opts.states ?? ['rest', 'hover']
  const factoryFor = opts.driverFactoryFor ?? createEngineDriver
  const isAvailable = opts.isEngineAvailable ?? engineAvailable

  const projections: StateProjection[] = []
  const notes: string[] = []

  for (const engine of engines) {
    if (!(await isAvailable(engine))) {
      notes.push(`engine ${engine} unavailable — skipped`)
      continue
    }
    for (const viewport of viewports) {
      const driver = await factoryFor(engine)()
      try {
        await driver.navigate(url, viewport)
        const states = effectiveStates(driver, engine, requestedStates, viewport, notes)
        for (const state of states) {
          if (driver.actuate) await driver.actuate(state)
          const signals = await driver.query<RawSignals>(EXTRACT_SCRIPT)
          const manifest = flattenSignals(signals, `${url}@${engine}:${viewport.width}:${state}`)
          // Provenance is the *requested* combination, so pairing is deterministic
          // (the measured innerWidth can drift a px from the requested width).
          manifest.viewport = viewport
          manifest.engine = engine
          manifest.state = state
          projections.push({ engine, viewport, state, manifest })
        }
      } finally {
        await driver.close()
      }
    }
  }

  return { url, projections, notes }
}

// ── REQ-61 — per-viewport reference screenshots ───────────────────────────────

/** One full-page reference screenshot tagged with the viewport it was shot at. */
export interface LadderScreenshot {
  viewport: Viewport
  bytes: Uint8Array
}

export interface LadderScreenshotOptions {
  /** Viewport ladder to shoot (default {@link RESPONSIVE_VIEWPORTS}). */
  viewports?: readonly Viewport[]
  /** Engine to shoot on (default `chromium` — the perceptual reference engine). */
  engine?: RenderEngine
  /** Injectable driver factory (tests supply a fake); defaults to the engine driver. */
  driverFactory?: BrowserDriverFactory
}

/**
 * REQ-61 — full-page screenshots across the viewport ladder, so the perceptual
 * `1c diff --size` has a reference shot at each width to compare against. The
 * multi-state pass ({@link runMultiStateCapture}) records per-width *manifests*
 * but no images; this is the image sibling. Kept as a separate pass (one open
 * page per width, screenshot, close) so the JSON matrix stays free of raw bytes —
 * screenshots land as sibling PNGs in the bundle, not inside `multistate.json`.
 */
export async function captureLadderScreenshots(
  url: string,
  opts: LadderScreenshotOptions = {},
): Promise<LadderScreenshot[]> {
  const viewports = opts.viewports ?? RESPONSIVE_VIEWPORTS
  const engine = opts.engine ?? 'chromium'
  const factory = opts.driverFactory ?? createEngineDriver(engine)
  const shots: LadderScreenshot[] = []
  for (const viewport of viewports) {
    const driver = await factory()
    try {
      await driver.navigate(url, viewport)
      const bytes = await driver.screenshot(viewport)
      shots.push({ viewport, bytes })
    } finally {
      await driver.close()
    }
  }
  return shots
}

/**
 * The states this driver can honestly project at this viewport: every requested
 * state when the driver actuates for real, otherwise only `rest` (with a note, so
 * the dropped hover/focus cells are visible, not silent). `rest` is always kept.
 */
function effectiveStates(
  driver: BrowserDriver,
  engine: RenderEngine,
  requested: InteractionState[],
  viewport: Viewport,
  notes: string[],
): InteractionState[] {
  const nonRest = requested.filter((s) => s !== 'rest')
  const canActuate = typeof driver.actuate === 'function' && (driver.canActuate?.() ?? true)
  if (nonRest.length > 0 && !canActuate) {
    notes.push(`engine ${engine} cannot actuate @${viewport.width} — states ${nonRest.join(',')} skipped`)
    return requested.filter((s) => s === 'rest')
  }
  return requested
}
