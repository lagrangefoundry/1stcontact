---
uid: acceptance_criterion-1dc0667c
id: AC-721
type: acceptance_criterion
title: --out persists the N-way table to a named file
created_by: xgd
created_at: '2026-07-23T10:29:33.526404+00:00'
updated_at: '2026-07-23T10:49:52.217645+00:00'
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
With `--out <file>`, the command writes the N-way table to the named path as JSON — the same size columns and per-node rows the table carries — in addition to its normal stdout output. Persisting is independent of `--classify` and `--json`: `--out` always writes the raw table (never the classification), while `--classify`/`--json` govern only what is printed to stdout. The parent path is resolved and the file is created with the table content.

## Verification
Invoke `responsive-diff --ref <bundle> --out <tmpfile>` on a fixture bundle whose ladder carries the mobile/tablet/desktop widths; assert the file at `<tmpfile>` exists and parses as JSON exposing the size columns and node rows, and that the command still emits the table to stdout. Invoke again with `--classify --out <tmpfile2>` and assert the persisted file still parses as the raw N-way table (unchanged by `--classify`), while stdout carries the classification.