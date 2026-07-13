---
uid: acceptance_criterion-b48eca1c
id: AC-622
type: acceptance_criterion
title: Bullet and ordered lists round-trip as one list kind with positional ordinals
  and start offset
created_by: xgd
created_at: '2026-07-13T21:00:41.355239+00:00'
updated_at: '2026-07-13T21:00:41.355239+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8b5ebbf7
  kind: behavior
  regression_only: false
---

## Criterion
Both bullet and ordered lists are represented by a single list block distinguished by an ordered flag. Ordered-list ordinals are positional (start + index); an ordered list that begins at an ordinal other than 1 preserves that start offset through a round-trip, while a list starting at 1 records no explicit start. A single-line item serializes as `- text` (bullet) or `N. text` (ordered).

## Verification
Round-trip a bullet list and an ordered list; assert the ordered variant's ordinals and a non-1 start offset survive; assert a plain item's first serialized line is `- text` / the expected ordinal form.
