---
uid: acceptance_criterion-57ae9026
id: AC-1674
type: acceptance_criterion
title: A title that cannot stand alone gets an excerpt; a real title stands alone
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:47:54.245760+00:00'
updated_at: '2026-09-11T03:47:54.245760+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ea7b4646
  kind: behavior
  regression_only: false
---

## Criterion

In the complete listing, a document whose title cannot stand on its own — a bare
filename such as `IMG_4821.jpg`, or no title at all — is listed with a short
excerpt of its content beside the title, so the entry still says what the
document is.

A document with a real title is listed by that title alone: its body text does
not appear in the listing. Conveying content is not the listing's job, and the
excerpt is a per-entry rescue rather than a default applied to every entry.

An untitled document is still named as an entry rather than dropped.

## Verification

Build the listing for a corpus holding one document titled with a bare filename
and a distinctive body, and one document with a descriptive title and an equally
distinctive body. Assert the first document's body text appears in the listing
and the second document's body text does not, while both documents are present as
entries. Assert directly that a bare filename and an empty title are each treated
as titles that cannot stand alone, and that an ordinary descriptive title is not.
