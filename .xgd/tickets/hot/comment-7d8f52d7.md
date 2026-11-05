---
uid: comment-7d8f52d7
id: COMMENT-6943
type: comment
title: Comment on request REQ-635
created_by: xgd
created_at: '2026-11-03T00:07:48.675654+00:00'
updated_at: '2026-11-03T00:50:46.800982+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-313f0bd3
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "65e1ca84-4f62-468a-8eb6-852bef9a8a42",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="40f27cf5-c139-41ef-ad76-16cee0ecf05e-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T00:06:11.631405+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="40f27cf5-c139-41ef-ad76-16cee0ecf05e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T00:11:54.564663+00:00" -->
#### Claude
Reading the ticket and the upload/Library code to scope the work.

Still scoping — checking the current per-file ceiling, then I'll come back with questions.

Before coding, there are five decisions I'd like you to make. Each comes with my recommendation, and if you agree with all of them, "go with your recommendations" is enough.

**1. Size limit and how large files get in.** Today an upload is one request, and the Worker reads the whole file into memory (`file.arrayBuffer()` in the `/api/material` route). Cloudflare caps a request body at 100 MB on Free/Pro zones (200 MB on Business), and the Worker has 128 MB of memory. A photo-heavy export of "a few hundred MB" can't arrive that way, and it can't be unzipped in memory either.
- **My recommendation:** for ZIPs only, the browser sends the file in pieces of about 50 MB, and the Worker joins them into one file in storage (R2). The background job then reads the archive's index and pulls out one entry at a time, so it never holds the whole thing. Cap at **1 GB** with a clear refusal past that, since Google Takeout already offers 1 GB as a split size. If an export is split into several ZIPs, each one is uploaded on its own.
- **The alternative:** cap ZIPs at what one request can carry (about 95 MB). It's much simpler, but many Instagram and Facebook exports would be refused.

**2. Site asset or Background information.** The upload window asks which of the two a file is, but an export contains both kinds.
- **My recommendation:** photos and videos take the area the client chose. Text (captions, posts, profile, reviews) is always Background information, because the client's reviews aren't site copy unless the consultant later quotes them.

**3. Cost of describing each photo.** Every picture that goes into the Library gets an AI description. An account with 2,000 posts means 2,000 describe calls.
- **My recommendation:** take the **most recent 300 photos/videos per export** and report the rest as skipped ("1,700 older photos not imported"). Text is never capped. Tell me if you'd prefer a different number or no cap.

**4. Facebook/Instagram HTML exports.** Meta offers HTML or JSON.
- **My recommendation:** read both, but fully parse only JSON. For an HTML export I'd still import the photos and videos and pull the post text out of the HTML. The guide entry will tell clients to choose JSON.

**5. Test material.** I don't have a real export from any of the four platforms. I'd build the test fixtures from each platform's documented folder layout (Instagram's `your_instagram_activity/content/posts_1.json` and `media/…`, Facebook's `your_facebook_activity/posts/…`, LinkedIn's `Profile.csv`/`Positions.csv`/`Shares.csv`/`Articles/`, and Takeout's `Takeout/Google Business Profile/…/reviews.json`). If you have a real export from any of them, even a small or test account, put it somewhere I can read. It's the only way to know the detection matches what platforms send today. It doesn't block starting.

I'll keep all of this in REQ-635, one ticket, on its own branch. The background unpacking will follow the shop import's pattern (REQ-631): a Cloudflare Workflow with one checkpointed step per batch, which also reports progress as it goes.

<!-- xgd-turn id="8e72a232-a260-404c-9e85-b020882a5c64-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T00:16:32.114592+00:00" -->
#### You
cap zips
2 your recommendation
3 your recommendation except let drop to 100
4 yr
5. please create a todo ticket for me to create exports and test them with specific instructions on how to do it

<!-- xgd-turn id="8e72a232-a260-404c-9e85-b020882a5c64-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T00:50:40.169792+00:00" -->
#### Claude
Creating the todo ticket for you with export instructions.

TODO-19 created. Now mapping the client upload callers and the shop-import job pattern.

Checking how blobs are stored — the ticket store caps a blob at 25 MB, so the ZIP itself needs its own place in R2.

Found the per-turn notice hook (`session-delta.ts`); reading it to see where an "export arrived" line fits.

Now reading the ingest path in `material.ts`, which each unpacked item will go through.

Design is settled. Recording the decisions in REQ-635's body before cutting the branch.

