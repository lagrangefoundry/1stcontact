---
uid: comment-cbcb6c7e
id: COMMENT-8033
type: comment
title: Comment on bug BUG-387
created_by: xgd
created_at: '2026-11-08T20:56:45.674882+00:00'
updated_at: '2026-11-08T21:11:05.336969+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-fa20b941
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8a6ea2a5-e725-4840-bad0-7b0b9d8b9ecc",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="c070d435-7eca-49a3-bcf8-b4b68157fd32-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T20:55:32.009946+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="c070d435-7eca-49a3-bcf8-b4b68157fd32-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T21:11:05.152496+00:00" -->
#### Claude
Not a duplicate. Reading the Durable Object wiring and the tests that reference `PLATFORM` before changing anything.

Checking the exact workerd flag name for `ctx.exports` and how staging environments get their config.

Plan settled. Taking the session lock and starting the edits on xgd-working (small change, one turn).

Now the code. First the Durable Object and `ready()`:

Writing the BUG-387 UATs now.

Now the compat-pin reconciliation test, then run the suites.

Both failures reproduce with HEAD's config, so they predate this change. Typechecking next.

Running the REQ-646 container rig locally (real `wrangler dev` + Docker) to confirm a turn still reaches the platform with the loopback binding and the new ordering.

zsh didn't split the file list, so that second run still used my code. My files are untouched. Running it again with a proper array:

HEAD's code fails the same way, so the Delegate-transcript assertion is an older failure. Next is the rig case closest to this change: the container reaching stores only through the entrypoint.

That case passes, with no `container_fetch_failed`. Next: cleanup, then commit.

Committed. Now updating the ticket body (the existing text stays as it is, with an implementation section appended) and moving it to `free_coded`.

I've committed a fix for BUG-387 (`6541e0488e`, version 0.2.833) and moved the ticket to `free_coded`. It isn't proven on production yet: that needs a deploy and a "hello" in a builder. It isn't a duplicate of another ticket.

**What changed**
- **Binding:** the job container's intercept now uses the Worker's own loopback entrypoint, `ctx.exports.PlatformApi({ props: {} })`, which is the form Cloudflare's container API uses. The object refuses to start, with an error naming `enable_ctx_exports`, if that entrypoint isn't available. The `PLATFORM` service binding is removed from all three environments and from the router's types; nothing else used it.
- **Order:** `JobContainer.ready()` now registers the intercept before `start()`, and does it again for every new container. BUG-385's `job_container_intercept` log line is unchanged and now shows the loopback binding.
- **Config:** I added only the `enable_ctx_exports` flag and left `compatibility_date` at `2025-07-01`, so no other runtime behaviour changes. Production and dev inherit the flag from the top level, and so will any later environment such as staging unless it overrides the flags line.

**Testing**
- **New tests:** `tests/test_UAT_FC_BUG-387_container_intercept_loopback.test.ts` passes. It checks the intercept comes before `start()` with the loopback binding, for each new container, and that the object won't start without it. It also checks every environment in `wrangler.toml`, as wrangler resolves it: the flag present, the date unchanged, no `PLATFORM` service.
- **Container test runs (local, Docker):**
  - "container reaches stores only through the entrypoint" passes.
  - "full message runs through a container" logged 1,463 platform calls reaching `PlatformApi` and no refused connections. It still fails later, on the check that the transcript contains "The result of your Delegate call". It fails the same way on the code before my change, so it was already failing.
- **Other failures:** two tests also fail the same way without my change: the REQ-393 secrets-file test and the AC1324 site-editing test.

I updated the compatibility-pin test so it expects the new flag on the control app. I left the workerd test config alone, because no test there runs the container.

**Still to do (you):** deploy to production, send "hello" in a builder, and check Workers Logs. You should see `platform_api_request` lines and no `container_fetch_failed` for `10.0.0.1`. The ticket body has the full record, ready for you to promote to `ready_to_reconcile`.

<!-- xgd-chat-end -->