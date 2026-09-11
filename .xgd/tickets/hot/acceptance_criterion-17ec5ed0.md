---
uid: acceptance_criterion-17ec5ed0
id: AC-1716
type: acceptance_criterion
title: The client narrows the Library by role, by kind, by used-on-this-site and by
  typed text, conjunctively and as a view over the same listed material
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:18:45.613665+00:00'
updated_at: '2026-09-11T05:28:53.741047+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

The client can narrow the Library along four axes, and every axis is a view over the same listed
material rather than a re-scoped request:

- by what the material is **for** (the role the client chose when adding it) — selecting one role
  leaves only material carrying it;
- by **kind** of file (image, document, font, capture) — selecting one kind leaves only material
  of that kind;
- by **used on this site** — turning it on leaves only material bound to the site currently open,
  and turning it off restores the whole account's material;
- by **typed text**, matched against a material's title and filename.

The axes combine conjunctively: material must satisfy every axis that is set. Changing which site
is open re-decides both the badge and the "used on this site" filter from the material already
listed, without the list being re-fetched or any material being dropped from it.

## Verification

Open the Library over an account whose material spans both roles, several kinds, one bound to the
open site and others not. Set each filter in turn and observe exactly the expected subset
remains; clear it and observe the full list returns. Set two filters at once and observe only
material satisfying both remains. With "used on this site" set, change the open site and observe
the surviving rows change accordingly without a further request for the account's material.