---
uid: acceptance_criterion-3235871e
id: AC-1120
type: acceptance_criterion
title: Italic is offered read-only only on positive evidence of absence, and a value
  posted for a read-only field is refused
created_by: xgd
created_at: '2026-08-12T18:08:18.417977+00:00'
updated_at: '2026-08-12T18:08:18.417977+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

Italic is always offered on a run of copy, and offered **read-only** in exactly
one circumstance: the run's family declares faces and none of them is italic.
The lock is a claim about a webfont the site actually ships, so it needs the
webfont to be true.

A family that declares **no** faces at all keeps a live control. Such a run is
painted by the reader's own system font, which has real italics — locking there
would disable a control that works. And the control is shown read-only rather
than dropped because a missing row reads as "this build has no italics" while a
locked one reads as "this site's font has none", and the two have very different
fixes.

A value posted for a read-only field is **refused** — not applied, not silently
dropped — leaving the draft byte-for-byte unchanged. The reason the field is
read-only is a fact about the site that a submission cannot change, so a post for
it can only have come from a caller that ignored what the region said about
itself.

Where italic is live it simply works, and turning it back off removes the setting
from the run rather than writing the default in.

## Verification

Seed a page declaring several non-italic faces for one family, and a run asking
for a family the page declares no faces for. Assert the first run's italic
control is offered read-only and the second's is not. Post italic for the
read-only one and assert the edit is refused with the stored draft byte-for-byte
unchanged. Turn italic on for the live one and assert the stored run carries it;
turn it off again and assert the setting is absent from the stored run rather
than present holding the default.
