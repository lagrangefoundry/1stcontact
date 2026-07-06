/**
 * REQ-39 — the conformance harness core ([[DOC-20]]).
 *
 * `assertModuleConforms(slug, fixtures, opts)` is the single call every thin
 * module leaf makes. It renders each fixture as a **one-module page** through
 * the real catalog renderer, serves it over loopback (the `1c shot` /
 * `values-diff` seam), drives Chromium, and throws on any non-excepted safety
 * violation. The negative-fixture self-tests prove the discriminator actually
 * discriminates *before* any leaf is allowed to trust it.
 *
 * **Isolation & no pollution:** every fixture renders and serves under its own
 * `mkdtemp` store root — never `storage/`, never the real `sandbox/` — so it is
 * structurally impossible to touch real site data. The sandbox is removed on a
 * clean pass and *preserved* (with its path logged) when the fixture failed, so
 * the exact page an assertion saw can be reopened.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  chromiumAvailable,
  cmdNew,
  createPlaywrightDriver,
  startServe,
  type BrowserDriverFactory,
  type ServeHandle,
  type Viewport,
} from '../cli'
import { renderSite } from '../render'
import { distDir, draftDir, loadSite, type StoreContext } from '../store'
import { evaluateSafety, SAFETY_PROBE, type SafetyProbe } from './checks'
import type { ConformanceFixture, ConformanceOptions, ConformanceViolation } from './types'

/** Fast-tier default viewport widths: one desktop, one mobile (DOC-20). */
const DEFAULT_WIDTHS = [1280, 375]
/** Full-page height for the probe viewport; width is the deterministic axis. */
const PROBE_HEIGHT = 900

/** Thrown when a run has one or more non-excepted violations (fails the UAT). */
export class ConformanceError extends Error {
  constructor(public readonly violations: ConformanceViolation[]) {
    super(
      `Module conformance failed with ${violations.length} violation(s):\n` +
        violations.map((v) => `  - [${v.fixture} @${v.viewport}] ${v.ac}: ${v.message}`).join('\n'),
    )
    this.name = 'ConformanceError'
  }
}

/** A one-module page rendered + served over loopback, with a disposer. */
export interface OneModuleServe {
  /** The live loopback serve handle (`handle.url` is the page). */
  handle: ServeHandle
  /** The isolated `mkdtemp` store root backing this render. */
  root: string
  /** Stop the server; remove the temp root unless `keepRoot` (then log its path). */
  dispose(opts?: { keepRoot?: boolean }): Promise<void>
}

/** Build a validated single-module page JSON from a fixture. */
function oneModulePage(slug: string, fixture: ConformanceFixture, version: number): unknown {
  const p = fixture.props
  const instance: Record<string, unknown> = {
    id: 'm0',
    type: slug,
    version,
    variant: typeof p.variant === 'string' ? p.variant : '',
    dials: (p.dials as Record<string, string> | undefined) ?? {},
    content: (p.content as Record<string, unknown> | undefined) ?? {},
  }
  if (p.background) instance.background = p.background
  if (p.layer) instance.layer = p.layer
  if (p.motion) instance.motion = p.motion
  return { id: 'home', slug: 'home', title: `conformance:${fixture.label}`, modules: [instance] }
}

/**
 * Scaffold a one-module site into a fresh temp root, render it through the
 * catalog renderer, and serve it over loopback. Exported as test-infrastructure
 * so the isolation self-test can inspect exactly what was mounted.
 */
export async function serveOneModulePage(
  slug: string,
  fixture: ConformanceFixture,
  opts: ConformanceOptions = {},
): Promise<OneModuleServe> {
  const root = mkdtempSync(path.join(tmpdir(), 'fc-conformance-'))
  const ctx: StoreContext = { cwd: root, root: 'sites' }

  // Scaffold a valid starter site (default theme), then replace its home page
  // with our single module instance.
  cmdNew(slug, { cwd: root })
  const version =
    opts.version ?? (typeof fixture.props.version === 'number' ? fixture.props.version : 1)
  writeFileSync(
    path.join(draftDir(ctx, slug), 'pages', 'home.json'),
    JSON.stringify(oneModulePage(slug, fixture, version), null, 2),
  )

  const loaded = loadSite(ctx, slug, 'draft')
  if (!loaded.ok) {
    rmSync(root, { recursive: true, force: true })
    throw new Error(
      `Conformance fixture '${fixture.label}' produced an invalid one-module page: ` +
        loaded.errors.map((e) => `${e.path}: ${e.message}`).join('; '),
    )
  }

  await renderSite(loaded.value, distDir(ctx, slug, 'draft'), {
    resolveModule: opts.resolveModule,
    extraCss: opts.extraCss,
  })
  const handle = await startServe(slug, { cwd: root, source: 'draft' })

  const dispose = async ({ keepRoot = false }: { keepRoot?: boolean } = {}): Promise<void> => {
    await new Promise<void>((resolve) => handle.server.close(() => resolve()))
    if (keepRoot) {
      // eslint-disable-next-line no-console
      console.error(
        `[conformance] preserved sandbox for '${fixture.label}': ${root}\n` +
          `[conformance]   served page: ${path.join(handle.rootDir, 'index.html')}`,
      )
    } else {
      rmSync(root, { recursive: true, force: true })
    }
  }

  return { handle, root, dispose }
}

/**
 * Assert every fixture of `slug` conforms to the fast-tier safety contract.
 * Throws {@link ConformanceError} on any non-excepted violation. On a Chromium-
 * less runner (and only with the default driver) the check is advisory and
 * returns cleanly — the leaf is a no-op rather than a hard failure (DOC-20).
 */
export async function assertModuleConforms(
  slug: string,
  fixtures: ConformanceFixture[],
  opts: ConformanceOptions = {},
): Promise<void> {
  const factory: BrowserDriverFactory = opts.driverFactory ?? createPlaywrightDriver
  if (!opts.driverFactory && !(await chromiumAvailable())) return

  const widths = opts.viewports ?? DEFAULT_WIDTHS
  const except = opts.except ?? []
  const keepOnFailure = opts.keepSandboxOnFailure ?? true
  const allViolations: ConformanceViolation[] = []

  for (const fixture of fixtures) {
    const served = await serveOneModulePage(slug, fixture, opts)
    const fixtureViolations: ConformanceViolation[] = []
    try {
      for (const width of widths) {
        const viewport: Viewport = { width, height: PROBE_HEIGHT }
        const driver = await factory()
        try {
          await driver.navigate(served.handle.url, viewport)
          const probe = await driver.query<SafetyProbe>(SAFETY_PROBE)
          fixtureViolations.push(
            ...evaluateSafety(fixture.label, String(width), probe, driver.diagnostics()),
          )
        } finally {
          await driver.close()
        }
      }
    } finally {
      const failed = fixtureViolations.some((v) => !except.includes(v.ac))
      await served.dispose({ keepRoot: failed && keepOnFailure })
    }
    allViolations.push(...fixtureViolations)
  }

  const active = allViolations.filter((v) => !except.includes(v.ac))
  if (active.length > 0) throw new ConformanceError(active)
}
