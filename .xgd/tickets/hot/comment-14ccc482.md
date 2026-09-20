---
uid: comment-14ccc482
id: COMMENT-3327
type: comment
title: Comment on bug BUG-128
created_by: xgd
created_at: '2026-09-20T19:50:47.644086+00:00'
updated_at: '2026-09-20T20:21:31.641604+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-23f6175e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "51adc189-72cd-4665-9a47-6876e873fcd1",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f6c188a8-f11b-4ee6-9f16-97f355011a5f-user" -->

<!-- xgd-chat role="user" ts="2026-09-20T19:49:49.956358+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="f6c188a8-f11b-4ee6-9f16-97f355011a5f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-20T20:21:30.757401+00:00" -->
#### Claude
Good. Now let me update the ticket with the plan and scope, then cut a branch.

Now let me write the RED tests.

Now writing the tests.

Now the `counter` doc — make it explicit that it is the stamp.

Now the prose in `priming.json`.

Now the stale comment in `host-core.ts`.

All 8 pass. Now the regression scope.

Now lock, merge back, and record the commit.

Done. BUG-128 is at `free_coded`, commit `64fd8db` merged into `xgd-working`.

## What I found

The ticket named one verified cause and one open one. Both are now settled — and the verified one was worse than described.

**The cache defect is real and broader than the counter.** The digest reports four independently-moving things: page shapes, the journal counter (and the "last worked on" page derived from it), the live revision, and how much is unpublished. Only the first sits behind `SiteStore.version`. So two ordinary events moved what the digest *says* while leaving its key still:

- `appendChange` — moves `counter` alone; it's how the builder, an AI turn and every structured-edit command end;
- a publish — `writeRevision` + `setDraftBase` change what the public sees and touch the draft not at all, so the entry could go on saying "nothing has been published yet" indefinitely.

Both reproduce as failing tests against the old code.

**The ledger half is not a second mechanism.** I ran the decisive experiment as a test rather than a live session. The framework assembles the reminder *and* the volatile seed at the start of `promptStream` — before generation, after everything the previous turn wrote. A decision recorded through the real `record_decision` tool on turn one is in turn two's assembled tail. What the consultant actually compared was the record it was handed when the turn began against writes it made *during* that turn. That is the snapshot doing its job — but the entry never said it was a snapshot, so it read identically to a lie.

## What I changed

1. **Dropped the cache rather than re-keying it.** A composite over version/counter/base_revision is correct today and silently wrong the next time a counter is added — which is exactly how this arose. `version` is kept only as the existence check (a site the store doesn't hold is not an empty one). The saving given up is a handful of store reads on a quiet turn, paid immediately before a model call costing seconds and cents.

2. **The digest now says what it is as of, and the stamp is the counter** — no second field, because a stamp that could disagree with the count already quoted would be one more thing to distrust. The prose says the snapshot was taken when the turn began and that `list_changes since {at}` is exactly what happened after it. The ledger's decision count is dated the same way.

One wording collision surfaced: my first draft used "list_changes with since", which is REQ-182's fingerprint for the *change signal* in a test asserting a quiet turn carries neither signal. Reworded rather than touching that test.

**Tests**: `tests/test_UAT_FC_BUG-128_the_digest_cannot_lag.test.ts`, 8 UATs — the generic one asserts over a list of write paths, since a test written against the first path would have passed throughout the defect. Full workers suite green (1232). Node suite: two pre-existing failures (`bug32-webui-scope-rebrand`, `BUG-67 backend settings`) confirmed failing on the base commit too.

One thing worth your attention: mid-merge, the `xgd-working` merge lock I held was released and immediately taken by BUG-126. My merge had already completed by then (13:19:45 vs their 13:20:16), so nothing collided — but the release looks like a side effect of `ticket move-to-free-coded` rather than anything I did deliberately.

<!-- xgd-chat-end -->