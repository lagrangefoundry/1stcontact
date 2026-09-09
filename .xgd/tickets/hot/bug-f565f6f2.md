---
uid: bug-f565f6f2
id: BUG-66
type: bug
title: '1st Contact chat: assistant replies to the previous turn — final assistant
  message never recorded in backend state'
created_by: martin-github@westhead.me
created_at: '2026-09-09T03:04:44.845566+00:00'
updated_at: '2026-09-09T03:21:41.346216+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d6b94786
  severity: high
---

## Symptom

In the 1st Contact chat (`chat-5c9fd79b`, site-1stcontact), the assistant
intermittently replies to the *previous* user message rather than the newest
one — while still absorbing some of the newest one. The operator hit this twice
in quick succession and said so in-band:

- `03:00:51Z` — *"Wait something got tangled there, it sounds like you were replying to my previous turn"*
- `03:04:29Z` — *"Wait, again you missed my last turn"*

The transcript is intact: every user message and every assistant reply is
recorded in the `chat_transcript` comment, in order, with matching turn ids.
Nothing was lost on the way in. What went wrong is what was **sent to the
model**.

### The two reported turns

| Turn id | User at | What the reply actually answered |
|---|---|---|
| `977ff1e95b4a…` | 02:59:18Z ("ok lets build on B — characterise the AI more") | Re-answered the **02:57:23Z** message ("turbo charge is generic", "_Not X. A Y._ is exhausted") *and* folded in the 02:59 ask ("builds on your consultants idea") |
| `ff93b20c4e2b…` | 03:03:17Z ("D but again AI consultants, right?") | Re-offered the headline options it had **already** offered at 03:02:35Z, as if that reply had never happened |

Both replies read as *"user said N-1 and N back to back, assistant said nothing
in between"* — which is exactly what the model was sent.

## Root cause

`runToolLoop` in `lagrange-framework/components/ai/js/src/backends/api_tools.js`
never records the **final** assistant message into the backend's own
conversation state.

```js
// api_tools.js ~line 400
if (!sawTool) {
  yield doneEvent()
  return                            // <-- returns WITHOUT wire.record(...)
}
if (emittedText) separatorPending = true
wire.record(state, raw, outcomes)   // only reached when a tool call ran
```

`wire.record()` (line 509) is the **only** place `{role:'assistant'}` is ever
pushed onto `state.messages`:

```js
record(state, raw, outcomes) {
  state.messages.push({ role: 'assistant', content: raw.content })
  state.messages.push({ role: 'user', content: /* tool_result blocks */ })
}
```

so the iteration that ends a turn — by definition the one with no tool call —
drops its prose. Confirmed empirically by driving `runToolLoop` with a stub wire
on a prose-only turn: `state.messages` comes back holding only the user message.

`ClaudeAPIBackend` (`backends/claude_api.js`) keeps `state.messages` per
`backendRef` for the life of the isolate and only re-seeds it from the manager's
window on a **cold** segment:

```js
if (!state.messages.length && window.length) { /* seed from window */ }
state.messages.push({ role: 'user', content: … })
```

So on any **warm** turn the wire payload is:

```
… user(N-1)      <- assistant(N-1) missing
   user(N)
```

The model does the only sensible thing with two consecutive user messages: it
answers the older one and mixes in the newer. Every turn that used a tool is
partially protected (those iterations *are* recorded); pure-conversation turns —
which is all of the copywriting stretch from 02:57 onwards — are not.

### Why it looked intermittent

A **cold** segment repairs itself: `window` is folded from the archive, which is
complete and correct (verified — parsing the stored session file yields all 71
turns in order, and `window()` returns all of them). So a turn that lands on a
fresh isolate is correct, and the next warm turn on that isolate is wrong. In
`wrangler dev` isolate churn is unpredictable, which is what makes this look
sporadic rather than constant.

The remaining "correct" replies in that stretch were correct because the operator
had restated the whole context in the message itself (03:00:51, 03:02:32,
03:04:29 all re-state what was decided) — self-contained prompts mask a missing
history. The assistant's own 03:05:25 reply, *"You're right, and I've been losing
the thread"*, is the model reporting the same defect from the inside.

## Scope

The defect is in **lagrange-framework**, not in this repo:
`components/ai/js/src/backends/api_tools.js`. It affects
`ClaudeAPIBackend` and, identically, `ChatGPTBackend` — both wires expose
`record()` and both are only called on the tool path.

A second, smaller inconsistency sits next to it: the re-seed guard is
`!state.messages.length` in `claude_api.js` but `state.messages.length <= 1` in
`chatgpt.js`.

## Fix (not yet applied — needs a ticket in lagrange-framework)

Record the terminating assistant message before returning:

```js
if (!sawTool) {
  wire.record(state, raw, [])   // assistant message, no tool results
  yield doneEvent()
  return
}
```

`record()` currently pushes a `tool_result` user message unconditionally, so it
needs to skip that second push when `outcomes` is empty — otherwise a prose-only
turn appends an empty user message. The aborted path (`if (aborted)`) needs the
same consideration: a partial reply is already durable on the junction, so the
backend's own state should agree with it.

## Test plan

To be written against lagrange-framework's UAT suite: drive a session through two
prose-only turns on one warm segment and assert the second request's message list
alternates user/assistant and contains the first reply verbatim.


---

## Resolution — `wont_fix` (upstream)

Not fixed here, because there is nothing here to fix. The defect is entirely in
the AI component's API backends, and 1stcontact only observes it: this repo's
host, junction, archive and transcript all handled the conversation correctly —
the stored session file holds all 71 turns in order, and the window folded from
it is complete. What went wrong happened inside
`components/ai/js/src/backends/api_tools.js`, below the seam this repo consumes.

Filed upstream as **lagrange-framework BUG-48** (`bug-2e9b56fa`) — *"API backends
drop a turn's final assistant message: a warm segment sends the model two
consecutive user turns"* — carrying the full diagnosis, the required behaviour
and the test plan.

No code, branch or UAT in this repo.

**When the fix lands upstream**, 1st Contact picks it up with the AI component
bump; nothing in `tools/generate/src/cli/ai/` or `apps/control-app/src/ai.ts`
needs to change. Worth re-running the same conversation shape afterwards — two
prose-only turns back to back on a warm isolate — to confirm the reply tracks
the newest message.
