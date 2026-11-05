---
uid: bug-9d19e6ae
id: BUG-325
type: bug
title: 'Builder preview: Replay animations doesn''t replay play-on-load animations'
created_by: EPIC-19
created_at: '2026-10-31T22:49:07.932973+00:00'
updated_at: '2026-11-01T00:37:21.470215+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: low
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-09c5e246
  commits:
  - working_sha: 59938ef03a0fc3a0530c6b832c0aa654a71e9f41
    reconcile_sha: null
    main_sha: null
  - working_sha: c5a0c984808b244755be471b7d96124c699d6fd2
    reconcile_sha: null
    main_sha: null
  version: 0.2.722
  story_points: 2
---

## Symptom

Production, 2026-10-31, the 1st Contact site (`site_c4bed79aeb647305a5e3098f70d6dca3`): pressing **Replay animations** in View doesn't replay the home page's wordmark entrance (the "quiet arrival": `wordmark-static` image, `animate: { trigger: "load", durationMs: 1200, iterations: 1, stops: opacity 0→1, translateYPct 9.4→0 }`).

## Root cause

`replayAnimationsAction` calls `panel.reloadDocument({ still: false })`. Since BUG-248, a reload loads the newer page in a **hidden frame behind the shown one** and swaps it in once loaded (`panel.js`, `refreshing` / `finishRefresh`), so the pane never blanks. `still: false` only keeps the reveal script (`L1_REVEAL_SCRIPT`, `stillPage` in `router.ts`), which serves scroll-in entrance reveals, and those wait for the element to be in view, so they still play after the swap. An `animate` with `trigger: "load"` is a CSS animation that starts when the document loads, so it plays in the hidden frame and is finished before the frame is shown.

## Fix

- **A replay shows every animation from its start, in view.** After a `still: false` refresh swaps the new frame in, the panel restarts the document's load-triggered animations (e.g. `document.getAnimations()` on the swapped-in document: reset to time 0 and play), and a looping or once-playing clip with `trigger: load` restarts from its beginning.
- A normal refresh after an edit (`still: true`) is unchanged: it arrives settled, with no motion replayed.
- Reduced motion still wins: nothing is restarted when the viewer prefers reduced motion.

## What changed (as implemented)

- `apps/control-app/src/builder/panel.js`: the refresh record now carries `still`. When a `still: false` refresh is swapped in (`finishRefresh`), `replayMotion` runs on the incoming frame:
  - every animation on the document's own (time-based) timeline is set to time 0 and played. Animations on a scroll timeline (`scrollTrack`) are skipped, since they track where the reader is rather than playing; CSS transitions are skipped, since they are state changes, not page motion.
  - every `<video>` whose `data-l1-video-trigger` is absent or `load`, and which has started (playing or ended), is set to time 0 and played. Clips waiting for hover or for being scrolled to are left to their own trigger.
  - nothing is restarted when the preview window matches `(prefers-reduced-motion: reduce)`.
- If a refresh is re-pointed while loading, the newest request's `still` applies (the same rule as its URL).
- A refresh after a write (`still: true`, the default) does none of this.

## Test plan

`tests/test_UAT_FC_BUG-325_replay_restarts_load_animations.test.ts` (Chromium; the real `createDisplayPanel`, the toolbar's `replayAnimationsAction` button, `previewStillUrl` and `builder.css` served from the repo; a preview page carrying the renderer's `trigger: "load"` rule and a slow picture so the document's `load` comes after the animation has finished):

- `test_UAT_FC_BUG-325_replay_restarts_load_animations`: after the first load the arrival is finished; pressing Replay animations asks for the page without `?still=1`, and after the swap the wordmark's animation is running near time 0 with opacity below 1, then plays to its end. Fails without the fix (`finished`, not `running`).
- `test_UAT_FC_BUG-325_edit_refresh_stays_still`: a refresh after a write (`reloadDocument()`) asks for `?still=1` and the swapped-in wordmark is settled (animation finished, opacity 1).
- `test_UAT_FC_BUG-325_reduced_motion_replays_nothing`: with the viewer preferring reduced motion (and the page's motion deliberately left ungated), Replay animations restarts nothing.

Video clip restarts are implemented but not covered by a UAT (headless Chromium here has no reliable autoplaying clip fixture).