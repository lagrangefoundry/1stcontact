---
uid: report-75aece48
id: REPORT-790
type: report
title: 'Capability-Intent Alignment: Capture-to-L1 Reproduction Fold (level=story)'
created_by: xgd
created_at: '2026-07-23T07:02:43.839742+00:00'
updated_at: '2026-07-23T07:02:43.839742+00:00'
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

## Cumulative Intent Considered

CAP-71's single story (STORY-84) carries `intent_uid = bundle-31e474b9`
(**BUNDLE-7**, status `free_and_reconciled`, `merged_at_commit`
`edeb1c2c…`). BUNDLE-7 is the framework-pivot reconciliation bundle; its
source tickets relevant to this capability, in scope order:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 | free_and_reconciled | 2026-07-22 | Framework pivot umbrella: L1 substrate + capability modules; D1 = absolute-base reproduction form | YES |
| REQ-83 | free_and_reconciled (via BUNDLE-7) | 2026-07-22 | **Originating intent for CAP-71.** Fold multi-viewport capture → one L1 doc (keyframes + interpolate/snap + visibility), retain raw ladder as oracle, advisory structural-hint sidecar, `capture` emits L1 (old adopt-values path dissolves) | YES |
| REQ-84 | free_and_reconciled (via BUNDLE-7) | 2026-07-22 | Strip layout modules to L1 — superseded the pre-L1 adopt-values reproduction path | YES (context) |
| REQ-86 | free_and_reconciled (via BUNDLE-7) | 2026-07-22 | End-to-end 3-probe reproduction gate + structure recovery — explicitly scoped OUT of this story (owned by CAP-73) | YES (boundary) |
| REQ-66 | reconciled (bundled/older) | pre-pivot | `adopt-values` command — **retired/superseded** by REQ-83 as-built | YES (retired) |
| REQ-74 | reconciled (bundled/older) | pre-pivot | `adopt-gaps` sibling — left untouched by REQ-83 | YES (unchanged) |

Story-84's sole `intent_uid` is BUNDLE-7; it carries no `updated_by`
chain, so BUNDLE-7 is the complete cumulative-intent set for this
capability. Nothing in the ledger is `abandoned`/`draft`; all counts.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-84 (feature, 3pt, completed) | REQ-83 (primary), REQ-79 (framing), REQ-66 (retires), REQ-74 (unchanged) | aligned |

Per-claim trace of STORY-84 body against REQ-83:
- Fold ladder → one absolute-base L1 doc with per-width geometry keyframes,
  per-segment interpolate/snap flags, presence-derived visibility rule →
  REQ-83 Behaviour §Fold. aligned.
- Retain raw multi-width ladder as acceptance oracle → REQ-83 "Retain the
  raw 6-sample ladder as the acceptance oracle." aligned.
- Advisory structural-hint sidecar (ancestry/parent computed layout/sizing
  unit/position mode/real @media/semantic tags), read for DIRECTION never
  EXECUTION, not consumed by the render path → REQ-83 §Structural-hint pass.
  aligned.
- Supersession of pre-L1 `adopt-values` (REQ-66) → REQ-83 as-built GAP 2
  ("adopt-values dissolved"). aligned.
- `adopt-gaps` (REQ-74) left untouched → REQ-83 as-built ("REQ-74 sibling
  is an independent surviving feature and was left untouched"). aligned —
  the story does NOT claim adopt-gaps was removed, matching what was done.
- Absolute-base form / empty structure primitives / structure recovery as a
  later optional overlay → REQ-79 D1 + REQ-86 boundary. aligned.
- Out-of-scope carve-outs (L1 tree/envelope/renderer → CAP-70; 3-probe gate
  + structure recovery → CAP-73; values-diff axes) → match the sibling
  capabilities' ownership. aligned; no exclusivity overlap.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | STORY-84 | — | Divergence note in the story body ("the fold currently emits text leaves only; text-free nodes — fields/images without src/text — are deferred, not yet folded") honestly narrows REQ-83's "per node" fold to text leaves. It is disclosed as a deferral for regression, traces to the REQ-83 as-built state, and does not claim behavior intent does not support. No stale/retired-feature references anywhere in the body. | none — keep the disclosure; the deferred-node closure is future intent, not current drift |

## Notes for the Editor

- Story-level alignment is clean: CAP-71 is a single-story capability and
  STORY-84 fully and exactly expresses REQ-83's asked behaviour, with no
  coverage gap and no cross-capability overlap (CAP-70 / CAP-73 boundaries
  are drawn explicitly in the story's Out-of-scope section).
- Watch item for the AC/UAT-level cycles (not a story-level finding): the
  "text-leaves-only, text-free nodes deferred" scope narrowing should be
  reflected in the AC/UAT surface — ACs should not claim non-text-node
  folding is complete, and there should be no UAT asserting it. If an AC
  overreaches here, resolve at that level (ac-edit / uat-add), not by
  editing the story body.
- Structural observation (not a drift finding): CAP-71 itself carries no
  `fields.intent_uid`; the intent linkage lives on its story. This is
  consistent with how the other pivot capabilities in this anchor were
  created and is not a story-level alignment issue.
