---
uid: acceptance_criterion-31155287
id: AC-1822
type: acceptance_criterion
title: Writing a bundle member a second time replaces it, leaving exactly one copy
  holding the later content
created_by: martin-github@westhead.me
created_at: '2026-09-19T13:37:01.360479+00:00'
updated_at: '2026-09-19T13:37:01.360479+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-177897a0
  kind: behavior
  regression_only: false
---

## Criterion

Writing a member that already exists **replaces** it rather than adding a second
copy, on every backing. After two writes of the same member key, the bundle
reports that key exactly once and reading it yields the content of the **later**
write.

## Verification

On each backing, write the folded L1 document, write a different one to the same
member key, then assert that reading it back yields the second document's values
and that the member key appears exactly once in the bundle's key listing.
