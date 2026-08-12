---
uid: acceptance_criterion-66f57a24
id: AC-1122
type: acceptance_criterion
title: A typography edit writes into the parameters the run already carries and disturbs
  no other, an undeclared default is removed rather than written in, and a change
  map that changes nothing produces no diff
created_by: xgd
created_at: '2026-08-12T18:08:28.462612+00:00'
updated_at: '2026-08-12T18:08:28.462612+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

Changing how a run is set lands **in the parameters the run already carries**,
rather than over them. The parameter named is the only one that moves; every
other parameter the run holds — its family, its letter spacing, its colour, and
anything else the page was captured with — survives byte-identical. That is what
makes "restyling a run disturbs nothing else" true of the whole run rather than
merely of the setting that was named.

**Absent is the default.** Setting a field back to the value it has when nothing
is declared *removes* the parameter from the run rather than writing the default
into it. Writing it in would grow the page's definition on every save and turn an
edit that changed nothing into a diff.

**A change map that changes nothing is reported as changing nothing.** A save
carrying only values the run already holds succeeds, reports an empty list of
changed fields, and leaves the stored draft byte-for-byte unchanged — so the
modal cannot put a history in the draft that nobody asked for.

## Verification

Seed a run carrying several parameters beside the ones this surface exposes.
Change one setting and assert the stored run carries the new value alongside
every one of its other parameters unchanged. Set a setting back to its undeclared
default and assert the parameter is absent from the stored run rather than
present holding that default. Re-save the whole form with every value exactly as
the region reported it, and assert the save succeeds, reports nothing changed,
and leaves the stored draft byte-identical.
