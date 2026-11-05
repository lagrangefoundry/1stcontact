---
uid: comment-d6822ae8
id: COMMENT-3843
type: comment
title: Comment on request REQ-318
created_by: xgd
created_at: '2026-09-25T04:38:15.845263+00:00'
updated_at: '2026-09-25T05:22:07.522085+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-30178935
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "38c7842d-c325-40d9-8685-b92c078ef5f0",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d5303af9-063c-4c6d-9704-d8fb6aa40a18-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T04:37:30.942538+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="d5303af9-063c-4c6d-9704-d8fb6aa40a18-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-25T05:09:53.713161+00:00" -->
#### Claude
Now let me write the `[env.dev]` block for the control app.

Now I'll rewrite that region of `bin/deploy` with a Python-driven surgical replacement.

Now the migrate hook.

Now the env-aware `d1-migrations.ts`.

Now let me wire the two new commands into the CLI.

Now add the `declaringBlocks` import to each of those files.

Now REQ-291 and the AC1335 step line.

Now add the sharper migrate-hook UAT to REQ-318's file, and fix the AC1335 step-line assertion.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="171bad03-4c8f-4a45-ac30-9805c9029290-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T05:10:06.114224+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="171bad03-4c8f-4a45-ac30-9805c9029290-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-25T05:22:06.740704+00:00" -->
#### Claude
REQ-318 is free-coded and landed on `xgd-working`.

## What shipped

**`bin/deploy` gained a target table.** `ship_target()` maps `dev → local`, everything else → `cloud`. The local row bundles to `apps/<app>/.dev-snapshot/` and uploads nothing; everything before that terminal verb is identical to a cloud deploy — same hook directories in the same order, same `DEPLOY_ENV`, same capability report. The step line now names the row (`(--env dev, local)`), and `DEPLOY_TARGET` is exported to every hook.

**`1c dev serve`** (`bin/dev serve`, port 8789) runs `wrangler dev --no-bundle` against the snapshot. The freeze is structural, not a flag: a source edit changes nothing about what is served until the next `bin/deploy --env dev`.

Also in: `[env.dev]` in both apps' `wrangler.toml` sharing the one store; `d1-migrations.ts` follows the environment being served; the migrate hook resolves the database from `[[env.<name>.d1_databases]]` and the store from `DEPLOY_TARGET` (closing §J3 — `--env dev` would otherwise have migrated **production's** D1); `1c workerd` exposes REQ-316's check as a CLI surface so the bash deploy can run it before any hook opens `.wrangler/state`; secret hooks stop at the local target but still probe a value the operator's environment carries.

`declaringBlocks()` replaces a dozen hardcoded `toHaveLength(2)` assertions that were pinning the *number of environments* as a side effect of pinning the "every block restates it" rule.

## Verification

13 new UATs in `tests/test_UAT_FC_REQ-318_local_dev_deploy_target.test.ts`, all passing — including the acceptance condition measured on real bundles (deploy, hash the entry, edit a source file, re-hash byte-identical, deploy again, marker appears). Regression scope: every suite that reads a `wrangler.toml`, imports a changed module, or exercises `bin/deploy` — 46 files, all green. Both typechecks clean.

Two things I fixed that were broken in the in-flight work: an import statement spliced into the middle of another import in `test_UAT_FC_REQ-231_wiring.test.ts`, and a second `(--env staging)` step-line assertion I'd missed in the deploy smoke suite.

Pre-existing failures I confirmed against `xgd-working` and left alone: `REQ-180` (a `tenant` string in `tenant-cost.js`), `reconciliation-builder-workspace-origin` (three chat-export routes no probe covers), and `BUG-124`/`REQ-273` (EADDRINUSE on 8790 — your filing service is running).

## One thing to know

The `xgd-working` checkout had uncommitted edits from another session in two files I also touched (`apps/control-app/wrangler.toml`'s `SERVICE_TOKEN_IDENTITIES`/`PLATFORM_ADMINS` fix, and `cli/index.ts`'s BUG-143 `width×height` gate output), so the fast-forward refused. I saved their diff, restored the files, merged, and re-applied it cleanly with `git apply --3way`, then unstaged it so it sits exactly as it did before — still uncommitted, theirs to commit. Both sets of changes verified present afterwards.

DOC-41 gained the target table, a "Deployed, not edited into" subsection under §2, the corrected migrate-hook description, and the dev line in the order-of-operations block.

Ticket is at `free_coded` with `commits` = [`eea3301a13`, `e07f95e0ff`], version `0.2.355`, story points 8. Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->