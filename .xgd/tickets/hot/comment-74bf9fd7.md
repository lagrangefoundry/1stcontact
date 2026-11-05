---
uid: comment-74bf9fd7
id: COMMENT-7763
type: comment
title: Comment on bug BUG-341
created_by: xgd
created_at: '2026-11-04T16:22:54.806747+00:00'
updated_at: '2026-11-04T18:30:23.669419+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-5f059f10
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "4b35c78f-d10b-41b6-9518-a0e58dadafa7",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="20100dff-23e1-42c7-a289-d5fcc6a3c4c8-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T16:19:34.993324+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="20100dff-23e1-42c7-a289-d5fcc6a3c4c8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T16:42:43.855992+00:00" -->
#### Claude
Investigating the page-check path: shot.ts serves every in-page request in-process, and BUG-338 recently added catalog photos to that path — checking how those bytes reach the browser.

Tracing how the CDP bytes move through `@cloudflare/puppeteer` inside the worker (screenshots and fulfilled photo responses both cross it as base64 strings).

Each photo request first runs `this.store.loadDraft(slug)` (the whole draft) before it reads the photo — with ~200 concurrent photo requests that's 200 live drafts. Checking what loadDraft costs.

Draft is tiny (12 KB), so that isn't it. 336 live items, photos ~MB-scale JPEGs. Next suspect: the per-photo ticket-store reads (`materialTicket` + `attachments` + blob).

Before going further on the photo path, checking the other half of "checking the pages": the full-page screenshot is decoded and tiled in JS (REQ-363), and a 336-item catalog page is very tall.

Measuring puppeteer's `getResponse` on a photo-sized body in V8 directly.

Root cause is clear enough to fix. Checking the test setup to write the UATs.

Setting the ticket to free_coding and cutting the branch.

As the memory predicted. Attaching the worktree by hand.

Implementing. First, checking whether `@cloudflare/puppeteer` (and `shot.ts`) load under the node test pool, which decides where the encoder UAT runs.

Design settled. Checking the catalog test fixture so the UAT can drive 150 live items through the production assembly.

Core fix is in `cf-driver.ts`; now fixing one comment's wording, then wiring the encoder into `shot.ts`.

Now the UAT file (workers pool, production assembly, 150 live items).

Running the new workers UAT.

Encoder test passes. The grid only drew 24 cards — a page-size default. Checking the catalog config.

The catalog module caps a grid page at 100 cards, so one page can show at most 100 photos. Adjusting the UAT to 100 items on one page (the real maximum) and noting that in the ticket.

Both pass. Checking the gate test actually discriminates: temporarily bypassing the gate.

Node pool: 5 files pass. Now the 43 workers-pool suites.

8 failures in 7 files that look unrelated to this change (prompt budgets, priming, cue turns). Baselining those 7 files on clean `xgd-working`.

Same 8 failures on clean `xgd-working`, so they predate this change. Checking for a lint/typecheck script before committing.

Ticket updated. Committing on the branch.

Now the merge-back sequence: lock, merge `xgd-working` into the branch, bump, fast-forward back, promote.

Fast-forwarded onto `xgd-working`. Promoting the ticket.

I've fixed BUG-341. It's merged into `xgd-working` and the ticket is at `free_coded`; I haven't promoted it to `ready_to_reconcile`. I haven't tested the fix against the live dev worker. The tests below use a fake browser, so the real proof is the dev worker getting through "checking the pages" on this site.

**Cause.** "Checking the pages" drives a browser at the draft preview, and the worker itself answers every request that browser makes. A catalog page asks for every product photo at once. Two things made that blow up the heap:
1. **The browser library's encoding is very wasteful.** `@cloudflare/puppeteer` converts each response to base64 using about 28× the photo's size in worker memory. A 3 MB photo took 85 MB. A 24 MB photo can't be converted in a 96 MB heap at all: the process dies with the same "JavaScript heap out of memory" as the dev crash.
2. **Nothing limited how many were held at once.** Each converted photo stays in memory until the browser takes it, and the page check shoots several screen widths in parallel. With a 100-card grid, the worker held **302 photos in flight at once**. This site has 336 live products, mostly around 2.7 MB with the largest about 22 MB, so that's over a GB.

The dev log fits: just before the last crash, the builder's own preview requests for photos were each taking about 4 s to answer while the worker was busy converting. The draft itself is only 12 KB, so it's not the source.

**Fix.**
- **A cap on photos in flight:** at most 6 at once across the whole worker, however many products or widths are involved (`tools/generate/src/cli/capture/cf-driver.ts`).
- **A cheaper conversion:** it converts in small chunks at about 2.7× the photo's size. `apps/control-app/src/shot.ts`, the one file allowed to import the browser library, swaps it in for the library's own when it loads.
- **Every photo still arrives with its own bytes**; only the number held at once changed.

**Tests** (2 commits, version 0.2.756):
- **Full screenshot on a 100-product page:** uses the real assembly with a fake browser that asks for everything at once. Every photo arrives correctly and no more than 6 are in flight, including on a second check of the same page. With the cap removed this test fails at 302 in flight. The ticket asked for 150 items, but the catalog grid shows at most 100 per page, so I used 100.
- **Library check:** the library's own request class sends a 3 MB photo through the new conversion with the bytes intact.
- **Memory limit:** a 24 MB photo converts inside a 96 MB heap.
- **Regression:** I ran every suite that touches these files (48 files). 8 tests in 7 files fail, and the same 8 fail on clean `xgd-working`: BUG-278, BUG-284, REQ-386, REQ-436, REQ-458, REQ-466 and REQ-473.

