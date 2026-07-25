/**
 * REQ-88 — the operator-facing L1 reproduction pipeline.
 *
 * `1c capture` already folds a multi-viewport capture into an absolute-base
 * `l1.json` + a retained `multistate.json` oracle. This module turns that bundle
 * into a **servable, gate-able 1c site**, closing the last gap between the L1
 * library (foldToL1 / renderL1 / threeProbeGate) and an operator workflow:
 *
 *   - {@link cmdRepro}  — import a bundle's `l1.json` (+ REQ-93's `forms.json`
 *                          behaviour bindings) as an L1 page site, so the existing
 *                          `render / serve / shot / diff / values-diff` loop works
 *                          on the reproduction unchanged.
 *   - {@link cmdL1Gate} — run the mechanical 3-probe acceptance gate (DOC-19) on
 *                          the bundle's oracle: fold → promote → gate, reporting
 *                          each residual as a framework-gap signal.
 *
 * The site config it writes is disposable (DOC-21): the durable output is the
 * framework growth each probe residual forces.
 */
import { defaultTokens, latestModuleVersion } from '@1stcontact/framework'
import { l1DocumentSlotNames, validateSite } from '@1stcontact/site-schema'
import type { L1Document } from '@1stcontact/site-schema'
import { foldToL1, localizeAssets, promoteToFlow, threeProbeGate } from '../l1'
import type { FoldedForm, FoldResidual, ThreeProbeReport } from '../l1'
import { copyDir, draftDir, emptyDir, ensureDir, pathExists, siteDir, writeDraftBase, writeJson } from '../store'
import { ctxOf } from './commands'
import type { GlobalOptions } from './commands'
import { readCaptureAssets, readForms, readL1, readMultiState } from './capture/bundle'
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
  /**
   * BUG-23 — media handles rewritten from the captured origin to the site's own
   * mirror. A reproduction that still pointed at the origin would render only
   * while that host was up, and would hide image regressions from the gate.
   */
  localizedAssets: number
  /**
   * BUG-23 — mirrored `image`/`font` assets the folded document references
   * nowhere. The bytes are in the bundle but no leaf (or `@font-face`) was
   * emitted for them: a **fold gap** to close, surfaced rather than ignored.
   */
  unreferencedAssets: string[]
  /**
   * REQ-93 — the behaviours mounted into the page's L1 slots, and what the
   * capture could not tell us about each (a missing endpoint, an unrecorded input
   * type). Surfaced, never silently defaulted: a reproduced form that posts to
   * its own URL is honest, but the operator must know before it collects leads.
   */
  forms: FoldedForm[]
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
 * Import a capture bundle as an L1 page site. Idempotent: an existing draft for
 * `slug` is emptied and rewritten, so re-import *is* the "delete + rebuild"
 * reproduction loop. The L1 document is self-contained (concrete geometry from
 * the fold), so the site takes `defaultTokens` for its theme — the L1 css, not
 * the theme palette, drives the reproduction.
 *
 * REQ-93 — a page is L1 layout **plus** the behaviours mounted into its slots,
 * so the import reads both halves of the bundle: `l1.json` (the page body, with
 * a `slot` seam per captured form) and `forms.json` (the binding for each seam).
 * Both are written by the same `foldToL1` call at capture time, so they cannot
 * disagree about which seams exist. A bundle with no `forms.json` — one captured
 * before REQ-93, or a page with no behaviour — carries no slot either, and
 * imports exactly as it did before.
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
  const forms = readForms(opts.ref)

  // REQ-93 — the two artifacts must describe the same seams. They always do when
  // written together, so a mismatch means the bundle is half-stale (an `l1.json`
  // folded before REQ-93 carries no seam; a `forms.json` from a later fold names
  // seams that file has never heard of). Reproducing it anyway would silently
  // render the behaviours as inert placeholders — exactly the stranding this
  // ticket exists to end — so it fails loudly with the fix.
  const seams = l1DocumentSlotNames(l1)
  const unmatched = [
    ...seams.filter((s) => !forms.some((f) => f.slot === s)).map((s) => `slot '${s}' has no binding in forms.json`),
    ...forms.filter((f) => !seams.includes(f.slot)).map((f) => `forms.json binds slot '${f.slot}', absent from l1.json`),
  ]
  if (unmatched.length) {
    throw new Error(
      `Bundle '${opts.ref}' is internally inconsistent — its L1 seams and behaviour ` +
        `bindings disagree:\n` +
        unmatched.map((u) => `  ${u}`).join('\n') +
        `\nThe two are written by one fold, so this means the bundle is part-stale. ` +
        `Re-capture with \`1c capture page <url>\`.`,
    )
  }

  // BUG-23 — bind every media handle to the bundle's mirror BEFORE the document
  // is written. A handle that still names the captured origin makes the whole
  // reproduction network-dependent and blinds the perceptual gate to image
  // regressions, so an unresolvable handle fails the import outright: a
  // reproduction is self-contained or it does not exist.
  const localized = localizeAssets(l1, readCaptureAssets(opts.ref))
  if (localized.unmirrored.length) {
    throw new Error(
      `Reproduction would hotlink the captured origin — ${localized.unmirrored.length} media ` +
        `handle(s) have no mirrored asset in bundle '${opts.ref}':\n` +
        localized.unmirrored.map((u) => `  ${u}`).join('\n') +
        `\nRe-capture with \`1c capture page <url>\` so the bundle mirrors every referenced asset.`,
    )
  }

  const site = {
    id: slug,
    config: { businessName: slug, tagline: '' },
    theme: defaultTokens,
    nav: { pattern: 'top-tabs' as const, entries: [] },
    assets: [],
  }
  // REQ-93 — one behavior-module instance per recovered form, each bound by name
  // to the `slot` the fold emitted for it. The L1 document stays the single page
  // body; these mount *into* it. Config is derived from the capture only — an
  // absent endpoint stays absent (the form posts to its own URL) and is reported
  // through `forms[].residuals` rather than invented here.
  const modules = forms.map((form) => ({
    id: form.slot,
    type: form.behavior,
    version: latestModuleVersion(form.behavior),
    slot: form.slot,
    config: {
      action: form.action ?? '',
      fields: form.fields.map((f) => ({ ...f, required: false })),
    },
    // REQ-93 — the reference's own submit chip, as this behaviour's `submit`
    // slot. Absent when the reference gave the form no button of its own, in
    // which case the module falls back to its plain functional one.
    ...(form.submit ? { slots: { submit: form.submit } } : {}),
  }))
  const page = { id: 'home', slug: 'home', title: slug, l1: localized.doc, modules }

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

  return {
    slug,
    draftDir: draft,
    nodeCount: countNodes(localized.doc),
    copiedAssets,
    localizedAssets: localized.rewritten.length,
    unreferencedAssets: localized.unreferenced,
    forms,
  }
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
  /**
   * REQ-93 — the behaviours the fold recovered into L1 slots, with whatever the
   * capture could not tell us about each. A *derivation* gap (no endpoint, no
   * recorded input type), deliberately distinct from {@link foldResiduals}: the
   * form was mounted, so it is not a gap in L1's expressive power.
   */
  forms: FoldedForm[]
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
  const forms: FoldedForm[] = []
  const base = foldToL1(multiState, { residuals: foldResiduals, forms })
  const { doc: recovered, promoted } = promoteToFlow(base, { scale: CONTENT_SCALE })
  const report = threeProbeGate(base, multiState, { recovered, contentScale: CONTENT_SCALE })
  return { ...report, promoted, foldResiduals, forms }
}
