---
uid: comment-bd34170d
id: COMMENT-8039
type: comment
title: Comment on bug BUG-390
created_by: xgd
created_at: '2026-11-08T21:54:08.748068+00:00'
updated_at: '2026-11-08T22:05:58.912239+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-62c93baf
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "345c682b-765f-4366-aa54-1fa2a894a182",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="cc4c3887-99ea-4b73-9d22-884bcc69cd53-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T21:52:37.756195+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="cc4c3887-99ea-4b73-9d22-884bcc69cd53-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T22:05:57.260366+00:00" -->
#### Claude
Read the ticket. It isn't a duplicate (it follows BUG-385, BUG-387 and BUG-389, which only added logging and intercept fixes). Next I'll set the ticket to free_coding and cut a branch.

Now the boot-time network log. A pure function goes in `job-diagnostics.ts`, and `server.ts` calls it with `os.networkInterfaces()`.

Tests pass. Next: typecheck, plus the REQ-646 container rig case the test plan names.

The entrypoint case passes through the new address. Now the full-turn case:

No platform-call failures appear in the output. To see whether the Delegate assertion failure was already there, I'll rerun the case with my source changes reverted.

The failure happens without my change too, so it predates this ticket. Now I'll clean up the rig output and check how earlier commits bumped the version.

Now I'll commit the work, then update the ticket body before merging back.

Now the merge-back loop: lock, merge xgd-working in, bump, xgd-merge, then move-to-free-coded.

BUG-390 is fixed and merged into xgd-working. The ticket is at `free_coded`, and production still needs the deploy and your "hello" check. It isn't a duplicate: it follows on from BUG-385, BUG-387 and BUG-389, which added the logging and fixed how the intercept is set up, but never moved the address.

**What changed**
- **New platform address.** The container now sends platform calls to `192.0.2.1` instead of `10.0.0.1`. `192.0.2.1` is a reserved documentation address: it isn't private and isn't routed on the internet. If the intercept ever fails, the call goes nowhere instead of carrying the job's token to a real host.
- **One constant.** The address is still defined once, `PLATFORM_HOST` in `apps/control-app/src/agent-container.ts`. The container's `PLATFORM_URL`, the intercept's address and `PlatformApi`'s host check all read it, and no copy of `10.0.0.1` is left in the control app's source.
- **New `container_network` log line.** The container logs it once at boot. It lists the container's interfaces, and `platform_addr_local` is true when the platform address is one of them or inside one of their subnets. It contains addresses only, no token.
- **Older tests.** BUG-385's and BUG-387's tests now read the constant instead of the hard-coded old address.

**Tests**
- The new tests in `tests/test_UAT_FC_BUG-390_platform_address_and_container_network.test.ts` pass, as do the BUG-385, BUG-387 and BUG-389 tests. The control app typechecks clean.
- In the REQ-646 container rig, the case where a real container calls the platform through the intercept passes on the new address.
- The rig's full-turn case fails with *"to contain 'The result of your Delegate call'"*. It fails the same way with my change reverted, and the run shows no failed platform calls, so it was failing before this ticket.

**On production:** deploy, then send "hello" in a builder. Workers Logs should show `platform_api_request` lines for the job, plus the `container_network` line. If calls still fail, that line shows what the container's own network looks like.

Commits: `19fa608675` (the fix) and `4add1fb106` (version 0.2.836), with story points set to 2.

<!-- xgd-chat-end -->