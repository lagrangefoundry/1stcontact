---
uid: acceptance_criterion-67622473
id: AC-545
type: acceptance_criterion
title: Launcher runs the CLI from any working directory
created_by: xgd
created_at: '2026-07-09T23:21:34.166434+00:00'
updated_at: '2026-07-09T23:21:34.166434+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5c2f2faa
  kind: behavior
  regression_only: false
---

## Criterion
Invoking the `1c` launcher runs the underlying generate CLI and exits with the CLI's status, regardless of which directory it is invoked from. Running a read-only command (e.g. `1c list`) from the repo root and from an unrelated subdirectory both succeed (exit code 0) and produce equivalent command output — the launcher locates the CLI relative to its own on-disk location, not the caller's current directory.

## Verification
Spawn the launcher with a simple command (e.g. `list`) twice — once with the working directory set to the repo root, once set to a nested subdirectory — and assert both invocations exit 0 and yield the same command output.
