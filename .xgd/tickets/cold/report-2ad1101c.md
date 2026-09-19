---
uid: report-2ad1101c
id: REPORT-835
type: report
title: 'Capability-Intent Alignment: 1c Size-Aware Diffing (level=story)'
created_by: xgd
created_at: '2026-07-23T10:23:06.404896+00:00'
updated_at: '2026-07-23T10:23:06.404896+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-18a822ac
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Size-Aware Diffing
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

CAP-65 (capability-18a822ac) has no `intent_uid`/`updated_by` of its own; its
originating intent is reached through its two stories, both of which carry
`fields.intent_uid = bundle-ab9e0cb6`. That bundle (BUNDLE-6,
free_and_reconciled, merged at 7a42e182) reconciles the source request REQ-61
(request-d6bc0d26, free_and_reconciled), which is the behavioral source both
story bodies cite ("Reproduces REQ-61 behaviour"). CAP-65's body additionally
attributes lineage to REQ-58 (multi-viewport capture / length model) as a
dependency it builds on, not as an intent it must express.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-58 | (bundled into BUNDLE-6) | 2026-07-13 | Multi-viewport capture ladder + length value model — the substrate CAP-65 reads | dependency only (not CAP-65 intent) |
| REQ-61 | free_and_reconciled | 2026-07-16 | (a) `--size` on `1c diff` + `1c values-diff`; (b) `responsive-diff` N-way cross-size table; (c) change classifier; (d) generalize per-breakpoint overrides to dial/length values; (e) configurable nav/header collapse treatment | YES |
| bundle-ab9e0cb6 (BUNDLE-6) | free_and_reconciled | 2026-07-17 | Reconciliation vehicle carrying REQ-61 (and siblings) into main | YES |

**Cumulative picture for CAP-65:** REQ-61 is a multi-part intent whose
reconciliation split cleanly across two capabilities. The *diff/analysis* half
— asks (a), (b), (c), plus the per-width reference screenshots that the pixel
`--size` path requires — is CAP-65's scope, and CAP-65's own body draws exactly
that boundary ("the shared `--size` viewport selector on the existing diff
commands, the per-width reference screenshots… and… the standalone cross-size
analysis command `responsive-diff`"). The *reproduction/consuming* half — asks
(d) per-breakpoint dial generalization and (e) nav/header collapse treatment —
is owned by STORY-81 (story-3569e1a4) under a different capability
(capability-bd0b722e, story_kind=upgrade), same intent bundle. That is a
deliberate capability boundary, not a CAP-65 gap; both CAP-65 stories explicitly
park those asks out of scope with pointers to "the framework's per-breakpoint
dial capability."

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-77 (story-16f2793c) — Size-aware diffing: `--size` on values-diff + pixel diff, fail-loud on missing reference, per-viewport reference screenshots at capture | REQ-61 (a) + pixel-`--size` same-width reference; REQ-58 (ladder substrate) | aligned |
| STORY-78 (story-2c7069fe) — responsive-diff: N-way cross-size node table + `--classify` (presence-flip / layout-swap / value-step) | REQ-61 (b) + (c) | aligned |
| — REQ-61 (d) per-breakpoint dials + (e) nav collapse | — | out of CAP-65 scope by design; expressed under STORY-81 / capability-bd0b722e (verified). No CAP-65 gap. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | CAP-65 story tree | — | CAP-65 body scope (— `--size` on both diff commands, per-width reference screenshots, `responsive-diff`) is fully expressed by STORY-77 + STORY-78. REQ-61's reproduction-side asks (d,e) are correctly excluded and land in STORY-81/capability-bd0b722e. | none |
| 2 | info | consistency | STORY-77 | — | `--size` vocabulary is `mobile\|tablet\|desktop` in the story vs `desktop\|tablet\|phone` in the REQ-61 request body. The story carries an explicit divergence note grounding on the implemented shot/viewport preset vocabulary; the reconciled intent (bundle, grounded on delivered code) uses the preset vocabulary. Aligned; naming nuance only. | none |
| 3 | info | exclusivity | STORY-77 + STORY-78 | — | The two stories share the persisted-ladder machinery but cover distinct behavior: STORY-77 is reproduction-vs-reference at a chosen width; STORY-78 is standalone one-site cross-size analysis ("NOT a reproduction-vs-reference comparison"). No overlap. | none |

## Notes for the Editor

No action required. This is a clean, well-decomposed capability:

- **Consistency:** Both story bodies accurately reflect REQ-61. Each carries an
  explicit divergence note grounding itself on the *implemented* interface
  (STORY-77: preset viewport vocabulary; STORY-78: `--ref` flag rather than the
  positional slug the reconciliation plan proposed). These are correct
  reconciliation-to-code alignments, not drift.
- **Coverage:** The diff-side of REQ-61 is fully expressed. The reproduction-side
  of REQ-61 was verified to live in STORY-81 under capability-bd0b722e — so no
  reconciled intent is orphaned; it simply belongs to a sibling capability.
- **Exclusivity:** STORY-77 (ours-vs-reference at a width) and STORY-78
  (self-vs-self across widths) are behaviorally disjoint.

The one thing a future check should NOT misread as a gap: REQ-61 asks for
per-breakpoint dials and nav collapse, and those do not appear in CAP-65. That
is intentional — they are capability-bd0b722e's, not CAP-65's. Confirmed this run.
