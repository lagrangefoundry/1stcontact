---
uid: acceptance_criterion-99d4a678
id: AC-1444
type: acceptance_criterion
title: Caller presentation options are honoured, but the currency and the zone the
  value is shown in cannot be overridden by them
created_by: xgd
created_at: '2026-08-31T12:39:16.263632+00:00'
updated_at: '2026-08-31T12:39:16.263632+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0598c150
  kind: behavior
  regression_only: false
---

## Criterion

Both formatting operations accept the caller's presentation preferences and
apply them — including a request to display the time-zone name alongside a time,
so that a booking readable across zones can state which zone it is in.

What the caller's options cannot do is change the facts that make each operation
what it is: an option cannot cause a money value to be rendered as a plain
number or in a currency other than the one supplied, and an option cannot cause
a moment to be rendered in a zone other than the one supplied. Those are fixed
by the operation and take precedence over anything passed alongside them.

When no presentation preference is given for a moment, a full readable date and
a short time are shown.

## Verification

Format a time with a request for the short zone name and assert the zone
abbreviation appears in the output. Format a time with a zone-overriding option
supplied alongside a different zone argument and assert the argument wins.
Format a money value with a style-overriding option and assert the currency is
still shown. Format a time with no options and assert the default long-date,
short-time shape.
