---
uid: comment-5a27fef3
id: COMMENT-5474
type: comment
title: Comment on request REQ-404
created_by: xgd
created_at: '2026-10-18T00:18:30.126040+00:00'
updated_at: '2026-10-18T01:06:01.958606+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ff2c984e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "166cb624-f597-4a0e-99f2-6aa1f774d388",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="5f4c8659-cd43-4ee4-a793-35b76768027a-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T00:16:59.438735+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="5f4c8659-cd43-4ee4-a793-35b76768027a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T01:06:01.242532+00:00" -->
#### Claude
I'm reading through the code the ticket touches before I make any changes: the photo editor, the per-use crop settings, the Library's placement records, and every path that writes site images.

Still reading. The Library and chat callers come next, then the Site tab's Edit-mode click handling.

Now the Site tab's Edit mode and how a click on a picture reaches the selection panel.

Next I'm looking at how the existing editor and Library UATs are built, so the new tests use the same harnesses.

Moving the ticket to `free_coding` and cutting the branch.

Branch is cut. Starting on the server side: the `generated` marker on asset writes, then the Library functions in `material.ts`.

Writing the `material.ts` additions now: the read for one placement, its recipe write, the door, and the backfill.

Now the new exported functions, placed after `placementRecipes`:

Now wiring the door into the one site-store opener in `router.ts`, and adding the routes.

Server side is in. Now the builder: two API calls, the editor's "this use" mode, and the selection in `editor.js`.

Now the selection itself, in `editor.js`:

Now passing a selection that survives reloads from `app.js`:

Builder side is in place. Running the typecheck next.

The fresh worktree is missing the gitignored `generated/` folder (a known quirk). Copying it from the main checkout so the typecheck and tests can resolve:

Writing the Workers UAT file:

Checking a few store method names the test relies on:

Simplifying the import test to post a fresh seed site with one picture, the way the REQ-217 suite does:

Running the new Workers suite:

All 7 pass on the first run, which is reason to check they can actually fail. Quick check: switch the door off and re-run.

Both door tests fail with the door off, so they're real. One more assertion: an ordinary upload must not get a second Library item from the door.

Server side is proven. Now the jsdom suite for the click gesture, against the real bridge, the real editor and the real photo editor. The only doubles are the HTTP calls.

The UI suite passes, not skipped. Same check: break the second-click branch and confirm the tests catch it.

Now the regression scope the ticket names (REQ-220, REQ-229, BUG-213, REQ-282, REQ-130), plus the editor, write_image and import suites the change touches:

While that runs, finishing the inventory of asset-write paths for the commit message:

Meanwhile, updating the ticket body with how the design actually landed (keeping the existing content):

That run picked up the whole suite (my path substitution was wrong), so it says nothing about the scope. Re-running with an explicit file list, split by runtime:

Workers scope: 13 files, 94 tests, all passing. Now the Node-side scope:

Node scope: 41 files, 280 tests, all passing. The door touches every asset write, so I'm also running the full Workers project:

That gave me the list of failing files (my changes were still in place). Now the baseline: my source changes reverted, same 10 files.

Restored cleanly. Re-running both REQ-404 suites to confirm, then committing:

Committed on the branch (`5ea3678`). Now taking the merge lock and merging into `xgd-working`:

Merged cleanly into `xgd-working` (the rematerialize check had nothing to fix). Moving the ticket to `free_coded` and letting the gate bump the version itself:

Ticket is at `free_coded` with both commits recorded, version 0.2.527. Tearing down the branch and worktree:

REQ-404 is implemented, merged into `xgd-working` and parked at `free_coded` (commit `5ea3678` plus the version bump to 0.2.527). The REQ-404 UATs pass (12 tests in 2 files) and so does the regression scope. The existing Library backfill has not been run yet; that one is yours (see below).

**1. Photo editor from Edit mode on the Site tab**
- **First click on a picture:** the selection panel opens as before. The picture stays outlined as selected, even after the page reloads on Save.
- **Click on the selected picture:** opens the same `image-editor.js` the Library and chat use, editing this use only. It has the banner *"Editing this use of IMAGE-n — the Library original is unchanged."* and no name field, because the name belongs to the Library item.
- **Saving:** each change saves immediately to this use's own crop settings, and only that file is re-rendered. The Library item and its other copies, including a second use on the same page, stay as they were.
- **A use with no crop of its own** opens from the Library item's current crop, so it looks the way it does on the page.
- **Two new routes:** `GET /api/site/picture` and `POST /api/site/picture/recipe`.
- **Exceptions:** a drawing (SVG) gets a "redraw, don't crop" message. A picture with no Library item shows *"This picture isn't in your Library — please tell us."* and the fault is logged naming the asset.

**2. Every image on a site has a Library item**
- Rather than patching each caller, I added one wrapper on the single place the app opens a site's storage, so no write path can skip it. After any image write, it creates a Library item for any image no item accounts for, and records where it's placed. Drawings from `write_image` get origin "generated"; everything else gets origin "site".
- To stop the Library's own uploads being catalogued twice, an upload now records its placement just before writing the file, and takes it back if the write fails.
- The commit message lists every path that writes `assets/`.
  - On the server: uploads, recipe edits, `write_image`, imports (including pages reproduced from a capture) and tab icons.
  - The local `1c` CLI keeps sites on disk with no Library, so its images get their item when the site is pushed up.
- **Backfill:** `POST /api/library/backfill` creates items for images already on a business's sites and reports what it created. It changes nothing on the site, and a second run creates nothing.

**What you need to do**
- **Run the backfill once per business** after deploying. It runs per business, not across the whole platform.

**Known gaps, written up on the ticket**
- Deleting a Library item still leaves the site's copy (by design since REQ-281). That picture then shows the "isn't in your Library" message.
- If `write_image` replaces a drawing that's already catalogued, the site file changes but the Library item keeps the old version.

**Tests:** the full Workers run has 17 failing tests in 10 files (REQ-295, REQ-180, REQ-219, REQ-379 and others). With my changes removed, the same 17 fail, so they were already failing.

<!-- xgd-chat-end -->