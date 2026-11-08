---
uid: comment-ff4e35d0
id: COMMENT-7944
type: comment
title: Comment on bug BUG-378
created_by: xgd
created_at: '2026-11-07T21:46:01.017468+00:00'
updated_at: '2026-11-07T21:53:25.018355+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-e40e80c3
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "98a80500-784e-4a41-92ca-982406b6cbb7",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="262034f8-9c14-4400-bb18-5d25b53f98b2-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T21:45:32.766951+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="262034f8-9c14-4400-bb18-5d25b53f98b2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T21:53:24.219662+00:00" -->
#### Claude
Reading the ticket and finding the existing wrangler parity test.

Checking `container-images.ts`, which looks up container applications by name — it may compute the derived name.

The registry prune (BUG-359) also derives the application name from the Worker name, so it must change too. Looking at its caller and test.

Confirming how wrangler 4.111 derives the default container name, and whether the Worker is uploaded before containers.

Now writing the change: explicit names in `wrangler.toml`, a per-environment reader plus a name check in `container-images.ts`, and the prune switched to the configured name.

Local dev images are keyed by class name, so the dev side is unaffected. Editing the config:

Now `container-images.ts`:

Now the `1c images prune` CLI and `bin/deploy`:

Updating the BUG-359 prune tests to the new signature:

Now the BUG-378 UAT. I'll check what wrangler exports for reading a resolved per-environment config, so the test can confirm the name wrangler will actually send:

Wrangler resolves the configured names. Writing the UAT:

Passing. Running the adjacent suites (deploy scripts, dry-run, BUG-359 config check) and typecheck:

Both failures are the known fresh-worktree gap (control-app's `generated/` is missing). Copying it in from the main checkout, as the memory notes say:

All green. Typecheck and lint next:

Typecheck is clean for the touched files; prettier isn't installed here, so formatting is unchecked. Now checking what the failed deploy left in production (read-only):

Committing the work, then updating the ticket body before merging back.

Body updated. Now merging back with the version-bump retry loop from memory:

The container naming is fixed and merged into `xgd-working`. BUG-378 is at `free_coded` (commits `fba45d07` and `19553c35`, version 0.2.815). Production is still half-deployed: you need to re-run `bin/deploy --env production`. I didn't run a cloud deploy from here.

**The fix**
- **`wrangler.toml`:** every `[[containers]]` entry now sets a `name`: `onecontact-agent-container` at the top level, plus `-production` and `-dev` versions. Worker names, the `AGENT_CONTAINER` binding and the `AgentContainer` class are unchanged. Local dev images are named by class, so dev isn't affected.
- **Name check:** a new function in `container-images.ts` reports any container entry, in any environment, that has no name, a name not starting with a letter, or a name another entry already uses. A UAT holds the committed config to zero problems, and wrangler's own config reader confirms those exact names are what it will send.
- **A second bug of the same kind:** the BUG-359 image prune looked up the application as `<worker>-<class>`, a name wrangler never creates, so it could never find anything. It now uses the names set in the config. `1c images prune` requires `--env`, which `bin/deploy` now passes.

**Tests:** the new `test_UAT_FC_BUG-378_*` tests pass, as do the adjusted BUG-359 prune tests, the instance-type config check, the BUG-352 dry run and the REQ-144 deploy scripts. Typecheck is clean on the touched files. Prettier isn't installed here, so formatting wasn't checked.

**What the failed deploy left in production** (checked read-only with wrangler)
- **Ran:** migrations and secrets. The secret changes are recorded at 21:30:06Z and 21:30:09Z.
- **Live:** the new Worker version `f026ce9c…`, uploaded at 21:30:23Z, is serving 100% of traffic. Wrangler uploads the Worker before it creates containers.
- **Missing:** no container application exists (`wrangler containers list` finds none). Until you re-run, any production job that needs the container (consultant and builder rounds, captures) will fail.
- **Not run:** routes and crons weren't updated, because wrangler deploys them after containers. The capability report and image prune didn't run either, because the script stopped at the failed step.

The re-run should create `onecontact-agent-container-production`, deploy the routes and crons, and prune images against the new name. All of this is in the ticket body.

<!-- xgd-chat-end -->