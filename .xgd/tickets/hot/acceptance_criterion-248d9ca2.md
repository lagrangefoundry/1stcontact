---
uid: acceptance_criterion-248d9ca2
id: AC-423
type: acceptance_criterion
title: Version-bump tool verifies a version bump exists in given commits and reports
  its written paths
created_by: xgd
created_at: '2026-07-08T19:04:47.456212+00:00'
updated_at: '2026-07-08T19:04:47.456212+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0ceaf24d
  kind: behavior
  regression_only: false
---

## Criterion
The version-bump tool's check mode (`--check <sha>... --version X.Y.Z`) exits with success (0) when at least one of the supplied commits introduced version `X.Y.Z` into the root manifest, and exits non-zero otherwise. Its `--list-paths` mode prints the file path(s) the tool writes during a bump (the root package manifest), one per line.

## Verification
Run `--check` with a commit that introduced a known version (expect exit 0) and with commits that did not (expect non-zero exit); run `--list-paths` and assert it prints the root package manifest path.
