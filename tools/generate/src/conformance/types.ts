/**
 * REQ-39 — conformance harness type surface ([[DOC-20]]).
 *
 * The public shape is `assertModuleConforms(slug, fixtures, opts)` — the single
 * call every thin module leaf makes. The options carry both the DOC-20 public
 * dials (dimension / tier / viewports / engines / except) and a handful of
 * *below-the-matrix-line* injection points the harness's own self-tests use to
 * mount deliberately-broken modules through the real renderer.
 */
import type { BrowserDriverFactory } from '../cli'
import type { ModuleResolver } from '../render'

/** One rendered scenario for a module: a label + the module instance props. */
export interface ConformanceFixture {
  /** Human-readable scenario name, surfaced in violation messages. */
  label: string
  /**
   * The module instance fields (minus `id`/`type`): `variant`, `dials`,
   * `content`, and optionally `version` / `background` / `layer` / `motion`.
   * Shaped as `Record<string, unknown>` per the DOC-20 interface; the harness
   * assembles a valid one-module page from them.
   */
  props: Record<string, unknown>
}

export type ConformanceDimension = 'safety' | 'security' | 'x-browser' | 'responsive'
export type ConformanceTier = 'fast' | 'full'
export type ConformanceEngine = 'chromium' | 'webkit' | 'firefox'

export interface ConformanceOptions {
  /** Which universal AC to check; omit = all implemented (REQ-39 ships `safety`). */
  dimension?: ConformanceDimension
  /** Cost tier (default `fast`: Chromium only, small viewport set). */
  tier?: ConformanceTier
  /** Viewport widths to run the checks at (default `[1280, 375]` — desktop + mobile). */
  viewports?: number[]
  /** Browser engines (default per tier; `fast` = Chromium only). */
  engines?: ConformanceEngine[]
  /**
   * AC ids a fixture legitimately opts out of (declared + reasoned). A violation
   * whose {@link ConformanceViolation.ac} is listed here does not fail the run.
   */
  except?: string[]
  /**
   * Extra origins (beyond the served same-origin) a module may issue requests to
   * without tripping `security.egress` — declared fonts / CDNs (DOC-20 AC-M2).
   * Only consulted by the `security` dimension.
   */
  assetAllowlist?: string[]

  // ── test-infrastructure injection points (below the matrix line) ────────────
  /** Custom catalog — the self-tests mount broken modules through the same renderer. */
  resolveModule?: ModuleResolver
  /** Extra CSS for injected modules that need rules beyond the framework catalog. */
  extraCss?: string
  /** Injectable driver factory; defaults to real Playwright/Chromium. */
  driverFactory?: BrowserDriverFactory
  /** Module version to pin the one-module page to (default from props, else `1`). */
  version?: number
  /** Keep the temp sandbox on failure for debugging (default `true`). */
  keepSandboxOnFailure?: boolean
}

/** One non-conformance a fixture exhibited at a viewport, tagged by AC id. */
export interface ConformanceViolation {
  /** The fixture label that produced it. */
  fixture: string
  /** Viewport width the check ran at (e.g. `'375'`). */
  viewport: string
  /** Stable AC / check id (e.g. `'safety.overflow'`) — the `except` match key. */
  ac: string
  /** Human-readable detail. */
  message: string
}
