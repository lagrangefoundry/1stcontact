---
uid: acceptance_criterion-f4e08717
id: AC-655
type: acceptance_criterion
title: --json emits machine-readable output; --ref is required
created_by: xgd
created_at: '2026-07-19T02:51:39.975404+00:00'
updated_at: '2026-07-23T10:49:50.560617+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-2c7069fe
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
With `--json`, the command emits the N-way table as parseable JSON carrying the size columns and the per-node rows with their per-size cells; combined with `--classify`, it emits the classification (the changed nodes with their move labels) as parseable JSON instead. Invoked without `--ref`, the command emits an error describing the missing required reference and exits non-zero without producing output.

## Verification
Run `responsive-diff --json` and assert stdout parses as JSON exposing the sizes and node rows; run `responsive-diff --classify --json` and assert the parsed JSON exposes the labelled changed nodes. Run the command with no `--ref` and assert a non-zero exit with an error naming the required reference.