/**
 * `1c shot` — page screenshot primitive (REQ-13, [[DOC-13]] §6): the AI's
 * *eyes*. It screenshots our own rendered draft/published output, or any URL,
 * through the same {@link BrowserDriver} seam the capture pipeline uses.
 *
 * The slug path renders the chosen source, serves it over loopback, then
 * screenshots the **served** page — so `/assets/` references resolve over HTTP.
 * That is the fix for first-contact's blank-screenshot bug: screenshotting a
 * page that could not reach its own assets produced an empty PNG.
 *
 * REQ-154 — THIS IS THE NODE SHELL. Rendering, serving and writing the PNG all
 * need a filesystem, which workerd does not have; the navigate-and-screenshot
 * core moved to `capture/screenshot.ts` so a Worker can reach it. The viewport
 * presets are re-exported from here so every existing importer keeps its path.
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { GlobalOptions } from './commands'
import { cmdRender } from './commands'
import { startServe } from './serve'
import { createPlaywrightDriver } from './capture'
import type { BrowserDriverFactory, Viewport } from './capture'
import { resolveViewport, screenshotUrl, VIEWPORTS } from './capture/screenshot'
import type { ViewportName } from './capture/screenshot'
import type { RenderChannel, SiteSource } from '../store'
import { distDir } from '../store'

export { VIEWPORTS }
export type { ViewportName }

export interface ShotOptions extends GlobalOptions {
  /** Site slug to render + serve + screenshot. Mutually exclusive with `url`. */
  slug?: string
  /** Arbitrary URL to screenshot directly. Mutually exclusive with `slug`. */
  url?: string
  /** Which channel to shoot for slug mode (default `draft`). */
  source?: RenderChannel
  /** Named viewport preset (default `desktop`). */
  viewport?: ViewportName
  /** Output PNG path; defaults per mode. */
  out?: string
  /** Injectable driver factory (tests supply a fake); defaults to Playwright. */
  driverFactory?: BrowserDriverFactory
  /** Fixed serve port (slug mode); defaults to an ephemeral port. */
  port?: number
}

export interface ShotResult {
  /** Absolute path of the written PNG. */
  outFile: string
  /** The URL that was actually screenshotted (loopback URL in slug mode). */
  url: string
  /** Resolved viewport preset. */
  viewport: Viewport
  /** PNG size in bytes. */
  bytes: number
}

/**
 * Screenshot a page to a PNG. Exactly one of `slug` / `url` must be given.
 * Returns the output path and the resolved viewport.
 */
export async function cmdShot(opts: ShotOptions): Promise<ShotResult> {
  const viewportName = opts.viewport ?? 'desktop'
  const viewport = resolveViewport(viewportName)
  const factory = opts.driverFactory ?? createPlaywrightDriver

  if (opts.url && opts.slug) {
    throw new Error('Pass either <slug> or --url, not both.')
  }

  if (opts.url) {
    const outFile = path.resolve(opts.out ?? 'shot.png')
    const bytes = await screenshotTo(opts.url, viewport, factory, outFile)
    return { outFile, url: opts.url, viewport, bytes }
  }

  if (!opts.slug) {
    throw new Error('Missing <slug> (or --url) to screenshot.')
  }

  return shotSlug(opts.slug, opts.source ?? 'draft', viewportName, viewport, factory, opts)
}

/** Render → serve over loopback → screenshot the served page → tear down. */
async function shotSlug(
  slug: string,
  source: RenderChannel,
  viewportName: ViewportName,
  viewport: Viewport,
  factory: BrowserDriverFactory,
  opts: ShotOptions,
): Promise<ShotResult> {
  const root = opts.sandbox ? 'sandbox' : 'sites'
  const cwd = opts.cwd ?? process.cwd()

  // A `published` shot serves the latest published revision; a `draft` shot the
  // working draft. `cmdRender` maps `latest` → the `published` channel dist.
  const renderSource: SiteSource = source === 'published' ? 'latest' : 'draft'
  await cmdRender(slug, { ...opts, source: renderSource, out: undefined })

  const handle = await startServe(slug, { ...opts, source, port: opts.port })
  try {
    const url = handle.url // http://localhost:<port>/
    const outFile = path.resolve(
      opts.out ?? path.join(distDir({ cwd, root }, slug, source), `shot-${source}-${viewportName}.png`),
    )
    const bytes = await screenshotTo(url, viewport, factory, outFile)
    return { outFile, url, viewport, bytes }
  } finally {
    await new Promise<void>((resolve) => handle.server.close(() => resolve()))
  }
}

/** The shared core (`capture/screenshot.ts`), plus the one thing it cannot do
 *  in a Worker: write the bytes to a file. */
async function screenshotTo(
  url: string,
  viewport: Viewport,
  factory: BrowserDriverFactory,
  outFile: string,
): Promise<number> {
  const png = await screenshotUrl(url, viewport, factory)
  await writeFile(outFile, png)
  return png.byteLength
}
