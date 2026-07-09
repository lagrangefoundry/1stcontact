---
uid: acceptance_criterion-587c83b8
id: AC-546
type: acceptance_criterion
title: Launcher preserves the caller's working directory for path resolution
created_by: xgd
created_at: '2026-07-09T23:21:38.184277+00:00'
updated_at: '2026-07-09T23:21:38.184277+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5c2f2faa
  kind: behavior
  regression_only: false
---

## Criterion
The launcher does not change the caller's working directory before dispatching to the CLI. CWD-relative inputs and outputs (site sources under `sites/`, build artifacts under `dist/`) resolve against the directory from which the launcher was invoked, identically to running the CLI's node entrypoint directly from that same directory. The same relative path argument produces the same resolved target whether the launcher or a direct node invocation is used from a given directory.

## Verification
From a chosen working directory, run a launcher command that acts on a CWD-relative path and separately run the equivalent direct node invocation of the CLI entrypoint from the same directory; assert both resolve to the same target (same file/site acted upon, same exit status).
