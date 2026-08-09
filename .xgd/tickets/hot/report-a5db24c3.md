---
uid: report-a5db24c3
id: REPORT-1721
type: report
title: 'Capability-Intent Alignment: 1c_capture_diff_fidelity (level=story)'
created_by: xgd
created_at: '2026-08-09T02:02:08.213657+00:00'
updated_at: '2026-08-09T02:02:08.213657+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: story
  violations: 8
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c_capture_diff_fidelity
# Level: story

**Result**: FAIL
**Violations**: 8
**Warnings**: 2
**Needs review**: 0

The five stories accurately describe the intent they *do* cover, and the capability
body's Scope bullet 4 has been repaired since the last cycle (REPORT-1643 finding 1
is closed). The failure is again **coverage**: seven reconciled intents whose asked
behaviour is live in production code inside this capability's own declared scope are
expressed in no story anywhere in the matrix — all seven carried over unrepaired from
REPORT-1643 (2026-08-07), each re-verified at a named file:line in this cycle. One
new **consistency** violation has appeared since that report: STORY-76 still presents
its gradient *authoring* half as live, while the capability body (updated 2026-08-08
by overlap cluster 4) now records that REQ-84 / REQ-96 superseded it.

## Cumulative Intent Considered

Stories record intent as *bundle* UIDs; the asks below are the REQ/BUG tickets those
bundles carry. Ordered by intent `created_at`. Every row is live cumulative intent —
no intent in this capability's tree is `abandoned`, `deprecated` or `wont_fix`, and
nothing in the ledger retires an earlier ask except where noted.

