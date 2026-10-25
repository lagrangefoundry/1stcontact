---
uid: comment-9b829009
id: COMMENT-2150
type: comment
title: Comment on bug BUG-47
created_by: xgd
created_at: '2026-09-02T21:02:02.212220+00:00'
updated_at: '2026-09-02T21:13:21.016290+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-364445f8
  kind: chat_transcript
---

<!-- xgd-turn id="705d8c0e-df07-42aa-be30-230ebf3cccf7-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T21:01:43.242828+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="705d8c0e-df07-42aa-be30-230ebf3cccf7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T21:13:20.303852+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Now let me look at `router.ts`'s `placeOnSite` and the upload route.

Now the library.js consumer:

Now let me set the ticket to `free_coding` and cut a branch.

Now let me make the changes. First, `tickets.ts`:

Now `material.ts` — remove `siteSlug` from ingest, add placement recording in `promoteToSiteAsset`, and change `MaterialRow`.

Now the placement write in `promoteToSiteAsset` and the row shape:

Now `router.ts` — remove `siteSlug` from ingest calls and update the doc comment:

Now `library.js`:

Now add the `placedHere` / `placedList` helpers:

Now `api.js` comments:

Now let me look at the test harness for the workers-side material surface so I can write the BUG-47 UATs:

Now let me write the BUG-47 origin-contract UATs:

Now the Library-side UAT:

Let me verify these tests actually catch the bug by temporarily restoring the old behaviour:

Both defect claims fail against the old behaviour. Restoring:

Now the wider regression scope:

Now let me update the ticket body while the sweep runs.

Pre-existing failure on the clean checkout too. Waiting for the full sweep:

Now merge back into `xgd-working`:

Done. BUG-47 is at `free_coded`, commit `f929d426eb` merged into `xgd-working`, version `0.2.43`.

## What I did

`site_slug` is retired from `material`/`reference` and replaced by **`placed_on`**, a list of site slugs written by the one function that actually puts bytes on a site — `promoteToSiteAsset`, *after* `editAssetAdd` returns — and by nothing else.

That single decision covers all three problems in the ticket:

- **The symptom.** The upload no longer writes any site field, so a file dropped on *"just for you to read"* carries no placement even though the overlay sends the open site's slug with it.
- **The second defect.** Because the write happens after the copy lands, a promotion that fails softly keeps the material and records nothing — previously it was badged identically to one that succeeded.
- **The shape.** A list, so a blob backing two of a client's sites is badged on both (DOC-38 §7.7). `recordPlacement` unions rather than pushes, so re-dragging the same logo onto the same site records one placement.

On the read side, one `placedList`/`placedHere` pair in `library.js` now feeds the pill, the `Used on` rights row and the `Used on this site` filter, so the three cannot disagree. The dead `siteSlug` parameter is gone from `ingest`/`ingestUpload`/`ingestFetch`; `/api/material/fetch` no longer forwards a slug at all, since fetched material is never republishable. `brief.site_slug` is a different field and is untouched.

## Two things I decided and recorded in the ticket

- **No backfill.** `site_slug` cannot distinguish a promotion that landed from an upload that merely happened while a site was open, and promotion renames on collision — so there is no recoverable material→asset link. Inventing placements from upload context would re-commit the original error. Existing rows read as unplaced.
- **Placement is recorded, not verified.** If an asset is later deleted from a site, `placed_on` still names it. Reconciling against the live asset library is beyond what the ticket asks for.

## Tests

Two new UAT files, 7 tests. Before keeping the fix I re-applied the old upload-context behaviour and confirmed the two defect claims fail against it (the reference-role test and the failed-promotion test) and pass against the fix.

Full sweep: **2247 passed, 1 failed** — `tests/bug32-webui-scope-rebrand.test.ts`'s `test_UAT_AC960_component_scope_is_written_in_exactly_one_place`. That failure is pre-existing: it fails identically on the clean `xgd-working` checkout, naming the same file, before any of my changes. Also pre-existing and unchanged: one `tsc` error in `session-knowledge.ts` (`SHIPPED_SOURCE` not exported), which reproduces on the clean checkout too.

The ticket is parked at `free_coded` — promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->