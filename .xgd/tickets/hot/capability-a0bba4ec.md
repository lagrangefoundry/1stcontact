---
uid: capability-a0bba4ec
id: CAP-98
type: capability
title: 'Palette Management: The Site''s Named Colours, Read, Edited & Guarded'
created_by: xgd
created_at: '2026-08-20T01:18:27.980373+00:00'
updated_at: '2026-08-20T01:18:27.980373+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: palette-management
---

# Capability: Palette Management

**Reading and editing the site's named colours as a first-class subject — the
census that says what each colour costs to change, the guards that stop an edit
leaving a colour pointing at nothing, and the surfaces an operator, an assistant
and the builder all reach that one set of rules through.**

A site's palette is a small map of names to colours; every colour on a page
either is a literal or names one of those entries, at a position within that
entry's own light↔dark family. That model makes an edit to one entry an edit to
everywhere it is used — which is the whole reason a palette exists, and also
what makes editing it a subject with its own rules rather than a settings write.

This capability owns those rules and the surfaces that expose them: what the
palette is, how much each entry is used, which edits have a computable answer
(change, add, rename) and which do not (removing a colour still in use), and how
a colour is chosen from the palette when something needs one.

## Scope

- **The usage census** — every entry with the number of places that reference
  it, across the site definition and every page, at any position in its family.
  The count is the fact the delete rule and the rename confirmation are both
  stated in, and it is taken by the same traversal an edit rewrites, so the
  number shown and the work done cannot disagree.
- **The four edits** — change an entry's colour (one write, every use follows),
  add an entry, remove one, rename one. Removal is permitted only at zero
  references and cannot be overridden; rename is a total, atomic rewrite of the
  key and every reference to it.
- **Where the guards live** — in the store's own write path, so they hold
  identically for the command line, for a browser surface with a stale view of
  the site, and for the assistant. A disabled control is an explanation of a
  rule, never the rule itself.
- **Choosing a colour from the palette** — one surface that displays the
  palette, lets it be edited in place, and resolves to a palette reference for
  whatever asked for a colour.
- **Free colour entry, bounded to this subject** — inventing a colour by hex is
  something the palette surface can express and other editing surfaces cannot,
  which is what bounds how incoherent a site's colours can become.

## Out of scope

- The palette colour *model* — the schema shape of an entry and a reference, the
  shade arithmetic, validation of a dangling reference and resolution at the
  load boundary — owned by the framework substrate capability.
- Deriving a palette from a folded site's colour literals, and the census of
  those literals — owned by the site materials capability (colour census and
  palette retrofit).
- Which axes of an element may carry a colour, and the segment-level controls
  that write one — owned by the structured-copy-editing and in-page-editing
  capabilities; this capability supplies the colours they choose from.
