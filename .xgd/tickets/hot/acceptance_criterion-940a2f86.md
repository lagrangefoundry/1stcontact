---
uid: acceptance_criterion-940a2f86
id: AC-473
type: acceptance_criterion
title: Output path defaults per mode and is overridable with --out
created_by: xgd
created_at: '2026-07-09T20:20:11.407114+00:00'
updated_at: '2026-07-09T20:20:11.407114+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3ae5b34e
  kind: behavior
  regression_only: false
---

## Criterion
Without `--out`, the PNG is written to a deterministic default location: in slug mode a filename derived from the slug's source and viewport within the site's rendered output directory, and in URL mode a default file in the working directory. Supplying `--out <file>` writes the PNG to exactly that path instead. In all cases the returned output path is the absolute path of the file actually written.

## Verification
Run `1c shot` in slug mode and in URL mode without `--out`, asserting a PNG appears at the documented default location for each mode. Repeat with `--out <path>` and assert the PNG is written at the given path and the returned output path resolves to it.
