---
uid: acceptance_criterion-f4202556
id: AC-1004
type: acceptance_criterion
title: Copy that overflows the box it renders into is still legible in full in the
  form field
created_by: xgd
created_at: '2026-08-07T02:17:04.964342+00:00'
updated_at: '2026-08-07T18:00:35.271532+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Where a region's words are longer than the box the page renders them into — so
that the page clips, overflows or otherwise does not show them all — the form
opened over that region still shows the complete string in its field. Ugly
output on the page is accepted; an operator unable to read back what they typed
is not.

## Verification

Set a region's copy to a string longer than its rendered box, reopen the form
over that region, and assert the field's value is the whole string, character
for character.