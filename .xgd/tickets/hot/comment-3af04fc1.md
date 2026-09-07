---
uid: comment-3af04fc1
id: COMMENT-2311
type: comment
title: Comment on bug BUG-64
created_by: xgd
created_at: '2026-09-07T23:23:28.725771+00:00'
updated_at: '2026-09-07T23:29:19.975739+00:00'
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

<!-- xgd-chat-end -->