---
uid: comment-3995e075
id: COMMENT-7802
type: comment
title: Comment on bug BUG-351
created_by: xgd
created_at: '2026-11-05T00:45:37.551181+00:00'
updated_at: '2026-11-05T00:59:56.200996+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-bc335599
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "79210e75-29d8-465a-a2d7-cdc896883c0c",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="1d081e85-b82b-4ead-a50e-bcd859a66915-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T00:45:01.528544+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="1d081e85-b82b-4ead-a50e-bcd859a66915-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T00:59:54.216293+00:00" -->
#### Claude
Reading the Library code and its existing tests before cutting a branch.

Checking what fields the video plugin writes on the clip ticket (duration, playback) so the tile can show them.

Branch cut worked. Next I'm linking `node_modules` into the worktree, following the recipe in my notes.

Running an existing Library suite in the worktree as a baseline before editing.

Now editing `material.ts` (row fields) and `videogen.ts` (recording duration and mode).

Now the CSS, placed beside the Library row and image rules (not at the file's tail).

Now writing the jsdom UAT for the Library.

Library UATs pass (5/5). Now a workers UAT showing that the clip's ticket and its Library row carry the poster, duration and mode.

Both pass. Running the neighbouring Library and clip suites plus typecheck as a regression scope.

Many failures. Checking whether they're pre-existing by re-running with my source changes set aside.

Still running the regression check. The file list wasn't being word-split (zsh), so I'm re-running the before/after comparison correctly.

The one new failure is a test that matches `.builder-library__image {` literally. I'm splitting the video rule out on its own instead of grouping the two selectors.

Renaming the thumb's CSS selector to the class the code actually emits, then running typecheck and the other clip suites.

Those two fail without my change too, so they're pre-existing. Now typecheck.

Typecheck is clean. Re-running the full jsdom set against the baseline after the CSS changes.

No new failures: the 40 red tests are all red without my change too. Next: version bump, ticket body, commit.

Updating the ticket body first, keeping the original text and adding what landed and why.

Committing the work on the branch, then the lock, merge and version-bump loop.

Fast-forwarded. Now the ticket overlay check and the `free_coded` gate.

The gate moved the ticket to `free_coded` but printed a warning. Reading the warning.

It's `free_coded` with both SHAs recorded. Setting story points and cleaning up the branch.

BUG-351 is fixed and merged into `xgd-working`. The ticket is at `free_coded` with both commits recorded, version 0.2.774. The branch has been cleaned up.

**What the client now sees in the Library:**
- **Clip rows show the poster.** The still has a ▶ marker over it and the length beside it (e.g. `5.5 s`). A screen reader hears "video, 5.5 s". A clip with no poster, or one whose poster won't load, shows a labelled 🎞 icon instead.
- **Opening a clip plays it.** The player has controls, is muted and plays inline, with the poster showing until play. Its accessible name is the clip's title. It loops only for `loop`/`pingpong` clips; a reveal plays once. The download link is still there. If the file is gone, the pane shows "That file is no longer in storage." instead of a broken player.
- **The kind filter has `video`**, and choosing it lists only clips.

**One change behind the screen:** the plugin only put a clip's length and play mode in its result and in the text description. So making a clip now also saves both as fields on its Library entry (`duration_s`, `clip_mode`), and each Library row carries those two plus the poster's id.

**Limitation:** clips made before this change don't have those two fields. The jewellery site's existing clips will show their poster and play, but with no length shown and no looping. They would need regenerating, or a one-off backfill read from each clip's description; tell me if you want the backfill.

**Tests:**
- 5 new browser-side tests and 1 server-side test pass. The server-side one makes a clip through the real clip tool, with only the fal video API faked, and checks the Library row.
- Typecheck is clean.
- I ran every existing Library and `builder.css` suite plus the clip suites, with and without the change. There are 40 browser-side failures and 2 in the Library-surface workers suite (AC1722, AC1724), and all of them fail without my change too.
- One existing test (AC-1811) looks up the `.builder-library__image` CSS rule by its exact selector, so the video player got its own separate rule.

I haven't promoted it to `ready_to_reconcile`; that's your call.

<!-- xgd-chat-end -->