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
import { ContentSafetyError } from '@1stcontact/framework'
import {
  chromiumAvailable,
  cmdNew,
  createEngineDriver,
  createPlaywrightDriver,
  engineAvailable,
  startServe,
  type BrowserDriverFactory,
  type ServeHandle,
  type Viewport,
} from '../cli'
import { renderSite } from '../render'
import { distDir, draftDir, loadSite, type StoreContext } from '../store'
import {
  evaluateResponsive,
  evaluateSafety,
  evaluateSecurity,
  evaluateXBrowser,
  evaluateXBrowserBackstop,
  MOBILE_BAND_MAX_PX,
  RESPONSIVE_PROBE,
  SAFETY_PROBE,
  SECURITY_PROBE,
  X_BROWSER_BACKSTOP_THRESHOLD,
  X_BROWSER_BOX_PROBE,
  X_BROWSER_TOLERANCE,
  type ResponsiveProbe,
  type SafetyProbe,
  type SecurityProbe,
  type XBrowserProbe,
} from './checks'
import type {
  ConformanceEngine,
  ConformanceFixture,
  ConformanceOptions,
  ConformanceViolation,
} from './types'

/** Fast-tier default viewport widths: one desktop, one mobile (DOC-20). */
const DEFAULT_WIDTHS = [1280, 375]
/** Responsive-dimension default sweep: the full viewport ladder (REQ-41). */
const RESPONSIVE_WIDTHS = [320, 375, 768, 1024, 1280, 1440]
/** Cross-browser default widths — desktop + mobile; the engine axis is what matters. */
const X_BROWSER_WIDTHS = [1280, 375]
/** Cross-browser engine set: Edge == Blink, so three engines, not four (DOC-20 AC-M3). */
const X_BROWSER_ENGINES: ConformanceEngine[] = ['chromium', 'webkit', 'firefox']
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
  // A capability-module instance (REQ-85): behavioural `config` + named L1 `slots`.
  const instance: Record<string, unknown> = {
    id: 'm0',
    type: slug,
    version,
    config: (p.config as Record<string, unknown> | undefined) ?? {},
    slots: (p.slots as Record<string, unknown> | undefined) ?? {},
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

  try {
    await renderSite(loaded.value, distDir(ctx, slug, 'draft'), {
      resolveModule: opts.resolveModule,
      extraCss: opts.extraCss,
    })
  } catch (err) {
    // A module that fails loud (REQ-46 `ContentSafetyError`) rather than emit
    // dangerous content has *refused* the fixture — the security dimension counts
    // that as conformant. Clean up the sandbox and rethrow the typed error so
    // `assertModuleConforms` can record a safe rejection (any other error is a
    // real bug and propagates unchanged).
    rmSync(root, { recursive: true, force: true })
    throw err
  }
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
 * Assert every fixture of `slug` conforms to the fast-tier contract for the
 * requested {@link ConformanceOptions.dimension} — `safety` (default),
 * `security` (REQ-40: content-injection inert + no off-allowlist egress),
 * `responsive` (REQ-41: safety across the viewport ladder + mobile-band tap
 * target / font-floor checks), or `x-browser` (REQ-42: Blink/WebKit/Gecko
 * layout equivalence — delegated to {@link assertXBrowserConforms}). Throws
 * {@link ConformanceError} on any non-excepted violation. On a Chromium-less
 * runner (and only with the default driver) the check is advisory and returns
 * cleanly — the leaf is a no-op rather than a hard failure (DOC-20).
 */
export async function assertModuleConforms(
  slug: string,
  fixtures: ConformanceFixture[],
  opts: ConformanceOptions = {},
): Promise<void> {
  if (opts.dimension === 'x-browser') {
    await assertXBrowserConforms(slug, fixtures, opts)
    return
  }
  const factory: BrowserDriverFactory = opts.driverFactory ?? createPlaywrightDriver
  if (!opts.driverFactory && !(await chromiumAvailable())) return

  const widths =
    opts.viewports ?? (opts.dimension === 'responsive' ? RESPONSIVE_WIDTHS : DEFAULT_WIDTHS)
  const except = opts.except ?? []
  const keepOnFailure = opts.keepSandboxOnFailure ?? true
  const allViolations: ConformanceViolation[] = []

  for (const fixture of fixtures) {
    let served: OneModuleServe
    try {
      served = await serveOneModulePage(slug, fixture, opts)
    } catch (err) {
      // The module failed loud on dangerous content (REQ-46). Refusing to render
      // an injection payload IS the secure contract — the security dimension
      // records no violation for this fixture and moves on. Any non-safety error
      // is a real bug and propagates.
      if (opts.dimension === 'security' && err instanceof ContentSafetyError) continue
      throw err
    }
    const servedOrigin = new URL(served.handle.url).origin
    const fixtureViolations: ConformanceViolation[] = []
    try {
      for (const width of widths) {
        const viewport: Viewport = { width, height: PROBE_HEIGHT }
        const driver = await factory()
        try {
          await driver.navigate(served.handle.url, viewport)
          if (opts.dimension === 'security') {
            const probe = await driver.query<SecurityProbe>(SECURITY_PROBE)
            fixtureViolations.push(
              ...evaluateSecurity(
                fixture.label,
                String(width),
                probe,
                driver.diagnostics().requestedUrls,
                servedOrigin,
                opts.assetAllowlist,
              ),
            )
          } else {
            // `safety` and `responsive` both run the safety checks at every
            // width; `responsive` adds the mobile-band checks (tap targets, font
            // floor) at widths ≤ MOBILE_BAND_MAX_PX. The overflow check already
            // covers "images scale within the viewport" at each width.
            const probe = await driver.query<SafetyProbe>(SAFETY_PROBE)
            fixtureViolations.push(
              ...evaluateSafety(fixture.label, String(width), probe, driver.diagnostics()),
            )
            if (opts.dimension === 'responsive' && width <= MOBILE_BAND_MAX_PX) {
              const rprobe = await driver.query<ResponsiveProbe>(RESPONSIVE_PROBE)
              fixtureViolations.push(...evaluateResponsive(fixture.label, String(width), rprobe))
            }
          }
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

/** One engine's rendering of the served page: layout boxes + (optional) screenshot. */
interface EngineRender {
  boxes: XBrowserProbe['boxes']
  shot?: Uint8Array
}

/** Drive one engine over the served URL and read its layout boxes (+ screenshot). */
async function renderInEngine(
  engine: ConformanceEngine,
  factoryFor: (engine: ConformanceEngine) => BrowserDriverFactory,
  url: string,
  viewport: Viewport,
  withShot: boolean,
): Promise<EngineRender> {
  const driver = await factoryFor(engine)()
  try {
    await driver.navigate(url, viewport)
    const probe = await driver.query<XBrowserProbe>(X_BROWSER_BOX_PROBE)
    const shot = withShot ? await driver.screenshot(viewport) : undefined
    return { boxes: probe.boxes, shot }
  } finally {
    await driver.close()
  }
}

/**
 * REQ-42 cross-browser dimension ([[DOC-20]] AC-M3). Render each fixture's
 * one-module page in Blink (Chromium, the reference), WebKit and Gecko, and
 * assert layout equivalence: a per-element parent-relative box comparison
 * ({@link evaluateXBrowser}) plus a perceptual block-diff backstop
 * ({@link evaluateXBrowserBackstop}). Full tier — regression-scoped.
 *
 * Engine resolution: with an injected {@link ConformanceOptions.driverFactoryFor}
 * (the self-tests) the requested engines are used verbatim; otherwise each real
 * engine is probed with {@link engineAvailable} and absent ones are dropped. The
 * check needs Chromium (the reference) plus at least one other engine to compare;
 * short of that it is an advisory no-op — the leaf passes rather than hard-fails
 * on a runner without WebKit/Firefox binaries provisioned.
 */
async function assertXBrowserConforms(
  slug: string,
  fixtures: ConformanceFixture[],
  opts: ConformanceOptions,
): Promise<void> {
  const injected = opts.driverFactoryFor
  const requested = opts.engines ?? X_BROWSER_ENGINES
  let engines: ConformanceEngine[]
  let factoryFor: (engine: ConformanceEngine) => BrowserDriverFactory
  if (injected) {
    factoryFor = injected
    engines = requested
  } else {
    factoryFor = createEngineDriver
    engines = []
    for (const engine of requested) if (await engineAvailable(engine)) engines.push(engine)
  }
  // Need the Blink reference + ≥1 other engine to have anything to compare.
  if (!engines.includes('chromium') || engines.length < 2) return
  const others = engines.filter((engine) => engine !== 'chromium')

  const widths = opts.viewports ?? X_BROWSER_WIDTHS
  const tol = opts.xBrowserTolerance ?? X_BROWSER_TOLERANCE
  const runBackstop = opts.xBrowserBackstop !== false
  const backstopThreshold = opts.xBrowserBackstopThreshold ?? X_BROWSER_BACKSTOP_THRESHOLD
  const except = opts.except ?? []
  const keepOnFailure = opts.keepSandboxOnFailure ?? true
  const allViolations: ConformanceViolation[] = []

  for (const fixture of fixtures) {
    const served = await serveOneModulePage(slug, fixture, opts)
    const fixtureViolations: ConformanceViolation[] = []
    try {
      for (const width of widths) {
        const viewport: Viewport = { width, height: PROBE_HEIGHT }
        const reference = await renderInEngine(
          'chromium',
          factoryFor,
          served.handle.url,
          viewport,
          runBackstop,
        )
        for (const engine of others) {
          const current = await renderInEngine(
            engine,
            factoryFor,
            served.handle.url,
            viewport,
            runBackstop,
          )
          fixtureViolations.push(
            ...evaluateXBrowser(
              fixture.label,
              String(width),
              engine,
              reference.boxes,
              current.boxes,
              tol,
            ),
          )
          if (runBackstop && reference.shot && current.shot) {
            fixtureViolations.push(
              ...(await evaluateXBrowserBackstop(
                fixture.label,
                String(width),
                engine,
                reference.shot,
                current.shot,
                backstopThreshold,
              )),
            )
          }
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
