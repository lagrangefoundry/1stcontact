---
uid: acceptance_criterion-1dd3f242
id: AC-1719
type: acceptance_criterion
title: A corrected description is what retrieval answers with afterwards, not only
  what the screen shows
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:18:58.290123+00:00'
updated_at: '2026-09-11T05:28:53.319449+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

A corrected description is what retrieval answers with afterwards. After the client rewrites the
description of a piece of material, a search of the client's knowledge whose terms appear only in
the new description finds that material, and a search whose terms appear only in the description
it replaced no longer returns it on the strength of those terms.

The correction is therefore not complete when the screen shows the new words: it is complete when
the material is findable by them.

## Verification

Give a piece of material a description containing a distinctive term, and let it be indexed.
Correct the description through the Library so that it contains a different distinctive term and
no longer contains the first. Search the client's knowledge for the new term and observe that
material returned; search for the superseded term and observe that it is no longer that
material's reason for being returned.