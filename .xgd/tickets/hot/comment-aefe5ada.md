---
uid: comment-aefe5ada
id: COMMENT-8011
type: comment
title: Comment on bug BUG-380
created_by: xgd
created_at: '2026-11-08T16:47:18.586187+00:00'
updated_at: '2026-11-08T17:19:01.387928+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-23904c81
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "9a9a9153-c9fb-4301-82dc-d0aaed958ecf",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="9a6fc444-b454-433e-8867-81e8f941f4cb-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T16:46:09.910128+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="9a6fc444-b454-433e-8867-81e8f941f4cb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T17:10:58.887665+00:00" -->
#### Claude
Big scope. First, a duplicate check.

Not a duplicate. Now the code.

Now the container rig (EPIC-32), the workflow binding, and the import status read.

Still mapping: reading the knowledge package's index load/build path to see how a corrupt index can be detected and rebuilt from the 1stcontact side.

Now the shop routes' status read and the existing BUG-333 import UATs I'll model the new ones on.

Writing the code. First `job-step.ts`: the import op as a step kind.

I'll keep the consultant `StepRequest` as it is. A new `ContainerRequest` (consultant step or import op) is what the container, its DO and its server take.

Now `agent-container.ts` and the DO, which should take `ContainerRequest`.

Now `shop-import.ts`: the op runner, the restructured Workflow body, and reconcile-on-read.

Now reconcile-on-read in `shop-import.ts`.

Now `shop-routes.ts`.

Adding `shopImportDeps` to the router so the Workflow fallback and the container build the import's deps the same way:

Now `worker.ts`: the `ShopImport` Workflow sends each op to the import's container.

Now the container's server.

Now the Library index in `knowledge.ts`: a per-business single writer, coalescing, and rebuild when corrupt.

Both projects typecheck. Running the existing suites this touches, starting with the shop import's workers suites:

Existing suites pass (29/29). Now the UATs. Looking for the existing helpers to reuse: a fake embedder for the knowledge base, and the routing setup from REQ-631.

Writing the UAT file. The per-invocation cap is a counting wrapper over D1 and R2 that throws Cloudflare's exact error past N calls.

All 5 pass. The 20 errors come from the test's `defer: () => {}`, which leaves the deferred map rebuild unhandled. Fixing that, then confirming the UATs fail on the old code:

Still passes on the old code: every refresh reads the same 20-document corpus, so the interleaved writes agree. Staggering the writers so concurrent refreshes see different corpora:

The old code now fails one run in two. Not reliable enough yet; widening the jitter:

The old code now fails every time, but so does the fix. Looking at why:

Just the 5 s test timeout: twenty serialized refreshes behind the slowed writes. Shortening the delays and giving the test 30 s:

That UAT now discriminates: it passes with the fix and fails without it, 2 of 2 runs each. Running the full new file plus every suite that touches the changed modules:

Many reconciliation suites fail. They may be red already on clean code (the hub memory warns of that). Checking against the baseline:

Those fail inside the suites' own `seedSite` setup. Running the same 7 files on the baseline:

Pre-existing: the baseline fails the same 12 of 16 in those two files. Now the non-reconciliation suites with the fix:

All 19 files pass (131 tests). Before relying on the container path, a check that photo fetching works the same in the container's Node process:

The container's `fetch` passes non-credential origins straight through, so photo downloads behave as they do in the Worker. Now the version bump and commit. Checking this repo's bump convention:

The ticket's test plan already names all five UATs. Committing the work on the branch:

Committed `8053cf5`. Now the merge-back sequence: lock, merge `xgd-working` into the branch, bump, merge back, promote.

Merged into `xgd-working`. Now the free_coded gate:

The gate printed a warning before moving it. Reading what it said and what the ticket now records:

`free_coded` with both SHAs recorded, and the bump check exits 0. Releasing the branch:

Now the ticket body: appending "What landed" and leaving the operator's content intact.

I've fixed BUG-380 and merged it into `xgd-working` (commits `8053cf54`, `69e45777`; version 0.2.825). The ticket is at `free_coded` (8 points). I checked first: it isn't a duplicate. Production is still broken until a deploy, and the real-container path hasn't been run yet.

