---
uid: report-5c0a0a6b
id: REPORT-7221
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-01T02:43:05.321657+00:00'
updated_at: '2026-11-01T02:43:05.321657+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: STORY-103
---

I wrote 4 UATs for STORY-103, covering the four ACs added for BUG-46 that had no tests. 3 pass and 1 fails: the AC-2088 test catches a real bug in the code, not a mistake in the test.

The story's other 36 ACs already had `test_UAT_AC{N}_` tests.

**What each test checks:**
- **`test_UAT_AC2088_opening_mid_turn_returns_the_turn_so_far_with_cursor_and_live`** (fails at `tests/reconciliation-conversations-live-turn.workers.test.ts:211`). The mid-turn half passes: a mid-turn open returns the user message and the reply so far, with `live: true` and a cursor that has moved forward. The durable copy doesn't hold the half-finished turn yet. After the turn finishes, a fresh open still says `live: true` where the AC requires `live: false`.
- **`test_UAT_AC2089_a_turn_whose_client_leaves_is_held_open_archived_and_aborted`** passes. When the client hangs up mid-turn, the host still finishes the turn: the stored conversation has the user message and the partial reply, and rejoining shows the turn ended as aborted.
- **`test_UAT_AC2090_reattach_streams_the_rest_from_the_cursor_and_refuses_a_bad_request`** passes. Rejoining from the cursor streams the rest of the reply with nothing repeated or missing, and ends in one completion marked complete. A missing cursor, a negative cursor or a missing conversation ID each get a 400. An unknown conversation ID gets a readable refusal inside the stream.
- **`test_UAT_AC2091_an_unreadable_transcript_fails_the_open_rather_than_reading_empty`** passes. A site with no conversation opens with no turns. A stored conversation whose transcript I corrupted makes the open fail instead of returning an empty conversation.

**The AC-2088 bug:** I first suspected my test was racing the end of the turn, so I made it wait for the host to finish recording the turn. It still failed. A temporary probe, since deleted, showed the same thing with the ordinary instant model double: a turn that finished with `status: complete` and was fully recorded still reports `live: true` on the next open. The flag is computed in `storedTranscript` (`tools/generate/src/cli/ai/host-core.ts:787-788`), which compares the folded records with what `closedPrefix` returns. Something seems to leave unclosed records in the log after a completed turn. I haven't confirmed what, and I didn't touch any runtime code.

Lint didn't run: `eslint` isn't installed in this worktree, and `npx` couldn't download it because the sandbox blocks the npm registry.

```
⚠️ TESTS FAILING — downstream fix-it loop required

Failures:
  - test_UAT_AC2088_opening_mid_turn_returns_the_turn_so_far_with_cursor_and_live: after the turn has ended (done status=complete, waitUntil promises settled), opening again reports live=true; AC-2088 requires live=false. Code regression in storedTranscript live computation, not a test defect.

test_files_created:
  - "tests/reconciliation-conversations-live-turn.workers.test.ts"
```
