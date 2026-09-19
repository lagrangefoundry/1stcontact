---
uid: report-2fa04f75
id: REPORT-930
type: report
title: 'Capability-Intent Alignment: Capture-to-L1 Reproduction Fold (level=ac)'
created_by: xgd
created_at: '2026-07-24T09:34:47.042403+00:00'
updated_at: '2026-07-24T09:34:47.042403+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Capture-to-L1 Reproduction Fold
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

This capability (CAP-71) has a single feature story (STORY-84), whose `intent_uid`
is BUNDLE-7 — the reconciled framework-pivot bundle. At `ac` level the story body
is the working reference (story-level cycle assumed run); intent is consulted only
to confirm the ACs claim no retired behavior. No ambiguity forced a deep intent walk.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (bundle-31e474b9) | free_and_reconciled | merged @ edeb1c2c | Framework pivot to L1: REQ-63 (capture/diff axis coverage), REQ-79 (absolute-base D1 form), REQ-82 (L1 substrate + envelope), REQ-83, REQ-84 (+2 more). Establishes the capture->fold->render->gate pipeline this capability's fold sits in. | YES |
| REQ-66 (via story body) | superseded | — | Pre-L1 `adopt-values` reproduction command — explicitly retired by this story; AC-696 asserts its removal. | YES (retired) |
| REQ-74 (via story body) | active | — | Independent `adopt-gaps` feature — explicitly left untouched; AC-696 asserts it still functions. | YES (unaffected) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-689 (one validated L1 doc spanning ladder) | BUNDLE-7 (REQ-82 envelope, REQ-79 D1) | aligned — follows story "fold to one L1 document" |
| AC-690 (raw ladder retained as oracle) | BUNDLE-7 | aligned — follows story "oracle retention" |
| AC-691 (geometry keyframe per width == captured box; typography from widest sample) | BUNDLE-7 (REQ-79 absolute-base) | aligned — follows story "geometry keyframes... each node carries its authored axes" |
| AC-692 (interpolate vs snap classification) | BUNDLE-7 | aligned — follows story "interpolate/snap classification" |
| AC-693 (visibility rule from presence subrange) | BUNDLE-7 | aligned — follows story "visibility rules" |
| AC-694 (advisory structural-hint sidecar) | BUNDLE-7 | aligned — follows story "the advisory hint sidecar" |
| AC-695 (folded doc renders independently of hints) | BUNDLE-7 | aligned — follows story "renders as a complete reproduction on its own" |
| AC-696 (adopt-values removed; adopt-gaps unaffected) | REQ-66 (retired), REQ-74 (untouched) | aligned — follows story "supersession of the pre-L1 adopt-values command" |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | STORY-84 | — | Story body's regression divergence note ("fold currently emits text leaves only; text-free nodes deferred") is a documented deferral, not a behavioral claim. No AC asserts text-free nodes ARE folded, so there is no false coverage. Nothing to repair. | none |

## Consistency

All 8 ACs describe criteria that follow directly from STORY-84's body. No AC
references behavior the story does not claim; no AC is internally inconsistent
with the story. AC-696 correctly encodes both halves of the story's supersession
clause (adopt-values removed, adopt-gaps preserved).

## Coverage

The story's eight in-scope behaviors map 1:1 onto AC-689..AC-696 with no gaps:
fold->689, oracle->690, keyframes/axes->691, interpolate/snap->692, visibility->693,
hint sidecar->694, hint-independence->695, adopt-values supersession->696. Story is
`story_kind=feature`, so AC coverage is expected and complete.

## Exclusivity

No two ACs describe the same criterion. Each targets a distinct behavioral axis of
the fold (structure, retention, geometry, transition, visibility, hints,
independence, CLI supersession).

## Notes for the Editor

No editor action required. This is a small, well-factored feature story with a
clean AC decomposition. If a future intent promotes text-free-node folding from
"deferred" to "in scope," expect a new AC under this story plus removal of the
divergence note from the story body — flagged here only so the deferral is on record.
