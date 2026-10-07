---
uid: request-a7f720cb
id: REQ-393
type: request
title: 'bin/deploy and bin/build: --secrets-file'
created_by: EPIC-16
created_at: '2026-10-07T19:19:15.570198+00:00'
updated_at: '2026-10-07T19:32:11.582225+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  priority: medium
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-460e95b9
  commits:
  - working_sha: b4fa4cbebdd6575f289011b52528c6dada06079a
    reconcile_sha: null
    main_sha: null
  - working_sha: 401f55750c68c967104748710862c6d6a448484b
    reconcile_sha: null
    main_sha: null
  version: 0.2.499
  story_points: 3
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

## Decision: no default file

With no flag, the deploy reads NO file — `--secrets-file` is explicit. Reasons:

- The file is `1c.dev.env`. Read unasked, every production deploy would push (overwrite) every secret it holds — and a dev-scoped key in it would silently replace the production one. Naming the file is the operator's decision to rotate from it.
- Each `wrangler secret put` creates a new Worker version, so an implicit default makes every deploy several deployments.
- Forgetting the flag is already visible: the capability report says `stored`/unverified rather than passing.

## How it is built

- One loader, `tools/generate/bin/env-file.mjs` (plain node, no transform). It holds THE parser (`parseEnvText`) — moved there from `dev-env.ts`, which now imports it — so the dev servers and the release scripts cannot disagree about the file.
- `node env-file.mjs exec <who> <path> -- <cmd...>` overlays the file onto the environment (non-empty values already set win; empty counts as unset), prints `secrets file: <path>`, `took: <names>` and `kept from your environment: <names>`, then runs the command with stdio inherited and forwards its exit code. Values never pass through a pipe or a shell.
- `bin/deploy` and `bin/build` parse `--secrets-file PATH` (relative paths resolve against the caller's directory, not the repo root) and, before any hook, stage or the `--fonts` target, re-exec themselves under the loader. A marker env var (`DEPLOY_SECRETS_FILE_LOADED` / `BUILD_SECRETS_FILE_LOADED`) stops the second run from loading the file again.
- `bin/deploy.d/secrets/README.md` and both scripts' `--help` text describe the flag.

## Boundaries

- Does not change which secrets the hooks push or how they probe (REQ-264).
- The dev-only Access vars in that file (`ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `SERVICE_TOKEN_IDENTITIES`) reach the deploy process harmlessly — production's Access configuration is `wrangler.toml`'s, and `wrangler deploy` does not upload process env as vars. A UAT should pin that loading the file cannot change a deployed `[vars]` value.

## Test plan

`tests/test_UAT_FC_REQ-393_secrets_file.test.ts` runs the real `bin/deploy` / `bin/build` with the process boundary stubbed (`npx`, `pnpm`, and `node` for everything except the loader), in an environment built from nothing:

- `a_secret_only_in_the_file_is_probed_and_pushed` — without the flag the deploy stops; with it, `ANTHROPIC_API_KEY` is probed and the file's value is pushed. A `--dry-run` probes too and says "would push".
- `a_value_exported_in_the_shell_wins_over_the_file` — the shell's value is the one pushed, and the report says it was kept.
- `a_missing_or_empty_file_stops_before_any_hook` — for both scripts: non-zero exit, path named, no hook, no stage.
- `the_report_names_keys_and_never_values` — names listed, no value anywhere in the output.
- `bin_build_supplies_the_kb_stage_its_token` — `1c kb ensure` sees `CLOUDFLARE_API_TOKEN` only with the flag.
- `loading_the_file_leaves_deployed_vars_unchanged` — the real wrangler, through the real loader, over a copy of control-app's `wrangler.toml`: a file setting `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `SERVICE_TOKEN_IDENTITIES` leaves the binding table byte-identical.

Regression: the dev-env suites (BUG-50, BUG-146, BUG-150) pass against the moved parser.


## Extension (2026-10-07): the copy pair, and the default — "make this all more streamlined"

The flag landed for `bin/deploy` and `bin/build` (explicit only, no default). The operator now wants the same file to drive the content-copy commands, and asked for the whole flow to be streamlined. In scope, on this ticket:

1. **`bin/copy-to-cloud` and `bin/copy-from-cloud` take `--secrets-file PATH`**, with the same meaning, parser, precedence (shell wins) and names-never-values report as `bin/deploy`. The cloud end's `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` and the local end's `LOCAL_ACCESS_CLIENT_ID` / `LOCAL_ACCESS_CLIENT_SECRET` are then read from it.

2. **The open question is decided: default to the file.** With no `--secrets-file`, all four commands (`bin/deploy`, `bin/build`, `bin/copy-to-cloud`, `bin/copy-from-cloud`) load the file the dev servers already default to — `ONECONTACT_SECRETS`, else `~/Documents/secrets/1c.dev.env` — when it exists, and say which file they loaded. An absent default file is not an error (it is the explicit flag naming a missing file that fails). `--no-secrets-file` opts out. Reason, in the operator's words: fewer steps to remember. The cost — a deploy probes and re-pushes every secret the file holds on every run — is accepted.

3. **The copy pair's local end defaults to `bin/access-sim`** — origin `http://127.0.0.1:8799` and the simulator's own pair — exactly as `bin/copy-repro-to-dev` already does (`ACCESS_SIM_ORIGIN` / `ACCESS_SIM_PAIR` in `copy.ts`). Today the default origin is the bare snapshot on 8789, which can only ever reach `TENANT_ID`'s business, so every real copy needs `--origin http://127.0.0.1:8799` typed. `--origin` and the `LOCAL_ACCESS_*` names still override.

Target operator experience after this: `bin/copy-to-cloud "Lagrange Foundry"` and `bin/copy-to-cloud --chats "Lagrange Foundry"` with no exports and no flags; `bin/build && bin/deploy` likewise.

Additional UATs: the copy pair reads both credential pairs from the file; with no flag the default file is loaded and reported; an absent default file is silently skipped while an explicit missing path fails; `--no-secrets-file` loads nothing; the copy pair's local end with no `--origin` is the simulator and resolves a business other than `TENANT_ID`'s.