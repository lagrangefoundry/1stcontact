---
uid: acceptance_criterion-46872eff
id: AC-1513
type: acceptance_criterion
title: Unreadable source prose costs a reference a sentence, never an entry
created_by: xgd
created_at: '2026-09-04T02:27:27.419920+00:00'
updated_at: '2026-09-04T02:27:27.419920+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0d7d3aad
  kind: behavior
  regression_only: false
---

## Criterion

When the prose a source carries cannot be read — the source has moved, a comment has been reformatted, a field has been renamed — the reference still lists every component, every element kind, every field with its permitted values and bounds, and every operation. What is lost is a sentence of explanation, never an entry.

A reference is structurally derived and prosaically enriched: the enrichment is optional, and a build must neither fail nor quietly shrink the reference because a source's wording changed.

## Verification

Produce the references with the prose-bearing sources unavailable or unreadable. Assert the build succeeds and that each reference still names the full set it names when the prose is present — the same components, element kinds, fields, value sets, bounds and operations — differing only in that explanatory sentences are absent. Assert no entry has been dropped and no invented sentence has taken a missing definition's place.
