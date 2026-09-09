---
uid: report-77da6b92
id: REPORT-3582
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=story)'
created_by: xgd
created_at: '2026-09-09T23:37:00.961183+00:00'
updated_at: '2026-09-09T23:37:00.961183+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: story
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 3
**Needs review**: 0

Seven stories, all aligned. **All 11 violations and all 3 warnings of REPORT-3580
(2026-09-09T23:23) are repaired**, and each repair was re-verified this cycle
against the ticket store *and* against the production code the story text now
claims — not taken from REPORT-3581's fix summary. Three warning-level residuals
survive: two stale structural references the finding-12 sweep did not reach, and
one now-moot open-defect note in the capability's own History.

## Cumulative Intent Considered

Stories record intent as *bundle* UIDs; the asks below are the REQ/BUG tickets
those bundles carry. Ordered by intent `created_at`. Statuses re-read this cycle.
No intent in this capability's tree is `abandoned`, `deprecated` or `wont_fix`,
so Step 2.5's stale-vehicle case does not arise anywhere here.

| Intent ID | Reconciled via | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-44 | BUNDLE-16 (bundle-15c1f647) | free_and_reconciled | 2026-07-03 | Fail loud on out-of-sync `node_modules`; per-command dependency preflight | YES |
| REQ-58 | BUNDLE-6 (bundle-ab9e0cb6) | free_and_reconciled | 2026-07-13 | Ladder-wide `--multi-viewport` values-diff (T2/A); boolean-flag + `--json` hygiene; composited surface fill; box border; duplicate-text pairing | YES |
| REQ-59 | BUNDLE-6 | free_and_reconciled | 2026-07-13 | Capture text-fill gradient stop positions | YES |
| REQ-61 | BUNDLE-6 | free_and_reconciled | 2026-07-16 | `--size` on both diff commands; `responsive-diff` N-way analysis + classifier | YES |
| REQ-62 | BUNDLE-6 | free_and_reconciled | 2026-07-16 | Panel/surface gradient: capture + render + diff | YES |
| REQ-63 | BUNDLE-7 (bundle-31e474b9) | free_and_reconciled | 2026-07-17 | Coverage audit: capture + diff every render-affecting CSS axis | YES |
| REQ-64 | (no bundle body cites it) | free_and_reconciled | 2026-07-17 | Noise audit; per-defect (not per-cell) aggregation | YES |
| REQ-72 | (no bundle body cites it) | free_and_reconciled | 2026-07-18 | Hexify modern colour spaces in-browser so gradient stops capture at all | YES |
| REQ-73 | (no bundle body cites it) | free_and_reconciled | 2026-07-18 | values-diff adjacent-`gap` axis + drop the band-padding deltas it supersedes | YES |
| REQ-76 | (no bundle body cites it) | free_and_reconciled | 2026-07-18 | values-diff cause clustering: ranked causes + `--clusters` + dispositions | YES |
| REQ-78 | BUNDLE-7, plan item 9 | free_and_reconciled | 2026-07-19 | `aligned-crops`; its store-selection routing is STORY-79 guarantee 3 | YES |
| REQ-84 | BUNDLE-7 | free_and_reconciled | 2026-07-20 | Framework pivot C: delete the layout modules | YES (retires) |
| REQ-89 | BUNDLE-8 (bundle-cceaba25) | free_and_reconciled | 2026-07-22 | Silence 'Missing pages directory'; Astro container on demand | YES (superseded by REQ-150) |
| BUG-10 | BUNDLE-8 | free_and_reconciled | 2026-07-23 | No `list-style-type` for non-list elements | YES |
| BUG-15 | BUNDLE-10 / BUNDLE-11 | free_and_reconciled | 2026-07-23 | values-diff cannot read L1-rendered pages | YES |
| BUG-16 | BUNDLE-10 (bundle-4ff83a8b) | free_and_reconciled | 2026-07-23 | Offline re-extract must reach the bundle's mirrored faces | YES |
| REQ-91 | BUNDLE-8 | free_and_reconciled | 2026-07-23 | Capture/axis families for pixel-movers (treatments, effects, blend, transform/mask) | YES |
| BUG-22 | BUNDLE-10 | free_and_reconciled | 2026-07-24 | Split text+box control mis-attribution (phantom radius delta) | YES |
| BUG-24 | BUNDLE-10 | free_and_reconciled | 2026-07-24 | Colour alpha not representable — translucent overlay/scrim invisible | YES |
| BUG-25 | BUNDLE-10 / BUNDLE-11 | free_and_reconciled | 2026-07-25 | Multi-line text splits into runs that all share one box | YES |
| BUG-27 | BUNDLE-10 / BUNDLE-11 | free_and_reconciled | 2026-07-25 | CSS background images and lazy-loaded media not captured | YES |
| REQ-94 | BUNDLE-11 (bundle-ee56a66e) | free_and_reconciled | 2026-07-25 | Gate calibration | YES (homed on STORY-86, CAP-71 — not a gap here) |
| REQ-96 | BUNDLE-11 | free_and_reconciled | 2026-07-26 | Behavior modules layout-agnostic; `config` never aesthetic | YES (retires) |
| REQ-150 | BUNDLE-20 (bundle-b3b7c399) | free_and_reconciled | 2026-08-18 | Launcher boots a plain Vite SSR server; Astro leaves the repo; render path names no build transform | YES (retires REQ-89's conditional form) |
| REQ-154 | BUNDLE-22 (bundle-8eef3846) | bundled | 2026-08-20 | Browser Rendering driver behind the `BrowserDriver` seam; self-origin fulfilment | imminent — bundle is `free_and_reconciled`; treated as live |

**No intent has entered this capability since REQ-154.** The full `request`
ledger (157 tickets) was re-scanned this cycle: everything created after
2026-08-20 that could plausibly touch capture (REQ-155 "Capture in workerd",
REQ-156 "sharp off the fidelity path", REQ-157 "the fidelity surface", REQ-166
"Capture to ticket") is `draft` and therefore does not count toward cumulative
intent. There is no new coverage gap from newer work.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-63 (capability-aa030c83, body) | REQ-44, 58, 59, 61, 62, 63, 64, 72, 73, 76, 84, 96, 150, 154 | **aligned.** Scope bullet 4 now carries REQ-150's unconditional form (the Astro-container clause is gone); bullet 1 enumerates the gap, overlay, run-geometry, marker-precondition and re-extract axes; bullet 3 carries `--multi-viewport` / `--collapse` / `--clusters`; a fifth bullet for deployed-runtime capture now places STORY-124/125 from Scope alone. One stale note in History (warning 3) |
| STORY-75 (story-d5de22a5) | REQ-58, 63, 64, 73, 91, 96, BUG-10, 15, 16, 22, 24, 25, 27 | **aligned.** All five prior gaps closed in place: BUG-25 multi-run geometry (item 1), BUG-22 split-control attribution (item 4), BUG-24 band overlay through the colour probe (item 9), BUG-16 offline re-extract with the FOUT residual reworded (item 7), REQ-73 adjacent-row gap with band-padding supersession (item 12). `updated_by` now names bundle-31e474b9 and bundle-4ff83a8b |
| STORY-76 (story-82eb6908) | REQ-59, 62, 72, 84 (retires), 96 (retires) | **aligned.** REQ-72's in-browser hex resolution added as item 0 and framed as the precondition; the authoring half is now explicitly "(superseded — legacy module content-field path)" with the zero-production-callers evidence and the CAP-70 routing. AC-637 is genuinely `status: deprecated` (verified, not merely `lifecycle`) |
| STORY-77 (story-16f2793c) | REQ-58 (T2/A), REQ-61, REQ-64, REQ-76 | **aligned.** The largest prior gap is closed: the story now owns ladder persistence (item 5), `--multi-viewport` (item 6), `--collapse` (item 7) and `--clusters` (item 8), with the provenance chain recorded in Technical Context. REQ-76 is no longer unhomed |
| STORY-78 (story-2c7069fe) | REQ-61 (cross-size half) | aligned; retired-capability reference now framed historically. One residual in Dependencies (warning 2) |
| STORY-79 (story-e15a19ef) | REQ-58, 78, 89 (superseded), 44, 150 | aligned; `updated_by` restored to all three bundles. One residual in Out of scope (warning 1) |
| STORY-124 (story-080c6036) | REQ-154 (browser-driving half) | **aligned.** Technical Context now reads "Filed under CAP-63"; no `CAP-102` string survives anywhere in the body |
| STORY-125 (story-7fa314f5) | REQ-154 (self-origin half) | aligned (unchanged since 2026-08-31; was already clean) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-79 (story-e15a19ef) | story-body-edit | Residual of REPORT-3580 finding 12, not reached by the sweep. The Out-of-scope clause still reads "the content/shape of the diff or crop artifacts themselves (covered by the values-diff, size-aware diff, and aligned-crops **capabilities**)". Two of those three are not capabilities: "values-diff" is sibling STORY-75 and "size-aware diff" is sibling STORY-77, both inside CAP-63 since the 2026-08-05 rebalance (`capability-18a822ac`, CAP-65, is `deprecated`). Only aligned-crops is a separate capability. The clause therefore places two same-capability concerns *outside* this capability | Reword to "(covered by sibling stories STORY-75 and STORY-77 in this capability, and by the aligned-crops capability)" |
| 2 | warning | consistency | STORY-78 (story-2c7069fe) | story-body-edit | Residual of the same finding. Technical Context was correctly repaired (CAP-65 is now named only as history: "merged into CAP-63 by the 2026-08-05 structural rebalance and is now deprecated"), but the **Dependencies** section one screen below still reads "Plan item 3 — 1c Size-Aware Diffing (the persisted viewport ladder this command reads)", naming the retired capability rather than the sibling story that now owns the ladder — which STORY-77 item 5 explicitly claims as "a capture-time artifact of this story, not borrowed infrastructure" | Change the Dependencies line to name STORY-77 (the sibling size-aware diffing story), matching the reference the Technical Context already makes |
| 3 | warning | consistency | CAP-63 (capability-aa030c83, body) | story-body-edit | The History section's "Overlap cluster 2" block still ends with "**Recorded defect, not repaired here** … STORY-124's Technical Context says 'Filed under CAP-102' … it will keep surfacing until a step permitted to edit story content corrects it to CAP-63." **That correction has now been made** — STORY-124's body reads "Filed under CAP-63" and contains no `CAP-102` string (verified this cycle). The paragraph is present-tense and predictive, so a future overlap survey reading it would re-open a closed defect. The historical record of what the cluster found remains accurate; only the trailing prediction is stale | Append "(Corrected 2026-09-09; the story now reads CAP-63.)" to that paragraph, or convert its final sentence to past tense. Do not delete the record — it explains why the cluster surfaced |

## Notes for the Editor

**Nothing blocks this level.** Zero violations, zero `needs_review`. The three
warnings are single-clause edits and may be taken opportunistically.

**How the repairs were verified.** REPORT-3581's fix summary was read but not
trusted. Each of the eleven repaired violations was re-checked against the live
ticket body, and every behavioural claim the repairs *added* was then checked
against the production code it describes, so the matrix is not merely
self-consistent but true:

- `--multi-viewport` / `--collapse` / `--clusters` (STORY-77 items 6–8) —
  `tools/generate/src/cli/fidelity.ts:199` (`cmdValuesDiffMultiViewport`, with
  the terminal no-ladder refusal at `:201-207`), `:242` (worst-cell-first),
  `:318` (`collapseMultiViewport`), `:433` (`DefectCause`), `:457`
  (`CAUSE_MAP`), `:478` (`clusterDefects`), `:512` (`formatClusterReport`);
  `tools/generate/src/cli/index.ts:327-330`, `:1018-1044`. STORY-77 item 8's
  four specific claims all hold: derived axes excluded from the count
  (`fidelity.ts:386`, `:491`), width scope always shown (`:514`, `:534`),
  fallback to the property name at `review` (`:490`), `fontLoad` → `accept`
  (`:466`).
- REQ-73 gap axis and its 6px / 16px-under-`--tolerant` tolerance (STORY-75 item
  12) — `values-diff.ts:363`, `:1361` (band-padding superseded), `:1530`
  (tolerance), `:2493`, `:2575`.
- REQ-72 in-browser hexification (STORY-76 item 0) — `extract.ts:334`
  (`hexifyGradient`), applied at `:846` (surface) and `:1132` (text-fill).
- BUG-16 offline re-extract (STORY-75 item 7) — `reextract.ts:50`
  (`rewriteMirroredRefs`), `:67`, `:100`.
- STORY-76's supersession evidence — `resolveSurfaceGradient` still has **zero
  production callers**: `packages/framework/src/modules/text-style.ts:223`
  (definition), two re-exports (`packages/framework/src/index.ts:34`,
  `packages/framework/src/modules/index.ts:9`), two tests
  (`tests/req62-gradient-panel.test.ts`,
  `tests/reconciliation-l1-one-colour-system.test.ts`).

**A grep caveat worth recording.** `tools/generate/src/cli/fidelity.ts` contains
NUL bytes and is treated as binary by `grep`, which returns *nothing* for a plain
`grep -n` against it. Any future check that surveys this capability's
implementation must use `grep -a` (or equivalent) or it will silently conclude
the clustering and multi-viewport code does not exist.

**Ledger note carried forward.** REQ-64, REQ-72 and REQ-76 (all
free_and_reconciled, all 2026-07-17/18) are still named in no bundle body, so
STORY-75's and STORY-77's `updated_by` chains cannot record them — there is no
bundle UID to record. The behaviour is now expressed in the story bodies and the
provenance is stated in prose in STORY-77's Technical Context, which is the best
available under the field schema. Not a finding; noted so the next cycle does not
re-derive it.

**Forward signal for level=ac, unchanged from last cycle.** Eight behaviours now
described in story bodies still carry no AC: the `gap` axis, split-control
attribution, the band overlay axis, per-text-node run geometry, and the offline
re-extract (STORY-75); in-browser hex resolution of stop colours (STORY-76); and
`--multi-viewport` / `--collapse` / `--clusters` (STORY-77). Also worth a look at
level=ac: **AC-638** ("a gradient-typed content field accepts a well-formed
gradient and rejects a malformed value") is an *authoring* criterion on the same
superseded content-field path as the now-deprecated AC-637, and STORY-76's live
scope is now capture + diff only.

**UAT-level facts not assessed here.** The capability's `uat_coverage: fail`,
STORY-75/77/79's `fail` and STORY-76's `stale` are UAT-level and out of scope at
level=story.

**No `code-issue` findings.** Every claim checked this cycle is the matrix
correctly describing working code.
