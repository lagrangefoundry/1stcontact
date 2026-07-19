---
uid: acceptance_criterion-7f078026
id: AC-658
type: acceptance_criterion
title: Render and bootstrap diagnostics are emitted on stderr, not stdout
created_by: xgd
created_at: '2026-07-19T03:01:45.893272+00:00'
updated_at: '2026-07-19T03:06:25.964303+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
---

## Criterion
Diagnostics produced while a values-diff command renders the draft — dependency
re-optimization notices, deprecation warnings, and the one-time "Missing pages
directory" warning emitted during server bootstrap — are written to stderr, not
stdout. This holds in both human-readable and `--json` modes: stdout is reserved
for the command's own output.

## Verification
Run a values-diff command under conditions that trigger render/bootstrap chatter
and capture stdout and stderr separately. Confirm the diagnostic strings appear
on stderr and are absent from stdout.