---
uid: comment-b336770a
id: COMMENT-7801
type: comment
title: Comment on request REQ-651
created_by: xgd
created_at: '2026-11-05T00:15:36.979625+00:00'
updated_at: '2026-11-05T00:40:29.843670+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b16f4529
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a443c8a8-b7f6-4f3e-9447-c0218883e9ce",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="639e7b18-f439-40d4-839a-42907b0d057e-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T00:15:00.639154+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="639e7b18-f439-40d4-839a-42907b0d057e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T00:40:28.355937+00:00" -->
#### Claude
Scope is clear from the ticket; starting work. Setting status and cutting the branch.

Worktree is provisioned. Reading the store code.

Mapped the store/site code; now checking the shop assistant/API surface and the import code.

Store/import/UI/site touchpoints mapped. Checking whether SQLite can drop the FK-bearing `collection_id` column for the migration.

Writing the migration.

Now updating `shop.ts` (item shape, hydrate, filter, save).

Now the framework catalog item (site side).

Now the import: apply every mapped collection, drop precedence.

Now the Shop tab UI (`builder/shop.js`).

Code edits done; running typecheck.

Typecheck clean. Now updating existing tests that assumed one collection.

Updating the browser journeys (j2 import, j5 editing, REQ-639 layout) for collection checkboxes.

Now the REQ-631 inventory workers test (import precedence assertions).

Writing the new REQ-651 UATs. Checking the existing harness helpers first.

Writing the workers UAT file now; checking the catalog test seed for a product-page `collection` binding.

Writing the browser UAT for the item detail and filter.

Now the workers UAT (migration, import, API, delete, site).

Running the workers suites for the new and touched files.

Both pass (18 tests). Running the rest of the touched workers suites.

The REQ-645 concurrency bound caught a third parallel batch reader. Instead of loosening the bound, I'll read collections and categories in one query.

The UNION would bind each id twice (over D1's 100-parameter cap); restructuring so the `IN` appears once.

Workers suites green. Now the jsdom/node suites that touch the Shop tab and catalog.

Node suites pass (REQ-648 skips needing Chromium, as on clean working). Trying the real-Chromium browser suites via `pnpm test:browser`.

Needs to be the whole Bash call for the sandbox exclusion; retrying that way.

j2 and j4 pass. Failures are mine: non-j2 journeys keep the default name "Studio Line", and the section count is 5 not 4 — checking which headings.

The Orders heading (REQ-643) postdates that REQ-639 assertion — it was already red on working; I'll include it. Fixing the collection name in the three files.

All 12 pass. Checking for other browser suites that touch collections, then reverting the workspace tweak.

Code and tests are done. Appending an "As implemented" section to the ticket body, keeping the existing text.

Committing on the branch.

Now the merge-back: lock, bring xgd-working in, bump version.

Another ticket landed its own `0048` meanwhile; renumbering mine to `0049`.

Green after the merge. Committing the merge, bumping the version, and landing on xgd-working.

Per my memory notes, the renumbering must not live only in the merge commit (reconcile never carries merges). Splitting it: merge = pure resolution, adaptation = its own commit.

Now the version commit and landing, as a retry loop (other sessions commit to xgd-working constantly).

Landed as 0.2.772 and moved to `free_coded`. Setting story points, correcting the migration number in the ticket body, then cleaning the branch.

REQ-651 is done: an item can now be in any number of collections. It has landed on xgd-working and the ticket is at `free_coded` (version 0.2.772, 5 story points, three commits recorded). I haven't done the definition-of-done check on dev — that's the one thing left (see the end).

**What changed**
- **Store:** collections are now kept in a join table, like categories. A new migration copies each item's existing collection across as a list of one and removes the old single-collection column. It's numbered `0049` because another ticket (REQ-646) took `0048` while I was working. Deleting a collection takes it off every item and leaves the items in place. There's still no way to delete a collection from the Shop tab; the database does it automatically when one is deleted.
- **Import:** every source category mapped to a collection is applied to the item. The "collection chosen" section is gone from the report. Re-importing keeps a product in both collections and doesn't duplicate it.
- **Shop tab:** the Collection dropdown is now a Collections set of checkboxes with a `+`, laid out the same as Categories. List rows show every collection. The filter works as before, and an item now appears under each of its collections.
- **Site:** a grid shows an item if it's in any of the grid's collections. Cards and product pages show all of an item's collections, separated by commas. The text field keeps its old name, `collection`, so existing site definitions still work.
- **Loading items:** collections and categories now come back in one query. Run as two separate reads, they broke the limit on how many reads can run at once (REQ-645).

**Tests**
- New: a workers suite covering the migration, saving, the filter, deleting a collection, import and re-import, and a published site where one item appears in two grids and its page lists both collections. Also a real-Chromium browser suite: tick two collections, save, reload, untick one, add one with `+`, and filter.
- I updated every existing suite that assumed one collection. The REQ-639 layout test was already failing on xgd-working before this change: the Orders heading added by REQ-643 had broken it. It now expects that heading.
- Everything I ran passes: the touched workers suites, the Shop and catalog node suites, and the Shop browser journeys (BUG-333 j2/j4/j5, REQ-639 and the new REQ-651 suite). The REQ-648 grid-standard tests were skipped; they need Chromium, which isn't available in the sandbox. I didn't run the full suite.

**Still to do:** deploy to dev (`bin/deploy --env dev`), re-run the import on a business whose shop has a product in two collection-mapped groups, and confirm the item shows in both collections in the Shop tab and in both grids on the site. I didn't deploy because it changes the shared dev environment — tell me if you want me to run it.

<!-- xgd-chat-end -->