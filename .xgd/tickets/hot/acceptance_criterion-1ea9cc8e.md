---
uid: acceptance_criterion-1ea9cc8e
id: AC-598
type: acceptance_criterion
title: Overlay chrome spans the full band and is pointer-transparent
created_by: xgd
created_at: '2026-07-13T20:23:23.064994+00:00'
updated_at: '2026-07-13T20:29:23.287761+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d70a0264
  kind: behavior
  regression_only: false
---

## Criterion
In an overlay header, the header chrome spans the full hero band so a positioned
wordmark can be placed anywhere within it, and the chrome itself does not
intercept pointer events over the hero — only its interactive controls (the
navigation) remain clickable.

## Verification
Inspect the overlay-band chrome contract: the chrome covers the full band
(inset 0) and is pointer-transparent, while its interactive controls re-enable
pointer events. Confirm a click over the hero area passes through the chrome and
the nav controls remain clickable.