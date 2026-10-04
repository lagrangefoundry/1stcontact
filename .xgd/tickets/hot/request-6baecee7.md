---
uid: request-6baecee7
id: REQ-360
type: request
title: No way to signal work-in-progress to the client, so long build pauses read
  as the session having died
created_by: xgd
created_at: '2026-10-02T16:01:11.787508+00:00'
updated_at: '2026-10-04T12:38:15.352979+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-aba7cf65
  commits:
  - working_sha: 302d79e26b09db3e05e4379bb2d8f0c488777084
    reconcile_sha: null
    main_sha: null
  - working_sha: 5f4baee11d6c5216b1201da29f3e7682268cb57b
    reconcile_sha: null
    main_sha: null
  version: 0.2.477
  story_points: 3
---

> **Status: built (2026-10-04).** lagrange-framework REQ-205 landed. The 1st Contact side is the build heartbeat; see "As built" at the end. The interim notice turned out to be covered already by REQ-379, so `GroupSay` is not granted to the 1:1 consultant.


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


## Revised assessment (2026-10-02, after reading lagrange-framework EPIC-7)

The investigation above dismissed generalising `GroupSay` to 1:1. That was wrong. Its objections were lease contention, a separate turn interleaved into the open round, and the post not reaching the live stream. EPIC-7 (interposition) has to solve the inbound version of exactly those problems, and its decisions resolve them:

- **Storage.** A mid-round contribution is a content record stored *inside* the open round at its position (EPIC-7 §16, REQ-200). It is not a new turn.
- **The lease.** The caller already holds the lease, so there is no wait.
- **Live delivery.** The record is yielded live after the call returns, before the next long tool call. REQ-201's split-round display renders it.

So the interim notice is the outbound mirror of interposition, and one `GroupSay` works the same in a room or a DM. That satisfies EPIC-7 §13.3(a), behaviour that names no role.

**Filed upstream:** lagrange-framework REQ-205 (`request-4fee9d24`).
- Part A: `GroupSay` targets the caller's own 1:1 session mid-round, with a keep-the-round-open flag for rooms.
- Part B: a host-generated heartbeat during delegated builds. This is option 2 here.
- It depends on lagrange-framework REQ-200 and REQ-201, which are still `draft`.

**No code lands against REQ-360 until lagrange-framework REQ-205 lands.** What remains here afterwards:
- grant the tool to the consultant role;
- add a priming line, "say it, then carry on";
- style the heartbeat line.

Separately, and available today: in a 1:1 session, prose written before `Delegate` already reaches the client live. A priming line saying so would help immediately.



## Held: waiting on lagrange-framework EPIC-7 §17 (2026-10-02)

The requirement and the current gaps are now recorded upstream as lagrange-framework EPIC-7 §17, the outbound addendum to interposition. The build is lagrange-framework REQ-205, step 4 of EPIC-7 §16, after REQ-200 and REQ-201. Its heartbeat half could be pulled forward.

REQ-360 holds only the 1st Contact side, which stays parked at `draft` until EPIC-7 delivers the infrastructure:
- grant the generalised `GroupSay` and heartbeat to the consultant role;
- priming: say it, then carry on;
- style the heartbeat status line in the builder chat.



## Unblocked: lagrange-framework REQ-205 landed (2026-10-04)

REQ-205 is at `ready_to_reconcile` upstream and is in the shared `@lagrangefoundry/ai` store (`keep_round_open`, `manager.interim`/`progress`, `PROGRESS_TEMPLATE`). As built upstream:
- `GroupSay` naming the caller's own conversation mid-round writes an `interim` content record inside the open round. The round's `promptStream` yields an `interim` event when the tool returns, and `manager.watch` yields the record.
- During a delegated build, `DelegationRuntime` writes a `progress` control record every `progressIntervalMs` (default 60 s): `still working, elapsed N min`. Only `manager.watch` yields it. The round's own `promptStream` is blocked inside the `Delegate` call and yields nothing.
- `webui-chat` ignores both `interim` and `progress` event kinds.

## As built (2026-10-04)

### Scope change from the plan above: the heartbeat only

