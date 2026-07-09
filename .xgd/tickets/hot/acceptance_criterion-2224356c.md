---
uid: acceptance_criterion-2224356c
id: AC-525
type: acceptance_criterion
title: Live values-diff produces a severity-ranked delta report against a captured
  reference
created_by: xgd
created_at: '2026-07-09T22:58:21.713915+00:00'
updated_at: '2026-07-09T22:58:21.713915+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f826e5ca
  kind: behavior
  regression_only: false
---

## Criterion
Given a captured reference bundle (`--ref <bundleDir>`) and a site slug, `1c values-diff <slug> --ref <bundleDir>` renders and serves the draft, reads its rendered computed values, and returns a report containing: a matched count (paired elements, integer ≥ 0), an unmatched count (integer ≥ 0), and a list of value deltas ordered most-severe first. Each delta identifies the element text (or a `§<n>` section label), the element role, the disagreeing property, the expected value, and the actual value.

## Verification
Run the command against a reference bundle and a draft with known styling drift; assert the report exposes matched/unmatched integer counts and a deltas list, and that each delta carries text/role, property, expected, and actual fields.
