---
uid: acceptance_criterion-4d017e74
id: AC-1533
type: acceptance_criterion
title: The listing carries titles, and rescues with an excerpt only the entry whose
  title cannot stand alone
created_by: xgd
created_at: '2026-09-04T03:36:49.125958+00:00'
updated_at: '2026-09-04T03:46:50.830569+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0fb17a68
  kind: behavior
  regression_only: false
---

## Criterion

The complete listing carries titles, and rescues only the entries whose titles cannot stand alone.
A document whose title is empty or is a bare filename is listed with a short excerpt of its own
content beside it, so that entry still says what the document is. A document with a real title is
listed by that title alone, and no part of its content appears in the listing — conveying content is
not the listing's job, and padding every entry with an excerpt would make it one.

An entry with neither a usable title nor any content is still listed, marked as untitled, rather
than dropped from a listing that claims to be complete.

## Verification

Build the landscape for a corpus holding one document titled as a bare filename with distinctive
content, and one with a descriptive title and equally distinctive content. Observe the first
entry carries a phrase from its content, and that no phrase from the second document's content
appears anywhere in the body. Include a document with neither title nor content and observe it is
still present, marked as untitled.