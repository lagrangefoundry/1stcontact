---
uid: report-f150ba1e
id: REPORT-1643
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=story)'
created_by: xgd
created_at: '2026-08-07T22:44:29.418221+00:00'
updated_at: '2026-08-07T22:44:29.418221+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: story
  violations: 8
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: story

**Result**: FAIL
**Violations**: 8
**Warnings**: 1
**Needs review**: 0

The capability's five stories accurately describe the intent they *do* cover. The
failure is **coverage**: seven reconciled intents whose asked behaviour is live in
production code inside this capability's own scope are expressed in no story, and
the capability body's own Scope statement no longer contains what STORY-79 carries.

## Cumulative Intent Considered

Stories record their intent as *bundle* UIDs; the asks below are the REQ/BUG
tickets those bundles carry. Ordered by intent `created_at`.

| Intent ID | Reconciled via | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-44 | BUNDLE-16 (bundle-15c1f647) | free_and_reconciled | 2026-07-03 (rec. 2026-08-07) | Fail loud on out-of-sync node_modules; per-command dependency preflight | YES |
| REQ-58 | BUNDLE-6 (bundle-ab9e0cb6) | free_and_reconciled | 2026-07-13 | gigabytealchemy pass-3; surfaced boolean-flag + `--json` hygiene | YES |
| REQ-59 | BUNDLE-6 | free_and_reconciled | 2026-07-13 | Capture text-fill gradient stop positions | YES |
| REQ-61 | BUNDLE-6 | free_and_reconciled | 2026-07-16 | `responsive-diff` N-way cross-size analysis; per-discrete-size objective | YES |
| REQ-62 | BUNDLE-6 | free_and_reconciled | 2026-07-16 | Panel/surface gradient: capture + render + diff | YES |
| REQ-63 | BUNDLE-6 / BUNDLE-7 | free_and_reconciled | 2026-07-17 | Coverage audit: capture + diff every render-affecting CSS axis | YES |
| REQ-64 | BUNDLE-6 / BUNDLE-10 | free_and_reconciled | 2026-07-17 | Noise audit: every values-diff delta must be a real visible difference | YES |
| REQ-72 | (no bundle body cites it) | free_and_reconciled | 2026-07-18 | Hexify modern colour spaces in-browser so gradient stops capture at all | YES |
| REQ-73 | (no bundle body cites it) | free_and_reconciled | 2026-07-18 | values-diff `gap` axis (adjacent-row spacing) + drop band-padding deltas | YES |
| REQ-76 | (no bundle body cites it) | free_and_reconciled | 2026-07-18 | values-diff cause clustering: ranked cause view + `--clusters` + dispositions | YES |
| REQ-89 | BUNDLE-8 (bundle-cceaba25) | free_and_reconciled | 2026-07-22 | Silence 'Missing pages directory'; Astro constructed only on demand | YES |
| BUG-10 | BUNDLE-8 | free_and_reconciled | 2026-07-23 | Capture must not record `list-style-type` for non-list elements | YES |
| BUG-15 | BUNDLE-10 / BUNDLE-11 | free_and_reconciled | 2026-07-23 | values-diff blind on L1 pages — collapsed band drops the whole subtree | YES |
| BUG-16 | BUNDLE-10 (bundle-4ff83a8b) | free_and_reconciled | 2026-07-23 | Capture records fallback fonts; offline re-extract must reach mirrored faces | YES |
| BUG-22 | BUNDLE-10 | free_and_reconciled | 2026-07-24 | values-diff mis-attributes split text+box controls (phantom radius delta) | YES |
| BUG-24 | BUNDLE-10 | free_and_reconciled | 2026-07-24 | Translucent overlay/scrim invisible to capture (legacy `rgba()` regex) | YES |
| BUG-25 | BUNDLE-10 / BUNDLE-11 | free_and_reconciled | 2026-07-25 | A multi-run element gives every run the same box — needs per-text-node geometry | YES |
| BUG-27 | BUNDLE-10 / BUNDLE-11 | free_and_reconciled | 2026-07-25 | CSS background images and lazy-loaded media are not captured | YES |

