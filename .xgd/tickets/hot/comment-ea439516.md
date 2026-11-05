---
uid: comment-ea439516
id: COMMENT-5750
type: comment
title: Comment on bug BUG-294
created_by: xgd
created_at: '2026-10-26T02:02:38.513012+00:00'
updated_at: '2026-10-26T02:40:56.019441+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-5724fa99
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e2b9a5a0-49e3-4697-8cc8-6243540c427e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="40580079-9c9a-4ef0-a180-580996e42627-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T02:01:00.151184+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="40580079-9c9a-4ef0-a180-580996e42627-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T02:40:54.651443+00:00" -->
#### Claude
Reading the dev launcher code (`dev.ts`, `dev-snapshot.ts`) to see how wrangler is pointed at the snapshot.

Tracing wrangler's source to see why a preview-token refresh restarts the local server.

Checking whether wrangler's token refresh actually reaches the local runtime (the log suggests it doesn't — the turn survived the 00:58 and 01:02 refreshes and died at the 01:05:44 config reload).

Found a cleaner lever: wrangler has a switch that turns its config watcher off. Checking what it reads.

Design settled for the config freeze: the snapshot carries its own `wrangler.toml` and `bin/dev` passes `--config` at it. Checking the BUG-50 env-file assertions this touches.

Critical check before moving `--config`: whether wrangler resolves `--persist-to` against cwd or the config directory (if the latter, the store would land inside the snapshot).

Now the panel side (Fix 3). Reading the reattach route, the turn ledger's silence rule, and the panel's recovery chase.

Design is settled. Starting with the dev side: the snapshot carries its own config and `bin/dev` points wrangler at it.

Now `dev-snapshot.ts`: the manifest's `config`, and the argv.

Running the existing dev-environment UATs against the change.

Ignored, so copying it in from the main checkout is safe. Re-running REQ-318 with the assets in place.

The widget closes the bubble on any `done` and ignores unknown statuses, so a `lost` status is safe to send. Writing the host-core side: find the dead turn, close it on the junction, report it.

Now wiring it into the conversation open (both the site and the settings conversation) and the rejoin tail.

Now the ledger half in `turn-log.ts`: close the session's open row as `lost` (or `restarted` when its silence began at a deploy).

Now the router: the session route closes the ledger row and carries the progress line on `failed`; the tail closes it when it ends `lost`.

Typecheck is clean. Now the panel: a stopped-work notice with a Carry on button, shown when the origin reports the turn dead (on reopen or at the end of a rejoined stream).

Now the button's style, placed beside the start-button rules (not at the file's tail, which a story-board UAT polices).

Now the UATs. Checking how REQ-318 already exercises the local deploy, to reuse its harness.

Now the origin-side UAT. Looking for an existing workers test that seeds junction records and calls `/api/ai/session` or `/api/ai/reattach`, to reuse its harness.

REQ-307's suite already has the apparatus I need (`isolateReplaced`, `ageTheLease`). Reading those helpers.

Reading the junction's record format (that framework file needs `grep -a`; it carries NUL bytes).

Writing the UATs. First confirming the record kind names I'll seed (heartbeat, progress, claim).

The reopen case passes. The other two collide on my fixture's turn id; making it unique per site.

All three pass. Checking they're not vacuous: with the dead-turn check disabled, the reopen and tail cases should fail.

Negative control confirmed (both fail without the fix; file restored). Now the panel UAT in jsdom, on BUG-123's harness.

Suspiciously fast; checking they actually ran rather than skipped.

Panel UAT runs for real (56ms each). Now the dev-config UAT; checking the shared wrangler-toml test helpers first.

The server never answered. Surfacing wrangler's log in the timeout message to see why.

Node itself is rejecting the absent `--env-file` paths. Reproducing outside vitest to see whether that's wrangler's launcher or the test environment.

Real-wrangler UAT passes. Now the regression scope around what I touched: the junction, reattach, ledger, and panel suites.

Three REQ-416 failures. The priming one is a known red-on-clean failure (per my notes); the two 5s timeouts need a baseline. Reverting just my origin-side files temporarily to compare.

Same three fail on the baseline, so they're pre-existing; my patch is restored. Now the panel-side suites, plus the CSS/shell scans that police `builder.css` and `chat.js`.

