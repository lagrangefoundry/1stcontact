---
uid: bug-beb7dc74
id: BUG-211
type: bug
title: 'Plan panel: Change and Skip on question cards don''t act until a later redraw'
created_by: martin-github@westhead.me
created_at: '2026-10-17T21:16:19.893854+00:00'
updated_at: '2026-10-17T22:21:52.806500+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-f0eaf370
  severity: medium
  commits:
  - working_sha: b167998f84e9697d4e532f03c099407d51aca823
    reconcile_sha: null
    main_sha: null
  - working_sha: af5b48f546e3d43e83580f8bd26c998afb05a966
    reconcile_sha: null
    main_sha: null
  version: 0.2.517
  story_points: 1
---

## Symptom

In the builder's plan panel, clicking **Change** on an answered or skipped question card does not open the card's editor straight away; nothing happens until some later redraw (focus moving elsewhere, a re-read after a turn). Clicking **Skip** on a question that was reopened to change likewise leaves the card open with its editor showing instead of folding it back to "Skipped".

## Root cause

`render()` in `apps/control-app/src/builder/plan-panel.js` keeps a card exactly as drawn when it contains `document.activeElement` — "the one in use" — so a redraw never loses what the client is typing or ticking. In a real browser a clicked button takes focus, so the Change / Skip button being clicked made its own card "in use" and the redraw that click asked for was skipped. (The UATs used `.click()` without focus, so they never saw it.)

## Fix

A card is held over a redraw only while focus is in one of its entry controls — a text box, text area, select, checkbox or radio — where a redraw would lose what the client is doing. Focus on a button (Change, Skip, Done, Remove…) or on the item's fold line no longer holds the card, so the click's redraw shows at once:

- **Change** opens the card's editor immediately.
- **Skip** on a reopened card redraws it as skipped, editor closed, as soon as the save returns.
- Typing in a field, or ticking a multi-select, while a redraw arrives still keeps the card (BUG-200 / REQ-364 behaviour unchanged).

## Test plan

`tests/test_UAT_FC_BUG-211_change_and_skip_act_at_once.test.ts` (jsdom, real builder, thin plan transport), with the button focused before it is clicked, as a browser does:
- Change on an answered card shows its editor straight away.
- Skip on a reopened answered card redraws it as skipped with no editor.
- A focused text field in a card still survives a redraw.

Regression scope: the plan-panel UATs (REQ-364, REQ-379, REQ-401, REQ-403, BUG-196, BUG-200).