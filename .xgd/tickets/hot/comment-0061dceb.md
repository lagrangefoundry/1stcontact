---
uid: comment-0061dceb
id: COMMENT-2692
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-11T02:38:11.336142+00:00'
updated_at: '2026-09-11T02:38:11.336142+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-fff96718
  kind: note
---

Report created: **REPORT-3877** (`report-fff96718`) — **FAIL**, 1 violation, 3 warnings, 0 needs_review.

## The violation

**AC-1090 vs `test_UAT_AC1090_...` (`tests/reconciliation-page-composition-surface.test.ts:565-582`)** — `uat-edit`.

This is a cascade the `ac`-level fix left half-applied earlier today. At 02:19:42 report-9b910172 strengthened AC-1090 to require the failure code, the recovery strategy **and** the offending field as a pointer — "complementary, not alternatives", with a Verification clause naming `fontSizePx` explicitly. It then added that assertion to the free-coded suite (`test_UAT_FC_REQ-129_l1_authoring.test.ts:397`) and stopped there.

The AC-numbered UAT — the one the `test_UAT_AC<n>_` convention makes AC-1090's evidence — asserts only the code and the three strategy statements. Worse, its rationale at :568-572 states the contrary: *"This caller does not receive the offending field … so the declared meaning carries the STRATEGY rather than promising specifics it cannot deliver."*

Not a code defect. I ran both refusal tests (`npm test -- <both suites> -t refusal` → 2 passed), so the pointer does reach the caller today. The fix is one assertion plus a comment rewrite.

## The three warnings

All the same shape — an AC names a *set*, its UAT asserts one member:

| AC | Gap |
|---|---|
| AC-1092 (:641) | Manual checked for `set_copy` only; a manual still describing the retired `get_copy` half would pass. Carried unrepaired from REPORT-2050. |
| AC-1093 (:712) | Asserts only `fields[0].name === 'text'`; `copyFieldsOf` also returns the REQ-139 colour row and REQ-135 typography, so dropping those on assistant-authored nodes would pass — exactly the indistinguishability the AC exists to assert. Carried unrepaired from REPORT-2050. |
| AC-1085 (:381-387) | Seeds the bare `{ ref }` form. REQ-137 made `{ ref, shade }` the production shape and reconciled on 2026-08-12 (it was `bundled` at the last cycle, which is why this moves from info to warning); a `get_l1` that resolved or dropped `shade` would still pass. |

## Notes

- **Full suite run**: 10 passed, 2 skipped. AC-1093/AC-1094 skip because their shared `beforeAll` calls `startBuilder`, which dies on `EPERM: listen 0.0.0.0` (`builder.ts:363`) — sandbox socket restriction, not a test defect. No finding depends on those two outcomes.
- The root cause worth carrying forward: where a behaviour has both a free-coded and a reconciliation UAT, a `uat-edit` cascade must land in **both**, or in the AC-numbered one at minimum. The two suites have now visibly diverged on AC-1090.
- Nothing in the intent ledger retires or widens a behaviour a CAP-93 UAT asserts. Only REQ-131 and REQ-137 moved since the last cycle; REQ-157 is still `draft` and does not count.
