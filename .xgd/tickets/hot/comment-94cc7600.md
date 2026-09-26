---
uid: comment-94cc7600
id: COMMENT-3952
type: comment
title: Comment on bug BUG-149
created_by: xgd
created_at: '2026-09-25T23:52:22.778571+00:00'
updated_at: '2026-09-26T06:50:34.435146+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-3625c6ff
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d1f062c9-c201-4b47-adad-b31b5944dcb5",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="cc75967a-ad2b-4d16-81e9-1cb23112428a-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T23:51:16.657244+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="cc75967a-ad2b-4d16-81e9-1cb23112428a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T00:17:12.772776+00:00" -->
#### Claude
Ticket is detailed and the diagnosis is precise. Let me start the protocol and then probe one design question empirically.

Now let me probe whether the workers test pool can reproduce a real cross-request boundary.

Now the fix itself.

Now the UATs. First, a quick check that a Proxy over a real DO stub behaves.

Now the UAT file.

All five pass. Now the critical check — do they fail against the unfixed code?

Meanwhile, let me review the final diff.

While that runs, the ticket body.

A real finding in the test harness: `drain()` returns on the `done` frame, before the turn's `waitUntil` drain has settled. Let me model the request lifetime faithfully.

Now re-verify the pre-fix failure still holds with the stricter harness, then re-run the whole workers project.

I'll wait for that to complete. In the meantime, here's where things stand.

**The fix** (`apps/control-app/src/junctions.ts`, +144/−16):

1. **The stub is never held; the namespace is.** `DurableJunctionStorage` keeps the `JunctionNamespace` and the session id, and takes a stub per use — in `adopt()`, and in `queue()` at the moment a write is queued, which is inside the request whose turn appended it. The storage and its mirror still live for the isolate's life; only the handle is short-lived.

2. **Requirement 2 needed no new plumbing** — `streamTurn`'s `finally` already awaits `host.flush` inside its `ctx.waitUntil`, and `/api/ai/session` awaits it before answering; reattach writes nothing. It was the stub lifetime that violated the rule, not the drain placement.

3. **The retry arm of requirement 3, made lossless.** The "object is behind, push the tail forward" repair was gated on `adopted && epoch unchanged && object shorter` — which is precisely false in the state this bug produces. A new `behind()` predicate compares bytes instead: the object is pushed forward iff its stream is a strict prefix of the mirror. Sound with or without the flag, and it still cannot overwrite a divergent object.

4. The degradation log is now a transition (`RAM-only until…` / `durable again…`) rather than one line per prompt.

**One thing worth flagging.** The existing REQ-307 suite passed against a Worker that had already stopped writing in production, because `@cloudflare/vitest-pool-workers` serves a whole test file from one I/O context — I measured this, a stub captured in one `worker.fetch` is still usable in the next, and every REQ-307 case kills or reopens on the first request a session ever sees. So the new suite wraps the *binding* (the Durable Object underneath is real) to put workerd's request-scoping rule back, and passes a real `ExecutionContext` so a request ends when its `waitUntil` settles rather than at the `done` frame. Four of the five UATs fail against the shipped code; the fifth is the degradation path and must pass both ways.

Also seen in the first full-project run: `test_UAT_FC_REQ-260_an_undo_is_itself_a_change_and_can_be_undone` failed on a DNS-change id mismatch — unrelated to this change, and I'll confirm it's pre-existing before handing back.

Waiting on the full workers-project run (blocking waiter `bw0iwxzyz` is armed).

The run is still in flight (~3 minutes expected). I'll report as soon as the waiter fires.

<!-- xgd-turn id="bb97712b-1f14-4951-9765-a5bd2a9ffa15-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T06:50:33.068568+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-chat-end -->