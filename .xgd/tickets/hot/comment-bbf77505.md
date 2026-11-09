---
uid: comment-bbf77505
id: COMMENT-8053
type: comment
title: Comment on bug BUG-395
created_by: xgd
created_at: '2026-11-09T01:18:49.065282+00:00'
updated_at: '2026-11-09T02:08:19.830696+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-ea74aee1
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "463271f8-4517-4717-b60a-7147731444a9",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="c227dc3f-1ef6-4af0-b582-e9772d1a4f01-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T01:17:19.601519+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="c227dc3f-1ef6-4af0-b582-e9772d1a4f01-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T01:41:45.853191+00:00" -->
#### Claude
Not a duplicate. Now the code path.

Checking the code path: a preview photo request goes from `shopPhotoMaterial` to `materialFile`. Next I'm reading `materialFile` to confirm whether it scans the whole Library.

Still tracing the photo path: next I'm checking whether the ticket store's `attachments()` and `get()` cost depends on the Library's size (the vendored ticketing component).

Design settled. Setting the ticket to `free_coding` and cutting the branch.

Worktree runs. Now writing the bounded `attachments` lookup. Checking the component's internals I'll reuse (`_toRecord`, `_project`).

Now the second half: where `index.ts` turns errors into the catch-all 503.

Next: the builder's side. Finding where a Settings card produces "GET /api/shop/shipping → 503".

Now the edit to `ticketStoreFor`:

Now the migration (partial expression index), registered in the test factory and the manifest.

Now the busy-store helper and its two server exits.

Now the builder's retry-once in `send`:

Server and builder changes are in. Writing the UATs next: a D1 statement-counting wrapper, and Library-sized fixtures seeded in bulk.

Now the test file:

Photo cost is now the same at both Library sizes (11 statements). Printing them, plus rows read, to set an honest ceiling.

`/api/plan` and `/api/launch` need the site named. Adding them back with `?site=` plus `publish/status`, which the logs show was slow.

Start-up reads total 60 statements at both 10 and 50 items, and each photo costs 11. Setting the start-up ceiling to 70, removing the probe log, and running the whole file.

All 4 pass. Checking the photo UAT actually fails without the fix: temporarily reverting `tickets.ts`.

Without the fix the large Library costs 22 statements per photo against 12 for the small one, so the UAT catches it. Fix restored. Now typecheck and regression scope.

Typecheck is clean. Running the workers regression set that exercises attachments, material files, captures and shop photos.

Many failures at 0–1 ms point to a shared setup error. Reading one.

These failures are suites calling `ticketStoreFor` without a scope, which looks unrelated. Running the same set on clean `xgd-working` for a baseline.

zsh didn't split the file list. Rerunning both with the list split.

The branch fails 34 tests, all already failing on clean `xgd-working` (35 there), so nothing new. Next, the jsdom suites that go through the builder's `send`.

`reconciliation-builder-workspace-origin` fails 7 on the branch against 2 on baseline. Checking whether that's my `send` change or a worktree artifact.

Those are worktree artifacts (no built `dist-assets`, webui resolution), not my change. Checking the migration and manifest guard suites.

REQ-180's "no user-visible string says tenant" could plausibly be mine. Checking against baseline.

Regressions are clean against baseline (same offender counts). Before committing, reading my notes on the version gate and promotion.

Updating the ticket body now (keeping the operator's Symptom and Evidence), so every UAT has language behind it before I commit.

Committing on the branch, then the merge-back sequence (lock, merge `xgd-working` in, bump, fast-forward).

Fast-forward landed, and the overlay check has nothing to change. Moving the ticket to `free_coded`.

Bad SHA concatenation on my part. Retrying with the full SHA from `git rev-parse`.

The ticket is at `free_coded` with both commits and version 0.2.839. Tearing down the branch.

BUG-395 is fixed, merged into `xgd-working`, and parked at `free_coded` (commits `19daefc2` and `2c86933f`, version 0.2.839). It is not a duplicate.

**Cause (confirmed):** each preview photo and each Library `material/file` read looked up its file through the ticket store's `attachments({uid})`. That call reads every attachment record the business holds, 200 rows per database query, and filters them in code. A Library picture is one such record. So on a business with 2,000 pictures, one photo request ran 22 queries; with 20 pictures it ran 12. Twenty photos at builder load pushed the database past D1's 10-second limit, and every builder call in that window failed with 503. It's the same mistake as BUG-341. The Shop and legal reads were not the cause: the builder's start-up calls ran the same 60 queries with 10 items as with 50.

**What changed:**
1. **Each photo now costs the same whatever the Library's size.** A ticket's attachments are found with one query on a new index (migration `0061`). Every caller benefits, not just the preview.
2. **A busy database is reported as temporary, not as a broken setup.** The "overloaded" error now gets a 503 that says to retry in a second, with a plain sentence, instead of the old "configuration failure" text.
3. **The builder retries a busy read once.** If the retry is also busy, the Settings card shows that sentence instead of `GET /api/shop/shipping → 503`. Saves are never repeated.

**Tests:** four new tests in `tests/test_UAT_FC_BUG-395_builder_load_is_bounded.workers.test.ts`, all passing:
- a photo request costs the same with 20 and with 2,000 Library pictures (at most 12 queries). With the fix taken out, this test fails, so it does catch the bug;
- a builder load with 2,000 pictures and 50 items stays under a fixed ceiling;
- the busy response is returned both from the router and from the Worker's outer error handler;
- the shipping card retries once and then shows its data.

The control-app typecheck is clean. The related Library, photo and builder suites have failures, but every one also fails on clean `xgd-working` or comes from running in a fresh branch checkout. None are new.

**Two things for you:**
- **The real fix belongs in `lagrange-framework`'s ticketing component**, in both its JS and Python versions. My override in `tickets.ts` is a stopgap to delete once that lands. I haven't filed the ticket there because you didn't ask for one; say if you want it, and the ticket body already has the diagnosis.
- **Production needs migration `0061` applied** before the speed-up takes effect. The code works without the index, but would still scan every attachment row inside the database.

The ticket body now records the confirmed cause, the design choices and the test plan, with your Symptom and Evidence sections kept as written.

<!-- xgd-turn id="8605cced-d35b-4c3b-86d3-5995b529d8d5-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T02:07:49.761901+00:00" -->
#### You
Is this finished?

<!-- xgd-turn id="8605cced-d35b-4c3b-86d3-5995b529d8d5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T02:08:17.907392+00:00" -->
#### Claude
The code work is finished. I re-checked just now:

- **Ticket:** BUG-395 is at `free_coded`, version 0.2.839, 5 story points.
- **Commits:** both are on `xgd-working`: `19daefc2` (the fix and tests) and `2c86933f` (the merge-back).
- **Branch:** the `free-BUG-395` branch and its worktree have been removed.

Three things still need a decision from you:

1. **Deploy and migration.** Production still runs the old code until it's deployed. The new index (migration `0061`) also has to be applied in production for each photo request to become a single fast query. Neither has been done; tell me if you want me to run them.
2. **The real fix belongs in `lagrange-framework`.** The fix in this repo overrides how the shared ticketing component looks up a ticket's attachments, as a stopgap. The proper fix is in the component itself, in both its JS and Python versions, after which the override can be deleted. I haven't filed that ticket. Say the word and I'll file it there with the diagnosis.
3. **Reconcile.** When you're ready, promoting the ticket to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->