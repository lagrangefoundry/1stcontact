---
uid: comment-6f52df29
id: COMMENT-7942
type: comment
title: Comment on bug BUG-377
created_by: xgd
created_at: '2026-11-07T21:41:05.228867+00:00'
updated_at: '2026-11-07T22:02:23.211220+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-a63c684c
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "39991431-85b5-4db4-aea1-c4a6cf15ac11",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="76924eae-6f7f-4f6b-96a3-eb8273424fd2-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T21:40:44.009987+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="76924eae-6f7f-4f6b-96a3-eb8273424fd2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T22:02:20.946807+00:00" -->
#### Claude
Not a duplicate (BUG-303 and REQ-322 cover `kb ensure` itself and `bin/build`, not the deploy). Starting work: marking the ticket and cutting a branch.

Reading the `kb ensure` implementation to see how it decides "behind" and which credential it reads.

Design settled. Now checking which tests pin the KB credential wording before I touch it.

Now the edits. First `kb.ts`: prefer the KB token, and add a check-only mode to `kbEnsure`.

Now the deploy side: a new `prepare` hook stage and the KB hook.

Now wiring `bin/deploy`: the prepare stage, stage tracking, and the "NOT deployed" final line.

Now the UATs. Checking how REQ-322's suite builds a fixture KB that is behind its tickets.

Running the new suite in the worktree.

The worktree is missing generated artefacts (a known fresh-worktree gap). Copying them in from the main checkout and fixing the snapshot helper.

Only remaining failure is the worktree lacking `dist-assets` (a dry run doesn't build it). Copying it in like the generated dir.

A font-report line also says "NOT deployed"; tightening that assertion to the app line.

All 7 pass. Now the regression scope: the neighbouring deploy and KB suites.

Passes on its own — looks like two suites deploying to the same snapshot concurrently. Confirming by rerunning the pair that both write snapshots.

Sequentially all green. Typechecking the CLI package.

No type errors in the touched files (the ones shown are pre-existing elsewhere). Checking how this repo bumps its version for a free-coded commit.

Committing the code on the branch.

Updating the ticket body to match what landed (preserving the original content).

Using `--append-body-file` with a temp file instead.

Ticket updated. Now the merge-back, following the order that works for the version gate (lock, merge working into the branch, bump, fast-forward).

`bin/deploy` auto-merged with someone else's change, so I'm re-running the suite on the merged tree before landing.

Green. Fast-forwarding `xgd-working` and rematerialising the ticket overlay.

It moved to `free_coded`, but printed a warning about the version. Checking what it said.

Recorded correctly (both SHAs, version 0.2.816). The warning was the gate's general reminder. Setting story points and tearing down the branch.

BUG-377 is fixed, merged into `xgd-working` and parked at `free_coded` (commits `d8552f2c` and `c6972146`, version 0.2.816, 3 points). It isn't a duplicate: BUG-303 and REQ-322 cover `1c kb ensure` and `bin/build`, not the deploy.

**One thing you need to do:** add `CLOUDFLARE_KB_API_TOKEN=<your 1c_Admin_Token>` to the deploy's secrets file (`~/Documents/secrets/1c.dev.env`). Until you do, a production deploy with the KB behind will stop at the new check. It now stops before anything ships, with a message naming that credential.

**What the deploy does now:**
- **New first stage.** `bin/deploy` has a new `prepare` stage that runs for every app before anything ships, the fonts included. I couldn't put the KB step in the existing `assets` hook, because the fonts upload before that hook runs, so a stop there wouldn't be "before anything is deployed".
- **KB check.** The control app's prepare hook asks `1c kb ensure --check`, a new check-only option:
  - KB current: prints `system KB current` and spends nothing.
  - KB behind: rebuilds and prints `system KB was behind (DOC-…, REF-…): rebuilt`.
  - `--dry-run`: prints `would rebuild the system KB — behind (…)` and writes nothing.
  - A failed rebuild shows the KB tool's own error and stops the deploy before any migration or upload.
- **Credential.** `1c kb` now reads `CLOUDFLARE_KB_API_TOKEN` first, and falls back to `CLOUDFLARE_API_TOKEN` when that's the only one set. So `bin/build` and `bin/kb-release` pick up the KB token from the same file too.
- **Stops are visible.** Any deploy that exits non-zero ends with `control-app NOT deployed: stopped at <stage> (exit N)` for each app it didn't ship. The exit code stays non-zero.
- **Backstop kept.** `1c assets` still refuses a stale KB, for any path that skips the new stage.

**Two choices to check:**
- With the KB behind and no KB token, a `--dry-run` also fails. A rehearsal that passed would hide a real deploy that is going to stop.
- No test runs a full real (non-dry-run) dev deploy that rebuilds and then finishes. That would migrate `.wrangler/state`, the only copy of the dev data. The rebuild is tested at the hook, and the ordering is tested through a real `--dry-run` deploy.

**Tests:** the 7 new tests pass, and so do the related deploy and KB suites (BUG-203, BUG-342, REQ-318, REQ-322, BUG-303), including after merging the latest `xgd-working`. Two REQ-318 tests fail when run in parallel with the other deploy suites and pass when run one file at a time. That looks like the suites writing the same dev snapshot, not this change.

I haven't run a production deploy. Promoting the ticket to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->