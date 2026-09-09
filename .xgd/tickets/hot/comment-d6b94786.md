---
uid: comment-d6b94786
id: COMMENT-2320
type: comment
title: Comment on bug BUG-66
created_by: xgd
created_at: '2026-09-09T03:07:26.888512+00:00'
updated_at: '2026-09-09T03:21:57.406422+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-f565f6f2
  kind: chat_transcript
---

<!-- xgd-turn id="70db12a7-96ef-409e-ae9a-929f1069011a-user" -->

<!-- xgd-chat role="user" ts="2026-09-09T03:07:13.628311+00:00" -->
#### You
Please review the current transcript for 1st contact with Claude.

My prompts at 19.59 and the one at 20.03 both seem to have gotten lost - Claude seemed to be replying to the previous prompt. What's going on?

<!-- xgd-turn id="70db12a7-96ef-409e-ae9a-929f1069011a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-09T03:17:37.557866+00:00" -->
#### Claude
Found it — and it's provable from the code, not just inferred. Let me record the diagnosis on the ticket.

Your prompts weren't lost — they reached the model. What was lost was **Claude's own previous reply**, on the way back out to the model.

## What the record shows

Both messages are in the transcript, in order, with matching turn ids. So nothing dropped on the way in. But look at what each reply actually answers:

- **02:59:18Z** ("build on B — characterise the AI more") → the reply re-argues the *02:57* message ("turbo charge is generic", "_Not X. A Y._ is exhausted") **and** folds in your 02:59 ask ("builds on your consultants idea").
- **03:03:17Z** ("D but again AI consultants, right?") → the reply re-offers the headline options it had *already* given you 42 seconds earlier.

Both read as `user(N-1), user(N)` back to back with no assistant turn between them. That's because that is literally what was sent.

## Root cause

`runToolLoop` in `lagrange-framework/components/ai/js/src/backends/api_tools.js`:

```js
if (!sawTool) {
  yield doneEvent()
  return                            // returns WITHOUT wire.record(...)
}
if (emittedText) separatorPending = true
wire.record(state, raw, outcomes)   // only reached when a tool ran
```

`wire.record()` (line 509) is the **only** place an assistant message is ever pushed onto `state.messages`. So the iteration that *ends* a turn — by definition the one with no tool call — never records its prose. I confirmed it empirically: driving `runToolLoop` with a stub wire on a prose-only turn leaves `state.messages` holding just the user message.

`ClaudeAPIBackend` keeps `state.messages` for the life of the isolate and only re-seeds from the archive window when it's empty. So every **warm** turn ships a history with the previous reply missing.

## Why it looked intermittent

A cold isolate repairs itself — the window is folded from the archive, which is complete and correct (I parsed the stored session file: all 71 turns, in order, `window()` returns all of them). Wrangler's isolate churn is unpredictable, so it alternates.

The other replies in that stretch only *looked* fine because you restated the whole context in the message itself each time. The 03:05 reply saying *"I've been losing the thread"* is the model reporting the same defect from the inside.

Also worth knowing: turns that used tools are partly protected — those iterations do get recorded. Your whole copywriting stretch from 02:57 on was pure conversation, which is why it clustered there.

## Scope

The bug is in **lagrange-framework**, not this repo — and it hits `ChatGPTBackend` identically. There's a smaller inconsistency alongside it: the re-seed guard is `!state.messages.length` in `claude_api.js` but `state.messages.length <= 1` in `chatgpt.js`.

The fix is small (`wire.record(state, raw, [])` before the early return, plus making `record()` skip the empty `tool_result` push, plus the aborted path), but it needs its own ticket in that repo. BUG-66 is written up with the full diagnosis and the proposed fix — want me to go make that change in lagrange-framework?

<!-- xgd-turn id="bb6c7d23-6a35-40f3-80b1-e81f625d4175-user" -->

<!-- xgd-chat role="user" ts="2026-09-09T03:19:51.320145+00:00" -->
#### You
Please create an LF ticket for this bug and close this ticket with a reference as won't fix

<!-- xgd-turn id="bb6c7d23-6a35-40f3-80b1-e81f625d4175-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-09T03:21:56.977871+00:00" -->
#### Claude
Both done.

**lagrange-framework BUG-48** (`bug-2e9b56fa`) — *"API backends drop a turn's final assistant message: a warm segment sends the model two consecutive user turns"*, status `draft`, priority/severity high. The body carries the full diagnosis (`runToolLoop`'s `if (!sawTool) { yield doneEvent(); return }` skipping `wire.record`), the empirical confirmation, why it presents as intermittent, and four required behaviours:

1. Record the terminating assistant message, tools or not.
2. Don't append an empty `tool_result` message when there are no outcomes.
3. Record an aborted turn's partial reply — the deltas are already durable on the junction, so the backend state must agree.
4. Make `claude_api.js` and `chatgpt.js` state the same re-seed rule (`!state.messages.length` vs `<= 1`).

Plus a UAT plan covering both backends and the stopped-turn case.

**1stcontact BUG-66** — status `wont_fix`, with a Resolution section appended (original diagnosis preserved) pointing at LF BUG-48 and noting that nothing in `tools/generate/src/cli/ai/` or `apps/control-app/src/ai.ts` needs to change; 1st Contact picks the fix up with the AI component bump. No branch, no code, no UAT in this repo.

One thing to flag: LF BUG-48 is sitting at `draft` in the framework repo — I didn't scope it into that repo's workflow or cut a branch there, since you asked only for the ticket. Say the word if you want me to take it forward there.

<!-- xgd-chat-end -->