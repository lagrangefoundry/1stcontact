---
uid: acceptance_criterion-0ef2289d
id: AC-653
type: acceptance_criterion
title: Terminal-fails on a stale reference with re-capture guidance
created_by: xgd
created_at: '2026-07-19T02:51:32.220234+00:00'
updated_at: '2026-07-19T02:59:23.909044+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-2c7069fe
  kind: behavior
  regression_only: false
---

## Criterion
When the referenced bundle has no persisted viewport ladder (no multi-viewport reference, or an empty one), the command fails loudly with a message that names the missing reference and instructs the user to re-capture across the viewport ladder. No table is produced and the command does not silently fall back to a single width.

## Verification
Run `responsive-diff --ref <dir>` against a bundle lacking a persisted ladder. Assert the command fails (error surfaced, no table output) and that the message identifies the bundle and advises re-capturing to persist the ladder.