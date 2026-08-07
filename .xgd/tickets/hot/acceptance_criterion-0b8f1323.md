---
uid: acceptance_criterion-0b8f1323
id: AC-998
type: acceptance_criterion
title: After a successful save the operator's page shows the new words with no further
  step, and stays editable
created_by: xgd
created_at: '2026-08-07T02:16:37.837461+00:00'
updated_at: '2026-08-07T02:16:37.837461+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

Confirming a valid change closes the form and leaves the operator looking at
their page with the new words rendered on it, with no further action on their
part — no manual refresh, no re-render command, no mode switch. The stored draft
holds the new words too.

The page the operator is now looking at is a replacement of the one they clicked
in, and the edit gesture is live on it: hovering still highlights and clicking
still opens a form.

## Verification

In a real browser, edit a region's text, confirm the form, and assert the
displayed page's text becomes the new text without further interaction; assert
the draft, read back independently, holds the same new text. Then hover and
click a region on the refreshed page and assert the highlight and the form still
work.
