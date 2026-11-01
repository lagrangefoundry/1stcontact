---
uid: acceptance_criterion-17ec5ed0
id: AC-1716
type: acceptance_criterion
title: The client narrows the Library by role, by kind and by typed text, conjunctively
  and as a view over the same listed material, with no used-on-this-site filter
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:18:45.613665+00:00'
updated_at: '2026-11-01T13:27:01.781282+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
  title: The client narrows the Library by role, by kind and by typed text, conjunctively
    and as a view over the same listed material, with no used-on-this-site filter
---

## Criterion

The client can narrow the Library along three axes, and every axis is a view over the same listed
material rather than a re-scoped request:

- by what the material is **for** (the role the client chose when adding it) — selecting one role
  leaves only material carrying it;
- by **kind** of file (image, document, font, capture) — selecting one kind leaves only material
  of that kind;
- by **typed text**, matched against a material's title and filename.

The axes combine conjunctively: material must satisfy every axis that is set. Setting or clearing
a filter does not request the business's material again. There is no "used on this site" filter
— no checkbox, label or equivalent control — because under one site per business it would only
restate the role filter for placed site assets and the warning for unplaced ones. Which material
is listed at all follows the business chosen in the header, not a filter.

## Verification

Open the Library over a business whose material spans both roles and several kinds. Set each
filter in turn and observe exactly the expected subset remains; clear it and observe the full list
returns, with no further request for the material. Set two filters at once and observe only
material satisfying both remains. Inspect the list header and observe exactly the text, role and
kind controls, and no "used on this site" control.