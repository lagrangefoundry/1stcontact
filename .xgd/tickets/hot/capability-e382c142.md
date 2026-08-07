---
uid: capability-e382c142
id: CAP-83
type: capability
title: Site Colour Census & Palette Retrofit
created_by: xgd
created_at: '2026-08-06T21:06:18.185843+00:00'
updated_at: '2026-08-07T15:59:27.996471+00:00'
completed_at: null
last_field_updated: merged_into
status: active
fields:
  name: site_colour_census_and_retrofit
  merged_into: capability-b4ac88fc
---

# Capability: Site Colour Census & Palette Retrofit

**Measuring an existing site definition's colours, and migrating it onto the
palette colour model without moving a pixel.**

The palette colour model (framework substrate capability) makes a palette
reference an admissible form for any colour axis. That model is only adoptable
on a site that already exists if there is a mechanical, repeatable way to get
from "every colour is an individually chosen literal" to "every colour is a
reference into a small palette" — and to *prove* the trip changed nothing.

This capability owns that trip: the measurement that says what colours a site
actually contains, the derivation that turns those colours into a palette, and
the lossless-or-refuse gate that stands between a derivation and the site's
files.

## Scope

- **The colour census** — distinct colour literals with their use counts,
  distinct RGB ignoring alpha, and the alpha families (one RGB used at several
  opacities), in both a human-readable and a machine-readable form. The census
  is read-only; it is also the evidence the palette model rests on.
- **Palette derivation** — exact alpha collapse first, then hue-family ramp
  grouping, with anything unclustered keeping its own entry. Families are named
  after what they are, and renameable to role vocabulary from the command line
  so a retrofit is reproducible end to end.
- **The lossless-or-refuse write** — the assignment writes only after proving
  every derived reference reproduces the literal it replaces and the converted
  definition still validates; otherwise it writes nothing.
- **Re-runnability** — an already-retrofitted site censuses and re-assigns as it
  did the first time, so adding a page or renaming a family is one command
  rather than a manual un-assignment.

## Out of scope

The palette *model* itself — the schema shape, the widened colour axis, the
validation of a dangling reference and the resolution at the load boundary —
belongs to the framework substrate capability. The capture→L1 fold belongs to
the reproduction pipeline capability and continues to emit literals only;
palette assignment is a separate pass over a folded site, never a change to the
fold. No colour-picker or palette-editor UI is in scope.