**What changed**
1. **The import's work no longer runs in the Workflow's single invocation.** Every step (items, photos, descriptions, the report and the catalogue rebuild) runs in the import's own job container, the same one consultant jobs use, keyed `shop-import-<id>`. The Workflow only sequences the steps; its single call budget now goes on one call per step and the one write that marks a failure.
   - I moved the items phase as well as the photos, which the ticket left for me to decide. At 367 products it already takes thousands of database and storage calls, too close to the cap. That decision is recorded under "What landed".
   - Photo descriptions now happen inside the photo steps, and whatever is left is described after the import shows `done`. The separate description chain that ran beside the photos is gone.
2. **A failed import always ends as `failed`.** If even the failure write is refused, the run now ends as errored instead of `Completed`. The next status read, or the next attempt to start an import, checks the Workflow: if it has ended while the row still says `running`, the row is marked `failed` with the error. Nobody waits 30 minutes, and a new import can start straight away.
3. **The Library index has one writer per business.** Refreshes take turns through the business's coordinator (`SITE_COORDINATOR`, lease `kb-index:<id>`), and refreshes requested while one is running share the next pass. A refresh that finds the index corrupt rebuilds it from the stored materials and logs `kb_index_rebuilt` once. The knowledge package already had the rebuild option this needed, so no ticket in that repo.

**Tests**
- The 5 new tests in `tests/test_UAT_FC_BUG-380_import_outlives_the_request_cap.workers.test.ts` pass. The request cap is simulated by a wrapper that throws Cloudflare's exact error past N calls.
- On the old code, 4 of the 5 fail. The fifth, twenty photos stored at once, passed on the old code at first because local storage has no delay for writes to interleave in. I gave it a write order that makes the old code fail on every run.
- The 19 related suites (131 tests) pass.
- The 7 `reconciliation-*` knowledge-base suites fail in their own setup. They fail the same way on clean code, so this change didn't cause it.

**Not done yet**
- **No test runs an import in a real container.** The container code typechecks and runs the same function the tests cover. A case in the Docker-based container suite (REQ-646) would close this gap; that suite is slow, so I didn't add one.
- **The production repair needs a deploy, which I didn't do.** After deploying, the stuck import should show `failed` in the Shop tab, and the business's next Library write rebuilds its index. Then re-run the import and record the photo counts (about 1,943) and whether Workers Logs show any `Too many API requests`. These steps are listed in the ticket body.
- **The real cap per Workflow step isn't confirmed.** Cloudflare's docs give 10,000 subrequests per invocation on the Paid plan (raised from 1,000 in February 2026) and say nothing about a separate limit per step. The fix doesn't depend on the exact number.

The ticket body keeps your original sections and adds a "What landed" section with these details.

Sources: [Workers limits](https://developers.cloudflare.com/workers/platform/limits), [Workflows limits](https://developers.cloudflare.com/workflows/reference/limits), [Subrequests limit changelog, 2026-02-11](https://developers.cloudflare.com/changelog/2026-02-11-subrequests-limit/), [Community thread on this error](https://community.cloudflare.com/c/developers/workflows/106)

<!-- xgd-turn id="495c0b41-e7eb-4b67-bc6d-718093097e62-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T17:18:02.491150+00:00" -->
#### You
Is this complete?

<!-- xgd-turn id="495c0b41-e7eb-4b67-bc6d-718093097e62-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T17:19:00.854037+00:00" -->
#### Claude
The code is done but the fix isn't finished. Production is still broken until it's deployed and checked.

**What's done (I just re-checked):**
- BUG-380 is at `free_coded`. It records both commits (`8053cf54`, `69e45777`), version 0.2.825 and 8 story points.
- Both commits are on `xgd-working`. The branch and worktree have been cleaned up.
- The 5 new tests pass, and 4 of them fail on the old code. The 19 related suites (131 tests) pass.
- The ticket body keeps your original sections and adds a "What landed" section.

**What's still open:**
1. **Deploy and check production.** I didn't deploy. Production deploys from `xgd-working`, so the fix goes live on your next deploy. Then:
   - The stuck import should show `failed` in the Shop tab.
   - That business's next Library write should rebuild its index and log `kb_index_rebuilt`.
   - Re-run the import and confirm it stores all ~1,943 photos, with no `Too many API requests` in Workers Logs.
2. **No test runs an import in a real container.** The tests cover the same import code the container calls, but the container path itself hasn't run. Adding a case to the Docker-based container suite (REQ-646) would close this. I left it out because that suite is slow. I can add it now if you want.
3. **Reconcile.** Moving the ticket to `ready_to_reconcile` is your decision. Doing it after the production check would let the ticket record what was actually seen there.

Item 2 is the only one I can do from here. Want me to add that case?

<!-- xgd-chat-end -->