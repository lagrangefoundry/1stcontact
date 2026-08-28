/**
 * REQ-154 — the screenshot primitive, with no host in it.
 *
 * WHY THIS FILE EXISTS. `1c shot` ([[DOC-13]] §6, the AI's *eyes*) was one
 * module that did three things: render a slug, serve it over loopback, and
 * screenshot the served page. Two of those need `node:fs` and `node:http`, so
 * the third — the only part a Worker needs — could not run in workerd at all.
 * The split is along that line and nothing else: this module navigates and
 * screenshots, and `shot.ts` remains the Node shell that renders, serves and
 * writes the PNG to disk.
 *
 * Nothing here knows which driver it holds. That is the seam working as
 * intended: a laptop passes Playwright's factory, a Worker passes one from a
 * leased Browser Rendering session, and this file cannot tell.
 */
import type { BrowserDriverFactory, Viewport } from './types'

/**
 * Named viewport presets (DOC-8 §3.4). Width is the deterministic dimension;
 * full-page height grows with content.
 */
export type ViewportName = 'mobile' | 'tablet' | 'desktop'

export const VIEWPORTS: Record<ViewportName, Viewport> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
}

/** Resolve a preset name to a viewport, refusing an unknown one by name. */
export function resolveViewport(name: ViewportName = 'desktop'): Viewport {
  const viewport = VIEWPORTS[name]
  if (!viewport) throw new Error(`Unknown viewport '${name}'. Use mobile|tablet|desktop.`)
  return viewport
}

/**
 * Drive a fresh driver: navigate, full-page screenshot at `viewport`, release.
 *
 * `navigate` is called with NO viewport, and the width is applied at screenshot
 * time. That is what `1c shot` has always done and is preserved verbatim rather
 * than tidied: loading at the driver's default width and resizing afterwards is
 * observably different from laying the page out at the target width from the
 * start, so "fixing" it here would silently change every existing shot.
 *
 * The `finally` is the contract, not hygiene. On the Playwright side a stranded
 * driver holds a local process; on the Browser Rendering side it holds a metered
 * session that counts against the account's concurrency cap until the platform's
 * idle reaper takes it. Both are released here whether the navigation succeeded,
 * threw, or timed out.
 */
export async function screenshotUrl(
  url: string,
  viewport: Viewport,
  factory: BrowserDriverFactory,
): Promise<Uint8Array> {
  const driver = await factory()
  try {
    await driver.navigate(url)
    return await driver.screenshot(viewport)
  } finally {
    await driver.close()
  }
}
