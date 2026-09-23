---
uid: comment-21e571fb
id: COMMENT-3669
type: comment
title: Comment on bug BUG-138
created_by: xgd
created_at: '2026-09-23T02:25:22.624344+00:00'
updated_at: '2026-09-23T02:42:37.245066+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-3d91a05e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "220e8b9b-dee8-4068-bcf4-6b245a083d57",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="0c9c0744-8d7d-44cc-94f9-5d03014c9c40-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T02:24:02.523687+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="0c9c0744-8d7d-44cc-94f9-5d03014c9c40-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T02:42:36.543672+00:00" -->
#### Claude
I'll start by reading the ticket to understand what's being asked.

Now let me look at the client side — `chat.js` replay, `paintInterrupted`, `paintUnsent`.

Now the `webui-chat` side — `appendMessage`/`stampTurn` contract.

Now let me check the `transcript()` fold path — the one `storedTranscript` reads.

Now let me check the workers-side host test pattern for the origin half.

I have full clarity on the change. Starting the free-coding protocol.

Now the host-side change:

Now the panel side. Let me look at the exact context around the replay and the two paint functions:

Now the UATs. Let me write the panel suite first.

Let me verify these actually catch the defect by reverting the panel fix temporarily.

Now the origin half — a workers suite proving `/api/ai/session` carries the moment.

Now the RED check for the origin half:

The second workers test passes pre-fix (undefined equals undefined) — that's weak evidence. Strengthening it:

Now I'll add the in-flight-seed case to the panel suite:

All 9 UATs fail without the fix and pass with it. Now the regression scope — adjacent chat panel and host suites:

Pre-existing failure, unrelated to this change. Let me check lint and run a broader sweep.

While that runs, let me update the ticket body to cover the behaviour the UATs assert.

Still running. Let me review the final diff while it completes.

All 23 workers suites in scope pass. Now version bump and commit.

Now merge back to `xgd-working` under the lock.

The lock is stale — its holder (pid 14813) is dead and `free-REQ-304` is already merged into `xgd-working`. Clearing just the lock file (the narrower of the two options the error offers, rather than `xgd branch clean REQ-304`, which would also tear down that ticket's worktree):

Done. BUG-138 is at `free_coded` on `xgd-working`.

## What the fix is

The moment existed at every layer except the two that would show it. Two arguments were missing:

**`tools/generate/src/cli/ai/host-core.ts`** — `ChatTurn` gains an optional `ts`; `storedTranscript` stops discarding the `ts` the fold puts on every turn it projects. Omitted rather than emptied when a record carries none, so "absent" means one thing on the wire as it does in the type.

**`apps/control-app/src/builder/chat.js`** — the moment is passed at all four paint sites, through one `at(ts)` helper that decides once what "no moment" looks like (`undefined`, never `{ts: undefined}`):
- the replay loop — the call that stamps a turn and opens a day;
- the seed handed to `resume` — the one turn the loop never appends, which would otherwise be dated by whenever the tail drained;
- `paintInterrupted` and `paintUnsent` — BUG-121's and BUG-122's handed-back prompts, stamped with when they were **sent**, from records that already kept `at`.

## Evidence

9 UATs across two runtimes. All 9 fail against the pre-fix files and pass against the fixed ones — I verified the RED direction explicitly for both halves.

- `tests/test_UAT_FC_BUG-138_a_replayed_turn_carries_its_time.test.ts` (7, jsdom, mounted on the real `webui-chat`): every replayed turn stamped; day separators positioned *above* each day's first turn across a three-day history; a reload showing identical times; unusable/missing moments degrading to the old appearance without losing the turn; the interrupted and unsent rescues dated by submit; the in-flight seed dated by the turn.
- `tests/test_UAT_FC_BUG-138_the_session_carries_when.workers.test.ts` (2, real D1/routes/fold, Anthropic client doubled): `/api/ai/session` carries a moment on every turn, inside the window the turn actually ran in and in order — which is what distinguishes a carried timestamp from one invented at read time — and two reads report the same values.

Regression scope: 27 node suites and 23 workers suites touching `chat.js`/`host-core` — 352 tests, all passing except one **pre-existing** failure, `test_UAT_FC_BUG-64_a_genuinely_live_turn_still_gates_the_composer`, which I confirmed fails identically against the unmodified `chat.js`. I left it alone; it's a separate concern.

Two things worth flagging:
- The `xgd-working` merge lock was held by a dead process (pid 14813) from REQ-304, whose branch was already merged. I cleared the stale lock file rather than running `xgd branch clean REQ-304`, which would also have torn down that ticket's worktree.
- I ran `./bin/1c assets` in the fresh worktree — the generated modules are gitignored and weren't part of the commit, but a clean checkout needs that step before the workers suites will import.

<!-- xgd-chat-end -->