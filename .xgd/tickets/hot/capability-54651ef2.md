---
uid: capability-54651ef2
id: CAP-109
type: capability
title: 'Material Library & Upload Surfaces: The Client''s Own Files, Seen And Added
  To'
created_by: xgd
created_at: '2026-09-04T04:25:27.514883+00:00'
updated_at: '2026-09-04T04:25:27.514883+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: material-library-surfaces
---

[[CAP-108]] is how a byte gets into the system and [[CAP-106]] is where it lives once it is here. This
capability is the pair of surfaces the client operates their own material *through* — the ones
[[CAP-108]] explicitly excludes.

Everything a client hands the platform — photos, fonts, brand guidelines, positioning papers, and
eventually captures of their own previous site — becomes a record with a written description of what
it says. Until these surfaces existed the client could see none of it, and had no way to put a byte
in at all.

This capability owns:

- **The Library** — a workspace surface listing everything the account has given us, whatever site it
  is bound to and whether it is bound to one at all, with the current site as a badge and a filter and
  never as a boundary. Selecting a piece of material shows the file itself, what the system understands
  it to be, and the record of where it came from and what may be done with it.
- **Correction** — the one thing the client may change about a piece of material is what it *says*. A
  correction reaches retrieval rather than only the screen, and is attributed to them so nothing later
  overwrites their words. The rights record is shown and never asked about: rights are inferred from
  provenance precisely so the client is never put in front of a legal question.
- **Putting a byte in from the browser** — the drop-and-choose gesture, the one question this product
  asks about a file ("is this for the site, or for you to read?"), and what follows from the answer:
  material marked for the site reaches the site's assets at once, material marked for reading
  cannot reach a published site at all.

What this capability is NOT: the pipeline a byte travels ([[CAP-108]]), the record it becomes
([[CAP-106]]), the knowledge base built over it ([[CAP-107]]), or the workspace chrome that hosts
these surfaces ([[CAP-85]]).
