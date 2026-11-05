---
uid: comment-a82f9e3a
id: COMMENT-5865
type: comment
title: Comment on bug BUG-320
created_by: xgd
created_at: '2026-10-31T20:43:13.401561+00:00'
updated_at: '2026-10-31T21:07:32.195975+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-81a31dab
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a7c3888e-08f7-490d-89ad-1f317c09b340",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="27e8a7fe-b491-406f-9593-991946cb0155-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T20:42:12.832882+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="27e8a7fe-b491-406f-9593-991946cb0155-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T20:45:44.591532+00:00" -->
#### Claude
Reading the code behind the ticket's four fixes before deciding what to ask; starting with `carryOnOwed`.

Fix 1 (`carryOnOwed`) is a small, contained change. Next I'm checking how builders currently run inside a Delegate, since fixes 2–3 look architectural.

I've read the ticket and the code, and I have a few questions before writing anything. Nothing is changed yet: no branch, no edits, and the ticket is still at `draft`.

**What I found**

- **Fix 1 (automatic carry-on refused):** this is small and stays in this repo. `carryOnOwed` (`tools/generate/src/cli/ai/host-core.ts:6014`) only looks at the session's last non-fork `turn_start`. If a talker round's `turn_start` lands after the lost turn's, the check looks at that round, which ended normally, so the route answers 409. The fix is to find the most recent turn closed `lost` and check that no real turn has started since. Talker rounds and similar quick replies don't count; a stop, refusal, error or a later carry-on still blocks it. I'll confirm the hypothesis by writing the UAT first and watching it fail as the incident did.
- **Fixes 2 and 3 (memory) are a different size of job.** Right now a consultant turn runs inside the front Worker's `POST /api/ai/prompt` request. The only Durable Object is `SessionJunction`, which just stores the log. `Delegate` and its parallel builders run inside that same request through the framework's `delegation_toolbox.js` in `lagrange-framework`. "Turns don't run in the front Worker's isolate" therefore means a new Durable Object that hosts turns, with the panel's stream, REQ-483's held rounds, stop and reattach all moved behind it. "Each builder in its own invocation" also means either changing how the framework's Delegate runs builders, or having the host replace it.

**Questions**

1. **Scope.** Should fixes 2 and 3 be done in this ticket? I'd estimate the Durable Object move alone at well over 20 points, which is the free-coding limit. My suggestion: land fix 1 (and fix 4 if you want it) here now, and treat 2 and 3 as a designed change. You prefer fewer tickets, so you choose: keep it all here, or file it separately.
2. **A stopgap.** Running Delegate's builders one after another would probably have prevented this incident, but it wouldn't meet fix 3, and a three-page build would take about three times as long. Do you want that as an interim mitigation, or should we wait for the proper isolation?
3. **Framework side.** If builders are to run in their own invocations, should I file a ticket in `lagrange-framework` for a Delegate that hands each builder to a host-supplied runner? Per your cross-repo rule, that would be a ticket only, no code from this session.
4. **Isolation fact for fix 3.** From memory, not yet checked against current docs: Durable Objects do separate a turn from the front Worker's requests, but two Durable Object instances of the same class may share an isolate, and its 128 MB. If so, one-object-per-turn protects other users' front requests but not necessarily another turn that lands in the same isolate. I'll confirm this against the docs and record it on the ticket either way. Is "never kills a front request" enough for now, or do you also need turn-from-turn isolation?
5. **Fix 4.** Reading Cloudflare's `exceededMemory`/`exceededCpu` verdict when a lost turn is found means the Worker calling the Cloudflare Workers Observability API. That needs an API token stored as a Worker secret, plus a delay because logs arrive late. That isn't cheap, so my default is to leave BUG-312's pointer to Workers Logs. Is that OK?

If you just say "fix 1 now, the rest later", I'll start: cut the branch, write the failing UAT, fix it, and take it through to `free_coded`.

<!-- xgd-turn id="dae770fc-2258-4fc5-a66a-5c03dadc6f93-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T20:46:38.526423+00:00" -->
#### You
please complete the free-coding of this ticket

<!-- xgd-turn id="dae770fc-2258-4fc5-a66a-5c03dadc6f93-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T21:07:27.599670+00:00" -->
#### Claude
Reading the existing BUG-312 tests so the new UAT can follow the same pattern.

The new UAT fails earlier than expected: the session open doesn't report the dead turn at all. Tracing how `failed` is computed.

Missing the dead turn's `turn_log` row (the BUG-312 helper inserts one). Adding it.

Hypothesis was wrong: talker rounds carry `fork_of`, which `carryOnOwed` already skips. Reading the router's 409 path to find the real reason.

`carryOnOwed` swallows any exception as `false` → 409, so the cause could be several things. Checking Workers Logs for the real records rather than guessing.

The 409 came ~1s after the reattach, in 52 ms. Checking whether the reattach actually wrote the `lost` turn_end before the cue arrived.

I'll reproduce it with a junction whose write of the `lost` turn_end is slow: the cue then arrives before the end is durable, exactly as in production.

