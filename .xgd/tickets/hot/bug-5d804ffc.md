---
uid: bug-5d804ffc
id: BUG-300
type: bug
title: 'Turn clock: raise the per-message spend ceiling from $10 to $20'
created_by: EPIC-19
created_at: '2026-10-27T18:00:27.253791+00:00'
updated_at: '2026-10-27T18:42:46.584723+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-e89d8b21
  commits:
  - working_sha: 1de81b016d642f0de653acad34f66afb4bf1ee04
    reconcile_sha: null
    main_sha: null
  version: 0.2.677
  story_points: 1
---

## What

Raise the per-client-message spend ceiling (`spend_ceiling_usd` in
`tools/generate/src/cli/ai/turn-clock.json`) from **$10 to $20**.

## Why

The first-draft message is the most valuable spend on a site ([[DOC-71]] §12.7: "budget the first
draft generously"). First-Draft-Test Dina's Diner 4's first draft reached $10.14 and was stopped by
the ceiling before its last builder ran (BUG-292). Other runs came to $3.63–$7.90. The ceiling is a
runaway backstop, not rationing, and at $10 it sits within normal first-draft spend. The operator
is about to run beta-readiness tests (a first draft, a full discovery, an existing-site import) and
doesn't want them cut short.

This is the interim form of DOC-73 Part E6. A ceiling specific to the first-draft message can follow
if the general one proves too loose.

## Change

- `spend_ceiling_usd`: 10 becomes 20. Its explanation in the same file stays accurate (it describes
  the ceiling, not its value).
- `tests/test_UAT_FC_REQ-409_an_outcome_not_a_question.test.ts` pinned the value at 10
  (`expect(turnClockDocument.spend_ceiling_usd).toBe(10)`). Retarget it to the new value, or to the
  behaviour it protects (the ceiling ends the work cleanly).

## What landed

- `turn-clock.json`: `spend_ceiling_usd` is now 20. Nothing else changed: `SPEND_CEILING_MICROS` in
  `turn-clock-core.ts` reads the value from that file.
- The REQ-409 suite no longer pins the number (BUG-300 owns that). It only checks that a ceiling is
  set. Its "the spend ceiling ends the work cleanly" case now sizes the builder's spend at 5% over
  whatever the ceiling is (2.1M Haiku 5.5 output tokens per ceiling dollar) instead of a hard-coded
  $10.50, so it still tests reaching the ceiling at $20 ($21 spent).
- The BUG-300 UATs are in a `describe('BUG-300 …')` block in the same file. They reuse that suite's
  real-host harness rather than copying it.

## Test plan

- `test_UAT_FC_BUG-300_the_spend_ceiling_is_twenty_dollars`: the turn clock's spend ceiling is $20.
- `test_UAT_FC_BUG-300_a_message_spending_fifteen_dollars_is_not_stopped`: a message with two
  builders at $7.50 each ($15: over the old ceiling, under the new one) runs both builders. No
  consultant request carries the spend-ceiling notice and the operator gets no "spend ceiling
  reached" warning. Both BUG-300 UATs were checked to fail with the value set back to 10.
- Reaching $20 still ends the work cleanly: no new builders, and the consultant says what's left.
  This is `test_UAT_FC_REQ-409_the_spend_ceiling_ends_the_work_cleanly_counting_the_builders_spend`,
  now run at the new ceiling. Its behaviour is unchanged.
- Regression: the REQ-409 suite (7/7) and the BUG-290 and BUG-292 workers suites (7/7) pass.