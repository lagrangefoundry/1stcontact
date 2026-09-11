---
uid: acceptance_criterion-dc4c56af
id: AC-1721
type: acceptance_criterion
title: An empty or whitespace-only description is refused with its reason, and the
  stored description is unchanged
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:19:06.201442+00:00'
updated_at: '2026-09-11T05:28:53.022576+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

An empty description is refused. A correction whose text is empty, or consists only of
whitespace, is rejected with a message saying that a description cannot be empty because it is
what makes the file findable, and the material's stored description is left exactly as it was.

No path through the Library can leave a piece of material with a description it did not have
before the attempt, or with none where it had one.

## Verification

Submit a correction carrying an empty string, and one carrying only spaces and newlines, for a
material that already has a description. Observe each rejected with an explanatory message rather
than accepted, and observe the material's stored description unchanged after both attempts.