---
uid: bug-e40e80c3
id: BUG-378
type: bug
title: 'Production deploy: the job container''s application name starts with a digit,
  so Cloudflare refuses it'
created_by: EPIC-16
created_at: '2026-11-07T21:41:59.053013+00:00'
updated_at: '2026-11-07T21:53:07.498925+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  severity: critical
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-ff4e35d0
  commits:
  - working_sha: fba45d073ea1422fad0ff9a09ceea2dea7d35df7
    reconcile_sha: null
    main_sha: null
  - working_sha: 19553c3559ea13dfb0e8c4bb99f1a644798bf254
    reconcile_sha: null
    main_sha: null
  version: 0.2.815
  story_points: 2
---

## Symptom

`bin/deploy --env production` (2026-11-07) builds and pushes the job container image, then fails creating the container application:

    ├ NEW 1stcontact-control-app-agentcontainer-production
    ✘ [ERROR] Error creating application due to a misconfiguration:
      VALIDATE_INPUT
      name An application name must not start with a digit

This is the first production deploy with a `[[env.production.containers]]` entry (the job container, EPIC-32 / DOC-86), so production cannot be deployed at all until it is fixed. That also blocks everything waiting on a production deploy, including the REQ-654 handoff routes `bin/copy-site --handoff` needs.

## Root cause

`apps/control-app/wrangler.toml`'s `[[containers]]` entries (top level, `env.production`, `env.dev`) set no `name`. Wrangler (4.111) then derives the application name `<worker>-<class_name>-<env>`, lowercased, from the Worker name `1stcontact-control-app`. Cloudflare requires a container application name not to start with a digit, and every Worker name in this project starts with `1`.

The BUG-359 registry prune (`1c images prune`) made the same assumption: it looked the application up as `<worker>-<class>`, a name that never matched what wrangler actually creates.

## Fix (as landed)

- **Every `[[containers]]` entry names its application**: `onecontact-agent-container` (top level), `onecontact-agent-container-production`, `onecontact-agent-container-dev`. Each starts with a letter and is unique per environment. The Worker names, the Durable Object binding (`AGENT_CONTAINER`) and the class (`AgentContainer`) are unchanged. Local dev images are keyed by class name (`cloudflare-dev/agentcontainer`), so dev is unaffected. Any future environment (staging, EPIC-16 §R) follows the same `onecontact-agent-container-<env>` pattern.
- **The name check** (`tools/generate/src/cli/container-images.ts`): `containerEntries()` reads every `[[containers]]` / `[[env.<env>.containers]]` entry with its environment, class and name. `containerNameProblems()` returns one line per problem: an entry with no `name`, a name that doesn't start with a letter or holds anything but lowercase letters, digits and hyphens, or a name used by two entries (two environments would deploy over each other). A UAT holds the committed config to zero problems, so a bad entry can't reach a deploy again.
- **The registry prune uses the configured name**: `pruneRegistryImages()` takes `applications` (the environment's configured names, from `containerApplications(appDir, env)`) instead of deriving `<worker>-<class>`. `1c images prune` now requires `--env <env>`, and `bin/deploy` passes `--env "$env_name"`.

## State the failed deploy left in production (checked 2026-11-07)

`bin/deploy` runs each app's assets, migrate and secrets hooks *before* `wrangler deploy`, and wrangler uploads the Worker *before* it creates container applications, then deploys triggers *after* them. So:

- **Migrations and secrets ran.** `wrangler deployments list --env production` shows the secret-change deployments at 21:30:06Z and 21:30:09Z.
- **The new Worker version is live.** Version `f026ce9c-eece-4e9e-adeb-8d33f63731c6`, uploaded 21:30:23Z, is at 100%.
- **No container application exists.** `wrangler containers list` returns "No containers found". Until the re-run, any production job that needs the container (consultant/builder rounds, captures) fails.
- **Triggers (routes, crons) were not updated by that run**, and `bin/deploy`'s later steps (the capability report and the registry prune) did not run, because `set -e` stopped it at the failed `wrangler deploy`.

A re-run of `bin/deploy --env production` re-uploads the Worker, creates `onecontact-agent-container-production`, deploys triggers, and prunes against the new name. The re-run needs operator confirmation, since a cloud deploy wasn't run from this session.

## Why free-coded

A config fix plus one guard, and production deploys are blocked until it lands.

## Test plan

- `tests/test_UAT_FC_BUG-378_container_application_names.test.ts`:
  - the committed config names every container application (top level, production, dev), has no problems, and wrangler's own config reader (`unstable_readConfig`) resolves exactly those names, each starting with a letter;
  - an entry with no `name` is refused in any environment (top level, production, dev), and wrangler's derived name for it is the digit-first `1stcontact-control-app…` name;
  - a digit-first name, and a name shared by two environments, are refused.
- `tests/test_UAT_FC_BUG-359_deploy_prunes_old_registry_images.test.ts` updated: the prune is given the production entry's configured application name, and `bin/deploy` hands the prune `--env production`.
- Regression scope run green: BUG-359 prune, the instance-type config check, BUG-352 dry run, REQ-144 deploy scripts.
- Operator confirmation: `bin/deploy --env production` completes and `onecontact-agent-container-production` is created.