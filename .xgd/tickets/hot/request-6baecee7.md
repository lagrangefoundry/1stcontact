---
uid: request-6baecee7
id: REQ-360
type: request
title: No way to signal work-in-progress to the client, so long build pauses read
  as the session having died
created_by: xgd
created_at: '2026-10-02T16:01:11.787508+00:00'
updated_at: '2026-10-02T22:46:55.137316+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-aba7cf65
---

## What I was trying to achieve

Keep a non-technical client oriented across a consultation that mixes short conversational exchanges with long stretches of construction.

## What stopped me

A turn is atomic from the client's point of view: nothing I produce reaches them until the turn completes. When a turn includes commissioning construction, that turn can run for tens of minutes. The client sees nothing for the whole of it, and then receives everything at once.

Observed in a real session, reported by the operator in review:

- A ten-minute silence after an opening exchange. The operator described it as "super confusing" following a flurry of activity.
- A later gap of over half an hour. The operator went to bed during it, and returned to two long pages of text to read in one sitting.

The two failures compound: the silence gives no evidence the session is alive, and the arrival is a wall of text because everything accumulated during the silence lands together.

## Why this is not a prompting problem

I can say "I'm going to go and build this now" — but only at the *end* of a turn, which means posting it, ending the turn, and waiting to be prompted again before I can start the work. That costs a full round-trip to transmit one sentence, and in a room with multiple participants it also consumes a turn in the rotation. The cheap, obvious thing — announce, then immediately continue working — is precisely what the turn model forbids.

So the workaround is available but expensive enough that it will reliably not be used, which is the same as not having it.

## What would have let me finish

Any of these, roughly in order of preference:

1. **A way to emit an interim notice mid-turn** — one line, delivered to the client immediately, without ending the turn. "Building the two variants now, back in about twenty minutes."
2. **An automatic working indicator** while a delegated build is running, showing that the session is active and roughly how long it has been going. This needs no cooperation from me and cannot be forgotten.
3. **Failing both**, a client-visible timestamp or activity marker so a silence is distinguishable from a crash.

Option 2 is the one I would build. It is invisible when things are fast, it cannot be skipped by a careless session, and it addresses the actual fear — not "how long will this take" but "is anything still happening".

## Related

Separately worth noting for whoever picks this up: the per-turn site snapshot and the standing note delivered with it have been persistently stale in this session — the snapshot reported an empty site at change 0 while the change log showed a fully built page, and currently reports change 74 while the log shows 78. I have worked around it by treating the change log as authoritative. If that is not already known, it is worth a ticket of its own; I have not filed one because I cannot tell from here whether it is a display lag or a genuine read-after-write problem.



## Investigation (2026-10-02)

**The premise is partly wrong.** In a 1-1 session, text is not held until the turn ends. The provider adapter yields each `text_delta` as it arrives (`lagrange-framework/components/ai/js/src/backends/api_tools.js:1093`). The control app forwards every event as an SSE frame (`apps/control-app/src/router.ts` `streamTurn`, ~6607). The panel draws each one immediately (webui-chat `applyEvent`). Prose written *before* a `Delegate` call therefore reaches the client at once.

The silence comes from the tool call, not from the turn. `runToolLoop` does `await executor.run(...)` (`api_tools.js:1145`), and nothing is yielded until the delegated build returns, which can take up to the 1800 s turn ceiling. The client panel has no visible working indicator: `is-busy` drives only the composer controls, and `tool_activity` fires only after a tool *finishes*.

**Option 1 (interim notice) mostly exists in 1-1 already.** "Announce, then delegate in the same turn" works today. The consultant believed it didn't. Two things remain:
- Priming should tell the consultant that prose before a tool call is delivered live. This is a 1stcontact prompt change.
- In a **room**, a member's own panel is not the output (REQ-197) and a successful `GroupSay` ends the round. A room member therefore cannot announce and then continue. That is a genuine gap, but only for rooms.

**Generalising `GroupSay` to 1-1 is not the right seam.**
- `GroupSay` goes through `manager.postTurn` (`manager.js:1622`), which claims the session's turn lease. The consultant's own in-flight turn holds that lease, so the call would wait 60 s and throw.
- Even with the lease, it records a *whole separate turn* interleaved inside the open one, which is the corruption the lease exists to prevent.
- It writes to the junction, not to the live per-turn SSE stream (`manager.promptStream` yields backend events directly, `manager.js:1050-1120`). The client would only see it after a reload or reattach.
- `group_surface.json` explicitly calls posting into a private session a category error (`not_a_room`).

**Recommended shape (upstream, lagrange-framework):** a per-turn **notice side channel** owned by `SessionManager.promptStream`.
- `manager.notify(sessionId, event)` pushes a `{kind: 'notice'}` event. The event is merged into the live turn stream and also appended to the junction as a new `NOTICE` record kind, so reattach and tail replay it. It is excluded from the reply text and archive fold.
- (2) The automatic indicator: `DelegationToolbox._runWorker` (`delegation_toolbox.js:919`) already runs a 100 ms stop-watch interval for the whole worker run. It records `startedAt` and emits a heartbeat notice (`elapsed_s`) at a configured cadence. No model cooperation is needed.
- (1) Optional `Notify(text)` op on the agent surface, for a model-authored one-liner on the same channel. This is useful mainly where prose isn't live (rooms, where it could also post a non-round-ending room contribution).
- webui-chat `applyEvent` renders a notice as one inline status line, with each heartbeat replacing the previous one.
- 1stcontact: grant the surface and add the priming line. `router.ts` needs no change, because it forwards any event kind.
