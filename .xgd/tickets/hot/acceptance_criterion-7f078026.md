---
uid: acceptance_criterion-7f078026
id: AC-658
type: acceptance_criterion
title: Render and bootstrap diagnostics are emitted on stderr, not stdout
created_by: xgd
created_at: '2026-07-19T03:01:45.893272+00:00'
updated_at: '2026-08-07T23:11:12.489147+00:00'
completed_at: null
last_field_updated: uat_coverage
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

The bootstrap phase is quiet at source rather than merely rerouted: the
"Missing pages directory" warning the Astro-backed bootstrap used to emit is no
longer produced on either stream (see the quiet-bootstrap criterion). Whatever
other chatter the bootstrap may emit is still diverted from stdout to stderr as
defence in depth, so a `--json` command's single document is never corrupted by
setup output; genuine bootstrap errors still surface on stderr.

## Verification
Run a `values-diff` command under conditions that trigger render chatter and
capture stdout and stderr separately. Confirm the diagnostic strings appear on
stderr and are absent from stdout, and that stdout parses as the command's own
output alone.