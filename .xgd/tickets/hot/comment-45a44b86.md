---
uid: comment-45a44b86
id: COMMENT-2636
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T23:50:48.808426+00:00'
updated_at: '2026-09-10T23:50:48.808426+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-c0b1dda7
  kind: note
---

This invocation made **no ticket mutation, and none was possible.** Reporting it as the blocked turn it is.

## What happened

This prompt fired a second time with identical text (still "attempt 6"). The work it asks for was applied during the first invocation and is **verified intact** — I checked the store files directly rather than trusting my own prior claim:

| Element | Marker | Present |
|---|---|---|
| AC-997 | "however many controls the region" | ✓ |
| AC-1123 | "drawn as the grid this dialog draws itself" | ✓ |
| AC-1000 / AC-1043 | "painted backdrop" | ✓ |
| STORY-101 | "dressed as the workspace" | ✓ |

REPORT-3817 (`report-c0b1dda7`) exists with `fixes_applied: 5, progress_made: true, needs_more_work: false, violations_remaining: 0`. **The workflow has what it needs to hand control to the assessor.**

One correction to my own verification path: my first check this turn reported the AC-997 edit as *absent*. That was wrong — I was reading `main`'s ticket store, and `--json` was silently returning an error object that my script read as an empty body. The edits live in this worktree's store, which is the correct one for this branch.

## Why nothing new could be done

Between invocations `xgd` went 0.17.10 → 0.17.13 and now dies on every subcommand:

```
CONFIGURATION_ERROR: Failed to load config file: [Errno 1] Operation not permitted:
.../main/.xgd/config.yaml
```

The file reads fine — the EPERM is on a **write**. I confirmed the cause directly rather than guessing:

```
auto_populated: ['dashboard.prompts.reread_extra']
errors: []
```

The validator reopens main's config for writing because the packaged template gained a key the live config lacks. From a branch worktree the sandbox allows writes only to `main/.xgd/_locks`, so `xgd ticket update` and `xgd report create` are both dead. `XGD_PROJECT_ROOT` doesn't help (the loader resolves main-only files to main regardless), and the env-prefix form is blocked by don't-ask anyway.

**Operator remedy** — add to **main's** `.xgd/config.yaml` from a session that can write main:
```yaml
dashboard:
  prompts:
    reread_extra: ""
```
That unblocks every worktree at once.

## What I chose not to do

I did not write the AC-997 follow-on test to satisfy the "one mutation per call" rule. It's uat-level work, the suite can't run here (`listen EPERM` from `startBuilder`), and `uat_coverage` couldn't be updated afterwards regardless. An unrunnable, unverified test would leave the matrix worse. The gap stays recorded in REPORT-3817.

Full handoff written to `.xgd/tmp/attempt6-reinvocation-BLOCKED.md`, since no report ticket can be filed.
