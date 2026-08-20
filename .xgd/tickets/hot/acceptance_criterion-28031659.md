---
uid: acceptance_criterion-28031659
id: AC-1269
type: acceptance_criterion
title: A run of copy exposes the colour its words are painted in, reporting what it
  holds and writing only a reference into the site's palette
created_by: xgd
created_at: '2026-08-20T02:56:15.730109+00:00'
updated_at: '2026-08-20T02:56:15.730109+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

Asking a run of copy what it exposes returns, beside its words, **what colour
those words are painted in** — a field whose value is a colour, listed before the
controls for how the run is set.

The value it reports is whatever the run actually holds, which on a folded site
is a free colour literal; a run that declares no colour of its own reports **no
value** rather than the colour it inherits, because a control that claims the
region holds something it does not would write that claim back on the next save.

The value it **writes** is a reference into the site's own palette: the name of
an entry, optionally with a position on that entry's light↔dark range. Choosing
an entry stores that reference — not the colour the entry currently resolves to —
and the re-rendered page paints what the entry resolves to, so a later change to
the entry moves this run with it. Picking on a folded run therefore converts a
literal into a reference, which is the refinement the design wants.

The field is offered **whether or not the site has a palette yet**. Most folded
sites hold literals and no palette at all, so a colour field that opened onto
nothing is the common first state rather than an edge case — and withdrawing the
field would make the palette unreachable from the only surface that wants one.
The entries that may be named come back with the same answer, so a caller cannot
draw a swatch against one palette and post a reference against another.

## Verification

Seed a site whose page carries a run with a free colour literal, a run declaring
no colour, and a palette of several entries. Request each run's fields and assert
a colour field is present in both, positioned after the words and before the
typography controls; that the first reports its literal and the second reports no
value; and that the site's palette entries accompany the answer. Choose an entry
for the first run and assert the stored run carries the reference — the entry
name and, where one was chosen, the position — rather than a resolved colour, and
that the re-rendered page paints the colour that entry resolves to at that
position. Repeat against a site whose definition declares no palette and assert
the field is still offered, with no entries accompanying it.
