---
uid: comment-a9433b2b
id: COMMENT-8035
type: comment
title: Comment on bug BUG-389
created_by: xgd
created_at: '2026-11-08T21:05:30.213018+00:00'
updated_at: '2026-11-08T21:22:38.066361+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-896d4100
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2281f5de-5b28-4da3-9d1f-96956dd41933",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="53419a5d-6c66-45f8-ab95-6d09f8a594cd-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T21:04:45.194100+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="53419a5d-6c66-45f8-ab95-6d09f8a594cd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T21:22:35.755162+00:00" -->
#### Claude
Not a duplicate. Starting the free-coding process.

Reading the existing BUG-385 timing lines so the new ones match their shape.

Tracing where the prompt handler reads the transcript and calls `create()`.

Mapping where a round step rebuilds the session and writes its first reply text.

Writing the code now. First checking whether the router sees the same `Request` object `fetch` received (for the arrival timestamp).

Now host-core: the step-timing hooks and the runner's `mark`.

Instrumenting the container's server (boot line + round timing on the step's compute).

Writing the UATs: one workers suite (real Worker + Workflow) and one node suite (container server, Durable Object logic, colo lookup).

Node UATs pass. Now the workers suite.

Passes. Running the regression scope around the touched files.

Those failures are worktree artifacts (no `dist-assets`), unrelated. Running the workers regression scope.

All green. Checking this project's version-bump convention before committing.

Committing the work, then a quick no-deploy bundle-size check (the ticket's note).

Minified: 13.1 MB → 8.6 MB (−34%). Now recording the implementation in the ticket body (appending, existing content kept).

Merging back. First checking the xgd-working checkout — at session start it held another session's uncommitted edits to the same files.

Clean now. Running the lock → merge → bump → fast-forward sequence.

Resolving per the "keep the merge pure" rule: take xgd-working's side of the conflicted file, then re-apply my edits in their own commit.

All green after the merge. Committing the re-applied edits, then the version bump.

BUG-389 is done and merged into xgd-working, and the ticket is at `free_coded`. It isn't a duplicate: no other ticket covers this start-up timing. Nothing changes behaviour; it only adds the log lines the ticket asked for.

**What each part now logs:**
- **Each isolate's first invocation** logs `isolate_cold`, with which entrypoint it was (`fetch`, `ConsultantTurn`, `AgentContainer` or `PlatformApi`) and `isolate_age_ms`. Later invocations log nothing for this.
- **On production, `module_eval_ms` will probably read about 0.** Cloudflare's runtime doesn't advance its clock while code runs without waiting on anything, and the module's top level is that kind of code. So `isolate_cold: true` itself is the signal that matters.
- **Data centre:** the request handler uses `request.cf.colo`. The Workflow and the Durable Object look it up once per isolate from `<origin>/cdn-cgi/trace`, with a 2 s timeout, and a failure is recorded as `colo: null`. The lookup is never awaited by the work, so it doesn't add to the time being measured.
- **`turn_start_timing`** (the prompt, and Carry on) has `handler_ms`, `create_ms`, the colo, and a `steps` map timing each part before `create()`. That includes `session_loaded`, the transcript read and its checks. Getting those steps meant a small hook in the shared `tools/generate` host core (`host-core.ts`).
- **`job_run_entered`** has `since_created_ms` and is logged on every entry of `run()`, replays included.
- **`job_container_wake`** has `rpc_ms`, which uses a new call timestamp the Workflow sends, plus `storage_ms`, `isolate_cold` and the colo.
- **`container_boot`** is logged once at listen time with `boot_ms`. The existing per-step timing line now also carries `rebuild_ms` and `first_token_ms`.
- **`turn_first_output`** has `since_request_ms`, measured from when the client's message arrived.

**Tests:** two new test files pass, one run with real Node and one in the Workers runtime (real Worker and Workflow, scripted model). So do the nearby suites I re-ran: BUG-385, BUG-387, BUG-359, REQ-624, REQ-627, REQ-646 and BUG-353. Two other suites failed in my branch's worktree, and it was for a reason that has nothing to do with this change: that worktree has no built `dist-assets` folder.

One change from the ticket's test plan: I tested the container parts by running the real container server in-process, not in the Docker REQ-646 rig. That rig can't read the Worker's or the container's console, and each case takes minutes. This is noted in the ticket.

**Merge:** BUG-387 landed while I was working and touched the same container code. It now registers the platform intercept before starting the container. I kept that order and logged `job_container_wake` just before the intercept, so `storage_ms` counts only the storage writes. I made that adaptation in its own commit, so reconcile will carry it.

**Bundle size** (the ticket's no-deploy check): the production build is 13.1 MB unminified and 8.6 MB with `--minify`, about 34% smaller.

Commits: `094aba9c0e` (the logging), `cc5686e613` (re-applied over BUG-387), `6a4786be1b` (version 0.2.834), with story points set to 5. The next step is yours: deploy, send a few messages, and read these lines for each job. The first-output line and the per-step timing only produce numbers once turns succeed on production, which depends on BUG-387.

<!-- xgd-chat-end -->