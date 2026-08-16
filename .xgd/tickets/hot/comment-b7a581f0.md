---
uid: comment-b7a581f0
id: COMMENT-1052
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T03:00:55.062796+00:00'
updated_at: '2026-08-16T03:00:55.062796+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-bb057ea2
  kind: note
---

Report filed and schema verified: **REPORT-2053** (`report-bb057ea2`), `result=fail`, `report_kind=capability_validation`, `subject_uid=capability-00e77e55`, `level=ac`, counts 1/1/0.

## Verdict: FAIL — 1 violation, 1 warning, 0 needs_review

**Scope checked**: CAP-92 → one story (STORY-105, `feature`) → twelve ACs (AC-1071…AC-1082), all active. Both list queries returned `next_cursor: null`, so the tree is complete, not a paginated slice. Intent traces to a single attachment point — BUNDLE-17 (`free_and_reconciled`); I read its full 72k body and resolved the five constituent requests that touch this capability (REQ-122, 126, 127, 129, 130, plus design predecessor REQ-125). Nothing in the ledger is retired or merely imminent, so no caveats to carry.

**The violation** — `coverage` / `ac-add`. STORY-105's body enumerates seven components the declaration carries; the ACs cover six. **Worked sequences** have no AC. This isn't a marginal reading: the story body names them, its Technical Context returns to them, and three separate requests act on them — REQ-126 §1 lists `sequences` in the declaration, REQ-129 rewrote them around read-then-replace, REQ-130 added one. The shipped `l1-surface.json` carries six. AC-1071's format check doesn't cover the gap either — it asserts only "problems is an empty list", which an empty `sequences[]` would satisfy unchanged. The sole assertion anywhere in the suite is incidental and belongs to a *sibling* capability (CAP-93's AC-1088, at `tests/reconciliation-page-composition-surface.test.ts:474-478`), where a sequence is a means to testing add/remove semantics rather than the subject.

**The warning** — `coverage` / `ac-edit` on AC-1080. The story says the manual names four things; AC-1080 covers three, omitting the addressing rule. AC-1081 does cover that rule, but against the *declaration*, never the manual. `roles.ts:21-24` records that REQ-126 deliberately moved the rule out of the hand-written preamble so the manual would carry it from the `overview` — so the projection loop the implementation depends on is unasserted. Read together the two ACs cover it in substance, which is why this is a warning rather than a violation.

Two things worth flagging for whoever picks up the fix:

- **Neither finding is a code issue.** The sequences are present and well-formed, and the addressing rule is in the `overview` the manual projects. The behaviour exists and is unproven at this level — matrix drift, not an implementation defect.
- **AC-1074/AC-1075 are not duplicates**, though they assert the same observable quartet. One gates on the capability rule, the other on effect, and the shipped tests refuse via different rules. Recorded as info so a future exclusivity pass doesn't collapse them. I also recorded as info that AC-1074's divergence from REQ-126 (publishing withheld as well as asset management) is explicitly documented in the story and at `toolbox.ts:357-373` — recorded, not drifted.

The AC↔UAT mapping is otherwise unusually clean: twelve tests named `test_UAT_AC1071_*`…`test_UAT_AC1082_*`, one per AC, in order.