`xgd branch cut` needs to write `.git/config`, which the sandbox blocks. Since this whole session is one turn, I'll use the session-lock path on xgd-working instead.

Worktree is up. Making it runnable (node_modules and the generated artifacts), per the setup notes.

Worktree is ready. Running one existing upload suite to confirm the test environment works here.

Environment works (6/6). Now reading the three client upload callers: the Library, chat attachments, and Input questions.

I have enough for the server design. Checking the system knowledge base format for the four guide entries.

Starting to write code. Checking a few signatures I'll call first (`tooBig`, `imageDimensions`, how the router passes `waitUntil`).

Writing the ZIP reader first. Checking the step-runner signature I'll mirror from the shop import.

Writing `zip-reader.ts` (range-read ZIP directory and per-entry inflate).

ZIP reader done. Now the platform planner (`export-plan.ts`): detects Instagram, Facebook, LinkedIn or Google Business Profile, and decides what to import and what to skip.

Writing the job module `material-import.ts` next. Checking what `imageDimensions` can measure, for the tiny-icon skip.

Server modules are written. Wiring the routes into `router.ts` now.

Routes in. Adding the `MaterialImport` Workflow class and its bindings.

Running the TypeScript check on the server changes.

Server type-checks clean. Now the consultant notice: hooking finished imports into the per-turn line in `ai.ts`.

Adding the consultant's "export arrived" notice in `session-delta.ts`, wired through the same per-turn hook as plan answers.

Server path type-checks. Writing the test ZIP builder and fixtures next, then the server UATs.

Test ZIP builder written. Checking whether existing suites build `workerHost` directly, so the consultant-notice UAT can go through the real hook.

Writing the server-side UAT file now (four archive scenarios plus the consultant notice).

Three of six pass. Two failures are wording, and the 100-photo case imported nothing, so I'm checking that one's error.

