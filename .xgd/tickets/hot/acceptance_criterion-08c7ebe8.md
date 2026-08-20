---
uid: acceptance_criterion-08c7ebe8
id: AC-991
type: acceptance_criterion
title: 'No edit through this surface can produce raw HTML or CSS: every control is
  plain text, a pick from a list the surface supplied, a bounded whole number, a yes/no,
  or a reference into the site''s own palette'
created_by: xgd
created_at: '2026-08-07T02:02:54.192416+00:00'
updated_at: '2026-08-20T02:54:29.491733+00:00'
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

There are exactly five shapes of field this surface can offer, and none of them
can carry code:

- a **plain-text** field, whose content is stored and rendered as the region's
  literal words — markup in it creates no element and applies no style;
- a **closed-list** field, which can only return one of the options the surface
  itself put in front of the caller;
- a **bounded whole number**, which carries its inclusive limits with it;
- a **yes/no**; and
- a **palette reference** — the name of an entry the site's own palette declares,
  optionally with a position on that entry's range and an opacity, both bounded.

The last four are strictly narrower than a free string: a closed list can only
hand back something the surface already supplied; a number and a bit cannot
express a character at all; and a palette reference can only name an entry the
site already has, with a free colour value refused outright even though it is
perfectly well formed. So the vocabulary has grown three times without the
raw-code guarantee moving — what a region can *say* about itself widened, what a
caller can *smuggle* did not.

The one thing the third growth changed is that a field's value need no longer be
a scalar. A colour travels as a typed value with its own named parts rather than
being encoded into a string, precisely so that no parser sits between the
control and the page.

There is no sixth shape, no freeform option and no mode through which markup,
styles or script can be submitted as code.

## Verification

Save a string containing script and style markup into a copy region, and into an
image region's alt text. Assert each save succeeds, that the rendered page shows
that string as literal text, and that it introduced no corresponding element or
active style. Separately, read every region of a page — including a run of copy,
which exposes fields of four of the five shapes — and assert that every field
offered is one of the five shapes above, that every closed-list field carries the
list of values it will accept, and that every bounded-number field carries its
limits. Post a free colour value, rather than a palette entry name, to a colour
field whose region currently holds something else, and assert it is refused.
