---
uid: comment-6bee448a
id: COMMENT-8026
type: comment
title: Comment on bug BUG-384
created_by: xgd
created_at: '2026-11-08T19:13:06.219857+00:00'
updated_at: '2026-11-08T19:42:14.628235+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-9d1930d5
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2bee46b5-1754-4781-b029-4f8ebf86b9dd",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a5d2f046-99d2-4c17-bae9-605b887ce66e-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T19:11:11.211628+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="a5d2f046-99d2-4c17-bae9-605b887ce66e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T19:42:13.662756+00:00" -->
#### Claude
Not a duplicate (BUG-380 is the predecessor this extends). Reading the code.

Checking the knowledge library to see where session start reads the index and where the "corrupt" error is thrown.

Running the BUG-380 suite as a baseline in the worktree.

Writing the storage change in `knowledge.ts`: one R2 object per index, plus self-repairing read views.

Now the R2 source rewrite.

Now the class: readers get self-repairing views; builds stage in memory and commit once.

Fixing a flaw: the read check was fetching fresh every time. Reads will check and serve from the same cached object.

Deduplicating the read code: `memoryReader` becomes the one reader, writes passed in.

Typecheck is clean. Updating the stale comment, then the tests that pinned the four-object layout.

Now the BUG-380 test's raw-object helper and its corruption injection.

Now the new UATs. Finding an existing workers test that drives `POST /api/ai/session` to copy its setup.

Writing the BUG-384 UAT file.

Caught a problem: transcript cursors are written through the index source. Under one object that would race with builds, so they need their own object.

Typecheck clean. Fixing the test's material fields, then running the new suite.

The test planted one row, and any byte count divides by one. Giving it two materials so the vectors really aren't whole rows.

All 4 pass. Checking they actually fail on the old code.

Old code fails all four, so they're real evidence. Running the knowledge-related regression scope.

zsh didn't split the file list. Re-running with explicit splitting.

72 failures, mostly `getTenant(undefined)` in files I didn't touch. Checking the baseline on unchanged code before reading anything into them.

Nine reconciliation files already fail on unchanged code (69 tests). New with my change: 2 in REQ-163 and 1 in BUG-185. Looking at those.

Two real regressions. BUG-185: my 1-second read cache made a session miss a material another handle had just written. REQ-163: looking at what it measures.

Replacing the 1-second cache: reads now recheck the object's etag (no body fetched when it hasn't changed), reusing a fetch only within 100 ms.

Fixing a race I just introduced: two parallel reads could each start a fetch. Making the cache swap synchronous.

All 19 pass. Checking the container's R2 wire passes `get` options and returns a bodiless object when the etag matches.

The wire mirrors R2 (no body, no `arrayBuffer`), so the etag check works from the container too. Re-running the full regression set against the baseline.

Exactly the baseline: the same 9 files and 69 tests fail on unchanged code (they call `ticketStoreFor` with an old scope shape). Everything else passes. Checking lint before committing.

Updating the ticket body first, so every UAT traces to its text. The existing content stays; I'm appending the findings and the as-built design.

Committing the code on the branch.

Now the merge-back: lock, bring xgd-working into the branch, bump the version, fast-forward.

No code arrived from xgd-working. Checking 0.2.828 is unclaimed, then committing the bump.

xgd-working moved on (a ticket commit). Merging it into the branch again and retrying the fast-forward.

Landed on xgd-working. Rematerializing tickets, then the free_coded gate.

The gate passed. Setting story points and cleaning up the branch.

I've fixed BUG-384 and merged it into xgd-working. A corrupt Library index can no longer fail session start, and new writes can't leave one behind. It isn't deployed, so production still has the bug until you run the deploy. The ticket is at `free_coded` with commits `3f99fd0ec3` (code) and `d61827dc98` (version 0.2.828).

It isn't a duplicate. BUG-380 is the earlier fix this one builds on.

**What caused it.** It wasn't two writers overlapping; it was one writer stopped halfway. The index was four separate R2 objects written one after another, vectors first. 88 rows of vectors against 86 metadata entries means the vectors were rewritten and the metadata never was. That matches the shop import's container being killed partway. BUG-380's per-business lease already makes requests and the container take turns, but it can't stop a writer dying mid-write. Only the refresh path knew how to repair the result, so session start returned 500.

**What changed** (`apps/control-app/src/knowledge.ts`):
- **One object per index.** Each index is now a single R2 object, `index.bin`, written in one step. A reader sees the whole old index or the whole new one, and a writer killed partway leaves the old one intact.
- **Reads repair instead of throwing.** Every read of the index, including session start, search and the Library overview, first checks that the index loads. If it doesn't, the read triggers a rebuild through the one writer and logs `kb_index_rebuilt` once. It waits up to 10 s for the rebuild. Past that, the turn runs without Library search, `kb_index_unavailable` is logged, and the rebuild carries on behind.
- **Existing indexes are rebuilt once.** Every business's current index uses the old four-object layout, so its first read after deploy rebuilds it from the stored materials. That includes the broken production one. The old objects are left in R2, unread. Expect that one-off rebuild cost per business after deploying.
- **Transcript bookkeeping keeps its own object**, so writing it can't clash with a rebuild.

**Change to an earlier spec.** The REQ-159 / AC-1661 tests named the four separate objects. I changed those assertions to the one object. Their point is unchanged: the index stays in private storage under the business's own prefix. This is recorded in the ticket so reconcile treats it as intended.

**Tests.** Four new tests in `tests/test_UAT_FC_BUG-384_a_corrupt_index_never_fails_a_session.workers.test.ts` pass, and all four fail on the old code:
- a session over a corrupt index starts, finds a material and logs one rebuild, and the next session doesn't rebuild;
- a rebuild slower than the wait gives an empty search and a log line, then search works once it lands;
- a writer killed after its first write leaves both indexes whole;
- six concurrent writers with searches running alongside leave a whole index, and no search fails.

I ran the 24 knowledge and material test files. The only failures are 9 files (69 tests) that fail the same way on the unchanged code, because they call the ticket store with an old argument shape. AC-1661's own file is one of them, so my edit to it can't run until that file is repaired.

**Unfinished:** `xgd branch clean BUG-384` refused because BUG-383 now holds the merge lock. The merged branch and worktree are still there; `xgd branch clean --stale` later will remove them.

<!-- xgd-chat-end -->