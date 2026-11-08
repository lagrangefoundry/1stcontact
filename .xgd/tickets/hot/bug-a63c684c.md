---
uid: bug-a63c684c
id: BUG-377
type: bug
title: 'Deploy: a stale system KB stops the deploy instead of being rebuilt'
created_by: EPIC-19
created_at: '2026-11-07T21:31:09.135451+00:00'
updated_at: '2026-11-07T22:22:06.298838+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-6f52df29
  commits:
  - working_sha: d8552f2c9789487a7b0c24e83e00b030fa654ff2
    reconcile_sha: null
    main_sha: null
  - working_sha: c6972146490890448b205601f69d7c3764f85489
    reconcile_sha: null
    main_sha: null
  version: 0.2.816
  story_points: 3
---

## Symptom

`bin/deploy --env production` stops at the control-app asset step whenever the system knowledge base is behind the doc tickets it's built from. The output is "OUTDATED projections … BEHIND its tickets … Run `1c kb build` (or `bin/kb-release`)" and the deploy exits. Nothing is uploaded. Editing any `system_kb` document is enough to cause it, and nobody remembers to rebuild the KB before a deploy. The result in practice: the operator believes production was deployed when it wasn't. A real case: production's control app stayed on a 2026-11-04 build for days, and a newly landed feature's routes (REQ-654's `/api/handoff/*`) answered with the old app's "Sign in to continue", which looked like an authentication problem.

## Root cause

This was decided on purpose in `bin/deploy.d/assets/10-control-app-assets` (BUG-203): "NOT `1c kb ensure` FIRST, unlike `bin/build` … Bringing the index forward costs a credential and a request, which is a build's business, not a deploy's." The check that refuses to ship a stale KB (BUG-48) is right. Refusing to *fix* it is not. `bin/build` already runs `1c kb ensure` before `1c assets` (REQ-322) for exactly this reason, and the deploy already loads the secrets file. The rebuild needs a Cloudflare token that can call Workers AI (`1c_Admin_Token`; the deploy token fails the embedder with a 401) and it uses the Claude CLI to write the descriptions.

## Expected behaviour

1. **The deploy brings the KB forward itself.** Before `1c assets`, the control-app hook runs the same KB step `bin/build` runs (`1c kb ensure`, or the `bin/kb-release` sequence if that's what a full projection-and-export refresh needs). It rebuilds only when the KB is behind, so a deploy that touched no KB document costs nothing extra. Afterwards, `1c assets`' refusal (BUG-48) stays as the backstop.
2. **It names what it did.** The deploy output says "system KB was behind (DOC-47, REF-behaviors, REF-surface): rebuilt", or "system KB current". `--dry-run` says "would rebuild the system KB" when it's behind, and changes nothing.
3. **The right credential, found automatically.** The KB step uses the credential that can call Workers AI, taken from the secrets file the deploy already reads (a named entry such as `CLOUDFLARE_KB_API_TOKEN`, so it's separate from the deploy token), not whatever `CLOUDFLARE_API_TOKEN` happens to be. When it's missing, the deploy stops *before anything is deployed*, with one message: which credential it needs, where it looks for it, and the command to rebuild by hand.
4. **A rebuild failure stops the deploy before any migration or upload**, as an asset build failure does today (the hook runs first), with the KB tool's own error shown.
5. **A deploy that stops never looks like success.** Whenever a deploy exits without uploading the control app, its last line says plainly "control-app NOT deployed: <reason>" and the exit code is non-zero, so a deploy that stopped can't be mistaken for one that finished.

## Test plan

UATs `test_UAT_FC_BUG-<n>_*` driving `bin/deploy --env dev` (the local snapshot path, no cloud) against a repo whose KB is behind one doc ticket:
- the deploy rebuilds the KB (with the KB embedder stubbed at its external boundary), then builds assets and completes, and the output names the rebuild;
- with the KB current, no rebuild runs and the output says it's current;
- `--dry-run` reports "would rebuild" and writes nothing;
- with the KB credential missing, the deploy exits non-zero before uploading or migrating anything, and the message names the credential and the manual command;
- a deploy that stops prints "control-app NOT deployed" as its final line.


## What changed (as implemented)

- **A `prepare` hook stage in `bin/deploy`** (`bin/deploy.d/prepare/`), run once per app before anything ships, the platform fonts included. That ordering is what lets a missing credential stop the deploy "before anything is deployed": the fonts upload before the first app's `assets` hooks run, so the KB step can't go in the `assets` hook.
- **`prepare/10-control-app-kb`** (control app only) asks `1c kb ensure --check` first:
  - current → prints `system KB current`, no rebuild, no credential needed;
  - behind + `--dry-run` → `would rebuild the system KB — behind (<docs>)`, writes nothing;
  - behind → `system KB is behind (<docs>) — rebuilding`, runs `1c kb ensure`, then `system KB was behind (<docs>): rebuilt`;
  - behind with no `CLOUDFLARE_KB_API_TOKEN` (and no stub embedder) → exits 1 with one message naming the credential, where it's read from (the deploy's secrets file: `--secrets-file`, else `$ONECONTACT_SECRETS`, else `~/Documents/secrets/1c.dev.env`) and the manual command (`CLOUDFLARE_KB_API_TOKEN=<token> bin/kb-release`). A rehearsal fails the same way, because a rehearsal that passed would hide a real deploy that stops;
  - rebuild fails → the KB tool's own error, then `the system KB rebuild failed … Nothing has been deployed.`, exit 1.
  `DEPLOY_KB_CMD` replaces `bin/1c kb ensure` so tests can stand in a behind or current KB.
- **`1c kb ensure --check`**: the same staleness decision (`requireCoherentKb`), with no build. Prints `kb: behind (<docs>)` when a build is needed, otherwise the normal ensure line. The new `kbSkewNames` lists the documents (missing/stale/outdated/unmapped ids plus the ids of `behind` rows), each once, sorted.
- **The credential**: `1c kb` (`embedderToken`) reads `CLOUDFLARE_KB_API_TOKEN` first, then `CLOUDFLARE_API_TOKEN` when that's the only one set. So `bin/build` and `bin/kb-release` also pick up the KB token from the same secrets file. The missing-credential advice names both.
- **The "NOT deployed" line**: `bin/deploy` keeps track of which stage it's in (build, workerd guard, each hook, fonts, ship step, dev refresh). An EXIT trap prints, as the last line on stderr of any non-zero exit, `<app> NOT deployed: stopped at <stage> (exit N)` for each app it didn't ship. If every app had shipped, it prints `bin/deploy: failed at <stage> … after every app was deployed`.
- The `assets/10-control-app-assets` comment that said "NOT `1c kb ensure` FIRST" is replaced. `1c assets`' BUG-48 refusal stays as the backstop.

## UATs (`tests/test_UAT_FC_BUG-377_deploy_brings_the_kb_forward.test.ts`)

- `a_behind_kb_is_rebuilt_with_the_kb_token_and_the_rebuild_is_named`: hook, stand-in behind KB, non-rehearsal.
- `a_current_kb_costs_no_rebuild_and_says_it_is_current`: hook, no credential.
- `a_rehearsal_says_it_would_rebuild_and_builds_nothing`: real `bin/deploy --env dev --dry-run control-app`; also checks prepare runs before the fonts and the asset hook.
- `a_missing_kb_credential_stops_the_deploy_before_anything_ships`: real `bin/deploy --env dev control-app` with only the deploy token set. Non-zero exit, message contents, no fonts/assets/migrate, last line `control-app NOT deployed: stopped at hook prepare/10-control-app-kb`.
- `a_failed_rebuild_stops_the_deploy_and_shows_the_kb_error_last_says_not_deployed`.
- `check_names_the_document_a_kb_is_behind_and_writes_nothing`: real `kbEnsure({check})` over a fixture KB (stub embedder/describer and ticket CLI, as in REQ-322). Current, then behind one edited doc ticket; index and corpus untouched.
- `the_kb_token_is_preferred_over_the_deploy_token`.

A full non-rehearsal `--env dev control-app` that rebuilds and then completes isn't run, for BUG-203's reason: it migrates `.wrangler/state`, the only copy of the dev data. The rebuild-then-continue path is shown at the hook, and the ordering is shown by the rehearsal.