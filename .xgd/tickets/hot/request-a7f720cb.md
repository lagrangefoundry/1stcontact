---
uid: request-a7f720cb
id: REQ-393
type: request
title: 'bin/deploy and bin/build: --secrets-file'
created_by: EPIC-16
created_at: '2026-10-07T19:19:15.570198+00:00'
updated_at: '2026-10-07T19:19:15.570198+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-460e95b9
---

## What the operator wants

`bin/deploy --secrets-file PATH` — read the deploy's credentials from a file instead of requiring them to be exported into the shell first.

Today the deploy's secrets hooks (`bin/deploy.d/secrets/*`) and wrangler read only the process environment. The operator's credentials already live in one file, `~/Documents/secrets/1c.dev.env`, which the local dev servers read (`dev-env.ts`, `DEFAULT_SECRETS_REL`, overridable by `ONECONTACT_SECRETS`) — but the deploy never does. So every production deploy needs a remembered extra step (`set -a; . ~/Documents/secrets/1c.dev.env; set +a`), and forgetting it silently leaves every stored secret unprobed.

## Behaviour

- `--secrets-file PATH` loads the file's assignments into the environment of the deploy process — every hook and every wrangler call it makes — and nothing else. The operator's shell is untouched.
- The file is parsed the way the dev servers parse it (dotenv syntax: `KEY=value`, optional quotes, comments, blank lines), so one file means the same thing to both readers.
- A value already exported in the shell wins over the file, so a one-off override (`ANTHROPIC_API_KEY=… bin/deploy --secrets-file …`) still works.
- A path that does not exist, or a file holding no assignment, fails the deploy before any hook runs, naming the path.
- The deploy reports which file it loaded and the NAMES it took from it — never a value.
- `--dry-run` loads the file too, so the dry run probes exactly what the real run would.
- `bin/build` takes the same flag, for the same reason: its KB stage needs `CLOUDFLARE_API_TOKEN`, and that is the step that failed for want of it on 2026-10-07.

## Open question for the implementing session

Whether, with no flag, the deploy should default to the same file the dev servers default to (`ONECONTACT_SECRETS`, else `~/Documents/secrets/1c.dev.env`). The operator's stated preference across EPIC-16 is fewer steps to remember, which argues for the default; the counter-argument is that a deploy then pushes and probes every secret on every run. Record the decision and why in this body.

## Boundaries

- Does not change which secrets the hooks push or how they probe (REQ-264).
- The dev-only Access vars in that file (`ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `SERVICE_TOKEN_IDENTITIES`) reach the deploy process harmlessly — production's Access configuration is `wrangler.toml`'s, and `wrangler deploy` does not upload process env as vars. A UAT should pin that loading the file cannot change a deployed `[vars]` value.

## Test plan

UATs (`test_UAT_FC_<id>_*`): a secret present only in the file reaches the secrets hook (probed and pushed path, not the "left alone" path); a shell-exported value overrides the file's; a missing or empty file fails before any hook with the path named; the report names keys and never values; `bin/build --secrets-file` supplies the KB stage its token; loading the file leaves deployed `[vars]` unchanged.