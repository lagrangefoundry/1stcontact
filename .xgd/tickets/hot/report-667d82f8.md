---
uid: report-667d82f8
id: REPORT-2096
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=story)'
created_by: xgd
created_at: '2026-08-16T08:58:33.092225+00:00'
updated_at: '2026-08-16T08:58:33.092225+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: story
  violations: 9
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: story

**Result**: FAIL
**Violations**: 9
**Warnings**: 2
**Needs review**: 0

The five stories describe the intent they *do* cover accurately, and the capability
body's Scope bullet 4 (CLI mechanism) remains correct. The failure is **coverage**:
eight reconciled intents whose asked behaviour is live in production code inside this
capability's own declared scope are expressed in no story anywhere in the matrix, plus
one **consistency** violation where STORY-76 still presents a superseded authoring half
as live.

**Nothing has been repaired since the previous story-level cycle.** REPORT-1721
(2026-08-09, 8 violations / 2 warnings) is the immediately prior report. No story body
in this capability has been edited since: all five carry `updated_at`
2026-08-09T02:55 with `last_field_updated: uat_coverage`, i.e. a field write, not a
body edit. Every one of REPORT-1721's findings was re-verified against the current
tree at the file:line cited below rather than inherited. Finding 8 is **new** in this
cycle — a coverage hole REPORT-1721 did not raise (it recorded STORY-77 as aligned on
REQ-58's ladder).

## Cumulative Intent Considered

Stories record intent as *bundle* UIDs; the asks below are the REQ/BUG tickets those
bundles carry. Ordered by intent `created_at`. Every row is live cumulative intent —
no intent in this capability's tree is `abandoned`, `deprecated` or `wont_fix`.

| Intent ID | Reconciled via | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-44 | BUNDLE-16 (bundle-15c1f647) | free_and_reconciled | 2026-07-03 | Fail loud on out-of-sync node_modules; per-command dependency preflight | YES |
| REQ-58 | BUNDLE-6 (bundle-ab9e0cb6) | free_and_reconciled | 2026-07-13 | gigabytealchemy pass-3; multi-viewport values-diff wiring (T2/A); boolean-flag + `--json` hygiene; composited surface fill; box border; duplicate-text pairing | YES |
| REQ-59 | BUNDLE-6 | free_and_reconciled | 2026-07-13 | Capture text-fill gradient stop positions | YES |
| REQ-61 | BUNDLE-6 | free_and_reconciled | 2026-07-16 | `--size` on both diff commands; `responsive-diff` N-way cross-size analysis + classifier | YES |
| REQ-62 | BUNDLE-6 | free_and_reconciled | 2026-07-16 | Panel/surface gradient: capture + render + diff | YES |
| REQ-63 | BUNDLE-7 (bundle-31e474b9) | free_and_reconciled | 2026-07-17 | Coverage audit: capture + diff every render-affecting CSS axis | YES |
| REQ-64 | (no bundle body cites it) | free_and_reconciled | 2026-07-17 | Noise audit: every values-diff delta must be a real visible difference; per-defect (not per-cell) aggregation | YES |
| REQ-72 | (no bundle body cites it) | free_and_reconciled | 2026-07-18 | Hexify modern colour spaces in-browser so gradient stops capture at all | YES |
| REQ-73 | (no bundle body cites it) | free_and_reconciled | 2026-07-18 | values-diff `gap` axis (adjacent-row spacing) + drop the band-padding deltas it supersedes | YES |
| REQ-76 | (no bundle body cites it) | free_and_reconciled | 2026-07-18 | values-diff cause clustering: ranked cause view + `--clusters` + dispositions | YES |
| REQ-78 | BUNDLE-7, plan item 9 | free_and_reconciled | 2026-07-19 | `aligned-crops`; its store-selection routing is STORY-79 guarantee 3 | YES |
| REQ-84 | BUNDLE-7 | free_and_reconciled | 2026-07-20 | Framework pivot C: delete the layout modules (hero/text-block/footer/header/layer) | YES (retires) |
| REQ-89 | BUNDLE-8 (bundle-cceaba25) | free_and_reconciled | 2026-07-22 | Silence 'Missing pages directory'; Astro container constructed only on demand | YES |
| BUG-10 | BUNDLE-8 | free_and_reconciled | 2026-07-23 | Capture must not record `list-style-type` for non-list elements | YES |
| BUG-15 | BUNDLE-10 / BUNDLE-11 | free_and_reconciled | 2026-07-23 | Collapsed band drops the whole subtree — band extent must be the painted extent | YES |
| BUG-16 | BUNDLE-10 (bundle-4ff83a8b) | free_and_reconciled | 2026-07-23 | Offline re-extract must reach the mirrored faces, not the serif fallback | YES |
| REQ-91 | BUNDLE-8 | free_and_reconciled | 2026-07-23 | Capture/axis families for pixel-movers (treatments, effects, blend, transform/mask) | YES |
| BUG-22 | BUNDLE-10 | free_and_reconciled | 2026-07-24 | values-diff mis-attributes split text+box controls (phantom radius delta) | YES |
| BUG-24 | BUNDLE-10 | free_and_reconciled | 2026-07-24 | Translucent overlay/scrim invisible to capture (legacy `rgba()` regex) | YES |
| BUG-25 | BUNDLE-10 / BUNDLE-11 | free_and_reconciled | 2026-07-25 | A multi-run element gives every run the same box — needs per-text-node geometry | YES |
| BUG-27 | BUNDLE-10 / BUNDLE-11 | free_and_reconciled | 2026-07-25 | CSS background images and lazy-loaded media are not captured | YES |
| REQ-94 | BUNDLE-11 (bundle-ee56a66e) | free_and_reconciled | 2026-07-26 | Gate calibration — a clean value gate must not outvote a failing perceptual diff | YES (homed on STORY-86, CAP-71 — not a gap here) |
| REQ-96 | BUNDLE-11 | free_and_reconciled | 2026-07-26 | Behavior modules layout-agnostic: L1 `control` node; `config` never aesthetic | YES (retires) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-63 (capability body) | REQ-44, REQ-58, REQ-59, REQ-61, REQ-62, REQ-63, REQ-84, REQ-89, REQ-96 | aligned on the CLI-mechanism and ownership rules; Scope bullet 1's axis enumeration still omits the axes under findings 1–5, and Scope bullet 3 omits the ladder-wide `--multi-viewport` diff mode (finding 8) |
| STORY-75 (story-d5de22a5) | REQ-58, REQ-63, REQ-64 (partly), REQ-91, BUG-10, BUG-15, BUG-27, REQ-96 | aligned on those; gaps for REQ-73, BUG-22, BUG-24, BUG-25, BUG-16 (findings 1–5) and REQ-64's per-defect aggregation (finding 8) |
| STORY-76 (story-82eb6908) | REQ-59, REQ-62 | aligned on stop positions + surface gradients; gap for REQ-72 (finding 6); authoring half not reconciled against REQ-84 / REQ-96 (finding 9) |
| STORY-77 (story-16f2793c) | REQ-58 (ladder as input), REQ-61 (size-aware half) | aligned on the `--size` selector; treats the ladder-wide diff mode as pre-existing infrastructure that no story owns (finding 8) |
| STORY-78 (story-2c7069fe) | REQ-61 (cross-size half) | aligned |
| STORY-79 (story-e15a19ef) | REQ-58, REQ-78 (BUNDLE-7 plan item 9), REQ-89, REQ-44 | aligned; `fields.updated_by` under-reports its own provenance (warning 11) |
| — (unhomed) | REQ-76 | gap: no story in any of the 26 capabilities expresses it (finding 7) |
| — (unhomed) | REQ-58 T2/A + REQ-64 §3 | gap: the `--multi-viewport` diff mode and its collapsed reporting layer are owned by no story (finding 8) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-75 (story-d5de22a5) | story-body-edit + ac-add | REQ-73 (free_and_reconciled, 2026-07-18) adds the values-diff adjacent-`gap` axis — pair elements into visual rows, compare the gap between consecutive rows, and drop the section band-padding deltas it supersedes. Live and re-verified: `tools/generate/src/cli/capture/values-diff.ts:363-364` (`DeltaProperty` member under the REQ-73 banner), `:1406` (kind table), `:1530` (tolerance, default 6px / 16px under `--tolerant`), `:2276` (`gapPairs`), `:2493` (the axis), `:2575` (band-padding explicitly not compared). STORY-75 enumerates eleven closures; the gap axis is not among them, and no other story mentions it | Add the `gap` axis to STORY-75's captured/compared axis list, with its tolerance and the band-padding suppression it replaces |
| 2 | violation | coverage | STORY-75 (story-d5de22a5) | story-body-edit + ac-add | BUG-22 (free_and_reconciled, 2026-07-24) requires values-diff to resolve a split control's surface axes against the node that *bears* the surface. Live and re-verified: `values-diff.ts:2103` ("BUG-22 — SPLIT CONTROL"), `:2151` (hairline re-read off the backing box), `:137-144` (`ValueElement.surface`, "Absent on pre-BUG-22 manifests, which keeps the resolution inert"). This is an element-pairing/attribution rule — CAP-63 Scope bullet 1 — while STORY-75 item 4 covers duplicate-*text* pairing only | Add a split-control surface-attribution closure to STORY-75's Description, with the back-compat note (absent on pre-BUG-22 manifests → inert) |
| 3 | violation | coverage | STORY-75 (story-d5de22a5) | story-body-edit + ac-add | BUG-24 (free_and_reconciled, 2026-07-24) requires the band overlay/scrim to be detected through the canvas colour probe rather than a raw `rgba()` regex, so a veil computing to `color-mix(in oklab, …)` is not silently dropped. Live and re-verified: `tools/generate/src/cli/capture/extract.ts:265` (BUG-24 canvas serialization parse), `:1047` (`overlayOf`), `:1055` (BUG-24 comment: resolve the scrim through `rgbaOf`, not a regex), applied at `:1425`. STORY-75 item 9 *presupposes* this ("scrims already recorded as the band's overlay") but no story states the overlay axis is captured at all, or that it survives modern colour syntax | State the band-overlay capture axis explicitly in STORY-75, including the colour-space condition item 9's exclusion rule depends on |
| 4 | violation | coverage | STORY-75 (story-d5de22a5) | story-body-edit + ac-add | BUG-25 (free_and_reconciled, 2026-07-25) requires per-text-node run geometry — an element owning more than one run must not give every run the element's box. Live and re-verified: `extract.ts:666-676` (`textNodeBox`, "the painted extent of ONE text node, via a Range over that node"), `:1101-1124` (two-pass `runCounts`; `var ownRun = runCounts.get(el) === 1; var glyphs = ownRun ? renderedTextBox(el) : textNodeBox(n)`). STORY-75 item 1 describes the glyph-extent axis and its ratio comparison but not this recording condition, which its own In-scope line ("the conditions under which an axis records a value at all") claims | Add the multi-run condition to STORY-75 item 1: geometry off the element when it owns exactly one run, off the text node otherwise |
| 5 | violation | coverage | STORY-75 (story-d5de22a5) | story-body-edit + ac-add | BUG-16 (free_and_reconciled, 2026-07-23) requires a captured bundle to re-extract offline against its own mirrored faces, or every glyph metric is measured against the serif fallback and `fontLoaded:false` is persisted. Live and re-verified: `tools/generate/src/cli/capture/reextract.ts:50` (`rewriteMirroredRefs`), `:67` (BUG-16 comment), `:100` (applied when serving `rendered.html`). No story expresses it; STORY-92 (CAP-89) covers font *licence* provenance only. STORY-75 item 7 additionally frames a reference `fontLoaded:false` as an accepted capture-side FOUT artifact, which reads as tension with BUG-16 having fixed its dominant cause | Add the offline-re-extract mirrored-reference rule to STORY-75's capture scope, and reword item 7 so tolerating residual FOUT is explicitly the remainder *after* BUG-16 |
| 6 | violation | coverage | STORY-76 (story-82eb6908) | story-body-edit + ac-add | REQ-72 (free_and_reconciled, 2026-07-18) requires gradient stop colours to be resolved to `#rrggbb` **in-browser**, because a Tailwind-authored gradient computes to `oklch`/`oklab`/`color()` the TS-side stop regex cannot parse — without it a card gradient captures angle-only with empty stops, i.e. the stop-position axis STORY-76 is built on has nothing to compare. Live and re-verified: `extract.ts:334` (`hexifyGradient`), applied at `:846` (surface gradient) and `:1132` (text-fill gradient). STORY-76's In-scope line reads "capture of stop positions and surface gradients" and excludes it by its own wording | Extend STORY-76's In-scope line and Description to cover in-browser colour-space resolution of stop colours as the precondition that makes stops capturable |
| 7 | violation | coverage | (no element — unhomed) | story-body-edit + ac-add | REQ-76 (free_and_reconciled, 2026-07-18) requires values-diff cause clustering: counted defects rolled into ranked causes with count, worst tier, representative elements and a fix/review/accept disposition, surfaced by `--clusters`, and viewport-aware so a mobile-only cause is not merged into a desktop one. Live and re-verified: `tools/generate/src/cli/fidelity.ts:436-459` (`DefectCause` dispositions + the property→cause taxonomy), `:478` (`clusterDefects`), `:507-520` (`formatClusterReport`), `tools/generate/src/cli/index.ts:268, 784-790` (`flags.clusters`). No story in any of the 26 capabilities expresses it | Add the cause-clustering view (taxonomy, dispositions, `--clusters`, viewport-awareness) to STORY-75, or author a story for the values-diff reporting surface |
| 8 | violation | coverage | (no element — unhomed; STORY-77 story-16f2793c is the nearest owner) | story-body-edit + ac-add | **New this cycle.** REQ-58 (free_and_reconciled, 2026-07-13) T2/A wired the *ladder-wide* values-diff: capture persists the reference across the viewport ladder (`multistate.json`), and `1c values-diff <slug> --ref <bundle> --multi-viewport` projects the served draft across that ladder, diffs cell-for-cell and reports worst-cell-first, terminal-failing on a bundle with no ladder. REQ-64 (free_and_reconciled, 2026-07-17) noise source #3 then adds `--collapse` — dedup to one row per DEFECT so the ×6-viewport multiplier stops inflating the count. Live and re-verified: `fidelity.ts:199` (`cmdValuesDiffMultiViewport`), `:195-204` (STALE REFERENCE refusal naming the re-capture remedy), `:242` (`formatMultiViewportReport`), `:318` (`collapseMultiViewport`), `index.ts:265` (usage), `:266` (REQ-64 `--collapse`), `:767, 779-790`. Expressed nowhere: STORY-77 owns only the caller-chosen `--size` path and treats the ladder as pre-existing input ("This reuses the multi-viewport capture landed under REQ-58"); STORY-78 owns the standalone `responsive-diff`; STORY-79 names `--multi-viewport` only as an argv-parsing case. CAP-63 Scope bullet 3 omits it too | Extend STORY-77 (or author a sibling story) to own the ladder-wide diff mode: ladder persistence at capture, cell-for-cell projection, worst-cell-first ordering, the stale-reference refusal, and the `--collapse` per-defect reporting layer; add it to CAP-63 Scope bullet 3 |
| 9 | violation | consistency | STORY-76 (story-82eb6908) | story-body-edit | STORY-76's user-story sentence and Description still present gradients as "authorable as a content value that resolves to a surface fill" via `resolveSurfaceGradient`, with no supersession note. REQ-84 (free_and_reconciled, 2026-07-20) deleted the layout modules, and REQ-96 (free_and_reconciled, 2026-07-26) forbids aesthetic values in a module's config. Re-verified: `resolveSurfaceGradient` (`packages/framework/src/modules/text-style.ts:223`) has **zero production callers** — the only references are two re-exports (`packages/framework/src/modules/index.ts:9`, `packages/framework/src/index.ts:33`) and two test files (`tests/req62-gradient-panel.test.ts:9`, `tests/reconciliation-l1-one-colour-system.test.ts:33`). The capability body records exactly this ("the legacy *module content-field* gradient … which the REQ-84 / REQ-96 pivot superseded and which the L1 renderer never calls", added 2026-08-08 by overlap cluster 4); the story body has not been brought into line | Mark STORY-76's authoring half as the superseded legacy module content-field path in the story body (matching CAP-63's Scope bullet 2), scoping the live story to capture + diff; the AC naming the deleted `text-block` host then needs `ac-deprecate` downstream |
| 10 | warning | consistency | STORY-75, STORY-76, STORY-77, STORY-78, STORY-79 | story-body-edit | All five still name the pre-consolidation structure retired 2026-08-05. STORY-78: "Belongs to CAP-65 (1c Size-Aware Diffing)" — capability-18a822ac is `deprecated`, and STORY-78's own `capability_uid` is capability-aa030c83. STORY-79: "Related capabilities: CAP-63 (1c Values-Diff Fidelity), CAP-65 …" — CAP-63 is its own capability, under its retired name. STORY-77: "Generalizes CAP-63 (1c Values-Diff Fidelity)" — same-capability self-reference. STORY-76: "Sits alongside [[values_diff_fidelity]] (CAP-63)". STORY-75: "Belongs to capability **1c Values-Diff Fidelity**" — right UID, retired name. Carried unrepaired from REPORT-1643 and REPORT-1721 | Update all five to "1c Capture & Diff Fidelity" (CAP-63); replace references to CAP-64/65/66 with intra-capability references to the sibling story |
| 11 | warning | consistency | STORY-75, STORY-79 | story-body-edit (fields) | The `fields.updated_by` provenance chains under-report the intents these stories actually reconcile, which is precisely what this ledger exists to prevent. STORY-79's body cites "Guarantee 3 reconciled from bundle-31e474b9 (BUNDLE-7), plan item 9, commit 09fa7cf5" while its `updated_by` is only `bundle-15c1f647`. STORY-75 reconciles REQ-63 (BUNDLE-7) while its `updated_by` lists only `bundle-cceaba25` and `bundle-ee56a66e`. Neither story names BUNDLE-10 (`bundle-4ff83a8b`), the source of findings 2–5 | Add `bundle-31e474b9` to both chains and `bundle-4ff83a8b` to STORY-75's when findings 2–5 are repaired |

