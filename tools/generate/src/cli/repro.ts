/**
 * REQ-88 — the operator-facing L1 reproduction pipeline.
 *
 * `1c capture` already folds a multi-viewport capture into an absolute-base
 * `l1.json` + a retained `multistate.json` oracle. This module turns that bundle
 * into a **servable, gate-able 1c site**, closing the last gap between the L1
 * library (foldToL1 / renderL1 / threeProbeGate) and an operator workflow:
 *
 *   - {@link cmdRepro}  — import a bundle's `l1.json` as a raw-L1 page site, so the
 *                          existing `render / serve / shot / diff / values-diff`
 *                          loop works on the reproduction unchanged.
 *   - {@link cmdL1Gate} — run the mechanical 3-probe acceptance gate (DOC-19) on
 *                          the bundle's oracle: fold → promote → gate, reporting
 *                          each residual as a framework-gap signal.
 *
 * The site config it writes is disposable (DOC-21): the durable output is the
 * framework growth each probe residual forces.
 */
import { defaultTokens } from '@1stcontact/framework'
import { validateSite } from '@1stcontact/site-schema'
import type { L1Document } from '@1stcontact/site-schema'
import { foldToL1, promoteToFlow, threeProbeGate } from '../l1'
import type { FoldResidual, ThreeProbeReport } from '../l1'
import { copyDir, draftDir, emptyDir, ensureDir, pathExists, siteDir, writeDraftBase, writeJson } from '../store'
import { ctxOf } from './commands'
import type { GlobalOptions } from './commands'
import { readL1, readMultiState } from './capture/bundle'
import path from 'node:path'

/** Content-perturbation factor for the robustness probe + structure recovery. */
const CONTENT_SCALE = 2.5

export interface ReproOptions extends GlobalOptions {
  /** Capture bundle directory (e.g. `storage/references/<host>/<page>`). Required. */
  ref: string
}

export interface ReproResult {
  slug: string
  draftDir: string
  /** Number of L1 nodes in the imported page (the folded reproduction). */
  nodeCount: number
  /** Whether the bundle carried assets that were copied into the site. */
  copiedAssets: boolean
}

/** Count leaves + containers in an L1 document (for the operator summary). */
function countNodes(doc: L1Document): number {
  let n = 0
  const walk = (node: L1Document['root']): void => {
    n += 1
    if (node.kind === 'container') node.children.forEach(walk)
    else if (node.kind === 'box') (node.children ?? []).forEach(walk)
  }
  walk(doc.root)
  return n
}

/**
 * Import a capture bundle's folded `l1.json` as a raw-L1 page site. Idempotent:
 * an existing draft for `slug` is emptied and rewritten, so re-import *is* the
 * "delete + rebuild" reproduction loop. The L1 document is self-contained
 * (concrete geometry from the fold), so the site takes `defaultTokens` for its
 * theme — the L1 css, not the theme palette, drives the reproduction.
 */
export function cmdRepro(slug: string, opts: ReproOptions): ReproResult {
  const ctx = ctxOf(opts)
  const l1 = readL1(opts.ref)
  if (!l1) {
    throw new Error(
      `No l1.json in bundle '${opts.ref}'. The bundle predates the L1 fold — ` +
        `re-capture with \`1c capture page <url>\` before reproducing.`,
    )
  }

  const site = {
    id: slug,
    config: { businessName: slug, tagline: '' },
    theme: defaultTokens,
    nav: { pattern: 'top-tabs' as const, entries: [] },
    assets: [],
  }
  const page = { id: 'home', slug: 'home', title: slug, l1 }

  // Validate the assembled definition before touching disk — a fold that does not
  // satisfy the page schema is a serializer bug, surfaced here not at render time.
  const result = validateSite({ ...site, pages: [page] })
  if (!result.ok) {
    throw new Error(
      `Folded reproduction is not a valid site definition:\n` +
        result.errors.map((e) => `  ${e.path}: ${e.message}`).join('\n'),
    )
  }

  const dir = siteDir(ctx, slug)
  const draft = draftDir(ctx, slug)
  emptyDir(dir)
  writeJson(path.join(draft, 'site.json'), site)
  writeJson(path.join(draft, 'pages', 'home.json'), page)
  ensureDir(path.join(draft, 'assets'))
  writeJson(path.join(dir, 'history.json'), { revisions: [] })
  writeDraftBase(ctx, slug, null)

  // Mirror the bundle's assets (photos, fonts) so the reproduction renders with
  // the site's own media rather than remote URLs.
  const bundleAssets = path.join(opts.ref, 'assets')
  const copiedAssets = pathExists(bundleAssets)
  if (copiedAssets) copyDir(bundleAssets, path.join(draft, 'assets'))

  return { slug, draftDir: draft, nodeCount: countNodes(l1), copiedAssets }
}

export interface L1GateResult extends ThreeProbeReport {
  /** Paths of the pinned sibling groups `promoteToFlow` recovered into flow. */
  promoted: string[]
  /**
   * REQ-92 / BUG-6 (B2) — elements the fold could not yet express as L1 leaves
   * (text-free media/fields, pure-surface panels, geometry-less runs). Kept
   * separate from the probes' mispairing/fidelity residuals: these name *folder
   * power* gaps (a leaf kind the fold does not emit yet), not a diff delta.
   */
  foldResiduals: FoldResidual[]
}

/**
 * Run the 3-probe acceptance gate against a capture bundle's oracle. Folds the
 * `multistate.json` to the absolute base, applies demand-driven `promoteToFlow`
 * for the envelope probes, and runs {@link threeProbeGate}. The returned report's
 * residuals each name a framework gap (a missing L1 axis, a capture-hint gap, or
 * a region needing promotion) to feed back per the DOC-21 growth loop.
 */
export function cmdL1Gate(opts: ReproOptions): L1GateResult {
  const multiState = readMultiState(opts.ref)
  if (!multiState) {
    throw new Error(
      `No multistate.json in bundle '${opts.ref}'. The bundle predates multi-state ` +
        `capture — re-capture with \`1c capture page <url>\` before gating.`,
    )
  }
  const foldResiduals: FoldResidual[] = []
  const base = foldToL1(multiState, { residuals: foldResiduals })
  const { doc: recovered, promoted } = promoteToFlow(base, { scale: CONTENT_SCALE })
  const report = threeProbeGate(base, multiState, { recovered, contentScale: CONTENT_SCALE })
  return { ...report, promoted, foldResiduals }
}
