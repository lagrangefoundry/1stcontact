---
uid: comment-09c5e246
id: COMMENT-5991
type: comment
title: Comment on bug BUG-325
created_by: xgd
created_at: '2026-11-01T00:24:46.774592+00:00'
updated_at: '2026-11-01T00:35:54.335773+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-9d19e6ae
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "08a00417-e057-4a88-a8c6-a08dec86d6e1",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="7db497c1-9e9d-47e8-9b95-2e1adbd1a319-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T00:22:56.886298+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="7db497c1-9e9d-47e8-9b95-2e1adbd1a319-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T00:35:53.305665+00:00" -->
#### Claude
Reading the refresh/swap code in `panel.js`; next I'll check how still pages are served and find the existing Chromium preview tests to build on.

Planning the fix (restart the swapped-in document's animations after a `still: false` swap) and checking how an existing Chromium test serves pages before writing the UAT.

Scope is clear from the ticket; no questions. Setting the ticket to `free_coding` and cutting the branch.

Now the code change in `panel.js`.

Fix is in `panel.js`; now writing the Chromium UAT that drives the real panel, toolbar button and stylesheet.

All three pass. Confirming the replay test fails without the fix:

Bug reproduced without the fix (`finished` where `running` was expected), fixed with it. Running the neighbouring panel/refresh suites:

Missing generated artifacts in the fresh worktree (known setup gap); copying them from the main checkout and rerunning.

Updating the ticket body to describe what landed (keeping the original text), then committing.

Committed. Now lock, merge `xgd-working` into the branch, bump the version on the branch, fast-forward back and move to `free_coded` (retrying if another session's ticket commit races the tip).

Moved to `free_coded` at version 0.2.722. The rematerialize helper wasn't at the path the lock printed, so I'll run the CLI form:

Nothing needed rematerializing. Tearing down the branch:

BUG-325 is fixed and merged into `xgd-working`. The ticket is at `free_coded` with commits `59938ef0` (the fix and its tests) and `c5a0c984` (version bump to 0.2.722), story points 2. I had no questions for you first; the ticket's scope was clear.

**The fix.** Replay animations now replays the wordmark's load animation. Since BUG-248 the newer page loads in a hidden frame behind the shown one, so the animation used to finish out of sight. Now, when a Replay animations refresh is swapped in, the preview pane (`apps/control-app/src/builder/panel.js`) restarts the page's animations from the start:
- **Skipped on purpose:** scroll-driven animations (they follow where the reader is, they don't "play") and CSS transitions.
- **Videos:** clips that play on load and had already started are also restarted from the beginning. Clips that wait for hover or for being scrolled to are left alone.
- **Reduced motion:** if the viewer prefers reduced motion, nothing is restarted.
- **Refresh after an edit:** unchanged. The page still arrives settled with no motion.

**Tests.** I added three Chromium tests in `tests/test_UAT_FC_BUG-325_replay_restarts_load_animations.test.ts`. They drive the real preview pane, the real toolbar button and the builder's stylesheet. The preview page uses the same CSS rule the renderer writes for a play-on-load animation, plus a slow image so the page finishes loading after the animation has ended, as it did in production.
- Pressing Replay animations shows the animation running from near the start, then playing to its end. With the fix removed this test fails (the animation reads `finished` instead of `running`), so it reproduces the bug.
- A refresh after an edit stays still.
- With reduced motion, nothing replays.

All three pass. The nearby suites pass too: the BUG-248 refresh tests, BUG-283, the toolbar tests, REQ-248, REQ-115, REQ-117, and copy-edit live preview. One nearby suite didn't run properly: `reconciliation-builder-workspace-origin` failed because the fresh branch had no built control-app assets (it asks for `1c assets`). That suite checks how the server serves the builder's files, not the preview pane.

**Not covered:** the video restart has no test. I didn't find a dependable way to get an autoplaying clip in headless Chromium here, so it is only checked by reading the code. The ticket body says this, and now describes what was built alongside your original text.

The ticket is ready for you to promote to `ready_to_reconcile` when you want.

<!-- xgd-chat-end -->