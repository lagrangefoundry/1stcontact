---
uid: acceptance_criterion-3235871e
id: AC-1120
type: acceptance_criterion
title: Italic is offered unavailable only on positive evidence of absence, with its
  reason, and a change to it is refused while a re-posted status quo passes
created_by: xgd
created_at: '2026-08-12T18:08:18.417977+00:00'
updated_at: '2026-08-20T02:55:12.271214+00:00'
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

Italic is always offered on a run of copy, and offered **unavailable** in exactly
one circumstance: the run's family declares faces and none of them is italic.
The lock is a claim about a webfont the site actually ships, so it needs the
webfont to be true.

A family that declares **no** faces at all keeps a live control. Such a run is
painted by the reader's own system font, which has real italics — locking there
would disable a control that works. And the control is shown unavailable rather
than dropped because a missing row reads as "this build has no italics" while a
locked one reads as "this site's font has none", and the two have very different
fixes.

It is shown unavailable **with its reason**, and the reason names the font rather
than the build, because adding a face to the site is the fix and asking the AI is
how it is done. This is one instance of the surface's general faithfulness rule
rather than a case of its own: the *unsupported* one.

A **change** posted for an unavailable field is **refused** — not applied, not
silently dropped — leaving the draft byte-for-byte unchanged, and refused with
the identical sentence the field's reason gave. The reason the field is
unavailable is a fact about the site that a submission cannot change, so a new
value for it can only have come from a caller that ignored what the region said
about itself. **Re-posting the value the field already holds is not a change and
passes**: the form posts every field it was given, so refusing the status quo
would make an unavailable italic freeze the whole run — its words included — on
every save.

Where italic is live it simply works, and turning it back off removes the setting
from the run rather than writing the default in.

## Verification

Seed a page declaring several non-italic faces for one family, and a run asking
for a family the page declares no faces for. Assert the first run's italic
control is offered unavailable and carries a reason naming the font, and that the
second's is neither unavailable nor carries a reason. Post a *changed* italic
value for the unavailable one and assert the edit is refused with a message
identical to that field's reason and the stored draft byte-for-byte unchanged.
Post its *unchanged* italic value alongside new words and assert the save
succeeds and the words land. Turn italic on for the live one and assert the
stored run carries it; turn it off again and assert the setting is absent from
the stored run rather than present holding the default.
