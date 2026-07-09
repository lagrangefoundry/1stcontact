---
uid: acceptance_criterion-ab6ec3a9
id: AC-466
type: acceptance_criterion
title: A written bundle can be re-extracted offline with no network
created_by: xgd
created_at: '2026-07-09T20:12:49.464606+00:00'
updated_at: '2026-07-09T20:12:49.464606+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8f33f14c
  kind: behavior
  regression_only: false
---

## Criterion
Because the bundle mirrors every subresource, the same structured essence can be re-derived from a written bundle alone, with the original site unreachable and no network access. Re-extraction yields the same key essence (resolved theme colors, section backgrounds, and verbatim content) as the original capture.

## Verification
Capture a fixture, then shut down the serving origin so it is unreachable. Re-extract from the written bundle and assert the re-derived essence still contains the resolved brand hex, a first section with an `image` background, and the verbatim headline text.
