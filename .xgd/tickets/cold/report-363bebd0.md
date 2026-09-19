---
uid: report-363bebd0
id: REPORT-932
type: report
title: 'UAT Coverage: Capture-to-L1 Reproduction Fold'
created_by: xgd
created_at: '2026-07-24T09:49:32.529435+00:00'
updated_at: '2026-07-24T09:49:32.529435+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-2049c9ec
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# UAT Coverage Assessment: Capture-to-L1 Reproduction Fold

**Result**: PASS
**AC verdicts**: 8 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (bundle-31e474b9) | merged (merged_at_commit=edeb1c2c) | 2026-07 | Reconciliation bundle carrying REQ-79/REQ-83 framework-pivot fold, REQ-66 adopt-values supersession, REQ-74 adopt-gaps untouched | YES |

The capability's single story (STORY-84) links `intent_uid=bundle-31e474b9`, a merged reconciliation bundle. Its behaviors (fold→one L1 doc, oracle retention, geometry keyframes, interpolate/snap, visibility rules, advisory hint sidecar, adopt-values supersession) are all supported by that intent. No later intent in the ledger retires any of them.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-84 (story-8acc338d) | BUNDLE-7 (REQ-79/REQ-83/REQ-66/REQ-74) | aligned | Story body's divergence note ("fold emits text leaves only; text-free nodes deferred") verified accurate against `tools/generate/src/l1/fold.ts:106-130`. No stale claims. |

## Findings — Categorized by Editor Action

None. Zero violations, zero warnings, zero needs_review.

Per-AC coverage (all active, all substantively covered by real-entry-point reconciliation UATs in `tests/reconciliation-l1-fold.test.ts`):

| AC | Behavior | Test | Substantive? |
|---|---|---|---|
| AC-689 | one validated L1 doc spanning ladder; empty ladder → explicit error | test_UAT_AC689 | pass — real `cmdCapturePage`, real `validateL1`, asserts widths==ladder & root container; empty ladder throws |
| AC-690 | raw ladder retained as oracle over same widths | test_UAT_AC690 | pass — real capture; asserts multistate.json widths == folded l1 widths |
| AC-691 | geometry keyframe per width matching box; typography from widest | test_UAT_AC691 | pass — real `foldToL1`; per-width x/y/width equal rounded box; fontSize from widest sample |
| AC-692 | fluid → interpolate; reflow → snap | test_UAT_AC692 | pass — real `foldToL1`; segment classification asserted on both node kinds |
| AC-693 | subrange node → bounded visibility rule; full-width → none | test_UAT_AC693 | pass — real `foldToL1`; fromPx==1024 for subrange, undefined for everywhere |
| AC-694 | advisory structural-hint sidecar (parent layout, sizing unit, breakpoints ascending) | test_UAT_AC694 | pass — real capture emits hints.json; ascending breakpoints + percent widthUnit; real-CSS derivation (justify-content, real @media) asserted in Chromium-gated branch that skips cleanly on headless runners |
| AC-695 | folded doc renders complete without hint sidecar | test_UAT_AC695 | pass — real `foldToL1` + real `renderL1Document`; render consumes only the doc |
| AC-696 | adopt-values removed (regression_only); adopt-gaps unaffected | test_UAT_AC696 | pass — real `cli.run`; unknown-command + exit 1 + no surviving symbols; adopt-gaps still recognized |

## Notes for the Editor

- Nothing to fix. The capability is fully covered and aligned.
- `.xgd/uat_index.json` reports all 8 tests as `status: missing`. This is the known stale-index artifact of a fresh regression worktree (gitignored index not repopulated by a local run), NOT absent tests — all 8 test functions exist in `tests/reconciliation-l1-fold.test.ts` and validation already passed (check_uat_validation r0063@pass). Coverage was assessed against the test source on disk, per the correct procedure. No index rebuild is required for this assessment; it would only affect dashboard display.
- AC-694's real-CSS derivation assertions (parentLayout.justifyContent, real @media breakpoint 600) live behind a `chromiumAvailable()` guard and skip on runners without Chromium. The always-on path still substantively proves sidecar emission, pass-through, and breakpoint ordering via a real `cmdCapturePage`, so coverage holds; the Chromium branch strengthens it where available. Recorded as a note, not a finding.
