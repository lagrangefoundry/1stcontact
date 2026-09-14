---
uid: acceptance_criterion-6b843dc0
id: AC-1766
type: acceptance_criterion
title: 1c refold re-derives l1.json and forms.json from a stored bundle on either
  backing, without re-hitting the site
created_by: martin-github@westhead.me
created_at: '2026-09-14T04:48:41.899072+00:00'
updated_at: '2026-09-14T05:00:56.311331+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0cb7f25b
  kind: behavior
  regression_only: false
---

## Criterion
`1c refold --ref <bundle>` re-derives a stored bundle's `l1.json` and `forms.json`
from the observation the bundle already retains, reaching the network not at all,
and behaves identically whichever backing holds the bundle:

- it reports the name of the bundle it refolded
- both derived members are present afterwards, whether or not either existed before
- the retained observation (`multistate.json`) is byte-for-byte unchanged: a
  refold changes what is *derived*, never what was *observed*
- a bundle holding no retained observation — one predating multi-viewport
  capture — is refused with a message naming that bundle and naming re-capture as
  the remedy, rather than failing on a parse of a missing member

## Verification
Write a retained observation and a capture record into a bundle on the
locally-backed store, refold, and assert the derived members appear and the
observation is unchanged. Repeat against a non-filesystem backing and assert the
same result, proving the verb does not know which store it was given. Refold a
bundle with no retained observation and assert the refusal names the bundle and
the remedy.