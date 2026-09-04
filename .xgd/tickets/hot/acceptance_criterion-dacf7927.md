---
uid: acceptance_criterion-dacf7927
id: AC-1539
type: acceptance_criterion
title: What kind of thing a file is comes from the bytes, with the name as a fallback,
  and nothing is refused for being unrecognisable
created_by: xgd
created_at: '2026-09-04T03:53:34.035121+00:00'
updated_at: '2026-09-04T03:53:34.035121+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-70a922b9
  kind: behavior
  regression_only: false
---

## Criterion

Every created piece of material records what kind of thing it is, drawn from the closed vocabulary
the material store declares, and decided as follows:

- What the bytes are declared to be leads: an image type yields an image, a font type yields a font.
- Where the declared type says nothing — absent, or the generic "some bytes" type — the file's own
  name decides instead: the common font and image extensions yield a font or an image respectively.
- Anything else is recorded as a document. A file whose type and name are both unrecognised is
  **stored** as a document rather than refused.

The decision is observable on the created record and is the same for both entry points.

## Verification

Send files whose declared types are an image type, a font type, a document type and the generic
byte type, and assert the recorded kind for each. Send a font and an image whose declared type is
the generic byte type but whose names carry the usual extensions, and assert both are recorded as
font and image rather than as documents. Send a file with an unrecognised declared type and an
unrecognised name and assert a record exists, is recorded as a document, and its bytes are readable
back.
