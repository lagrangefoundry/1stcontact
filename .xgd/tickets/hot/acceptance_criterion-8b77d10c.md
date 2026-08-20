---
uid: acceptance_criterion-8b77d10c
id: AC-1247
type: acceptance_criterion
title: Closing without confirming — by the control, by Escape, or by clicking outside
  — answers the opener with nothing, exactly once, and changes no state
created_by: xgd
created_at: '2026-08-20T01:59:15.831285+00:00'
updated_at: '2026-08-20T02:20:59.094459+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4300366a
  kind: behavior
  regression_only: false
---

## Criterion

Every route out of the surface without confirming — the cancel/close control, Escape, and a click
outside the dialog — closes it, resolves the opener with **no value**, and leaves the site's stored
definition unchanged. Whichever route is taken, the opener is answered exactly once: no route can
answer twice, and none can leave an opener waiting forever.

## Verification

Record the stored definition. Open the surface, select an entry, and leave by the cancel control;
observe no value returned and the definition unchanged. Repeat, leaving by pressing Escape. Repeat,
leaving by clicking outside the dialog panel. In each case observe the dialog removed from the page
and the opener answered once — including a case where Escape is pressed during the close already
under way, which must not answer a second time.