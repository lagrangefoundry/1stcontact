---
uid: acceptance_criterion-828c2981
id: AC-1276
type: acceptance_criterion
title: A change to an unavailable colour is refused with that field's own reason,
  while re-posting its unchanged value saves the rest of the region
created_by: xgd
created_at: '2026-08-20T02:57:54.611225+00:00'
updated_at: '2026-08-20T03:25:22.346899+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

A **change** to an unavailable colour is refused with a message **identical** to
the reason that field carried, at the field, leaving the draft byte-for-byte
unchanged. The sentence the caller was shown when the control was drawn and the
sentence it is refused with are one string with one definition, so the two can
never tell different stories.

**Re-posting the unchanged value passes, and the rest of the region saves.** A
form posts every field it was given, not only the ones that were touched, so an
unavailable colour rides along on every save — including one that only rewrote
the words. Refusing it would make an unavailable control freeze the *whole
region*, and the one measured run whose colour is unavailable is a headline: its
words would have become uneditable the moment its colour did. A field being
unavailable says "you may not move this", not "you may not save while this
exists".

## Verification

Address the run whose colour is unavailable because its glyphs are painted by a
gradient. Submit a *different* colour for it and assert the edit is refused, that
the fault path names the colour field, that the message is character-for-character
the reason that field reported, and that the stored draft is byte-identical.
Then submit new words for the same run together with the colour value the field
itself reported, and assert the save succeeds, that the changed-field list names
the words alone, and that the stored run carries the new words with its colour
untouched.