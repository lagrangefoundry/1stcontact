---
uid: acceptance_criterion-54d0866f
id: AC-1466
type: acceptance_criterion
title: Every capture path applies the same capture preconditions before the page is
  measured
created_by: xgd
created_at: '2026-08-31T22:53:34.656847+00:00'
updated_at: '2026-08-31T23:04:42.302554+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-080c6036
  kind: behavior
  regression_only: false
---

## Criterion

Before any page is photographed or measured, the same preconditions are applied,
whichever capture path is in use:

- declared motion is landed on its final frame instantly, and blocks held in a
  pre-animation hidden state are revealed, so an entrance-animated block shows
  its content rather than nothing;
- the page is scrolled its full height in viewport steps and returned to the top,
  so lazy-load and entrance observers have fired, and any image still marked
  deferred is promoted to load immediately;
- every image is awaited to completion before measurement;
- web fonts are awaited immediately after load, and awaited **again** after the
  scroll for the exact face of every visible text run — family, real weight,
  style, and that run's own text — so a face first needed by revealed content is
  painted rather than a fallback.

Each step degrades rather than failing the capture: an image that never loads, a
page with no images, and an engine with no font API each leave the capture
proceeding and the screenshot still worth taking, and an unresolved face is
reported honestly as unloaded rather than silently substituted.

## Verification

Execute the preconditions against a real document and assert their effects:
deferred images acquire their real source and eager loading; a page with no
images completes; an incomplete image holds the wait and a broken image releases
it rather than hanging; a document with no font API completes; and the font step
requests the exact face of a visible run with that run's own text while
requesting nothing for a hidden run. Read the motion-landing rules off the
injected stylesheet.