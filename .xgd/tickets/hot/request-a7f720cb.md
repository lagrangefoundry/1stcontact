---
uid: request-a7f720cb
id: REQ-393
type: request
title: 'bin/deploy and bin/build: --secrets-file'
created_by: EPIC-16
created_at: '2026-10-07T19:19:15.570198+00:00'
updated_at: '2026-10-07T19:55:16.989388+00:00'
completed_at: null
last_field_updated: story_points
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
    working_sha_history: []
  - working_sha: 401f55750c68c967104748710862c6d6a448484b
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 2dabf4c18f8a66467ed917d1e11ca7c8c1724203
    reconcile_sha: null
    main_sha: null
  - working_sha: cd47a7ee10ef533dd200b89e4a922e3cd6c4120a
    reconcile_sha: null
    main_sha: null
  version: 0.2.500
  story_points: 5
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

## Decision: default to the file (revised 2026-10-07, see Extension)

First landed as explicit-only. The operator then decided the open question the other way: with no flag, all four commands load the dev servers' default file — `$ONECONTACT_SECRETS`, else `~/Documents/secrets/1c.dev.env` — when it exists, and say which file they loaded. Reason: fewer steps to remember. Accepted cost: every deploy probes and re-pushes every secret the file holds (each `wrangler secret put` is a new Worker version). An absent DEFAULT file is not an error; an explicitly named missing or empty file is. `--no-secrets-file` loads nothing.

## How it is built

