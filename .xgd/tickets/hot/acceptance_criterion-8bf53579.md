---
uid: acceptance_criterion-8bf53579
id: AC-763
type: acceptance_criterion
title: A run declares the width from which it is unbreakable, and stays unbroken above
  it
created_by: xgd
created_at: '2026-08-03T01:33:57.903398+00:00'
updated_at: '2026-08-03T02:03:12.417376+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
A text run may declare the viewport **width from which it is unbreakable**, and
the published page keeps that run on a single line at and above that width while
leaving it free to wrap below it. The declaration is a *width*, not a boolean,
because line count is a function of width: the same run may be one line on
desktop and three at 320px, and a flag could only be set for runs that never wrap
at any width — excluding precisely the runs that need it.

When the declared width is at or below the ladder's smallest width the run is
unbreakable unconditionally; above it, the pin takes effect from that width up. A
run that declares no such width is left breakable everywhere.

This exists because a fixed-width box re-opens a line-breaking decision the
design had already closed, and a shrink-to-fit box clears its own glyphs by a
fraction of a pixel — an amount different engines resolve differently, so an
unpinned run can wrap in one engine and not another and overprint whatever is
positioned below it.

## Verification
Render a run declaring an unbreakable-from width above the ladder floor and
observe the emitted CSS pins it only from that width upward; render a run
declaring a width at or below the floor and observe an unconditional pin; render
a run declaring none and observe no pin. Confirm across every available browser
engine that a document whose single-line runs declare the width renders them on
one line in each engine, and that the same document without the declaration
demonstrably wraps in at least one engine (so the check cannot silently stop
discriminating).