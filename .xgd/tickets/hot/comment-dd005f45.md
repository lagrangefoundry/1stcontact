---
uid: comment-dd005f45
id: COMMENT-1474
type: comment
title: Comment on bug BUG-38
created_by: xgd
created_at: '2026-08-24T22:13:59.493208+00:00'
updated_at: '2026-08-24T22:20:10.568862+00:00'
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

<!-- xgd-chat-end -->