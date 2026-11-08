---
uid: comment-14ce6c6d
id: COMMENT-8028
type: comment
title: Comment on bug BUG-385
created_by: xgd
created_at: '2026-11-08T19:50:59.413622+00:00'
updated_at: '2026-11-08T20:18:18.926379+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-689524e4
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "66037a82-6f80-4597-960d-ab9c7b1a5438",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="dc462cf1-53b7-4fc0-baa4-162441a49e02-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T19:49:27.593796+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="dc462cf1-53b7-4fc0-baa4-162441a49e02-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T19:53:51.790318+00:00" -->
#### Claude
Reading the code and the ticket's earlier findings; next I'm pulling the production failure stacks from Workers Logs.

<!-- xgd-turn id="66173656-4afa-42ed-ab67-a227013ac387-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T19:54:12.463229+00:00" -->
#### You
This ticket has been rescoped - please check and implement only the new logging scope

<!-- xgd-turn id="66173656-4afa-42ed-ab67-a227013ac387-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T20:18:17.694496+00:00" -->
#### Claude
Now set up node_modules in the worktree (per-entry links, relative `@1stcontact` links recreated).

Wiring the logging now: reading the platform wire and existing BUG-359 test rig so the new UATs follow it.

Writing the diagnostics module.

Now the container server.

Now the Durable Object side: intercept log and step timing.

Typecheck is clean. Now the UATs.

Both typecheck. Writing the UAT file.

All four pass. The ticket's `job_step_queued` line has no UAT yet, so I'm adding one.

Now the regression scope: the BUG-359 container suites, the platform-wire/REQ-646 workers suites, and lint.

That failure is the Docker rig missing `dist-assets` in a fresh worktree (a known setup gap). Setting it up to run the real-container path too.

Passes. Now one real-container REQ-646 case, to prove the server change works inside an actual container.

A REQ-646 real-container case fails on a scripted-model prompt assertion ("The result of your Delegate call"), which looks unrelated to logging. Checking it against the code without my change.

Pre-existing — same failure without my change. Restoring my code and running the other two quick real-container cases.

Both pass. Lint next.

No linter in this repo. Checking for source-scanning suites that read the files I touched.

Need a baseline for these 5. Running the same files in the main checkout (no BUG-385 change).

Same failures exist on xgd-working without my change, so none are regressions. Now the commit and hand-off steps.

Squashing the WIP into the real commit, then updating the ticket body before merge.

Now appending what landed to the ticket body, keeping the existing content.

Ticket updated. Merging back with the retry loop from my notes (ticket commits from other sessions race the version tip).

I've added the logging from the new scope and changed no behaviour. It's merged into `xgd-working` as version 0.2.830 (commits `e3bec4f9a1` and the version bump `b65448dffb`), and BUG-385 is at `free_coded`. It isn't deployed: to get the answer you need to deploy to production, send "hello" in a builder, and read that job's lines in Workers Logs.

**The new log lines.** Each is one JSON object with the job id, and none contains a token, an `Authorization` header, a model key, a query string or a request body:
- **`container_fetch_failed`**: every fetch from the container that throws. It gives the method, host and path, whether the target was the platform address, and the error's full `cause` chain (`code`, `syscall`, `address`, `port`, …). This is the real reason that "fetch failed" was hiding.
- **`job_step_failed`**: now also carries the `cause` chain, in the container and in the Worker.
- **`job_container_intercept`**: whether `interceptOutboundHttp` exists, whether registering it worked (`registered`, `absent` or `failed`), the address, and what kind of value the binding is. The `?.` call is still optional.
- **`platform_api_request`**: every request `PlatformApi` receives, including refused ones, with status and duration.
- **`job_container_step_timing`**: per step, whether it had to start a container, `start_ms`, `intercept_ms`, `step_ms`, `total_ms`, and whether it succeeded.
- **`job_step_queued`**: how long each step waited to begin, measured from when the job was created and then from the step or attempt before it.

**Something useful already from production.** In the last 24 hours `PlatformApi` was never invoked, not once. So the container's platform calls never reach the Worker; the intercept or its binding is where it breaks. In the local container suite the intercept logs `registered` with a binding of type `Fetcher`, so the production line from `job_container_intercept` will show whether production differs.

**Tests.**
- **New tests:** five in `tests/test_UAT_FC_BUG-385_job_container_diagnostics.test.ts`, all passing. They are the four from the test plan plus one for `job_step_queued`, which the plan didn't list.
- **Real containers:** two of the five real-container cases (`container_reaches_stores_only_through_the_entrypoint`, `killed_container_retries_the_step_once`) pass. The container-leak suite also passes.
- **Failure that predates this change:** `test_UAT_FC_REQ-646_full_message_runs_through_a_container` fails on the same prompt assertion ("The result of your Delegate call") with my change taken out, so it is unrelated.
- **Other failures:** five more tests fail in suites that read the files I touched. All five fail the same way on `xgd-working` without the change.

**Limitations:**
- `platform_api_request` writes a line for every platform call, which can be hundreds per round. That is what the ticket asked for, but you may want to cut it back once you've read the result.
- `job_step_queued` covers consultant turns only, not shop imports.
- When the Workflow resumes after a pause, the first wait is measured from the resume, not from the end of the previous step.

The ticket body now has a "What landed" section with the exact fields.

<!-- xgd-chat-end -->