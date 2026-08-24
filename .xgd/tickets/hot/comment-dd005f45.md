---
uid: comment-dd005f45
id: COMMENT-1474
type: comment
title: Comment on bug BUG-38
created_by: xgd
created_at: '2026-08-24T22:13:59.493208+00:00'
updated_at: '2026-08-24T22:25:35.663099+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-a98fb3b0
  kind: chat_transcript
---

<!-- xgd-turn id="3a66d8c3-590a-4dc3-bf8a-72ccfcc4d316-user" -->

<!-- xgd-chat role="user" ts="2026-08-24T22:13:54.236247+00:00" -->
#### You
The 1c chat is not working in the cloud, I get an error:

"This is a new cloud deply of first contact, can you hear me? can you see the site? Do you have access to the background docs?

*That conversation is no longer open — reload the builder to start it again.*

Trying again?

*That conversation is no longer open — reload the builder to start it again."*

<!-- xgd-turn id="3a66d8c3-590a-4dc3-bf8a-72ccfcc4d316-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-24T22:20:10.536670+00:00" -->
#### Claude
Diagnosis is clear. Let me record it on the ticket.

Now the fix:

Good — in the worktree. Now the call sites:

Now the UAT test:

Both typecheck clean. Now bump, commit, and land:

Fixed and landed on `xgd-working`.

**The bug.** `host-core.ts` bound a session id back to its slug through a module-level `Map` that `openSession` wrote and `streamPrompt` read:

```ts
minted.set(mintedKey(sessionId, deps), slug)      // POST /api/ai/session
const slug = minted.get(mintedKey(sessionId, deps))
if (!slug) throw new UnknownSessionError(sessionId)   // POST /api/ai/prompt
```

Those are two separate HTTP requests. Under `1c builder` the map lives for the whole process, so it holds. In workerd it lives for one isolate, and nothing promises two requests the same one — so a turn reaching a cold isolate found the map empty and got told its conversation was closed. On a fresh deploy with no warm isolates, that's every turn, including the first.

Everything else in the host was already built for isolate churn — the transcript archive is R2-backed and `attach` resumes from it when the in-memory junction has nothing. `minted` was the one piece of per-isolate state whose loss was fatal, and it held nothing that isn't derivable: `sessionIdFor(slug)` is literally `` `site-${slug}` ``.

**The fix.** Deleted the map; the id is now resolved by stripping the `site-` prefix and confirming the slug against `SiteStore.hasDraft`. The registry's real job — stopping an arbitrary client string becoming a free-form key into the session store — survives, and is stronger: the check is now tenant-scoped against real storage rather than against whatever one isolate happens to remember.

**Evidence.** `tests/test_UAT_FC_BUG-38_chat_session_survives_isolate_churn.workers.test.ts`, three UATs inside workerd against real D1/R2. I confirmed they reproduce the exact production message before the fix (2 failed with `_That conversation is no longer open…_`) and pass after. The existing REQ-146 suite couldn't have caught this: it drops the caches and then *re-opens* the session, which re-populated the map — the real client just holds the id and sends the next turn.

Regression: 7 workerd/panel suites, 48 tests, all green. `tsc --noEmit` clean on both `tools/generate` and `apps/control-app`.

Ticket BUG-38 is at `free_coded`, commit `63df97c9`, version 0.2.14. **You'll need to redeploy the control-app Worker** for this to take effect in the cloud.

One thing I did not touch, flagged rather than fixed: `tests/test_UAT_FC_REQ-122_chat_host.test.ts` has 5 pre-existing failures on `xgd-working` — identical before and after my change, and identical in the main checkout, so unrelated to this bug. They look like the Node builder origin failing to resolve the shared `ai` library. Worth a separate ticket if you want it chased.

<!-- xgd-turn id="ccea0766-c26a-450c-bd28-57edd1cd074f-user" -->

<!-- xgd-chat role="user" ts="2026-08-24T22:24:01.837675+00:00" -->
#### You
Can you create a bug to fix those tests please?

<!-- xgd-turn id="ccea0766-c26a-450c-bd28-57edd1cd074f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-24T22:25:35.638383+00:00" -->
#### Claude
The user's explicitly asking for a new ticket, so that's the exception to this session's scope. Let me get enough detail first to make it actionable.

Confirmed the cause. Filing it:

Filed as **BUG-39** (`bug-23d1ec27`), status `draft`. While writing it up I found the actual cause, so it's a scoped ticket rather than a "these are red, investigate" note.

**Cause:** the Node suite's model double still speaks the pre-streaming Anthropic contract — its steps return a finished message:

```ts
const says = (text: string) => () => ({ content: [{ type: 'text', text }] })
```

But the shared library's backend (`lagrange-framework/components/ai/js/src/backends/claude_api.js:104`) calls `messages.create({..., stream: true})` and iterates the result as raw wire events. Iterating a plain `{content: [...]}` object yields nothing, so every turn completes having seen no text and no `tool_use` — which is exactly the shape of all five failures: user turn recorded, assistant half absent, no tool ever runs.

The backend moved to streaming upstream and this suite didn't move with it. Its workerd counterpart did — `test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts` emits `content_block_start`/`_delta`/`_stop` and passes, and its own comment spells out the contract the Node one is missing.

**Fix in the ticket:** move the Node double onto the streaming contract, and define the scripted client *once* in `tests/support/` imported by both suites. Two hand-maintained transcriptions of the same wire protocol is how this drifted — one suite got the update, the other didn't.

One thing worth your attention, flagged in the ticket: the **3 tests in that file that currently pass may be passing vacuously.** They were written against the old contract too, so any asserting only on transport (status, content-type, SSE framing) would pass whether or not the double produced anything. That's AC3 — confirm each still means what its name claims once the double is fixed.

I didn't cut a branch or start on it, since you asked me to create the bug rather than fix it. Say the word if you want me to pick it up.

<!-- xgd-chat-end -->