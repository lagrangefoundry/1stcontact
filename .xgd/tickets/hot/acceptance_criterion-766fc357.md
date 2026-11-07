---
uid: acceptance_criterion-766fc357
id: AC-1758
type: acceptance_criterion
title: Every refusal, including the scope refusal, is byte-identical, reads that 1st
  Contact cannot open this for you at the moment, claims nothing ended, names no reason,
  is forbidden and neither cached nor indexed
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:32.280175+00:00'
updated_at: '2026-11-07T08:09:34.411617+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Every caller refused at admission receives the same answer, whatever the reason: a
caller with no record, a caller with no address, a caller whose membership has been
withdrawn, and a caller whose own record is suspended. The scope refusal also receives
it. That refusal goes to an admitted caller who names a business that is not theirs.
All of these responses are byte-identical: the same status and the same single
message, which reads:

> 1st Contact cannot open this for you at the moment. Please get in touch and we will sort it out.

The message is true of every reason. It does not claim that any access ended, and it
names no check and no reason, so it cannot be used to test addresses against the
contact list.

The refusal is a forbidden answer rather than an authentication challenge. The caller
has already proved who they are, so sending them back round the login loop would
produce the same identity and the same refusal forever. The response is marked as
neither storable by a cache nor indexable, because one cached refusal would become
everybody's answer, including the entitled.

These callers are not refused at admission, so they do not get this answer:
- a person whose grants have all lapsed (membership admits);
- a contact who has not signed up and whose account owns no business. That contact is
  admitted to the terms gate instead.

## Verification

Request the builder as a fully verified identity that was never invited, as a person
whose membership has been withdrawn, and as a person whose record is suspended. Then,
as an admitted person, request a business that is not theirs. Assert all responses
carry the same status and the same body bytes, and that the body equals the sentence
above. Assert the status is the forbidden one rather than the authentication-challenge
one. Assert the body contains no word claiming an ending ("ended", "expired",
"revoked") and no reason name. Assert each response declares itself non-storable and
non-indexable.
