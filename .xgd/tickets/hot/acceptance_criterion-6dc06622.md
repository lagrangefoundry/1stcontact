---
uid: acceptance_criterion-6dc06622
id: AC-1231
type: acceptance_criterion
title: Adding an entry makes it immediately usable; a duplicate name, a malformed
  name, or a colour carrying transparency is refused with a reason and writes nothing
created_by: xgd
created_at: '2026-08-20T01:19:50.533797+00:00'
updated_at: '2026-08-20T01:19:50.533797+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ee073693
  kind: behavior
  regression_only: false
---

## Criterion

Adding an entry takes a kebab-case name and one opaque colour, and the entry is immediately part
of the palette — it appears in the next read with a usage count of `0` and can be referenced.

Each of the following is refused with a stated reason, and leaves the site definition
byte-unchanged:
- a name the palette already declares (reported as a conflict, naming the existing entry);
- a name that is not kebab-case (reported as a schema refusal, with a hint stating the form);
- a colour that is not an opaque hex — including one carrying transparency — reported as a schema
  refusal that states transparency belongs to a use rather than to an entry.

## Verification

Add an entry with a valid name and colour; read the palette and assert the entry is present with
its colour and a count of `0`, and that a page may then reference it and render. Then attempt an
add for each of the three refusal cases and assert each fails with the corresponding refusal
kind and message, and that the site definition is identical before and after each attempt.
