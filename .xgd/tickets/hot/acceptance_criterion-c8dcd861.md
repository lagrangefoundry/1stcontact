---
uid: acceptance_criterion-c8dcd861
id: AC-1816
type: acceptance_criterion
title: The workspace starts its markdown engines once, and their readiness settles
  whether they load or fail
created_by: martin-github@westhead.me
created_at: '2026-09-14T07:28:06.445707+00:00'
updated_at: '2026-09-14T07:47:17.144409+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
---

## Criterion

Every surface in the builder workspace that shows markdown draws on one shared pair of
engines — the renderer and the sanitizer that scrubs what it produces. Their loading is
started a single time when the workspace is loaded, however many such surfaces the
operator opens and whichever one they reach first; a surface brought up on its own finds
those loads already in flight rather than starting a second copy of them.

The readiness those surfaces wait on settles in both outcomes — when the engines arrive,
and when they cannot be fetched at all. It never reports failure, so no surface can be
left waiting on it and none has to have a second path for the engines refusing to come.
With the engines unavailable the workspace is a plainer one: markdown is shown as
readable escaped text rather than as rendered prose, and no surface blanks, hangs, or
puts an error in front of the operator to clear.

## Verification

Load the workspace with the engine sources reachable, open more than one surface that
renders markdown, and count the requests made for each engine: one apiece, regardless of
how many surfaces were opened or which came first. Bring up a single markdown-rendering
surface on its own and confirm the engines load without that surface asking for them.

Then make the engine sources unreachable and load the workspace again: confirm it
finishes loading, that the surfaces which wait on readiness proceed rather than stalling,
that their content is shown as escaped text rather than as raw markup or not at all, and
that no failure is surfaced to the operator.