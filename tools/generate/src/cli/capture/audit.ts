/**
 * REQ-275 — `1c capture audit`: what does this page use that the capture does
 * not carry?
 *
 * THE PROBLEM. `CAPTURE_SCHEMA_AXES` (REQ-270) is the right machinery and it is
 * reactive by construction: an axis joins it only after a reproduction round has
 * paid — about $7 a round — to discover the bundle was missing it. Five axes are
 * in the register and those five are exactly the five a round found. Nothing
 * says the list is complete, and the only way to extend it was to run another
 * round.
 *
 * THE CHANGE. Discovery becomes one mechanical pass. The page enumerates the
 * properties it uses (`AUDIT_SCRIPT` — derived from the page, never a wishlist);
 * the register says what was decided about each (`coverage.ts`); and what is
 * left over is the report. A re-run on a site of a new class surfaces only what
 * is genuinely new, because every prior decision is already written down.
 *
 * IT READS THE STORED BUNDLE, NOT THE LIVE SITE, and that is the same decision
 * REQ-270 made for the same reason. The bundle's `rendered.html` IS the DOM the
 * `capture.json` beside it was extracted from, so the two sides of this
 * comparison are the same page by construction. Re-fetching the live site would
 * compare today's page against last month's capture and report the site's own
 * changes as instrument gaps. The serving is `reextract`'s — one loopback
 * server, already built to make a bundle navigable offline.
 */
import { CAPTURE_COVERAGE, type CoverageVerdict } from './coverage'
import { AUDIT_SCRIPT, type ObservedProperty, type RawAudit } from './audit-script'
import { serveBundle } from './reextract'
import { readCapture } from './bundle'
import { staleCaptureDetail } from './schema'
import type { BrowserDriverFactory, Capture, Viewport } from './types'
import type { ReferenceBundle } from '../../store/reference-store'

export type { CoverageVerdict, CoverageEntry } from './coverage'
export type { ObservedProperty, RawAudit } from './audit-script'

/** One property the page uses, with what the register says about it. */
export interface AuditFinding extends ObservedProperty {
  /** `untriaged` when the register has no entry — the probe's actual output. */
  verdict: CoverageVerdict | 'untriaged'
  /** The register's reason, absent when untriaged. */
  note?: string
}

/** What one bundle's audit found. */
export interface CaptureAudit {
  bundle: string
  url: string
  /** Visible elements the probe walked. */
  elements: number
  /** Distinct properties and DOM facts the page uses. */
  observed: number
  /**
   * Used by the page, and the register has never decided anything about it.
   * THIS IS THE REPORT. Everything else below is context for reading it.
   */
  untriaged: AuditFinding[]
  /**
   * Used by the page, the extractor records it, and this bundle carries no
   * instance of it. A CANDIDATE loss, not a proven one — see
   * {@link CoverageEntry.present} for the asymmetry, which runs the same way as
   * REQ-270's: a bundle that visibly has the axis is never listed.
   */
  lost: AuditFinding[]
  /** Used by the page, and no L1 axis could consume it — a capability item. */
  notExpressible: AuditFinding[]
  /** Used by the page, deliberately not carried, with the reason. */
  declined: AuditFinding[]
  /** How many used properties the extractor records and this bundle carries. */
  carried: number
  /** REQ-270's staleness sentence for this bundle, when it is behind. */
  stale: string | null
}

const finding = (p: ObservedProperty): AuditFinding => {
  const entry = CAPTURE_COVERAGE.get(p.property)
  if (!entry) return { ...p, verdict: 'untriaged' }
  return { ...p, verdict: entry.verdict, note: entry.note }
}

/**
 * Triage one page's observations against one bundle. Pure — the browser half is
 * {@link runCaptureAudit}, and keeping the decision here means the interesting
 * behaviour is testable without one.
 */
export function auditObservations(raw: RawAudit, capture: Capture, bundle: string): CaptureAudit {
  const observed = [...raw.css, ...raw.dom]
  const untriaged: AuditFinding[] = []
  const lost: AuditFinding[] = []
  const notExpressible: AuditFinding[] = []
  const declined: AuditFinding[] = []
  let carried = 0

  for (const property of observed) {
    const f = finding(property)
    const entry = CAPTURE_COVERAGE.get(property.property)
    switch (f.verdict) {
      case 'untriaged':
        untriaged.push(f)
        break
      case 'not-expressible':
        notExpressible.push(f)
        break
      case 'declined':
        declined.push(f)
        break
      case 'recorded':
        // A witness is optional; without one the entry is coverage-only and the
        // bundle is credited rather than accused, exactly as REQ-270's version
        // only ever REMOVES an axis from a finding.
        if (entry?.present && !entry.present(capture)) lost.push(f)
        else carried++
        break
    }
  }

  return {
    bundle,
    url: capture.url,
    elements: raw.elements,
    observed: observed.length,
    untriaged,
    lost,
    notExpressible,
    declined,
    carried,
    stale: staleCaptureDetail(capture),
  }
}

/** What {@link runCaptureAudit} needs beyond the bundle. */
export interface CaptureAuditOptions {
  /** The browser. Inject-or-fail, exactly as the capture pipeline's seams are (REQ-157). */
  driverFactory: BrowserDriverFactory
  /** The width to render at; defaults to the bundle's own captured viewport. */
  viewport?: Viewport
}

/**
 * Audit one stored bundle: serve it offline, walk its own rendered DOM, and
 * triage what it uses against what the extractor records.
 */
export async function runCaptureAudit(
  bundle: ReferenceBundle,
  opts: CaptureAuditOptions,
): Promise<CaptureAudit> {
  const capture = await readCapture(bundle)
  return serveBundle(bundle, async (origin) => {
    const driver = await opts.driverFactory()
    try {
      await driver.navigate(origin, opts.viewport ?? capture.viewport)
      const raw = await driver.query<RawAudit>(AUDIT_SCRIPT)
      return auditObservations(raw, capture, bundle.name)
    } finally {
      await driver.close()
    }
  })
}

/**
 * The combined report over several bundles.
 *
 * COMBINED RATHER THAN CONCATENATED, because the question the ticket asks is
 * "which properties does the corpus use that we have not decided about", and a
 * property that matters on one site and not another has to survive the merge. A
 * finding therefore carries the bundles it was seen in, and its counts are
 * summed.
 */
export interface CombinedFinding extends AuditFinding {
  bundles: string[]
}

export interface CombinedAudit {
  audits: CaptureAudit[]
  untriaged: CombinedFinding[]
  lost: CombinedFinding[]
  notExpressible: CombinedFinding[]
}

const merge = (audits: readonly CaptureAudit[], pick: (a: CaptureAudit) => AuditFinding[]): CombinedFinding[] => {
  const byProperty = new Map<string, CombinedFinding>()
  for (const audit of audits) {
    for (const f of pick(audit)) {
      const existing = byProperty.get(f.property)
      if (!existing) {
        byProperty.set(f.property, { ...f, values: [...f.values], bundles: [audit.bundle] })
        continue
      }
      existing.count += f.count
      existing.bundles.push(audit.bundle)
      for (const v of f.values) if (!existing.values.includes(v) && existing.values.length < 8) existing.values.push(v)
    }
  }
  return [...byProperty.values()].sort((a, b) => b.bundles.length - a.bundles.length || b.count - a.count)
}

export function combineAudits(audits: readonly CaptureAudit[]): CombinedAudit {
  return {
    audits: [...audits],
    untriaged: merge(audits, (a) => a.untriaged),
    lost: merge(audits, (a) => a.lost),
    notExpressible: merge(audits, (a) => a.notExpressible),
  }
}
