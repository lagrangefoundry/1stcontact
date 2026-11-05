---
uid: comment-65d37889
id: COMMENT-7784
type: comment
title: Comment on request REQ-645
created_by: xgd
created_at: '2026-11-04T20:09:16.007249+00:00'
updated_at: '2026-11-04T20:42:20.566916+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b559a8df
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8a669e85-bf9b-4e6a-9179-93a766af929a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="bbd32bb0-d846-452f-8cb6-6b442954ed91-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T20:07:55.476345+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="bbd32bb0-d846-452f-8cb6-6b442954ed91-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T20:42:14.885356+00:00" -->
#### Claude
Ticket set to `free_coding` and branch `free-REQ-645` cut. Now setting up the worktree and surveying the three rules across the in-scope code.

Plan settled: one shared fixed-concurrency helper plus one-scan "by subject" readers. Checking where a helper can live so both control-app and `tools/generate` can import it.

Writing up the survey list now; one more pass for rule 3 (whole-log reads per poll), in the junction/coordinator DOs and the routes that poll.

Found a rule-3 case: the D1 site store's `changesSince` reads the site's whole change journal and filters in JS, on every draft-stream poll that moved. Reading the rest of it.

Now the comp board (rule 1 + rule 2):

Comp board done. Now chat copy (`readChats`/`writeChats`) and feedback's `testerMessageStamps`.

Now first-draft's per-ticket copy (4 full scans per copied ticket → 4 per chunk):

Now the unbounded fan-outs: `/api/sites`, audit flush, shop hydrate batches, plan `read_plan` comps, `list_references`, and folding the two hand-rolled lanes into `inLanes`.

Now rule 3 — tail the D1 change journal from the cursor instead of reading the whole window:

Indexed. Now typecheck. Setting up the worktree's dependency links first.

Both typechecks clean apart from two pre-existing errors in files I didn't touch. Now the UATs — looking at how existing tests build a ticket store.

I'll follow BUG-341's pattern: a counting D1 proxy at the external boundary, real ticket store in workerd. Checking the routes that reach each fixed path.

Writing the UAT file now (counting D1 proxy, seven paths). Checking two more signatures first.

Fixing the test's session ids (an un-prefixed id lands as-is; a second business prefix would be refused), then running the suite.

Scans are counted per 200-row page (one scan = 11 pages over this corpus). I'll count only first pages. Checking the accessor's SQL, and why the journal row count read 0.

All 7 pass. Now proving they discriminate: run them against the old code (revert the source changes temporarily via a patch in `$TMPDIR`, keep the helper files the test imports).

84 node failures — likely worktree location artifacts. Baselining in the same worktree against the old code to compare like for like.

The baseline run passed the file list as one argument (zsh doesn't word-split). Rerunning it properly.

Node-pool failures are identical on the old code (84, all pre-existing worktree artifacts). Now the 89 workers-pool files.

Some failures touch areas I changed (AC-1411 audit trail). Baselining these 21 files against the old code.

Workers failures are also identical on the old code (73, pre-existing). Checking why AC-1411 (audit flush, which I touched) fails, so it isn't hiding a regression.

Committed. Now updating the ticket body with the findings (fixed vs. bounded-with-reason), keeping the existing sections.

Ticket body updated. Now the merge-back: lock, merge `xgd-working` into the branch, bump, fast-forward via `xgd-merge`, then `move-to-free-coded`.

Conflict in `router.ts` from another session's change. Looking at it.

Merged and green. Now the bump, fast-forward, and gate — as a retry loop since other sessions commit tickets constantly.

`free_coded` on the first attempt (version 0.2.762). Setting story points, then cleaning up the branch.

REQ-645 is done and parked at `free_coded`. The work commit is `bf0376c4` and the version bump is `30971e03` (0.2.762). Both are on `xgd-working`, and the branch and worktree are cleaned up. I did not promote it to `ready_to_reconcile`; that's your call.

**What I fixed**
- **One shared concurrency helper.** `inLanes` in `tools/generate/src/cli/ai/bounded.ts` runs at most six at a time by default. It replaces two hand-written copies (in the shop import and the builder case recorder). It now also caps `/api/sites`, the audit flush, the shop's price/category batches, the comp board, the plan's comp read and `list_references`.
- **Rule 1 (one query per item).** New `commentsBySubject` / `attachmentsBySubject` read a type once and look each item up. They now serve the comp board, chat export and import, the feedback timing read, and the first-draft copy (which was doing four full scans per copied item). Sent notifications now read the mail once instead of once per kind.
- **Rule 3 (whole-log reads).** The D1 site store's `changesSince` now reads only the changes after the cursor. Before, it read the whole 500-entry change log and filtered.

**Tests:** 7 new UATs in `tests/test_UAT_FC_REQ-645_bounded_by_construction.workers.test.ts`. They count queries and concurrency at the D1 binding, with a Library of about 2,000 items. All pass. Against the old code every one fails, with exactly the per-item numbers: 30, 40, 20 and 600 scans; 24 and 41 statements in flight; 200 log rows read.

**Regression run:** I ran the 158 test files that touch these modules. 84 node and 73 workers tests fail, and they fail identically against the old code in the same worktree, so none come from this change.
- One of those failing files covers the audit trail, which I changed (AC-1411). In this worktree its turn dies before reaching the audit flush, so it can't vouch for that change. The change only limits how many writes run at once; the keys and contents are the same.

**Things you should know**
- **Inventory test size:** I used 2,000 inventory items instead of the ticket's 400, because 400 items make only four batches and can't show the problem. The ticket's test plan now says so.
- **Not fixed:** the delivery webhook (`messages.ts`) still scans every active business's mail on each event. That grows with the platform's businesses, not one business's items, so it's outside this ticket's rules; it's noted in the ticket as worth an index later.
- **Ticket body:** it now lists every fix, plus each finding I left alone and why it's already bounded (fixed tuples, constant lists, per-isolate sets, browser-side code, single-item reads).

<!-- xgd-chat-end -->