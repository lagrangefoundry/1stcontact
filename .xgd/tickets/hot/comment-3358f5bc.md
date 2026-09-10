---
uid: comment-3358f5bc
id: COMMENT-2489
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T07:28:50.894501+00:00'
updated_at: '2026-09-10T07:28:50.894501+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-e7681edd
  kind: note
---

**PASS** — REPORT-3690 (`report-e7681edd`), 0 violations, 1 warning, 0 needs_review.

## What I checked

Cumulative intent for CAP-100 is **REQ-123 alone** (`free_and_reconciled` via BUNDLE-19). The other seven KB-adjacent intents (REQ-158/159/160/163/164/166) are all `draft`; REQ-18 is `abandoned`. None counts. Neither STORY-117 nor any of the 16 ACs carries an `updated_by` chain, so every element aligns to the single originating intent.

Against STORY-117's body (the working reference at `ac` level):

- **Coverage** — every in-scope clause is discharged: the four command forms → AC-1291/1292/1293/1294, opt-in membership → AC-1295, named exclusions → AC-1296, retitle-safe identity → AC-1297, withdrawal-as-deletion → AC-1298, incremental rebuild → AC-1299, generated map → AC-1303/1304, declaration in force → AC-1305. Every out-of-scope clause is correctly absent.
- **Exclusivity** — no duplicates. The three membership-adjacent ACs are distinct properties (decision / reporting / refusal) and mirror three separate code paths.
- **Consistency** — no AC claims behaviour the story doesn't support.

## The one thing worth acting on

AC-1295 and AC-1297 prescribe verification against **"the real document store"**, and that premise has gone stale. Verified through the export's own code path: of 38 `doc` tickets, **zero** now carry `fields.system_kb: true` — every one carries `doc_kind` instead. The flags were cleared ahead of REQ-164, which is still `draft`.

So the ACs' criteria remain correct; only their verification method is now non-executable. `tests/test_UAT_FC_REQ-123_system_kb.test.ts:357` asserts `expect(first.docs.length).toBeGreaterThan(0)` against the live store, and its `beforeAll` `statSync`s a file selected from a now-empty corpus directory.

Two consequences flagged for the editor:

1. **`1c kb build` cannot succeed against the live store today** — it takes the AC-1300 refusal path before reaching any model. That's the specified behaviour correctly implemented; the store changed, not the code. "The KB build is broken" would be the wrong diagnosis.
2. **Don't fix this by editing the Criterion text toward `doc_kind`** — that adopts a draft intent ahead of reconciliation. REQ-164 is blocked on xgd REQ-827 adding `system_kb` to the closed `doc_kind` enum; when it lands, AC-1295/1296/1300 and the story body's membership paragraph move together. The fix now is confined to two Verification paragraphs.

I also recorded a uat-level observation not counted in the totals: the tests are named `test_UAT_FC_REQ-123_*`, not `test_UAT_AC<number>_*`, so the `uat`-level cycle will find zero tests by naming convention unless it maps them by content.
