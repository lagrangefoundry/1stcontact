---
uid: acceptance_criterion-4388aced
id: AC-2327
type: acceptance_criterion
title: 'The change feed carries only the scoped business''s material: a write by a
  second business never reaches the subscription'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-05T21:07:09.012959+00:00'
updated_at: '2026-11-05T21:21:57.506283+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

A change subscription opened under one business carries only that business's material. It is
scoped exactly as the list read is — by the business named in the request's scope and by nothing
the request can widen — so a material written, changed or archived by a second business is never
delivered to it, and no form of the feed's URL reaches another business's changes. Changes to
tickets that are not material are not delivered either.

## Verification

With two businesses present, open the feed under the first and have the second business create and
update material; observe no frame for any of it, while a write by the first business arrives.