## Notes for the Editor

**Nothing has been repaired since REPORT-1721 (2026-08-09).** All five story bodies are
byte-identical to that cycle (`last_field_updated: uat_coverage` on every one), so its
findings 1–8 recur here as findings 1–7 and 9, each re-verified at the file:line above
against the current tree rather than inherited. Findings 10 and 11 are its warnings 9
and 10, likewise unrepaired and also carried from REPORT-1643 (2026-08-07). If the
editor works this report, working REPORT-1721 as well would be redundant.

**Finding 8 is new and was missed by both prior cycles.** REPORT-1721 recorded STORY-77
as "aligned — REQ-58 (ladder), REQ-61 (size-aware half)". STORY-77 does *mention* the
ladder, but only as the data source its `--size` selector reads from; it explicitly
scopes itself to a caller-chosen width and says the no-flag path is "the pre-existing
single-width (≈ desktop) path … unchanged". The ladder-wide mode REQ-58 T2/A actually
built — project across every rung, diff cell-for-cell, order worst-cell-first, refuse a
stale bundle — plus REQ-64's `--collapse` de-duplication over it, is described by no
story. This is the largest unowned surface in the capability: it is the mode the
gigabytealchemy reproduction was actually driven with (1603 → 1191 deltas across the
BUNDLE-6 T-work), and the mode whose reference count every noise-audit decision was
calibrated against.

