---
uid: acceptance_criterion-c7e51d45
id: AC-738
type: acceptance_criterion
title: Every 1c command boots quietly — no 'Missing pages directory' warning on either
  stream
created_by: xgd
created_at: '2026-07-29T04:32:56.846020+00:00'
updated_at: '2026-08-07T23:11:15.485690+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

Every `1c` invocation boots without emitting the "Missing pages directory"
warning on **either** stream. This holds for the commands that never render a
site as well as those that do — `help`, `list`, `repro`, `l1-gate`, `capture`,
`values-diff` — because the warning is suppressed where it originates rather
than diverted between streams.

The suppression is scoped to that warning: genuine bootstrap errors still
surface on stderr, and a command that fails to boot still reports a non-zero
exit status.

## Verification
Run a non-rendering command (e.g. `1c help`) as a subprocess, capturing stdout
and stderr separately. Confirm the command exits 0, its own output appears on
stdout, and the string "Missing pages directory" appears on neither stream.