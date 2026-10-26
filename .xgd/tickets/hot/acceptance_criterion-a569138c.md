---
uid: acceptance_criterion-a569138c
id: AC-2010
type: acceptance_criterion
title: Reading an asset answers for anything the listing shows, by id or by handle,
  in the listing's own shape
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-26T01:11:07.744754+00:00'
updated_at: '2026-10-26T01:11:07.744754+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c46abfa6
  kind: behavior
  regression_only: false
---

## Criterion

Reading one asset answers for anything the asset listing reports, named either by
its id (the listing's first column) or by its `/assets/<name>` handle — the form a
page's picture element holds. The answer is the listing's own entry for that
asset, field for field, so the two operations agree on what an asset is. A name
the store does not hold is refused as not found, with a hint pointing at the
listing.

## Verification

On a site whose store holds a file no definition has ever mentioned, list its
assets, then read that asset by its id and again by its handle; assert both
succeed and each returns an entry deep-equal to the listing's entry. Read a name
the store does not hold and assert a NOT_FOUND refusal.
