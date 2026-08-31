---
uid: acceptance_criterion-316e92c7
id: AC-1447
type: acceptance_criterion
title: Reading an unchanged draft repeatedly assembles it once, with currency proven
  by a live version read on every read
created_by: xgd
created_at: '2026-08-31T16:37:44.339228+00:00'
updated_at: '2026-08-31T16:37:44.339228+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

Reading the same unchanged draft twice assembles it once. The site's write version is read from the
database on **every** read and is what decides whether the previously assembled value may be
reused, so currency is proven per read rather than assumed from a timer or from the reader's own
memory of what it last wrote.

Consequently:

- **A draft that has not moved costs no re-validation.** Two consecutive reads at the same version
  hand back the *same* assembled value — not merely an equal one — and the same stamp. Equality
  alone would also hold if the whole definition had been validated again, which is the cost this
  criterion exists to remove; the definition of a large site is the great majority of what a read
  costs, so this is the difference between a preview request the runtime can afford and one it
  cannot.
- **Any write is seen on the next read.** Every draft mutation advances the site's write version —
  including an asset write, whose names the assembled definition consumes — so a write is never
  invisible to a later read.
- **A write made through another handle, or by another process entirely, is seen too.** Because the
  version that decides reuse is read live from the database and not held in the reader's memory, a
  publish run from an operator's machine, or a request served by a different host process,
  invalidates a retained value exactly as the reader's own write does.

The retained value is data, never a store handle: it is reached only after the account check that
binds a handle to its account has already run for this read, so a deactivated account is turned
away before any retained value is consulted.

## Verification

Against the cloud store, seed a site and read its draft twice with nothing in between: both reads
report the same assembled value by identity and the same stamp.

Read the draft, write a change to it through the same handle, and read again: the assembled value
and the stamp both differ, and the new value contains the change.

Read the draft, then write a change through a **second, independently obtained** handle for the
same account, and read again through the first: the value differs and contains the change written
elsewhere.

Drive the editing surface's own preview route twice at an unchanged version and observe a
byte-identical answer; save a change and request it again, and observe an answer that differs and
carries the saved change.
