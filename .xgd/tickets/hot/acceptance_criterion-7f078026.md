---
uid: acceptance_criterion-7f078026
id: AC-658
type: acceptance_criterion
title: Render and bootstrap diagnostics are emitted on stderr, not stdout
created_by: xgd
created_at: '2026-07-19T03:01:45.893272+00:00'
updated_at: '2026-08-31T11:18:12.950636+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

Diagnostics produced while a `1c` command renders the draft — dependency
re-optimization notices and deprecation warnings — are written to stderr, not
stdout. This holds in both human-readable and `--json` modes: stdout is reserved
for the command's own output.

The bootstrap phase is separately quiet at source (see the quiet-bootstrap
criterion), and the stdout→stderr diversion over the server's startup is kept
regardless, as defence in depth against **any** boot chatter rather than as a
workaround for one framework's warning. The criterion is a claim about the
observable streams, not about the absence of the guard: the diversion costs
nothing and protects a `--json` command's single document from whatever a future
server or plugin decides to say while it boots — a bundler's own
dependency-optimisation notices, a newly added plugin's cold-boot lines. Genuine
bootstrap errors still surface on stderr.

## Verification
Run a `values-diff` command under conditions that trigger render chatter and
capture stdout and stderr separately. Confirm the diagnostic strings appear on
stderr and are absent from stdout, and that stdout parses as the command's own
output alone. Confirm the startup diversion is still in force — a `--json`
command's stdout is exactly one parseable document even on a cache-cold boot.