| Intent ID | Reconciled via | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-44 | BUNDLE-16 (bundle-15c1f647) | free_and_reconciled | 2026-07-03 | Fail loud on out-of-sync node_modules; per-command dependency preflight | YES |
| REQ-58 | BUNDLE-6 (bundle-ab9e0cb6) | free_and_reconciled | 2026-07-13 | gigabytealchemy pass-3; multi-viewport values-diff wiring; boolean-flag + `--json` hygiene; rendered-text extent | YES |
| REQ-59 | BUNDLE-6 | free_and_reconciled | 2026-07-13 | Capture text-fill gradient stop positions | YES |
| REQ-61 | BUNDLE-6 | free_and_reconciled | 2026-07-16 | `responsive-diff` N-way cross-size analysis; per-discrete-size objective | YES |
| REQ-62 | BUNDLE-6 | free_and_reconciled | 2026-07-16 | Panel/surface gradient: capture + render + diff | YES |
| REQ-63 | BUNDLE-7 (bundle-31e474b9) | free_and_reconciled | 2026-07-17 | Coverage audit: capture + diff every render-affecting CSS axis | YES |
| REQ-64 | (no bundle body cites it) | free_and_reconciled | 2026-07-17 | Noise audit: every values-diff delta must be a real visible difference | YES |
| REQ-72 | (no bundle body cites it) | free_and_reconciled | 2026-07-18 | Hexify modern colour spaces in-browser so gradient stops capture at all | YES |
| REQ-73 | (no bundle body cites it) | free_and_reconciled | 2026-07-18 | values-diff `gap` axis (adjacent-row spacing) + drop band-padding deltas | YES |
| REQ-76 | (no bundle body cites it) | free_and_reconciled | 2026-07-18 | values-diff cause clustering: ranked cause view + `--clusters` + dispositions | YES |
| REQ-84 | BUNDLE-7 | free_and_reconciled | 2026-07-20 | Framework pivot C: delete the layout modules (hero/text-block/footer/header/…) | YES (retires) |
| REQ-89 | BUNDLE-8 (bundle-cceaba25) | free_and_reconciled | 2026-07-22 | Silence 'Missing pages directory'; Astro container constructed only on demand | YES |
| BUG-10 | BUNDLE-8 | free_and_reconciled | 2026-07-23 | Capture must not record `list-style-type` for non-list elements | YES |
| BUG-15 | BUNDLE-10 / BUNDLE-11 | free_and_reconciled | 2026-07-23 | Collapsed band drops the whole subtree — band extent must be the painted extent | YES |
| BUG-16 | BUNDLE-10 (bundle-4ff83a8b) | free_and_reconciled | 2026-07-23 | Offline re-extract must reach the mirrored faces, not the serif fallback | YES |
| REQ-91 | BUNDLE-8 | free_and_reconciled | 2026-07-23 | Capture/axis families for pixel-movers (treatments, effects, blend, transform/mask) | YES |
| BUG-22 | BUNDLE-10 | free_and_reconciled | 2026-07-24 | values-diff mis-attributes split text+box controls (phantom radius delta) | YES |
| BUG-24 | BUNDLE-10 | free_and_reconciled | 2026-07-24 | Translucent overlay/scrim invisible to capture (legacy `rgba()` regex) | YES |
| BUG-25 | BUNDLE-10 / BUNDLE-11 | free_and_reconciled | 2026-07-25 | A multi-run element gives every run the same box — needs per-text-node geometry | YES |
| BUG-27 | BUNDLE-10 / BUNDLE-11 | free_and_reconciled | 2026-07-25 | CSS background images and lazy-loaded media are not captured | YES |
| REQ-96 | BUNDLE-11 (bundle-ee56a66e) | free_and_reconciled | 2026-07-26 | Behavior modules layout-agnostic: L1 `control` node; `config` never aesthetic | YES (retires) |
| REQ-94 | BUNDLE-11 | free_and_reconciled | 2026-07-26 | Gate calibration — a clean value gate must not outvote a failing perceptual diff | YES (homed on STORY-86, CAP-71 — not a gap here) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-63 (capability body) | REQ-58, REQ-59, REQ-61, REQ-62, REQ-63, REQ-84, REQ-89, REQ-96, REQ-44 | aligned — Scope bullet 4 now names flag propagation, the on-demand Astro container and the install preflight (REPORT-1643 finding 1 repaired); its axis enumeration in bullet 1 still omits the axes under findings 1–5 |
| STORY-75 | REQ-58, REQ-63, REQ-64, REQ-91, BUG-10, BUG-15, BUG-27, REQ-96 | aligned on those; gaps for REQ-73, BUG-22, BUG-24, BUG-25, BUG-16 (findings 1, 2, 3, 4, 5) |
| STORY-76 | REQ-59, REQ-62 | aligned on stop positions + surface gradients; gap for REQ-72 (finding 6); authoring half not reconciled against REQ-84 / REQ-96 (finding 8) |
| STORY-77 | REQ-58 (ladder), REQ-61 (size-aware half) | aligned |
| STORY-78 | REQ-61 (cross-size half) | aligned |
| STORY-79 | REQ-58, REQ-89, REQ-44, BUNDLE-7 plan item 9 | aligned; `fields.updated_by` under-reports its own provenance (warning 10) |
| — (unhomed) | REQ-76 | gap: no story in any of the 25 expresses it (finding 7) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-75 (story-d5de22a5) | story-body-edit + ac-add | REQ-73 (free_and_reconciled, 2026-07-18) adds the values-diff adjacent-`gap` axis — pair elements into visual rows, compare the gap between consecutive rows, and drop the section band-padding deltas it supersedes. Live: `tools/generate/src/cli/capture/values-diff.ts:364` (`DeltaProperty` member), `:1406` (kind table), `:2276` (`gapPairs`, comment "REQ-73 — every paired element with a box, for the adjacent-gap axis"), `:2533`. STORY-75 enumerates eleven closures; the gap axis is not among them, and no other story mentions it | Add the `gap` axis to STORY-75's captured/compared axis list, including the band-padding suppression it replaces |
| 2 | violation | coverage | STORY-75 (story-d5de22a5) | story-body-edit + ac-add | BUG-22 (free_and_reconciled, 2026-07-24) requires values-diff to resolve a split control's surface axes against the node that *bears* the surface. Live: `values-diff.ts:2103-2125` ("BUG-22 — SPLIT CONTROL"; `exp.surface?.self === true && act.surface && !act.surface.self`, then radius/shadow/position re-read off the backing box). This is an element-pairing/attribution rule — CAP-63 Scope bullet 1 — while STORY-75 item 4 covers duplicate-*text* pairing only | Add a split-control surface-attribution closure to STORY-75's Description, with the back-compat note (absent on pre-BUG-22 manifests → inert) |
| 3 | violation | coverage | STORY-75 (story-d5de22a5) | story-body-edit + ac-add | BUG-24 (free_and_reconciled, 2026-07-24) requires the band overlay/scrim to be detected through the canvas colour probe rather than a raw `rgba()` regex, so a Tailwind v4 veil computing to `color-mix(in oklab, …)` is not silently dropped. Live: `tools/generate/src/cli/capture/extract.ts:1047-1071` (`overlayOf` → `rgbaOf`, explicit BUG-24 comment), applied at `:1425`. STORY-75 item 9 *presupposes* this ("scrims already recorded as the band's overlay") but no story states the overlay axis is captured at all, or that it survives modern colour syntax | State the band-overlay capture axis explicitly in STORY-75, including the colour-space condition item 9's exclusion rule depends on |
| 4 | violation | coverage | STORY-75 (story-d5de22a5) | story-body-edit + ac-add | BUG-25 (free_and_reconciled, 2026-07-25) requires per-text-node run geometry — an element owning more than one run must not give every run the element's box. Live: `extract.ts:676` (`textNodeBox`) and `:1106-1124` (two-pass `runCounts`; `var ownRun = runCounts.get(el) === 1; var glyphs = ownRun ? renderedTextBox(el) : textNodeBox(n)`). STORY-75 item 1 describes the glyph-extent axis and its ratio comparison but not this recording condition, which its own In-scope line ("the conditions under which an axis records a value at all") claims | Add the multi-run condition to STORY-75 item 1: geometry off the element when it owns exactly one run, off the text node otherwise |
| 5 | violation | coverage | STORY-75 (story-d5de22a5) | story-body-edit + ac-add | BUG-16 (free_and_reconciled, 2026-07-23) requires a captured bundle to re-extract offline against its own mirrored faces, or every glyph metric is measured against the serif fallback and `fontLoaded:false` is persisted. Live: `tools/generate/src/cli/capture/reextract.ts:50` (`rewriteMirroredRefs`) and `:100` (applied when serving `rendered.html`). No story expresses it; STORY-92 (CAP-89) covers font *licence* provenance only. STORY-75 item 7 additionally frames a reference `fontLoaded:false` as an accepted capture-side FOUT artifact, which reads as tension with BUG-16 having fixed its dominant cause | Add the offline-re-extract mirrored-reference rule to STORY-75's capture scope, and reword item 7 so tolerating residual FOUT is explicitly the remainder *after* BUG-16 |
| 6 | violation | coverage | STORY-76 (story-82eb6908) | story-body-edit + ac-add | REQ-72 (free_and_reconciled, 2026-07-18) requires gradient stop colours to be resolved to `#rrggbb` **in-browser**, because a Tailwind-authored gradient computes to `oklch`/`oklab`/`color()` the TS-side stop regex cannot parse — without it a card gradient captures angle-only with empty stops, i.e. the stop-position axis STORY-76 is built on has nothing to compare. Live: `extract.ts:334` (`hexifyGradient`), applied at `:846` (surface gradient) and `:1132` (text-fill gradient). STORY-76's In-scope line reads "capture of stop positions and surface gradients" and excludes it by its own wording | Extend STORY-76's In-scope line and Description to cover in-browser colour-space resolution of stop colours as the precondition that makes stops capturable |
| 7 | violation | coverage | (no element — unhomed) | story-body-edit + ac-add | REQ-76 (free_and_reconciled, 2026-07-18) requires values-diff cause clustering: counted defects rolled into ranked causes with count, worst tier, representative elements and a fix/review/accept disposition, surfaced by `--clusters`. Live: `tools/generate/src/cli/fidelity.ts` (`clusterDefects`, `formatClusterReport`) and `tools/generate/src/cli/index.ts:260, 759-768` (`flags.clusters`). No story in any of the 25 expresses it | Add the cause-clustering view (taxonomy, dispositions, `--clusters`, viewport-awareness) to STORY-75, or author a story for the values-diff reporting surface |
| 8 | violation | consistency | STORY-76 (story-82eb6908) | story-body-edit | STORY-76's user-story sentence and Description still present gradients as "authorable as a content value that resolves to a surface fill" via `resolveSurfaceGradient`, with no supersession note. REQ-84 (free_and_reconciled, 2026-07-20) deleted the layout modules — `packages/framework/src/modules/` no longer contains `text-block`, the module AC-637 names as the host of the authored gradient panel — and REQ-96 (free_and_reconciled, 2026-07-26) forbids aesthetic values in a module's config. `resolveSurfaceGradient` (`packages/framework/src/modules/text-style.ts:223`) now has **zero production callers**: the only importers are `tests/req62-gradient-panel.test.ts:9` and `tests/reconciliation-l1-one-colour-system.test.ts:33`. The capability body records exactly this ("the legacy *module content-field* gradient … which the REQ-84 / REQ-96 pivot superseded and which the L1 renderer never calls", added 2026-08-08 by overlap cluster 4); the story body has not been brought into line | Mark STORY-76's authoring half as the superseded legacy module content-field path in the story body (matching CAP-63's Scope bullet 2), scoping the live story to capture + diff; AC-637 (which names the deleted `text-block`) then needs `ac-deprecate` downstream |
| 9 | warning | consistency | STORY-75, STORY-76, STORY-77, STORY-78, STORY-79 | story-body-edit | All five still name the pre-consolidation structure retired 2026-08-05. STORY-78: "Belongs to CAP-65 (1c Size-Aware Diffing)" — capability-18a822ac is `deprecated` with `merged_into: capability-aa030c83`, and STORY-78's own `capability_uid` is capability-aa030c83. STORY-79: "Related capabilities: CAP-63 (1c Values-Diff Fidelity), CAP-65 …" — CAP-63 is its own capability, under its retired name. STORY-77: "Generalizes CAP-63 (1c Values-Diff Fidelity)" — same-capability self-reference. STORY-76: "Sits alongside [[values_diff_fidelity]] (CAP-63)". STORY-75: "Belongs to capability **1c Values-Diff Fidelity**" — right UID, retired name. Carried unrepaired from REPORT-1643 finding 9 | Update all five to "1c Capture & Diff Fidelity" (CAP-63); replace references to CAP-64/65/66 with intra-capability references to the sibling story |
| 10 | warning | consistency | STORY-75, STORY-79 | story-body-edit (fields) | The `fields.updated_by` provenance chains under-report the intents these stories actually reconcile, which is precisely what this ledger exists to prevent. STORY-79's body cites "Guarantee 3 reconciled from bundle-31e474b9 (BUNDLE-7), plan item 9, commit 09fa7cf5" while its `updated_by` is only `bundle-15c1f647`. STORY-75 reconciles REQ-63 (BUNDLE-7) in items 3, 5 and 6 — the code carries the `REQ-63` labels at `values-diff.ts:340-352` — while its `updated_by` lists only `bundle-cceaba25` and `bundle-ee56a66e`. Neither story names BUNDLE-10 (`bundle-4ff83a8b`), the source of findings 2–5 | Add `bundle-31e474b9` to both chains and `bundle-4ff83a8b` to STORY-75's when findings 2–5 are repaired |

