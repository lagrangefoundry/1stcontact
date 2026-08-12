---
uid: acceptance_criterion-08c7ebe8
id: AC-991
type: acceptance_criterion
title: 'No edit through this surface can produce raw HTML or CSS: every control is
  plain text, a pick from a list the surface supplied, a bounded whole number, or
  a yes/no'
created_by: xgd
created_at: '2026-08-07T02:02:54.192416+00:00'
updated_at: '2026-08-12T18:07:04.942153+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

There are exactly four shapes of field this surface can offer, and none of them
can carry code:

- a **plain-text** field, whose content is stored and rendered as the region's
  literal words — markup in it creates no element and applies no style;
- a **closed-list** field, which can only return one of the options the surface
  itself put in front of the caller;
- a **bounded whole number**, which carries its inclusive limits with it; and
- a **yes/no**.

The last three are strictly narrower than a free string: a closed list can only
hand back something the surface already supplied, and a number and a bit cannot
express a character at all. So the vocabulary has grown twice without the
raw-code guarantee moving — what a region can *say* about itself widened, what a
caller can *smuggle* did not.

There is no fifth shape, no freeform option and no mode through which markup,
styles or script can be submitted as code.

## Verification

Save a string containing script and style markup into a copy region, and into an
image region's alt text. Assert each save succeeds, that the rendered page shows
that string as literal text, and that it introduced no corresponding element or
active style. Separately, read every region of a page — including a run of copy,
which exposes at least one field of each of three shapes — and assert that every
field offered is one of the four shapes above, that every closed-list field
carries the list of values it will accept, and that every bounded-number field
carries its limits.
