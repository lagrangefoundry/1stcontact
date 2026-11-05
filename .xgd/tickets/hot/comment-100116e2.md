---
uid: comment-100116e2
id: COMMENT-7771
type: comment
title: Comment on bug BUG-342
created_by: xgd
created_at: '2026-11-04T18:11:08.807612+00:00'
updated_at: '2026-11-04T18:39:39.237642+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-be4ce87c
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e1e894a2-0f10-4860-981d-03771a6ce4e1",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="b79b4e5b-5913-40c8-9bb7-ee254389b007-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T18:09:15.993827+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="b79b4e5b-5913-40c8-9bb7-ee254389b007-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T18:39:38.022880+00:00" -->
#### Claude
The scope is fully specified. Let me survey the code involved.

A probe of the live dev worker hung, so I've stopped it; I don't need it. I'm going back to reading the snapshot/service table, then I'll write the plan into the ticket.

I have enough to plan. Before coding, I'm recording the design in the ticket, marking it `free_coding`, and cutting the branch.

The branch cut succeeded and the worktree already has `node_modules`. Now I'm coding, starting with the probe asset in the service table.

Now the main rewrite in `dev.ts`. First I'm checking the `DevListener` and `DevSnapshot` field names I'll rely on.

Now the edits to `dev.ts`: the service table, the failure details, the STALE hint, and the rewritten refresh.

Inserted. Now the CLI line, the deploy script, and the two operator messages.

Next, the build-first step in `bin/deploy`.

Type-check is clean for the touched files. Now the UATs; first I need a port range no other dev suite uses.

Ports 8700–8709 are free. Next I'm looking at how the existing suites drive the boot guard and the front's 502, so I can reuse them.

Now writing the BUG-342 UAT file.

All 7 pass. Now the BUG-307 tests this ticket supersedes.

Now the regression scope: all the dev, boot-guard and front suites that touch what I changed.

All 88 pass across the 12 suites. Next I'm checking the remaining suites that read `bin/deploy`, and running the REQ-318 deploy-target suite.

Next, the end-to-end success UAT through the real `bin/deploy`, with build and refresh stubbed to record when and how they ran.

The manifest is multi-line JSON, which would break the journal's one-line format. I'm recording its sha1 instead.

All 8 pass, including the real `bin/deploy` run. Now the deploy-script suites: REQ-318, BUG-294 and the dry-run suites.

Five failures in REQ-318 and REQ-393. I'm reading the details to see whether my change caused them or they also fail without it.

Serially, all 25 pass, so the REQ-318 failure is the parallel collision on `apps/public-site/.dev-snapshot`, and REQ-318 and BUG-294 already collided before this change. Now REQ-393.

REQ-393 only deploys `--env production`, the cloud target my change doesn't touch, and its failures change between runs. I'm checking the one that fails alone.

Next I'm committing the code. Then I'll lock, merge `xgd-working` into the branch, bump the version, fast-forward and promote. First, confirming exactly what will be staged.

Committed `55a612b`. Now the merge-back: lock, bring `xgd-working` into the branch, bump the version.

The version is unclaimed and the bump is committed. I'm re-running the core suites on the merged tree before landing it.

The public-site pidfile disappeared after the refresh. I'm re-running in isolation to see whether it's deterministic before digging further.

It fails every time now and passed before the merge, so something that came in from `xgd-working` interacts with it. Checking what the merge changed in these files.

The merge didn't touch the dev code, so this is probably environmental. I'm checking for stray listeners left in BUG-307's port range.

No new listeners are left behind, so the leak is fixed. The BUG-307 test still fails here; I'm confirming that's the duplicate-port effect of the 13 existing strays.

Now fast-forwarding `xgd-working` (the main checkout) to the branch, then rematerializing the ticket overlay.

The fast-forward landed and the overlay check found nothing to change. Now I'm recording "What landed" on the ticket before promoting it.

The ticket is at `free_coded` and the branch is cleaned up. I'm saving one lesson from this session to memory.

BUG-342 is done: `bin/deploy --env dev` now builds, deploys, brings every dev service up on the new snapshot and checks it before reporting success. It has landed on `xgd-working` (version 0.2.759) and the ticket is at `free_coded`. I didn't need to ask anything first; the ticket was specific enough.

**What the command does now**
- **Builds first.** A failed build stops it before anything is deployed or any service is touched. Production deploys are unchanged.
- **Brings every service up, whatever state it was in.** A crashed worker with a leftover pidfile is started. A process from this checkout with no pidfile is replaced. Anything not running is started, including filing.
- **Refuses if another checkout or project holds a dev port.** It names that process and stops or starts nothing.
- **Checks before saying it's up.** Every service must answer, and the dev worker must serve `builder/main.js` byte-for-byte identical to the new snapshot. That is the check that would have caught the old-asset-manifest problem from BUG-334.
- **Reports in one line or one paragraph.** On success: `Dev is up: <services> serving <app> <commit> (deployed <time>)`. On failure it exits non-zero, naming the service, what happened, its last log lines and where the log is.
- **One command in every message.** The builder's error panel, the "dev worker is not answering" page and the stale-process hint in `1c ps` now say only `bin/deploy --env dev`.

**Choices I made that you may want to check**
- **No `deployedAt` endpoint on the worker.** I prove freshness by the worker being restarted after the deploy, plus the byte-identical asset. That avoided changing the control app for no extra evidence.
- **Two override variables in `bin/deploy`.** `DEPLOY_BUILD_CMD` replaces the build and `DEPLOY_DEV_REFRESH_CMD` replaces the service step. Without them, the REQ-318 and BUG-294 suites, which run a real dev deploy, would do a full build and start or stop your real dev services.
- **Overrides BUG-307's rule.** A deploy used to leave a stopped environment down and tell you to run `bin/dev up`. That BUG-307 test is deleted and its message checks now expect the single command; the ticket body records this.

**Tests**
- Eight new BUG-342 tests pass, including two that run the real `bin/deploy`. The surrounding dev and boot-guard suites passed 88/88, and REQ-318, BUG-294 and BUG-342 pass together when run one file at a time.
- **REQ-318 vs BUG-294:** both deploy `public-site` into the same snapshot folder, so they can collide when the full suite runs files in parallel. That collision existed before this change, and my new end-to-end test is a third suite doing the same deploy.
- **REQ-393:** one test fails on a production bundle error ("SiteCoordinator not exported") in a file this change doesn't touch.
- I didn't run the whole test suite.

**Something you need to do:** my rewrite broke how the BUG-307 suite cleans up the test processes it starts. I've fixed and committed that, and a re-run leaves nothing behind. But 13 stand-in processes from earlier runs are still listening on ports 8723–8735, and the sandbox won't let me stop them. Until they're gone, that BUG-307 test fails because it can't find free ports. They all run from deleted `/private/tmp/claude-501/bug307-*` folders, so this only kills those:
```
for p in $(lsof -nP -iTCP -sTCP:LISTEN | awk '$9 ~ /:87[23][0-9]$/ {print $2}' | sort -u); do lsof -a -p $p -d cwd -Fn | grep -q bug307- && kill $p; done
```

Your running dev environment still has the old code. Running `bin/deploy --env dev` once will build, deploy and pick this up.

<!-- xgd-chat-end -->