- One loader, `tools/generate/bin/env-file.mjs` (plain node, no transform). It holds THE parser (`parseEnvText`) and THE default path (`defaultSecretsPath`: `ONECONTACT_SECRETS` with `:-` semantics, else `$HOME/Documents/secrets/1c.dev.env`). Both moved there from `dev-env.ts`, which now imports them, so the dev servers and the scripts cannot disagree about which file or what it means.
- `node env-file.mjs run <who> -- <script> [args...]` is each script's preamble. It takes `--secrets-file PATH` (or `=PATH`) and `--no-secrets-file` OUT of the arguments, loads the selected file (none on `-h`/`--help`), overlays it on the environment (non-empty values already set win; empty counts as unset), reports to STDERR `secrets file: <path>` (marked `(default; --no-secrets-file to skip)` when defaulted), `took: <names>` and `kept from your environment: <names>`, then re-runs `bash <script>` with the remaining args and `ONECONTACT_SECRETS_LOADED_BY=<who>` set so it does not load twice. The script never parses either flag. Values never pass through a pipe or a shell. Stderr keeps a `--json` command's stdout clean.
- Relative `--secrets-file` paths resolve against the caller's directory (the preamble runs before `bin/deploy`/`bin/build` `cd` to the repo root).
- The loader detects that it is the entry point by comparing REAL paths. A plain compare of `import.meta.url` with `argv[1]` is false under a symlinked directory (macOS `/tmp`), and the command then silently did nothing and exited 0. That bug was in the first landing and is fixed here.
- `bin/deploy`, `bin/build`, `bin/copy-to-cloud`, `bin/copy-from-cloud` all carry the preamble. The copy pair runs it after `--help`, so help needs no credential.
- **Copy pair local end** (`copy.ts` `LOCAL_ORIGIN`) is now `bin/access-sim`, `http://127.0.0.1:8799` (`ACCESS_SIM_ORIGIN` is the same constant). With no `--origin` and no `LOCAL_ACCESS_*`, the CLI sends `ACCESS_SIM_PAIR` to it. With an explicit `--origin` and no `LOCAL_ACCESS_*`, BUG-134's fallback to the cloud pair is unchanged.
- Help/headers updated: `bin/deploy --help`, `bin/build --help`, both copy scripts' headers (which are their help), `1c` help for the copy verbs, `bin/deploy.d/secrets/README.md`.
- Two existing scratch-tree fixtures (`reconciliation-platform-build-deploy-smoke`, REQ-264's whole-rehearsal test) now copy `env-file.mjs` beside the drivers, by the rule they already state: shared machinery travels with the driver.

## Boundaries

- Does not change which secrets the hooks push or how they probe (REQ-264).
- The dev-only Access vars in that file (`ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `SERVICE_TOKEN_IDENTITIES`) reach the deploy process harmlessly — production's Access configuration is `wrangler.toml`'s, and `wrangler deploy` does not upload process env as vars. A UAT should pin that loading the file cannot change a deployed `[vars]` value.

## Test plan

`tests/test_UAT_FC_REQ-393_secrets_file.test.ts` runs the real scripts with the process boundary stubbed (`npx`, `pnpm`, and `node` for everything except the loader), in an environment built from nothing:

- `a_secret_only_in_the_file_is_probed_and_pushed`: without the file the deploy stops; with it, `ANTHROPIC_API_KEY` is probed and the file's value pushed. `--dry-run` probes too and says "would push".
- `a_value_exported_in_the_shell_wins_over_the_file`
- `a_missing_or_empty_file_stops_before_any_hook`: both `bin/deploy` and `bin/build`.
- `the_report_names_keys_and_never_values`
- `bin_build_supplies_the_kb_stage_its_token`
- `loading_the_file_leaves_deployed_vars_unchanged`: real wrangler over a copy of control-app's `wrangler.toml`; the binding table is identical with and without a file setting the Access vars.
- `the_loader_runs_when_reached_through_a_symlink`
- `with_no_flag_the_default_file_is_loaded_and_reported`: also that `ONECONTACT_SECRETS` moves the default.
- `an_absent_default_is_skipped_but_an_explicit_missing_path_fails`
- `no_secrets_file_loads_nothing`
- `the_copy_pair_reads_both_credential_pairs_from_the_file`: `copy-from-cloud` is refused for want of the cloud pair without the file; with it the refusal is gone and a gated fake local builder sees only the file's LOCAL pair. `copy-to-cloud --backup` through the same gate succeeds. No secret appears in output.
- `the_copy_pair_local_end_defaults_to_the_simulator`: `LOCAL_ORIGIN` is `bin/access-sim`'s origin, not the snapshot port.
- `with_no_origin_the_copy_reaches_the_simulator_with_its_own_pair`: no `--origin`, no exports; a fake simulator on 8799 admitting only `ACCESS_SIM_PAIR` resolves "Not The Tenant" and the backup lands. Skipped when 8799 is taken (the operator's real `bin/access-sim`). Verified by hand against the real simulator on 2026-10-07: `bin/copy-to-cloud --no-secrets-file --backup … "Lagrange Foundry"` backed it up from `http://127.0.0.1:8799` with nothing exported.

Regression (all green): BUG-134, REQ-289, REQ-294 chats command, BUG-159 (help, force advice), REQ-392, BUG-36, REQ-149, REQ-264, REQ-144, REQ-312, REQ-315, REQ-318, REQ-319, REQ-322, BUG-50, BUG-146, BUG-150, reconciliation build/deploy smoke.

## Extension (2026-10-07): the copy pair, and the default — "make this all more streamlined"

The flag landed for `bin/deploy` and `bin/build` (explicit only, no default). The operator now wants the same file to drive the content-copy commands, and asked for the whole flow to be streamlined. In scope, on this ticket:

1. **`bin/copy-to-cloud` and `bin/copy-from-cloud` take `--secrets-file PATH`**, with the same meaning, parser, precedence (shell wins) and names-never-values report as `bin/deploy`. The cloud end's `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` and the local end's `LOCAL_ACCESS_CLIENT_ID` / `LOCAL_ACCESS_CLIENT_SECRET` are then read from it.

2. **The open question is decided: default to the file.** With no `--secrets-file`, all four commands (`bin/deploy`, `bin/build`, `bin/copy-to-cloud`, `bin/copy-from-cloud`) load the file the dev servers already default to — `ONECONTACT_SECRETS`, else `~/Documents/secrets/1c.dev.env` — when it exists, and say which file they loaded. An absent default file is not an error (it is the explicit flag naming a missing file that fails). `--no-secrets-file` opts out. Reason, in the operator's words: fewer steps to remember. The cost — a deploy probes and re-pushes every secret the file holds on every run — is accepted.

3. **The copy pair's local end defaults to `bin/access-sim`** — origin `http://127.0.0.1:8799` and the simulator's own pair — exactly as `bin/copy-repro-to-dev` already does (`ACCESS_SIM_ORIGIN` / `ACCESS_SIM_PAIR` in `copy.ts`). Today the default origin is the bare snapshot on 8789, which can only ever reach `TENANT_ID`'s business, so every real copy needs `--origin http://127.0.0.1:8799` typed. `--origin` and the `LOCAL_ACCESS_*` names still override.

Target operator experience after this: `bin/copy-to-cloud "Lagrange Foundry"` and `bin/copy-to-cloud --chats "Lagrange Foundry"` with no exports and no flags; `bin/build && bin/deploy` likewise.

Additional UATs: the copy pair reads both credential pairs from the file; with no flag the default file is loaded and reported; an absent default file is silently skipped while an explicit missing path fails; `--no-secrets-file` loads nothing; the copy pair's local end with no `--origin` is the simulator and resolves a business other than `TENANT_ID`'s.