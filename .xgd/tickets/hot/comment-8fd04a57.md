---
uid: comment-8fd04a57
id: COMMENT-3275
type: comment
title: Comment on bug BUG-123
created_by: xgd
created_at: '2026-09-19T20:19:12.897093+00:00'
updated_at: '2026-09-19T20:43:47.869035+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-89d5930b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "ce15c823-3d32-41d7-bf8a-8d75059f2fa3",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="741d80a4-501c-443b-9fa8-114c1618f913-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T20:18:53.090988+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="741d80a4-501c-443b-9fa8-114c1618f913-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T20:43:47.371543+00:00" -->
#### Claude
I've read the ticket, both sides of the seam (upstream `webui-chat` BUG-58, this repo's `chat.js` / `api.js` / `router.ts`), and the origin's session contract. Starting the free-coding flow.

Now the implementation. First, restructuring `setSession` so the paint is reusable:

Now the recovery itself, plus the state and options it needs:

Now the constants, the `wait` seam, and the `reopen` transport documentation:

Now the file header and the stale transport comment:

Now the BUG-123 UATs:

Clean. Now the ticket body — recording the product decision and the behaviour the UATs pin:

Done. BUG-123 is at `free_coded`, version `0.2.288`, branch merged and cleaned.

## What I built

**The chase** (`builder/chat.js`). `onTurnLost` is wired at mount. A turn reported lost now: pauses, re-reads the conversation, and recovers on what the origin says — `live` → `streamChatReattach` into `resume()`, which adopts the lost bubble so the reply is one message with the notice removed; not `live` → repaint the whole conversation from the fresh transcript.

**`paint` split out of `setSession`** so the repaint is the existing painting path, not a second one that can drift from the unsent rescue (BUG-122) and interrupted notice (BUG-121).

**`options.reopen`** — a top-level option, *not* part of `transport`, on the split REQ-127 already draws: the pane holds a session id and `/api/ai/session` doesn't take one. `app.js` wires `openSession(currentSite)` and `openSettings()`. A host with no `reopen` is unchanged but no longer silent.

**Two bounds, two failures**: a backoff ladder `[400, 1500, 4000]ms` for an origin that won't answer; a chase budget of 3 for a rejoin that keeps dying. Refilled by a prompt. Both awaits are guarded against a conversation switched away from *and* a composer the operator has already used again — BUG-58 releases it, so that race is ordinary.

**The transport seam was not tightened.** Point 1 offered it as optional; I declined and corrected the stale `readEventStream` comment in place instead. `webui-chat` already knows what a terminal frame is; re-deriving the predicate in the parse would be a second definition of "a turn ended" to drift — the failure BUG-64 is named for.

## The constraint, decided

**Abort-on-abandon stays.** The junction is RAM, so a turn can't honestly outlive its isolate (that's EPIC-19's Durable Object), and a turn that survives every reader is one nothing can stop. "Walking away is lossy" stays true deliberately; "reload is lossy" is what this removes, by making the reload unnecessary.

The visible consequence, which the UATs pin: a chase often finds `live: false`, because the dying socket is what aborted the turn. That's the correct outcome — the fresh transcript carries the partial plus BUG-121's own notice, which says the true thing better than a second sentence would. A successful chase adds no narration; the panel speaks only when it genuinely failed.

## Supersession

BUG-46's `a_failed_rejoin_costs_the_tail_and_nothing_else` asserted the pane says *nothing* when a rejoin fails. BUG-123 reverses that and the test is renamed and rewritten — silence is exactly what left reloading as the only move. Recorded loudly in the ticket body.

## Evidence

7 new UATs in `tests/test_UAT_FC_BUG-123_a_lost_stream_is_rejoined.test.ts`, mounted against the real `webui-chat`. Full `node` project: **3914 passed / 3 failed**, against an `xgd-working` baseline of 3909 / 8 — every failure pre-existing and confirmed on the baseline.

## One thing needs you

**`webui-chat` with BUG-58 is not installed on this machine** — the shared store still holds a pre-BUG-58 copy, so the new suite skips here. Please run, in `lagrange-framework`:

```
bin/install --lang js --component all
```

I can't: `bin/install` writes `/Users/martin/lagrangefoundry/node_modules`, outside the sandbox. To get real evidence I staged the upstream source into the store's resolution path, verified all 7 UATs pass, verified the skip path still works with it removed, and then removed it — nothing is left behind.

The suite gates on a **capability probe**, not `WEBUI_INSTALLED`: that flag is presence-only and a stale copy simply ignores `onTurnLost`, which would fail every assertion for a reason that isn't a defect here. So until you install, you'll see 7 skips and a console warning naming that command — not a red suite.

<!-- xgd-chat-end -->