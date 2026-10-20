/**
 * A real Chromium, for suites whose subject is layout.
 *
 * jsdom lays nothing out — every `getBoundingClientRect()` there is zero — so a
 * claim about where something sits on screen needs a browser. Moved here from
 * `test_UAT_FC_BUG-58_invite_modal_fits` so every layout suite launches the same
 * way; callers report their own loud skip when either function returns nothing.
 */
import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const REPO = path.resolve(__dirname, '../..')

/** Playwright belongs to `tools/generate`; see `req117-builder-viewport-fill`. */
export async function loadChromium(): Promise<typeof import('playwright').chromium | undefined> {
  try {
    const require = createRequire(path.join(REPO, 'tools/generate/package.json'))
    const entry = pathToFileURL(require.resolve('playwright')).href
    const mod = (await import(/* @vite-ignore */ entry)) as Record<string, never>
    return (mod.chromium ?? (mod.default as Record<string, never>)?.chromium) as never
  } catch {
    return undefined
  }
}

/**
 * Where Playwright keeps the browsers it downloads.
 *
 * READ FROM THE ENVIRONMENT FIRST, because a machine that has relocated the
 * cache has done so deliberately. The per-platform defaults are the fallback,
 * and an unknown platform simply contributes nothing rather than guessing.
 */
function browserCacheDirs(): string[] {
  const override = process.env.PLAYWRIGHT_BROWSERS_PATH
  if (override && override !== '0') return [override]
  const home = os.homedir()
  const byPlatform: Record<string, string | undefined> = {
    darwin: path.join(home, 'Library', 'Caches', 'ms-playwright'),
    linux: path.join(home, '.cache', 'ms-playwright'),
    win32: process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'ms-playwright'),
  }
  const dir = byPlatform[process.platform]
  return dir ? [dir] : []
}

/** The Chromium binaries inside one downloaded build, whatever it is called. */
const CHROMIUM_BINARIES = new Set([
  'chrome-headless-shell',
  'headless_shell',
  'Google Chrome for Testing',
  'Chromium',
  'chrome',
])

function findBinaries(dir: string, depth: number, into: string[]): void {
  if (depth < 0 || !fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) findBinaries(full, depth - 1, into)
    else if (CHROMIUM_BINARIES.has(entry.name)) into.push(full)
  }
}

/**
 * Every Chromium this machine actually has, newest build first.
 *
 * PLAYWRIGHT WILL ONLY LAUNCH THE BUILD PINNED TO ITS OWN VERSION, and a machine
 * that has been updated on either side of that pin has a perfectly good browser
 * in a neighbouring directory. Naming it through `executablePath` is what turns
 * "no browser installed" — which is what an unqualified launch reports, and what
 * makes this suite skip itself while reporting green — back into a measurement.
 * The headless shell sorts ahead of the full browser: it is the smaller thing to
 * start and it does the same layout.
 */
function cachedChromiums(): string[] {
  const found: string[] = []
  for (const cache of browserCacheDirs()) {
    if (!fs.existsSync(cache)) continue
    for (const build of fs.readdirSync(cache).filter((n) => n.startsWith('chromium'))) {
      findBinaries(path.join(cache, build), 4, found)
    }
  }
  const revision = (p: string): number => Number(/-(\d+)[\\/]/.exec(p)?.[1] ?? 0)
  return found.sort(
    (a, b) =>
      Number(b.includes('headless')) - Number(a.includes('headless')) || revision(b) - revision(a),
  )
}

/**
 * A browser we can actually drive.
 *
 * THREE THINGS GO WRONG ON A REAL MACHINE and each has a candidate here. The
 * pinned build may not be downloaded, which the first two lines cover by falling
 * back to the installed Chrome and then to whatever build IS downloaded. And a
 * sandboxed host refuses the mach bootstrap check-in that Chromium's
 * multi-process startup performs, so the browser dies before its first page and
 * the run reports "no browser" — indistinguishable from a machine with none, and
 * wrong. `--single-process` starts a browser that does not perform that handoff.
 *
 * THE DEGRADED MODE IS LAST, and every ordinary launch is tried before any of
 * it, so a machine that can start a browser properly never reaches it.
 */
export async function launchAnyChromium(
  chromium: typeof import('playwright').chromium,
): Promise<import('playwright').Browser | undefined> {
  const ordinary: Parameters<typeof chromium.launch>[0][] = [
    {},
    { channel: 'chrome' as const },
    ...cachedChromiums().map((executablePath) => ({ executablePath })),
  ]
  const candidates = [
    ...ordinary,
    ...ordinary.map((opts) => ({ ...opts, args: ['--single-process'] })),
  ]
  for (const opts of candidates) {
    try {
      return await chromium.launch(opts)
    } catch {
      /* try the next one */
    }
  }
  return undefined
}