Retired / not counting: no intent in this capability's tree is `abandoned`,
`deprecated` or `wont_fix`; nothing in the ledger retires an earlier ask. Every
row above is live cumulative intent.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-63 (capability body) | REQ-58, REQ-59, REQ-61, REQ-62, REQ-63, REQ-64 | gap: Scope bullet 4 predates REQ-89 and REQ-44; does not contain STORY-79 guarantees 3–5 (finding 1) |
| STORY-75 | REQ-63, REQ-64, BUG-10, BUG-15, BUG-27 | aligned on those; gaps for BUG-22, BUG-24, BUG-25, BUG-16 (findings 2, 5, 6, 7) |
| STORY-76 | REQ-59, REQ-62 | aligned on stop positions + surface gradients; gap for REQ-72 (finding 4) |
| STORY-77 | REQ-61 (size-aware half) | aligned |
| STORY-78 | REQ-61 (cross-size half) | aligned |
| STORY-79 | REQ-58, REQ-89, REQ-44, BUNDLE-7 plan item 9 | aligned to intent; the capability body has not kept up with it (finding 1) |
| — (unhomed) | REQ-73, REQ-76 | gap: no story in any capability expresses either (findings 3, 8) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | CAP-63 body (capability-aa030c83) | story-body-edit (capability body) | Scope bullet 4 covers only boolean-flag parsing and `--json`/stderr hygiene. STORY-79 (updated 2026-08-07 by bundle-15c1f647) additionally carries guarantee 3 (store-selecting flags propagate into the render/serve a sub-command drives — BUNDLE-7 plan item 9), guarantee 4 (the render path constructs Astro only when a page carries behavior modules — REQ-89, free_and_reconciled, BUNDLE-8) and guarantee 5 (per-command dependency preflight with an `ENVIRONMENT` failure code — REQ-44, free_and_reconciled, BUNDLE-16, 2026-08-07). None of the three is "argument parsing" or "output hygiene", and guarantee 4 touches the render path the body's Out-of-scope section pushes away | Widen Scope bullet 4 to name flag propagation into sub-commands, the on-demand Astro container, and the dependency preflight — or rehome guarantees 4–5. Body was last updated 2026-08-05 (consolidation); REQ-44 landed 2026-08-07 |
| 2 | violation | coverage | STORY-75 | story-body-edit + ac-add | BUG-22 (free_and_reconciled, 2026-07-24) requires values-diff to resolve a split control's surface from the box that actually paints it — the reference carries one node with text + `surfaceFill` + `borderRadiusPx`; the L1 fold carries a text node plus a sibling box, so the diff read radius off the text node and emitted a phantom Type-A delta at the head of the repair order while the real geometry defect went unreported. Live in `tools/generate/src/cli/capture/values-diff.ts:137-144` (`ValueElement.surface`) and `:2103-2145` (SPLIT CONTROL branch). This is an element-pairing/attribution rule — CAP-63's own Scope bullet 1 — and CAP-71's Out-of-scope explicitly assigns values-diff axes here. STORY-75 item 4 covers only duplicate-*text* pairing | Add a closure to STORY-75's Description for surface-bearing-box attribution on split controls, with the back-compat note (absent on pre-BUG-22 manifests, so the resolution stays inert) |
| 3 | violation | coverage | (no element) | story-body-edit + ac-add | REQ-73 (free_and_reconciled, 2026-07-18) adds the values-diff `gap` axis — pair elements into visual rows by y-overlap, compare the gap between consecutive rows, and drop the section band-padding (`paddingTopPx`/`paddingBottomPx`) deltas it supersedes. Live in `values-diff.ts:364,406,1406,2533`. No story in this capability (or any other) mentions a gap axis; STORY-75 enumerates eleven closures and this is not among them | Add the `gap` axis to STORY-75's captured/compared axis list, including the band-padding suppression and the linear-inversion property (Δ = ref_gap − our_gap is the correction) |
| 4 | violation | coverage | STORY-76 | story-body-edit + ac-add | REQ-72 (free_and_reconciled, 2026-07-18) requires gradient stop *colours* to be resolved to `#rrggbb` in-browser, because a Tailwind-authored gradient computes to `oklch`/`oklab`/`color()` that the TS-side stop regex cannot parse — without it the gigabytealchemy card gradient captured as `135° []`, angle-only with empty stops. Live in `tools/generate/src/cli/capture/extract.ts:331-339` (`hexifyGradient`), applied at `:846` and `:1132` to both `surfaceGradientCss` and text-fill `gradientCss`. STORY-76's In-scope line reads "capture of stop positions and surface gradients" and so excludes it by its own wording | Extend STORY-76's In-scope line and Description to cover in-browser colour-space resolution of stop colours as the precondition that makes stops capturable at all |
| 5 | violation | coverage | STORY-75 | story-body-edit + ac-add | BUG-24 (free_and_reconciled, 2026-07-24) requires the capture to detect a translucent band overlay written in modern colour syntax — `overlayOf` matched a raw `/rgba\(([^)]+)\)/`, so every `color-mix` / `oklab` / `oklch` / `color()` scrim was silently skipped and the hero veil recorded `overlay: null`. Live in `extract.ts:1047-1057` and `:1425`. STORY-75 item 9 *presupposes* this ("scrims already recorded as the band's overlay") but no story states that the overlay is captured, or that it is captured across modern colour syntax | State the band-overlay capture axis explicitly in STORY-75, with the colour-space condition — item 9's exclusion rule depends on it being true |
| 6 | violation | coverage | STORY-75 | story-body-edit + ac-add | BUG-25 (free_and_reconciled, 2026-07-25) requires per-text-node run geometry: an element holding more than one run gave every run the element's box *and* the element's glyph box, so a fold positioning them absolutely printed them on top of each other and `nowrapFromPx` read both one-line runs as two-line. Live in `extract.ts:666-684` (`textNodeBox`) and `:1101-1124` (two-pass `runsUnder`, geometry off the element only when `runCounts.get(el) === 1`). STORY-75 item 1 describes the glyph-extent axis and its ratio comparison but not the multi-run rule, which is exactly the "conditions under which an axis records a value at all" its In-scope line claims | Add the multi-run condition to STORY-75 item 1: geometry is read off the element when it owns exactly one run, and off the text node when it does not |
| 7 | violation | coverage | STORY-75 | story-body-edit + ac-add | BUG-16 (free_and_reconciled, 2026-07-23) requires a captured bundle to re-extract offline against its own mirrored faces — `rendered.html` referenced cross-origin webfonts by absolute URL, so offline re-extraction measured runs against the serif fallback and persisted `fontLoaded:false`, corrupting `fontFamily` and every glyph metric derived from it (a DOC-13 §9 "capture once, re-map forever" violation). Live in `tools/generate/src/cli/capture/reextract.ts:45-73,96-100` (`rewriteMirroredRefs`). No story expresses it; STORY-92 (CAP-89) covers font *licence provenance* only, and CAP-71 disclaims capture. STORY-75 item 7 goes further and frames a reference `fontLoaded:false` as an accepted capture-side FOUT artifact, which reads as tension with BUG-16 having identified and fixed its dominant cause | Add the offline-re-extract mirrored-reference rule to STORY-75's capture scope, and reword item 7 so tolerating residual FOUT is explicitly the *remainder* after BUG-16's cause was fixed, not the whole story |
| 8 | violation | coverage | (no element) | story-body-edit + ac-add | REQ-76 (free_and_reconciled, 2026-07-18) requires values-diff cause clustering — `clusterDefects(collapsedDefects)` returning ranked causes with count, worst tier, representative elements and a fix/review/accept disposition, surfaced by a `--clusters` flag, and viewport-aware so a mobile-only wrapping cause does not merge with a desktop glyph-width cause into a phantom. Live in `tools/generate/src/cli/fidelity.ts` (`clusterDefects`, `formatClusterReport`) and `tools/generate/src/cli/index.ts:260,759-768`. No story expresses it; STORY-79 covers CLI flag parsing and `--json` hygiene but not this output view | Add the cause-clustering view (taxonomy, dispositions, `--clusters`, viewport-awareness) to STORY-75, or author a story for the values-diff reporting surface |
| 9 | warning | consistency | STORY-75, STORY-76, STORY-77, STORY-78, STORY-79 | story-body-edit | All five stories still name the pre-consolidation capability structure retired on 2026-08-05. STORY-78 Technical Context: "Belongs to CAP-65 (1c Size-Aware Diffing)" — CAP-65 (capability-18a822ac) is `deprecated` and STORY-78's own `capability_uid` is capability-aa030c83. STORY-79: "Related capabilities: CAP-63 (1c Values-Diff Fidelity), CAP-65 (1c Size-Aware Diffing)" — CAP-63 is STORY-79's *own* capability, under its old name. STORY-77: "Generalizes CAP-63 (1c Values-Diff Fidelity)" — same-capability self-reference. STORY-76: "Sits alongside [[values_diff_fidelity]] (CAP-63)" — implies a sibling that is now the same capability. STORY-75: "Belongs to capability **1c Values-Diff Fidelity** (`capability-aa030c83`)" — correct UID, retired name | Update all five to the current name "1c Capture & Diff Fidelity" (CAP-63); replace cross-capability references to CAP-64/65/66 with intra-capability references to the sibling story |

