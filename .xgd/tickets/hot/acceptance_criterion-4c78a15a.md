---
uid: acceptance_criterion-4c78a15a
id: AC-1672
type: acceptance_criterion
title: The complete listing emphasises nothing, because it validated no way in
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:47:46.726950+00:00'
updated_at: '2026-09-11T04:01:56.722271+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-ea7b4646
  kind: behavior
  regression_only: false
---

## Criterion

The enumerated listing contains no emphasis markers of any kind.

In the shared vocabulary the assistant reads landscapes in, an emphasised term is
a *validated* way in — one demonstrably shown to retrieve the territory it
appears in. A complete listing names every document and validated no such route,
so emphasising anything in it would make an unearned promise; the assistant is
correctly left with no access points and told to search directly.

## Verification

Build the enumerated landscape for a client corpus whose document titles and
bodies contain no emphasis of their own, and assert the resulting text contains
no emphasis markers. Assert the same for the empty-corpus listing and for a
listing containing an entry that fell back to an excerpt.