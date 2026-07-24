---
uid: report-97c88a94
id: REPORT-928
type: report
title: 'Capability-Intent Alignment: Capture-to-L1 Reproduction Fold (level=story)'
created_by: xgd
created_at: '2026-07-24T09:30:47.362792+00:00'
updated_at: '2026-07-24T09:30:47.362792+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Capture-to-L1 Reproduction Fold
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Capability CAP-71 (capability-2049c9ec) contains exactly one story, STORY-84
(story-8acc338d, `feature`, status=completed, uat_coverage=pass). Its intent_uid is
the reconcile bundle bundle-31e474b9 (merged_at_commit edeb1c2c), which bundles
REQ-63/79/82/83/84/85/86. The primary intent expressed by this capability is
**REQ-83** (Framework pivot B2: capture→L1 fold + structural-hint extractor).

## Cumulative Intent Considered

Chronological ledger of intents that touch this capability's fold behavior:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-66 | ready_to_reconcile | 2026-07-18 | `adopt-values` command (copy Type-A flat values into old-model styled content) | imminent — but RETIRED by REQ-83 |
| REQ-74 | free_coded | 2026-07-18 | `adopt-gaps` (independent gap-inversion sibling) | YES — left untouched |
| REQ-79 | free_and_reconciled | 2026-07-19 | Framework-pivot umbrella; D1 = absolute-base L1 form (leaves absolutely placed by per-width keyframes, empty structure primitives) | YES |
| REQ-82 | free_and_reconciled | 2026-07-20 | L1 substrate (schema/renderer/validator) | YES — dependency only (owned by CAP-70, out of scope) |
| REQ-83 | bundled | 2026-07-20 | Fold multi-viewport ladder → one L1 doc (keyframes + interpolate/snap + visibility) + oracle retention + advisory structural-hint sidecar; dissolve `adopt-values` | YES (imminent) — **PRIMARY** |

Notes: bundle-31e474b9 carries `merged_at_commit=edeb1c2c`, so the `bundled` /
`ready_to_reconcile` members are treated as live cumulative intent. REQ-86 (3-probe
end-to-end gate) and REQ-82 (L1 substrate) are explicitly out of this capability's
scope per the story body and belong to sibling capabilities.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-84 (story-8acc338d) | REQ-83 (primary), REQ-79 (D1 absolute-base), REQ-66 (supersedes), REQ-74 (excludes), REQ-82 (dependency) | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | STORY-84 | — | Story body's in-scope list (fold→one L1 doc, geometry keyframes, interpolate/snap classification, visibility rules, advisory hint sidecar read for DIRECTION-not-EXECUTION, oracle retention) matches REQ-83 Behaviour verbatim in substance; absolute-base framing is grounded in REQ-79 D1 / REQ-82. No over-claim. | none |
| 2 | info | consistency | STORY-84 | — | Story's "supersession of the pre-L1 `adopt-values` command (REQ-66)" matches REQ-83 as-built GAP 2 (adopt-values dissolved; `test_UAT_FC_REQ-83_adopt_values_command_removed`). "adopt-gaps (REQ-74) left untouched" matches the as-built note that REQ-74 is an independent surviving feature. No drift. | none |
| 3 | info | coverage | STORY-84 | — | Divergence note ("fold currently emits text leaves only; text-free nodes deferred, not yet folded") is an honest implementation-limitation annotation. REQ-83 as-built closed only its two deferred deliverables (DOC-13 §11, adopt-values removal) and did NOT close the text-free-node deferral, so the note remains accurate. This is transparency, not matrix drift — the story neither omits nor over-claims intent. | none |

## Notes for the Editor

No violations, warnings, or needs-review items. The single-story capability is
correctly and honestly aligned to cumulative intent.

One forward-looking observation (no action required at this level): the story's
text-free-node deferral is a real intent-vs-implementation gap against REQ-83's
"every node is matched across the sampled widths." It is deliberately documented as
a regression divergence rather than hidden, so it does not constitute drift. If/when
that gap is closed in code, the divergence note should be removed from the story
body to keep the matrix current. Separately, REQ-83's own as-built flags REQ-74
(`adopt-gaps`) as "likely a vestige too — flagged, not acted on"; that is out of this
capability's scope (adopt-gaps is not part of the fold) and does not affect this
alignment verdict.
