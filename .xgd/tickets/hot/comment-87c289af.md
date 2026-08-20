---
uid: comment-87c289af
id: COMMENT-1313
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T13:42:41.501473+00:00'
updated_at: '2026-08-20T13:42:41.501473+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-b41fe36e
  kind: note
---

Done for this call. Report **report-b41fe36e** (REPORT-2448) filed.

## What I did

This was the first `uat`-level fix call for this capability. I took all seven `uat-edit` findings — every finding whose repair is widening an existing AC-named UAT — and left the eight `uat-add` findings (AC-1345…AC-1352) for the next iteration.

| Finding | AC | Clause closed |
|---|---|---|
| 10 | AC-710 | Pinned-box content overflow: `clip` naming **both** heights and the container's path `0.0` (asserted distinct from the leaf paths), plus both negatives |
| 11 | AC-706 | The same overrun at an unsampled width only — a row visible across `[400,700)` overruns at 500 while every captured rung stays clean |
| 12 | AC-707 | Container pinned to exactly the height its unperturbed content fills → `clip` under 2.5× growth; the same subtree unpinned passes |
| 9 | AC-691 | Text keyframes carry no `height`; varying `fontSizePx` emits a `responsive` track matching 24/32/44; a constant axis emits none |
| 13 | AC-736 | Two intersecting **captured** `box-*` surfaces DO report an overlap — with the identical geometry under synthesized ids reporting none, so the exemption is proven to key on identity, not on being painted |
| 14 | AC-731 | Adopted rect, band guard, accent-bearer fallback, grouping identity |
| 15 | AC-689 | Multi-kind leaf assertion (the "full-language" half of the AC's title) |

Ordering followed the assessor's note: findings 10/11/12 share one mechanism that had **no** coverage of any kind, so they went first.

## Verification

All seven AC-named suites: **7 files / 34 tests passing**. Every added assertion drives a real entry point (`foldToL1`, `evaluateLayout`, the three probes, `validateL1`, `renderL1Document`); no mocks added. I also typechecked the four edited files under the project's `tsconfig.base.json` settings — the only errors left in them are four pre-existing ones on lines I didn't touch.

One thing worth flagging: the evaluator's stack advances its gap for a **hidden** child too, so the AC-706 two-row interior measures 64px rather than the 54px the arithmetic suggests. I set the pin to 70px to match actual behaviour. The AC says nothing about gap collapsing, so I treated it as an observation rather than a defect — it's recorded in the report.

No code edits, and no `needs_review` items to forward.

## Remaining

8 violations, all the same shape: behaviour implemented and proven by `test_UAT_FC_*` suites that carry no AC traceability. The report lists each AC against the FC suite to re-home from, per the assessor's preference for moving assertions over writing fresh fixtures.
