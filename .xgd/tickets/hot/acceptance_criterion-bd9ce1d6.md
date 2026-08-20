---
uid: acceptance_criterion-bd9ce1d6
id: AC-1240
type: acceptance_criterion
title: The editing gesture's client code is served from this origin, derived from
  the renderer's own source rather than hand-copied
created_by: xgd
created_at: '2026-08-20T01:54:44.494436+00:00'
updated_at: '2026-08-20T03:00:57.457089+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The client code the editing gesture runs inside the displayed page is served
from this origin, as browser-executable script, and its bytes are derived at
serve time from the renderer's own source rather than maintained as a second
hand-written copy beside it.

This is the same reasoning as one production of a page, applied to a different
pair. The gesture's client code binds to the markup the renderer emits and reads
the annotations the renderer writes into it; a hand-written second copy of that
knowledge is free to drift from the markup, and the drift would be visible only
in a browser — nowhere a test can see it. Deriving the served bytes from the
renderer's own source removes the second copy, so there is nothing to keep in
step by hand.

This criterion is about *derivation and serving only*. What that code does once
the browser runs it — the click, the modal, the edit it applies — belongs to the
editing gesture's own story and is not claimed here. Nor is the mechanism of
derivation pinned: like the origin itself, *how* the bytes are produced is
expected to change when the origin moves into the edge runtime, and this
criterion is written about what the origin answers with.

## Verification

Request the gesture's client route over the running origin. Assert a success
carrying a script content type. Then assert the served text is the derived form
of the renderer's own source file — locate that source in the framework package,
derive it the same way, and assert the served body matches, so a file authored
separately beside it would fail. Assert also that the served text is executable
browser JavaScript rather than the TypeScript source passed through verbatim,
and that no separately authored copy of that client code exists in the
workspace's own application sources.