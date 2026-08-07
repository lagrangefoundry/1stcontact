---
uid: acceptance_criterion-0b79f27e
id: AC-1013
type: acceptance_criterion
title: A command that loads a declared runtime dependency refuses before doing any
  work when that dependency does not resolve
created_by: xgd
created_at: '2026-08-07T03:12:41.704325+00:00'
updated_at: '2026-08-07T23:11:06.190165+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

A `1c` command that loads a declared runtime dependency checks the installed tree
before doing anything else, and refuses when a package named in the generate
package's `dependencies` cannot be resolved from disk.

The refusal happens ahead of the command's own work: no render runs, no browser
launches, no file is written.

The message names the fault and the packages it applies to — the specific package
ids that failed to resolve, and the fact that they are declared in the manifest
but absent from the installed tree — and the remedy is the literal install
command to run at the repo root, not a description of one.

## Verification
Point a gated command (e.g. `shot`) at a tree whose lockfile matches its install
but from which a required package (`playwright`) does not resolve. Confirm the
command refuses, that the refusal names both the command and the unresolvable
package, and that its remedy carries the literal `pnpm install` command.