## Notes for the Editor

**One systemic root under five of the eight violations.** BUNDLE-10
(`bundle-4ff83a8b`, `free_and_reconciled`, 2026-07-29) is the only reconciled
bundle in the project that appears as `intent_uid` or `updated_by` on **zero
stories anywhere in the matrix** — I checked all 25. Findings 2, 5, 6, 7 (BUG-22,
BUG-24, BUG-25, BUG-16) are all BUNDLE-10 members. Its other members were partly
rescued later: BUG-15, BUG-25 and BUG-27 were re-carried by BUNDLE-11
(`bundle-ee56a66e`), which *is* on STORY-75's `updated_by` — which is why BUG-27
is covered and BUG-24/BUG-22 are not. Repairing STORY-75 is the bulk of the work;
it would be worth re-walking BUNDLE-10's remaining members against the other
capabilities too, since the same hole plausibly cost CAP-70 and CAP-71 coverage.

**Three intents were reconciled with no bundle trail at all.** REQ-72, REQ-73 and
REQ-76 (all `free_and_reconciled`, all 2026-07-18) are named in **no** bundle
body, and all three are implemented and live in `tools/generate`. They fall in the
window between BUNDLE-6 (2026-07-17) and BUNDLE-7 (2026-07-22). Whatever set their
status did not route them through a bundle, so nothing downstream had an
opportunity to story them. Worth checking whether REQ-66..REQ-78 as a block share
this — REQ-74 and REQ-66 are cited in BUNDLE-7, the rest are not.

**Not a matrix-era artifact.** Findings 2–8 could look like they predate matrix
tracking, since every story in this project starts at BUNDLE-6 (2026-07-17). They
do not: all seven intents are dated *after* that boundary, and sibling intents
from the identical window (BUG-27, 2026-07-25) were reconciled into STORY-75. The
era boundary excuses nothing here.

**No `code-issue` findings.** Every gap above is the matrix failing to describe
working code, not code failing to do what the matrix describes. I verified each
one at a named file:line rather than inferring it from the ticket text.

**Level scope.** The capability's `uat_coverage: fail` and STORY-75's
`uat_coverage: needs_review` are UAT-level facts and were not assessed here.
Findings 2–8 will each require ACs and UATs downstream once the story bodies carry
the behaviour; the `ac-add` half of those resolution categories is a forward
signal, not an instruction to act at this level.
