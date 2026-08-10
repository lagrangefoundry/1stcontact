---
uid: acceptance_criterion-33328c06
id: AC-1053
type: acceptance_criterion
title: A turn is addressed to a conversation, not a site; naming a site instead is
  refused and changes nothing
created_by: xgd
created_at: '2026-08-10T08:35:34.989479+00:00'
updated_at: '2026-08-10T08:42:35.089769+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
Running a turn requires the identifier of an open conversation and the operator's
text. A request that names a site instead of a conversation, or omits either
value, is refused as a malformed request — identifying which value is missing —
before any turn begins. The site's draft is unchanged and no conversation is
started or extended.

## Verification
Open a conversation for a site that exists, then submit a turn naming that site
rather than the conversation. The request is refused as malformed, the refusal
names the missing conversation identifier, and the site's draft is byte-identical
to before.