The plan above also had a 1:1 `GroupSay` grant and a "say it, then carry on" priming line. Neither was built. REQ-379 (`1fc49e8223`, landed 2026-10-03 after this ticket was parked) already covers option 1 for the case that matters:
- `Delegate` takes a required `note`.
- The host shows it to the client as a status line *before* the build runs, guaranteed by `cadence-core.ts`'s `keepClientOriented`, not by priming.

A `GroupSay` on the consultant's own conversation would be a second, model-optional way to say the same thing in the same place. So the thing left missing was option 2, a sign of life *during* the build, and that is what was built. Group-chat rooms are out of scope: in a room, the consultant's round already continues after a `GroupSay`, because its room runtime carries no `sessionId`, and room heartbeats would need the room panel's exchange stream.

### What the client sees

While a delegated build runs, the builder chat shows one muted status line between the conversation and the composer:
- **Text.** `still working, elapsed N min`, the framework's fixed text.
- **Cadence.** Every `progress_seconds` (default 60), with each new line replacing the last.
- **Clearing.** The line disappears as soon as anything else arrives (the build came back and the assistant is talking) or the stream ends by any route: `done`, a dropped connection, an error.
- **Short builds.** A build that finishes inside one interval shows nothing.
- **Reload.** A client that reloads mid-build gets the latest figure on rejoin.
- **Record.** Heartbeats never appear in the reply bubble or the stored transcript.

### How

- **Config: `delegation.json` / `delegation.ts`.** New key `progress_seconds`: a number of seconds, 0 or more. Absent means `DEFAULT_PROGRESS_SECONDS` = 60, and `0` turns the heartbeat off. Anything else (a string, a negative number, null) is refused by name as `DelegationConfigError`. The value is passed to `lib.DelegationRuntime` as `progressIntervalMs`.
- **Live stream: `progress-core.ts` `withProgress`.** It wraps the site turn's `manager.promptStream` in `host-core.ts` `streamPrompt`.
  - It reads the session junction forward from where the turn started, on `manager.pollIntervalMs`, while the turn's stream is pending.
  - Each new `progress` record becomes a `{kind: 'progress', content, meta: {elapsed_s}}` event; a batch holding several yields only the latest.
  - Records are drained before the pending event is passed on, so heartbeats precede the `Delegate` result's `tool_activity`.
  - A consumer that walks away mid-build is noticed at the next heartbeat. The pending step is still allowed to finish before the turn's stream is closed, which keeps the turn's existing end-of-turn semantics.
- **Reattach: `tailSession`.** Projects `progress` records the same way. `manager.watch` already serves only the current one.
- **Panel: `chat.js` `withProgressLine`.**
  - Wraps the prompt stream and both reattach streams.
  - `progress` frames go to a single `div.builder-chat-progress` (`role="status"`, `aria-live="polite"`), placed after `.chat-widget-messages`, and are never forwarded to `webui-chat`.
  - `builder.css` styles it as a muted italic line with a pulsing dot. The dot holds still under `prefers-reduced-motion`.

### UATs

`tests/test_UAT_FC_REQ-360_build_heartbeat.workers.test.ts`, through the Worker's `route` with a real D1, sessions and delegation surface. The only double is the Anthropic client, with the worker held open:
- a held build streams ≥3 `progress` frames on `/api/ai/prompt` before the `Delegate` result, each matching the framework text with a numeric `elapsed_s`, and the turn ends normally;
- after the turn, the reopened transcript has the reply and no `still working`;
- a client that reloads mid-build gets a heartbeat on `/api/ai/reattach`, and the tail ends with `done`;
- with the shipped 60 s cadence, a build that returns at once produces no `progress` frame;
- `progress_seconds` ships at 60, is 60 when absent, accepts 0, and refuses `"60"` / -1 / null by name;
- `progress_seconds: 0` produces no `progress` frame even when the build is held.

`tests/test_UAT_FC_REQ-360_progress_line.test.ts`, jsdom against the installed `webui-chat`:
- one status line placed after the messages; the second heartbeat replaces the first; the next text clears it; the reply holds no heartbeat text;
- a stream that ends mid-build with no `done` leaves no line behind.

Mutation-checked: disabling the merge in `withProgress` fails the three live cases, removing the `tailSession` projection fails the reattach case, and removing the panel wrapper fails both panel cases.