**One systemic root under four of the nine violations.** BUNDLE-10 (`bundle-4ff83a8b`,
free_and_reconciled) appears as `intent_uid` or `updated_by` on **zero** stories
anywhere in the matrix. Findings 2, 3, 4, 5 (BUG-22, BUG-24, BUG-25, BUG-16) are all
BUNDLE-10 members. Its other members were partly rescued by BUNDLE-11
(`bundle-ee56a66e`), which *is* on STORY-75's `updated_by` — which is why BUG-27 is
covered and these four are not. BUNDLE-10's remaining members are worth re-walking
against CAP-70 and CAP-71 for the same hole.

**Three intents were reconciled with no bundle trail at all.** REQ-72, REQ-73 and
REQ-76 (all free_and_reconciled, all 2026-07-18) are named in no bundle body — I
enumerated the source lists of all 17 bundles — and all three are implemented and live
in `tools/generate`. They fall between BUNDLE-6 (2026-07-17) and BUNDLE-7 (2026-07-22).
Whatever set their status did not route them through a bundle, so nothing downstream
had an opportunity to story them.

**Not a matrix-era artifact.** Every story in this project starts at BUNDLE-6
(2026-07-17), so these gaps could look pre-matrix. They are not: all the intents above
are dated after that boundary, and sibling intents from the identical window (BUG-27,
2026-07-25) *were* reconciled into STORY-75.

**REQ-94 is not a gap here.** "Gate calibration — a clean value gate must not outvote a
failing perceptual diff" arrives via BUNDLE-11 and touches this capability's animating
invariant, but it is homed on STORY-86 (End-to-end 3-probe reproduction acceptance
gate, CAP-71), the correct owner under CAP-63's own out-of-scope clause. No action.

**No `code-issue` findings.** Every gap above is the matrix failing to describe working
code, not code failing to do what the matrix describes. Every cited symbol was read in
the current worktree during this cycle.

**Level scope.** The capability's `uat_coverage: fail` and STORY-76's `uat_coverage:
stale` are UAT-level facts and were not assessed here. Findings 1–9 will each need ACs
and UATs downstream once the story bodies carry the behaviour; the `ac-add` /
`ac-deprecate` halves are a forward signal, not an instruction to act at this level.