## Notes for the Editor

**Nothing from REPORT-1643's coverage set has been repaired.** That report (2026-08-07,
8 violations) is the immediately prior story-level cycle. Its finding 1 (capability
Scope bullet 4 not covering STORY-79 guarantees 3–5) **is** now repaired — the body
was rewritten on 2026-08-08 and names flag propagation, the on-demand Astro container
and the dependency preflight. Findings 2–8 of that report are findings 1–7 here,
re-verified in this cycle at the file:line cited in each row rather than inherited.
Finding 8 here is new since that report.

**One systemic root under four of the eight violations.** BUNDLE-10
(`bundle-4ff83a8b`, free_and_reconciled) appears as `intent_uid` or `updated_by` on
**zero** stories anywhere in the matrix — checked against all 25. Findings 2, 3, 4, 5
(BUG-22, BUG-24, BUG-25, BUG-16) are all BUNDLE-10 members. Its other members were
partly rescued by BUNDLE-11 (`bundle-ee56a66e`), which *is* on STORY-75's
`updated_by` — which is why BUG-27 is covered and these four are not. It is worth
re-walking BUNDLE-10's remaining members against CAP-70 and CAP-71 for the same hole.

**Three intents were reconciled with no bundle trail at all.** REQ-72, REQ-73 and
REQ-76 (all free_and_reconciled, all 2026-07-18) are named in no bundle body — I
enumerated the source lists of all 16 bundles — and all three are implemented and
live in `tools/generate`. They fall between BUNDLE-6 (2026-07-17) and BUNDLE-7
(2026-07-22). Whatever set their status did not route them through a bundle, so
nothing downstream had an opportunity to story them.

**Not a matrix-era artifact.** Every story in this project starts at BUNDLE-6
(2026-07-17), so these gaps could look pre-matrix. They are not: all seven intents
are dated after that boundary, and sibling intents from the identical window
(BUG-27, 2026-07-25) *were* reconciled into STORY-75.

**REQ-94 is not a gap here.** "Gate calibration — a clean value gate must not outvote
a failing perceptual diff" arrives via BUNDLE-11 and touches this capability's
animating invariant, but it is homed on STORY-86 (End-to-end 3-probe reproduction
acceptance gate, CAP-71), which is the correct owner under CAP-63's own out-of-scope
clause. No action.

**No `code-issue` findings.** Every gap above is the matrix failing to describe
working code, not code failing to do what the matrix describes.

**Level scope.** The capability's `uat_coverage: fail` is a UAT-level fact and was
not assessed here. Findings 1–8 will each need ACs and UATs downstream once the story
bodies carry the behaviour; the `ac-add` / `ac-deprecate` halves are a forward signal,
not an instruction to act at this level.
