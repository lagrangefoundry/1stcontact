---
uid: comment-8d78687e
id: COMMENT-1035
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T00:56:54.234931+00:00'
updated_at: '2026-08-16T00:56:54.234931+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3ee1144f
  kind: note
---

**Result: FAIL** — REPORT-2034 (`report-3ee1144f`), `level=ac`, 1 violation, 1 warning, 0 needs_review.

**Scope**: CAP-94 holds one story, STORY-107 (feature, intent `bundle-e59210c5`/BUNDLE-17, governing item **REQ-130**, `free_and_reconciled`), with 15 active ACs (AC-1095…AC-1109). Later intents were checked: REQ-134 (image-generation component) is `abandoned` and correctly has no expression here; REQ-131/133/137/140 carry no story under this capability and retire nothing.

**Violation (coverage, `ac-add`)** — REQ-130 states under "⚠️ The operator's editor must not break" that *copy inside a component the assistant instantiated is addressable and editable in the modal, over the same `/api/copy` transport*. No AC under STORY-107 expresses it: AC-1102 covers only the instance list `describe_page` returns, not that the segment map reaches inside an instance by module/seam nor that a save through the operator's transport lands in that seam. Nor is it covered elsewhere — AC-1093/AC-1094 (STORY-106) are scoped to assistant-composed L1 elements and their intent REQ-129 declares the modal unchanged. The behaviour already ships with green evidence (`tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:642`), so this is a matrix gap, not a code or test gap — the new AC can bind to the existing UAT.

**Warning (coverage, `ac-add`)** — `add_component` takes an optional `presentation` (`tools/generate/src/cli/ai/toolbox.ts:312`) and the story says supplying one is optional, but AC-1099 asserts only the presentation-absent paths (default-look success, and refusal when a kind has no default look). The supplied-presentation success path — the only route AC-1099's own refusal clause leaves open — has no AC.

Three info entries record refinements that are correct against REQ-130 but invisible in the story body (reconfigure-merges, drawing filename/conflict rules, the empty-update refusal), flagged for a future story-level pass rather than an AC edit. Consistency and exclusivity were clean: no AC contradicts the story body, and the nearest pairs (AC-1105/1106, AC-1096/1097) have distinct triggers and assertions.

Scratch file left at `.xgd/tmp/cap94_ac_alignment_report.md` (gitignored) — the report body was fed from it; no tickets, tests or code were modified.
