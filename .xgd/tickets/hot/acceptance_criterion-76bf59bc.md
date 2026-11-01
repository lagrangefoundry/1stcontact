---
uid: acceptance_criterion-76bf59bc
id: AC-2161
type: acceptance_criterion
title: A placed site asset carries no placement badge; only a site-role material that
  was never placed is marked, in words, as not on the site
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T12:05:17.158874+00:00'
updated_at: '2026-11-01T12:05:17.158874+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

No Library row carries a placement badge. A material that was placed on the site is the normal
case and is not marked: its row shows only its type icon, its title and its role pill.

Exactly one state is badged, as the exception: a material the client handed over for the site
(role *Site asset*) whose recorded placement is empty — they asked for it to go on their site and
the bytes never got there (for example, its promotion failed). That row, and no other, carries a
warning that:

- says its meaning in words — **Not on the site** — inside the badge, so a screen reader and a
  forced-colours or monochrome display each get the whole fact;
- carries a warning glyph that is decorative and hidden from assistive technology;
- offers the full sentence as its hover text — *"You asked for this to go on your site and it did
  not get there. It is still here — try adding it again."*;
- is drawn in the workspace's danger colour, not its accent colour, as a warning in its own right
  rather than the old placement pill recoloured.

Background information is never marked, however unplaced it is: background material is never
placed by construction, so a warning keyed on placement alone would fire on every reference
document. A material with no recorded placement at all reads as placed nowhere.

## Verification

Mount the Library over material including a site-role row with a recorded placement, a site-role
row with an empty placement, a site-role row with no placement field, and a background row with an
empty placement. Observe no row carries a placement badge. Observe the warning on exactly the two
site-role rows with no placement, and on neither the placed row nor the background row. On a
warning, observe the words *Not on the site* in the badge, the glyph marked hidden from assistive
technology, and the full sentence as its title. In the stylesheet, observe the warning takes the
danger colour and not the accent, and that no rule styles a placement ("on this site") badge.
