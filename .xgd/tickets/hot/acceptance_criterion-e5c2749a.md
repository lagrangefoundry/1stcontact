---
uid: acceptance_criterion-e5c2749a
id: AC-2521
type: acceptance_criterion
title: A write reloads the page on screen in place and marks every other channel out
  of date, re-rendering none of them
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T03:11:39.106488+00:00'
updated_at: '2026-11-09T03:11:39.106488+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

A write reloads the page on screen and marks the other channels out of date
([[BUG-79]]). The writes are a palette change, an assistant change and a segment
save. Each reloads the displayed document in place, where the frame actually
is, so a link the operator followed inside it is kept rather than replaced by
the page the mode first opened. Every other channel's frame is marked out of
date. It is not re-rendered at write time, because nobody is looking at it. The
next time it is shown it fetches, so it never serves the render from before the
write.

## Verification

Mount the real builder composition with both channels loaded and View shown.
Trigger a write. Assert the View frame reloads and the Edit frame does not load.
Switch to Edit and assert it now fetches (a load fires) rather than revealing
its pre-write document. Separately, follow a link inside the shown frame, then
trigger a write, and assert the reloaded document is the linked page.

Reference UAT: `tests/test_UAT_FC_BUG-79_flip_in_place.test.ts`
(a_write_reloads_the_shown_page_and_stales_the_others).
