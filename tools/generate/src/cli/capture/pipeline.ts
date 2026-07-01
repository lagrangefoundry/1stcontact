/**
 * The capture pipeline (DOC-13 §3): navigate live → intercept-cache every
 * response → query computed signals → screenshot → segment → assemble the
 * in-memory {@link CaptureResult}. Browser failure retries; there is **no**
 * static fallback (DOC-13 §2.1, §3).
 */
import { EXTRACT_SCRIPT, type RawSignals } from './extract'
import { createPlaywrightDriver } from './playwright-driver'
import { buildSections } from './sections'
import { buildTheme } from './theme'
import type {
  BrowserDriverFactory,
  Capture,
  CaptureAsset,
  CaptureResult,
  CapturedResponse,
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
