---
uid: comment-3af04fc1
id: COMMENT-2311
type: comment
title: Comment on bug BUG-64
created_by: xgd
created_at: '2026-09-07T23:23:28.725771+00:00'
updated_at: '2026-09-07T23:56:07.268188+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-944e2269
  kind: chat_transcript
---

<!-- xgd-turn id="05913d49-5cf2-4020-8fac-8df6a63bbcf6-user" -->

<!-- xgd-chat role="user" ts="2026-09-07T23:20:35.354089+00:00" -->
#### You
I am logged in as myself. On the Site tab. Chat window shows the STOP button (without any invocation - that's not right). Entered text appears in a bubble - but there is no response

<!-- xgd-turn id="05913d49-5cf2-4020-8fac-8df6a63bbcf6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-07T23:29:13.298695+00:00" -->
#### Claude
Root cause found. Let me scope the ticket before touching code.

I've scoped the ticket. Here's what's wrong:

**`live` is `true` for every session, always.** In `tools/generate/src/cli/ai/host-core.ts:813`:

```js
const live = deps.lib.closedPrefix(records).length !== records.length
```

`closedPrefix` returns a **number**, not an array. `.length` on a number is `undefined`, and `undefined !== records.length` is true for any non-empty log. The library is loaded untyped, so nothing caught it.

Everything you saw follows from that one value: `chat.js` sees `live: true` and calls `chat.resume(...)` → composer enters streaming state → **STOP button**. `mountChat`'s submit is `streaming ? queue(md) : send(md)`, so your message is **queued behind a turn that doesn't exist** — the bubble is the queue rendering, not a request. And `/api/ai/reattach` tailing a quiet junction returns only when `watch`'s `timeoutMs` elapses: **10 minutes**.

Introduced by BUG-46; its UATs only test the case where a turn *is* open, where the wrong answer is accidentally right.

The fix: `manager.transcript()` already returns `live`, computed correctly upstream (`closedPrefix(records) < records.length`) — and its doc comment describes this exact failure. `storedTranscript` re-derived, from a second read of the same log, a fact the call it had just made had already answered.

Shall I cut the branch and land it? It's a small fix plus UATs pinning both directions (quiet → not live, mid-turn → still live).

<!-- xgd-turn id="9c405f0e-07c5-4927-87af-25643fce0458-user" -->

<!-- xgd-chat role="user" ts="2026-09-07T23:43:02.061832+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="9c405f0e-07c5-4927-87af-25643fce0458-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-07T23:56:07.007216+00:00" -->
#### Claude
No blocking questions — the contract is settled upstream: `manager.transcript()` already returns `live`, so this is a deletion of a wrong re-derivation, not a new mechanism. Cutting the branch.

Now the fix:

Now the client half — confirming the panel's behaviour where the operator meets it. Let me check the existing panel tests:

Now the workers UAT:

Now the panel-side UAT — the operator-visible half:

Now let me run both suites — first confirming they fail against the unfixed code.

The queue is worse than I described: `chat.js` passes no `onQueue`, so `mountChat` defaults it to a no-op — the queued message is **never sent at all**, not merely delayed. Correcting the test and the ticket.

Now the crucial check — that these fail against the unfixed code:

2 of 4 fail on unfixed code — and the first-open case passes either way, because a brand-new session short-circuits through the `null` path. That's a real finding: the symptom only appears from the *second* page load onward. Restoring the fix and making the test comments honest about which ones carry the evidence.

Now the regression check — BUG-46's suites and the other chat/session tests:

Now updating the ticket body so every UAT traces to ticket language — including the two findings that emerged during implementation:

Now the full suite, to make sure nothing else moved:

4 of the 5 fail identically on the main checkout — pre-existing. The 5th is the knowledge-base suite, which failed only in the worktree because `1c assets` reported the KB not built. Confirming that:

All 5 failures are pre-existing or environmental — none from this change. Now committing:

Landed on `xgd-working` at `0.2.131`. BUG-64 is `free_coded`.

## The bug

One expression in `tools/generate/src/cli/ai/host-core.ts`:

```js
deps.lib.closedPrefix(records).length !== records.length
```

`closedPrefix` returns a **count**, not an array. `.length` on a number is `undefined`, and `undefined !== n` is always true — so `live` ("a turn is open, reattach") was true for **every session that had any records at all**, from the day BUG-46 wrote it. The AI library is loaded untyped, so nothing objected.

Everything you saw follows from that one boolean. The panel did as it was told: reattached, and put the composer into the streaming state a turn in progress calls for — the STOP button. `mountChat` submits with `streaming ? queue(md) : send(md)`, so your message was queued.

## Two things I got wrong in scoping, corrected during implementation

**The message is dropped, not delayed.** I said it was queued for ten minutes. `queue` hands the text to a host `onQueue` callback, and `chat.js` supplies none — so `mountChat`'s no-op default takes it. The text is accepted, rendered as a pending bubble, and goes nowhere permanently. Waiting would never have delivered it. The ten minutes is only how long the composer stays gated.

**A brand-new site was never affected.** It has no junction and no archive entry, so `storedTranscript` returns `null` and `live` takes its `?? false` default — the broken derivation is never reached. You meet this from the *second* page load onward, which is why it presents as "the builder is like this" rather than as something you did.

## The fix

`manager.transcript()` already computes this predicate, on the exact records it folded, and its doc comment describes this exact failure ("a reload landing *between* turns would gate its composer for ten minutes"). `storedTranscript` was re-deriving, from a second read of the same log, a fact the call it had just made had already answered. Now it takes the answer; `logFor` and `closedPrefix` leave the module.

## Tests

Two suites, split like BUG-46's — 7 tests. Verified: **2 of the 4 origin tests fail against the unfixed code**. Both directions are pinned (mid-turn must still report `live: true`, or the fix silently undoes BUG-46), plus the false→true→false cycle across one conversation, since only a value that *changes* is an answer rather than a constant.

Full suite: 3103 passed, 5 failed — 4 fail identically on `main` (pre-existing), and the 5th was the worktree's unbuilt KB, which passes after `1c kb build`.

## One thing I left alone

`chat.js` wires no `onQueue`, so **Queue is silently a no-op in the builder** — press Queue during a real turn today and the text is accepted and dropped. That's a separate defect this fix doesn't touch (with `live` correct you no longer hit it accidentally). I asserted the behaviour rather than changing it, and didn't file a ticket since you hadn't asked for one — say the word if you want it raised.

<!-- xgd-chat-end -->