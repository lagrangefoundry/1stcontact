---
uid: acceptance_criterion-98f8f69e
id: AC-1711
type: acceptance_criterion
title: 'Promotion never replaces an asset already live: a free name preserving the
  extension is used and reported'
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:02:55.046508+00:00'
updated_at: '2026-10-26T01:26:26.345057+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-aacb7060
  kind: behavior
  regression_only: false
---

## Criterion

Promotion never replaces an asset already on the site. When the name the material would land
under is already taken, the asset lands under a free name derived from the requested one — the
distinguishing suffix placed before the file extension, so the extension every consumer reads
the type from is preserved — and the name actually used is what the hand-over reports back and
what the site's asset listing shows.

Promotion lands the asset by the same add path every other asset write takes, so the renamed
asset is listed and readable by the site exactly as an asset added any other way would be.

The asset that was already live is untouched: reading it after the promotion returns the bytes
it had before.

## Verification

Promote two different files that both ask for the same asset name into the same site, then:

- observe the first reports the requested name and the second reports a distinct, derived name
  that still ends in the same extension;
- observe the site lists both names, the second under exactly the name reported;
- read the first name back and observe it still returns the first file's bytes, not the
  second's.