Red for the right reason. Quickly confirming the cue itself gets the production 409 when that assertion is skipped:

Reproduces the production 409. Now the fix in `tailSession`: hold the stream's `lost` end until the close is flushed.

Green. Running type-check/lint and the panel-side suites.

Clean. Checking this repo's version-bump convention before committing.

Fix 1 is done and green. Before committing, checking whether the host can control builder parallelism from this repo (fix 2), since the framework is off-limits for code.

Before choosing serialisation for fix 2, checking what the stall deadlines count as progress: a Delegate queued behind another builder must not be abandoned as stalled.

A docs-reading agent is checking Cloudflare's isolate-sharing rules for Durable Objects in the background. Meanwhile, committing fix 1.

Fix 1 committed. For fix 2, the gate has to open on BUG-296's turn-end release as well as the framework's `finally`. Otherwise a wedged builder would block every later one. Reading that code.

There's already a `max_concurrent` knob in `delegation.json` that tells the consultant how many builders may overlap. Checking whether anything enforces it.

Red as expected: both builders are open together under the shipped config. Applying the config change and updating its documentation:

Many suites use the shipped document. Finding those that pin parallel builders or the "Up to 3" priming line:

Running every suite that touches delegation, both configs, to see what the shipped value change affects.

15 failures. Some may already fail on a clean tree (pre-existing). First, why my own UAT still fails, then a baseline of the others without the config change.

All 14 fail identically at `max_concurrent: 3`, so the config change didn't cause them. That baseline still contained fix 1, so I'm re-running two of them with fix 1 reverted to rule it out.

Same failures without fix 1, so they're pre-existing on the base. Now the BUG-320 UAT, the concurrency suites, and the node-side delegation/priming suites:

The workers suites pass. Seventeen node failures sit in unrelated areas (REQ-340 change record, BUG-39, BUG-219); baselining them with both of my changes reverted:

The same 17 fail on the base. One file appeared only in my run; checking it alone with my changes:

Also fails on the base, so every failure is pre-existing. Committing fix 2.

Updating the ticket body. Re-reading it first in case it changed during the build.

Unchanged since my status update. Writing the body: the original symptom is kept, root cause 2 is corrected, and each fix says what landed.

Ticket updated. Now the merge-back sequence: lock, bring `xgd-working` into the branch, bump the version at the tip, then fast-forward.

Tickets only, so no code drift. Bumping the version on the branch:

Fast-forwarded. The printed rematerialize path doesn't exist, so I'm using the CLI form from the docs:

Nothing to rematerialize. Moving the ticket to `free_coded`:

Ticket is `free_coded`. Cleaning up the branch.

BUG-320 is at `free_coded`, merged into `xgd-working` as version 0.2.715. It fixes the automatic carry-on and runs builders one at a time. Fixes 3 and 4 are not done; the ticket explains why.

**Fix 1: the automatic carry-on is no longer refused.** My earlier guess about talker rounds was wrong: they're marked `fork_of`, and `carryOnOwed` already skips those. Workers Logs showed the real cause:
- The reconnected stream found the turn dead at 20:21:26.950.
- Writing the `lost` close to the session's junction (Durable Object) ended **`canceled`**. The stream had told the panel "lost" before that write finished. The stream then closed, the request ended, and the write died with it.
- The panel's cue at 20:21:28 read the junction, found the turn still open rather than lost, and got the 409.

The fix makes the stream wait for that write before telling the panel (`tailSession` in `host-core.ts`). The new UAT reproduces the exact production 409 before the fix and passes after it.

**Fix 2: builders run one at a time.** The shipped `delegation.json` now has `max_concurrent: 1`, replacing REQ-397's shipped `3`. This setting already controls how many Delegate calls in one reply run at once, and the consultant is already told "Builders run one at a time." when it's 1. So it's a config change, not new code. I based the choice on this incident: one builder ran eight minutes without trouble, three at once died within two and a half. A multi-page Delegate now takes about the sum of its builders' times. A UAT checks this with the shipped config, and REQ-397's test now expects `1`.

**Not done:**
- **Fix 3 (a turn's memory kept apart from other users' requests).** Cloudflare's docs say one isolate can host several Durable Objects of the same class "along with the surrounding Worker code, and they all share that isolate's memory." So moving turns into a Durable Object wouldn't give them their own memory. Real separation means running turns in a separate Worker script, which is an architectural change well beyond free-coding. Fix 2 limits the damage meanwhile.
- **Fix 4 (Cloudflare's own verdict in the turn log).** It would need an API-token secret and a delayed log query, so the existing pointer to Workers Logs stays.

**Tests:** both new UATs pass, and so do the BUG-294, BUG-312, REQ-397, REQ-410 and REQ-411 suites. 14 Worker-runtime and 17 node failures in nearby delegation and priming suites fail identically without my changes.

**Decision for you:** fix 3 is only recorded on BUG-320. If you want it tracked, say whether to keep it on BUG-320 or file a separate design ticket. If it stays and BUG-320 goes to reconcile, reconcile may expect code for it.

I also saved a memory note that Durable Objects share isolate memory.

<!-- xgd-chat-end -->