**Not done (recorded on the ticket):**
- **Production logs:** I didn't look at the 2026-11-03 production `exceededMemory` kills. The same code runs in production, where the 128 MB limit would be hit much sooner, so it's a likely contributor, but that's unconfirmed.
- **One more memory cost:** the browser driver still keeps a copy of every photo it served until it closes. This sits outside the JavaScript heap, so it didn't cause this crash, but it does count against production's 128 MB. It would need its own ticket if the production logs point at it.

<!-- xgd-turn id="49a665fd-fc4a-4e95-bd64-8da051ccf926-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T18:13:30.159109+00:00" -->
#### You
More scope has been added to this ticket - the crash is not solved - please read and proceed with the fix

<!-- xgd-turn id="49a665fd-fc4a-4e95-bd64-8da051ccf926-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T18:30:17.405463+00:00" -->
#### Claude
The new evidence points to the start of a builder pass (REQ-627), not the page check. Finding the code that writes the opening capture.

The case recorder snapshots the **whole Library** (`libraryCatalogue`) at every builder start — and the shop import (BUG-335) put thousands of product photos into the Library. Reading it.

`read(name)` resolves an item by name. If the worker's implementation lists the whole Library to find one name, `libraryCatalogue` is O(N²) with all N reads concurrent. Checking.

Exported (3.5 MB of real rows; stays out of the repo — it's customer data, scratch only). Cutting the branch for this round and moving the ticket back to `free_coding`.

The cut provisioned a real install this time; it only lacks the shared `@lagrangefoundry` link. Adding it.

Writing a scratch reproduction (not to be committed): real dev rows loaded into the test D1, then `libraryCatalogue` over the worker's real `chatLibrary`.

Passes on the real data, same heap that died before. I need the catalogue's own duration: is a builder start now slowed by seconds? Surfacing it.

`name` is the material uid, so texts key by `subject_uid` directly. Implementing `materialTexts` (one scan), `LibraryDeps.texts()`, and switching `libraryCatalogue` to it.

Real data: **421 ms** (was 12.7 s bounded, and an OOM before), with output identical in size (2.857 MB). Checking nothing else in a builder's start-up walks the Library per item the same way.

Writing the UAT (synthetic data only: 320 photos, one text document and 500 KB of transcript-like comments; nothing from the customer).

Passes. Checking it discriminates: temporarily putting back the per-item `text` read.

Discriminates: 326 comment scans with per-item reads, against the bound of 32. Removing the scratch files, then typecheck and regression scope.

Three of those stubs are already partial (no `text` either), so they never reach this path. I'll add `texts()` to the two that implement `text`, matching each one's own data.

Now the regression scope: every suite touching the case recorder, the Library, material text, REQ-627's builder step, plus the earlier BUG-341 suites.

8 failures in 4 node files. Baselining those on clean `xgd-working` before reading any of them.

The same 8 fail on clean `xgd-working`, so they predate this change. Now the 34 workers files.

Body is intact. Committing, then the merge-back sequence.

I found and fixed the real cause of the crash. Dev won't pick it up until it's redeployed: run `bin/deploy --env dev`, then restart the dev worker. The fix is merged into `xgd-working` and the ticket is at `free_coded` with all four commits (version 0.2.757). I haven't seen it work on the live dev worker yet.

**Cause.** Your lead was right: the crash happens when a builder pass starts. Dev records every builder pass as a replayable case (REQ-452), and that record includes a snapshot of the whole Library: each item's description and its own text. The text was looked up separately for every item, all at once. Each lookup made the ticket store load every comment the business has, chat transcripts included, and only then pick out that item's text. After the shop import, this business has **1,617 Library items** and **642 KB of comments**. So each builder start held up to 1,617 copies of the comments at the same moment, which is well over a GB.

That explains why only dev crashes (production records cases only when a client opts in), why it started after the import, and why the screenshot fix made no difference.

**Reproduced.** I loaded this business's real ticket rows from the dev database into a scratch test and ran the Library snapshot. It killed the runtime in 11 s with your exact log signature (`Mark-Compact (reduce) 1399.2 -> 1399.2 MB … heap out of memory`). With the fix, the same data finishes in **421 ms** and produces a snapshot of the same size. The scratch test used customer data, so I didn't commit it.

**Fix:**
- **One read for all texts:** the Library gains a `texts()` call that returns every item's text from a single pass over the comments. The snapshot uses it once instead of once per item.
- **Remaining reads capped:** the per-item description reads (one cheap lookup each) now run at most 8 at a time, however large the Library is.
- **What the builder sees is unchanged:** reading a single item's text works as before.

**New test** (synthetic data only): a real builder pass, through the worker's own routes with only the model scripted, against a business with 320 photos, one text document and 500 KB of transcript comments.
- The case is saved with all 321 items, and the document's text is recorded word for word.
- The comments are scanned fewer than 32 times in the whole turn. With the old per-item lookup put back, it fails at 326.
- I ran every suite touching these areas (48 files). 10 tests fail, and the same 10 fail on clean `xgd-working`: 8 in four node files (REQ-452 and REQ-454 replay, BUG-252, one reconciliation suite) and 2 in REQ-295 delegation.

**Still open (on the ticket):**
- **The ticket store's lookup itself is still slow:** any search loads every ticket of that type before filtering. That component lives in the sibling `@lagrangefoundry/ticketing` repo, so a proper fix there would be a ticket in that repo.
- **The builder's later start-up wasn't profiled:** in every crash only the case write ran before the worker died.
- **Earlier section relabelled:** the screenshot-path fix from the first round is a real cost and stays in place, but it wasn't what killed dev. I've relabelled that section of the ticket to say so.

<!-- xgd-chat-end -->