/**
 * The capture pipeline (DOC-13 §3): navigate live → intercept-cache every
 * response → query computed signals → screenshot → segment → assemble the
 * in-memory {@link CaptureResult}. Browser failure retries; there is **no**
 * static fallback (DOC-13 §2.1, §3).
 */
import { EXTRACT_SCRIPT, type RawFontFace, type RawSignals } from './extract'
import { HINTS_SCRIPT, type StructuralHints } from './hints'
// REQ-157 — NO DRIVER IMPORT HERE, and its absence is the point.
//
// This module used to default four seams to Playwright's factories, which was
// invisible while every caller was a `1c` command on a laptop. It is not
// invisible now: `capture_site` runs in a Worker, and a static
// `?? createPlaywrightDriver` put Playwright into the Worker's bundle graph —
// the exact thing REQ-154 removed and REQ-155 named ("the inject-or-fail rule
// `driverFactory` needs for the same reason") without applying here.
//
// So the seams are INJECT-OR-FAIL: absent, they throw by name rather than
// reaching for a browser this runtime may not have. The Node convenience is not
// lost, only relocated — `capture/index.ts` is the Node-only barrel (it says so
// in its own header) and defaults them there, so every `1c` command and every
// existing test calls exactly what it always did.
/** The seam a caller must supply, named so a missing one is legible. */
function required<T>(value: T | undefined, seam: string): T {
  if (value === undefined) {
    throw new Error(
      `${seam} was not supplied. Capture needs a browser, and this module does not ` +
        `choose one: pass a driver factory (\`createPlaywrightDriver\` on a laptop, a ` +
        `leased Browser Rendering session in a Worker).`,
    )
  }
  return value
}
import { buildSections } from './sections'
import { buildTheme, primaryFamily } from './theme'
import {
  flattenSignals,
  HEIGHT_PROBE_VIEWPORTS,
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

/**
 * BUG-12 — recover `@font-face` rules from captured **stylesheet bytes**.
 *
 * The in-page extractor ({@link EXTRACT_SCRIPT}) reads faces from the live CSSOM,
 * but `styleSheet.cssRules` throws a `SecurityError` on any *cross-origin* sheet
 * (Google Fonts' `css2?family=…`, most CDN font stylesheets) and those faces are
 * silently dropped. The response bytes are cached regardless (DOC-13 §3), so the
 * family→woff2 handle lives in the intercepted CSS text even when the CSSOM hid
 * it. Parsing the bytes recovers the mapping so the mirrored `.woff2` connects to
 * the family painted on the page — the substance the fold's resource table needs.
 */
function fontFacesFromStylesheets(responses: CapturedResponse[]): RawFontFace[] {
  const faces: RawFontFace[] = []
  const blockRe = /@font-face\s*\{([^}]*)\}/gi
  const urlRe = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi
  for (const resp of responses) {
    if (resp.status >= 400 || resp.body.length === 0) continue
    if (kindOf(resp.url, resp.contentType) !== 'stylesheet') continue
    const css = new TextDecoder().decode(resp.body)
    let block: RegExpExecArray | null
    while ((block = blockRe.exec(css))) {
      const body = block[1]
      const famMatch = /font-family\s*:\s*([^;]+)/i.exec(body)
      if (!famMatch) continue
      const family = primaryFamily(famMatch[1])
      if (!family) continue
      const srcUrls: string[] = []
      let m: RegExpExecArray | null
      urlRe.lastIndex = 0
      while ((m = urlRe.exec(body))) {
        try {
          srcUrls.push(new URL(m[2], resp.url).href)
        } catch {
          // data: URIs and malformed refs never mirror to an asset — skip.
        }
      }
      if (!srcUrls.length) continue
      const w = parseInt(/font-weight\s*:\s*([0-9]+)/i.exec(body)?.[1] ?? '', 10)
      faces.push({ family, srcUrls, weight: isNaN(w) ? null : w })
    }
  }
  return faces
}

/**
 * Map each painted font family to the local paths of its mirrored face files,
 * drawing on both the in-page CSSOM faces (same-origin) and the byte-parsed faces
 * (cross-origin) — BUG-12. A family keeps only faces whose `src` actually mirrored
 * (`urlToLocal` hit); a family whose every face 404'd or was missed contributes
 * nothing, exactly as before.
 */
function fontFilesByFamilyOf(faces: RawFontFace[], urlToLocal: Map<string, string>): Map<string, string[]> {
  const byFamily = new Map<string, string[]>()
  for (const face of faces) {
    const files = face.srcUrls.map((u) => urlToLocal.get(u)).filter((p): p is string => Boolean(p))
    if (!files.length) continue
    const merged = byFamily.get(face.family) ?? []
    for (const f of files) if (!merged.includes(f)) merged.push(f)
    byFamily.set(face.family, merged)
  }
  return byFamily
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

    // BUG-12 — union the in-page CSSOM faces (same-origin) with faces recovered
    // from cached stylesheet bytes (cross-origin, which the CSSOM blocks), so a
    // Google-Fonts-style family connects to its mirrored `.woff2`.
    const fontFilesByFamily = fontFilesByFamilyOf(
      [...signals.fontFaces, ...fontFacesFromStylesheets(responses)],
      urlToLocal,
    )

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
  const factory = required(opts.driverFactory, 'runCapturePipeline driverFactory')
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
  // REQ-88 — the width ladder plus the height probes. Probes come last so
  // `restingByWidth` keeps the ladder entry for a shared width (first-wins).
  const viewports = opts.viewports ?? [...RESPONSIVE_VIEWPORTS, ...HEIGHT_PROBE_VIEWPORTS]
  const requestedStates = opts.states ?? ['rest', 'hover']
  const factoryFor = required(opts.driverFactoryFor, 'runMultiStateCapture driverFactoryFor')
  const isAvailable = required(opts.isEngineAvailable, 'runMultiStateCapture isEngineAvailable')

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
  const factory = required(opts.driverFactory, 'captureLadderScreenshots driverFactory')
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

// ── REQ-83 — structural-hint extraction ───────────────────────────────────────

export interface StructuralHintsOptions {
  /** Viewport to read hints at (default desktop 1280 — the front-door layout). */
  viewport?: Viewport
  /** Engine to read on (default `chromium`). */
  engine?: RenderEngine
  /** Injectable driver factory (tests supply a fake); defaults to the engine driver. */
  driverFactory?: BrowserDriverFactory
}

/**
 * REQ-83 — the advisory structural-hint pass. Navigate once at a desktop width and
 * evaluate {@link HINTS_SCRIPT}, projecting the CSS-mechanism relationships the
 * fold omits (parent layout, sizing unit, position mode, `@media` breakpoints,
 * ancestry, repetition). Read for DIRECTION only; nothing in the render path
 * consumes it. Kept a separate pass from the values extraction so the heavily-
 * tested {@link EXTRACT_SCRIPT} stays untouched.
 */
export async function captureStructuralHints(
  url: string,
  opts: StructuralHintsOptions = {},
): Promise<StructuralHints> {
  const viewport = opts.viewport ?? { width: 1280, height: 800 }
  const factory = required(opts.driverFactory, 'captureStructuralHints driverFactory')
  const driver = await factory()
  try {
    await driver.navigate(url, viewport)
    return await driver.query<StructuralHints>(HINTS_SCRIPT)
  } finally {
    await driver.close()
  }
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
