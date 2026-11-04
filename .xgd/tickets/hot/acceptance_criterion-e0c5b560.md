---
uid: acceptance_criterion-e0c5b560
id: AC-2317
type: acceptance_criterion
title: bin/access-sim --print-env emits the two Access settings that point the Worker
  at the simulator
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:21.192988+00:00'
updated_at: '2026-11-04T18:28:57.134080+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
`bin/access-sim --print-env` prints exactly two lines and exits 0 without starting a server:
- `ACCESS_TEAM_DOMAIN="http://127.0.0.1:<port>"`
- `ACCESS_AUD="<aud>"`
The defaults are port 8799 and aud `local-dev-aud`. `--port` and `--aud` override them.

## Verification
Run with `--print-env`, with and without `--port`/`--aud`. Assert the two lines, their values, exit 0, and that no listener is left running.