`MAX_ARCHIVE_PICTURES` was imported from the wrong module (I'd removed that re-export). Fixing the import.

That's a fixture bug: post dates past day 31 are invalid. Spacing them a day apart instead.

All six server UATs pass. Now the browser side, starting with `api.js`'s upload transport.

Checking whether a new builder file has to be registered for the asset build.

Not registered anywhere, so the whole builder directory ships. Updating `uploadMaterial` in `api.js` to send ZIPs to the archive route.

Changing the chat attachment tray so a ZIP waits on its chip and uploads at send time, with the role chosen on the chip.

Tray done. Adding an unpacking-progress area to the Library pane, plus a watcher in `app.js` that feeds it.

Wiring the import watcher into `app.js` so Library and chat uploads show unpacking progress.

Now the Input-question path in `plan-panel.js`: a ZIP answer waits for its unpacking, then cites every item it produced.

Builder files parse. Finding existing jsdom suites for the tray, plan panel and Library drop to model the browser UAT on.

Writing the browser-side UAT (Input question, Library drop, chat attach, and the pre-send size refusal). Checking how the existing overlay suite drops onto the Library first.

My edit of `app.js` left a fragment of the old watcher behind. Inspecting and removing it.

All five browser UATs pass. Adding Facebook and LinkedIn coverage, since the code handles both and they need evidence too.

Eight server UATs pass. Next is item 5, the per-platform guide entries. Checking how the system knowledge base picks up its documents.

The system KB is `doc` tickets with `doc_kind: system_kb`. I'll write one guide doc with an entry per platform, then point the consultant at it from its rules. Reading the rules template first.

Priming already mentions "a social-media export"; I'll extend that one line. Checking the knowledge-search tool name the consultant uses.

Priming line extended in both copies. Creating the system-KB guide doc with one entry per platform.

Guide is DOC-83. Now the regression scope: finding suites that pin the text, config and schema I touched.

`REQ-246_one_content_type_table` may object to the extension tables I added in `export-plan.ts`. Checking what it enforces.

There's one shared extension table (`store/content-type.js`), and a second one fails that scan. Switching `export-plan.ts` to it.

The scan rejects any file naming two MIME families. Reworking `export-plan.ts` to keep only extension lists and take types from the shared table.

Type-check clean. Running the node and jsdom regression batch.

This failure (the "+" button's text) looks unrelated to my changes. Checking it against the main checkout as a baseline.

Same failure on the main checkout, so it isn't mine. Now the workers regression batch.

The critic's prompt is over budget, and I didn't touch the critic. Re-running with my `priming.json` change swapped out to get a baseline.

That failure is on the baseline too, and the consultant's prompt is still inside its budget with my line. Reading my notes on the `free_coded` version gate before committing.

Not hand-bumping the version; the gate will do it. Next I'm updating REQ-635's body so it matches what was built, before committing. Re-reading the current body first.

Ticket body updated. Committing on the branch, staging only my files.

Committed as `370ea70`. Taking the merge lock.

Lock acquired, and REQ-634's edits are now committed. Merging xgd-working into my branch first so the merge back is a fast-forward.

Four conflicts, all against REQ-634's work. Resolving them one at a time.

The `router.ts` imports just combine. In `plan-panel.js`, another session rewrote `upload()` for parallel uploads with progress, so I'm reading their full version before adding the ZIP path to it.

Conflicts resolved and type-checked. Re-running my UATs plus the suites the merge touched (plan panel, shop, inventory).

All green after the merge. Committing it and merging back into xgd-working with `xgd-merge`.

Now `free_coded` at 0.2.741. Setting story points, adding the merge-resolution note to the body, then cleaning up the branch.

Branch cleaned. One memory update: I knew about the merge-commit trap and still hit it, so I'm adding when to apply the check.

REQ-635 is built and parked at `free_coded` (version 0.2.741). All 13 new tests pass, plus the existing suites around uploads, the Library, the plan panel and the shop. One problem with the merge back needs a decision from you (below).

**What it does now**
- **ZIPs are accepted** from the Library, the chat's attach button and Input questions, up to 95 MB. A larger one is refused in the browser before anything is sent, and again by the server, with one message telling the client to export a shorter date range or lower quality, or upload the parts separately.
- **Large files never sit whole in the Worker.** The ZIP streams straight into storage (R2), and a background job reads it one entry at a time. The ZIP is deleted once unpacked, because it can contain messages we never import.
- **Instagram, Facebook, LinkedIn and Google Business Profile exports are recognised by their folder layout.**
  - Photos and videos become Library pictures in the area the client chose, the 100 most recent only.
  - Captions, posts, profile, positions, articles, business info and reviews become Background documents. Each review keeps the reviewer's published name, the stars, the date and the business's reply.
  - Every item is tagged with the export it came from.
  - Messages, other people's data (followers, connections, friends, comments), ads data, account details, avatars, duplicates and tiny icons are skipped, and each skip is reported with its reason.
- **Any other ZIP** is unpacked as its readable files; the rest are listed as skipped, with a reason.
- **Progress:**
  - The Library shows "Unpacking your Instagram export: 40 of 84", then what was added and skipped.
  - A ZIP dropped on the chat waits on its chip and uploads when the message is sent, using the role chosen on the chip.
  - An Input question shows progress in its own upload line, then answers with every item the ZIP produced.
- **The consultant is told once**, on its next turn, what the export added and what was left out.
- **Guidance:** I created DOC-83 in the system knowledge base, with one entry per platform. I also added a line to the consultant's prompt: offer the platform's own export, never ask for a password. DOC-83 reaches the shipped knowledge base at the next `1c kb build`.

**Things to know**
- **The merge back:** While I worked, BUG-329 rewrote the plan panel's upload code and REQ-634 added migration 0041. My fixes for both are only in the merge commit `145ec5e`, which reconcile doesn't carry, and I noticed only after merging back. Reconcile will hit conflicts in those spots when it replays my main commit. I added a "Merge note" to the ticket body describing the intended result, so the conflict resolver has something to go on. If you'd rather not depend on that, I can make a follow-up commit that re-applies those fixes explicitly.
- **Two failing suites were already red without my changes:** BUG-244 (the "+" button's text) fails the same way on xgd-working, and REQ-466 fails with my prompt line removed (the critic's prompt is 8653 characters against a budget of 8600).
- **Not yet tested:**
  - Video files inside exports go through the normal upload path, but no test covers them.
  - Reloading the page during an unpacking loses the progress line; the job itself keeps running.
  - Imported site photos are Library pictures marked for the site; they aren't copied into the site's own assets.
- **Branch and versioning:** `xgd branch cut` couldn't write `.git/config` in the sandbox, so I created the worktree by hand. The version bump was done by the `free_coded` gate itself.
- **TODO-19 is for you:** step-by-step instructions to request real exports from all four platforms, save them in `storage/tmp/exports/<platform>/` (which git ignores), and test them on dev. The detection is built from each platform's documented layout, so a real export is the only proof it matches what they send today.

Commits: `370ea70` (the work) and `3d13512` (version bump), both on xgd-working, 13 story points. Promoting to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->