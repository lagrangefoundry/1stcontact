---
uid: acceptance_criterion-e0c5b560
id: AC-2317
type: acceptance_criterion
title: bin/access-sim --print-env emits the two Access settings that point the Worker
  at the simulator
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:21.192988+00:00'
updated_at: '2026-11-08T02:03:20.463066+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
  title: bin/access-sim --print-env emits the Access settings that point the Worker
    at the simulator and the SERVICE_TOKEN_IDENTITIES mapping line
---

## Criterion
`bin/access-sim --print-env` prints exactly three lines and exits 0 without starting a server:
- `ACCESS_TEAM_DOMAIN="http://127.0.0.1:<port>"`
- `ACCESS_AUD="<aud>"`
- `SERVICE_TOKEN_IDENTITIES="<service-name>=<service-address>"`

The defaults are port 8799 and aud `local-dev-aud`; `--port` and `--aud` override them. `<service-name>` is the simulator's client id with a trailing `.access` removed (default `local-dev`, following `--client-id`). `<service-address>` is `--service-email` when given, otherwise the first `PLATFORM_ADMINS` entry from `apps/control-app/.dev.vars`, falling back to `apps/control-app/wrangler.toml`.

## Verification
Run with `--print-env`, with and without `--port`/`--aud`/`--client-id`/`--service-email`. Assert the three lines, their values, exit 0, and that no listener is left running. With no `--service-email`, assert the address is the first `PLATFORM_ADMINS` entry, read from `.dev.vars` ahead of `wrangler.toml`.