Also pre-existing (fails identically with my `chat.js` change reverted). Next the CSS/shell scans and a typecheck of the tools package.

Pre-existing on the clean checkout too. Typechecking the tools package.

Typecheck clean. Final pass over all four BUG-294 UAT files together, then commit. Checking this repo's version-bump convention first.

Body is complete. Committing the work on the branch.

Lock held. Merging `xgd-working` into the branch so the version bump lands at the tip.

Merged cleanly; the incoming BUG-293 work touches the renderer and layout check, not my files. Quick re-run of the fast BUG-294 suites on the merged tree, then the bump.

Merging back into `xgd-working` with the sparse-aware merge script.

BUG-294 is implemented, merged into `xgd-working` and parked at `free_coded` (commits `ea14b95dab` and `2b5c166ede`, version 0.2.662). The new tests pass, and so do the related ones apart from the failures listed below, which were already there.

**You need to run `bin/deploy --env dev` once.** Snapshots deployed before this change have no frozen config, so `bin/dev up` / `restart` will now treat them as "no snapshot" and ask for a deploy, instead of quietly serving them against the checkout's config. The dev server that's running now isn't affected until it restarts.

**Fix 1: the ticket's diagnosis was wrong.** The "Preview token expired … Detected changes, restarted server" lines come from wrangler's remote connection for the AI binding renewing itself. Wrangler's local runtime ignores that event entirely. The log agrees: 193 token-expiry lines but only 9 real local reloads ("Reloading local server"). Your 00:57 turn survived the 00:58 and 01:02 refreshes and died at the 01:05:44 reload, which was BUG-288's `wrangler.toml` edit. So Fix 2 is the actual cure. I still declared the AI binding `remote = true` (which is what it already was): that silences wrangler's warning, and the config comment now records where those log lines come from. I've put this correction in the ticket body.

**Fix 2: the config is frozen with the code.**
- `bin/deploy --env dev` copies `wrangler.toml` into `.dev-snapshot/`, and `bin/dev` points wrangler at that copy.
- Editing or merging the checkout's config now changes nothing that's served until the next deploy.
- The `.dev.vars` files are now passed as absolute paths, because wrangler looks for them relative to the config, which now sits inside the snapshot.
- The UAT runs a real `wrangler dev`: a request in flight while the checkout config is edited completes with no reload. As a control, editing the snapshot's copy does trigger a reload.

**Fix 3: a dead turn is reported as dead.**
- **How a dead turn is detected:** the turn's owner refreshes a claim on the turn every 5 seconds, and the framework treats a claim older than 30 seconds as abandoned. A turn that is open with no live claim is now closed: on the record, and its ledger row marked `lost` (or `restarted` if it died at a deploy). The record is re-read before deciding, so a turn that's still running in another isolate is never closed by mistake.
- **When it's checked:** when the conversation is reopened, and every 10 seconds while the panel is rejoined to a running turn. Before, a rejoined panel waited up to 10 minutes on a dead turn.
- **What the client sees:** "The work stopped before it finished. Where it had got to: "…"" quoting the consultant's last progress line, and a **Carry on** button that sends "Please carry on from where you stopped." The panel doesn't chase again and doesn't mention reloading.
- A turn that is still active is left alone, however long it has run.

**Tests:** 12 new UATs across three `test_UAT_FC_BUG-294_*` files. With the dead-turn check switched off, the reopen and rejoin tests fail, so they aren't passing vacuously. I updated six existing dev-environment UATs (BUG-50, BUG-124, BUG-146, BUG-150, REQ-253, REQ-318) for the new snapshot `config` field and the absolute env-file paths. Both typechecks are clean. I didn't run the full suite.

These tests fail, all for reasons unrelated to this change:
- **BUG-124 (4 tests):** port 8790 is held by your running dev filing service.
- **REQ-416 (3 tests) and BUG-64 (1 test):** also fail with my changes reverted.
- **REQ-408 `weakest_point` (1 test):** also fails on the main checkout.

Two side findings:
- **Missing env files are fatal:** this version of wrangler refuses to start if any `--env-file` it's given doesn't exist. A comment in `dev-env.ts` claims a missing one is tolerated, which is wrong for this version. It doesn't affect you today because all three files exist on your machine.
- **Story points:** I set them to 5.

<!-- xgd-chat-end -->