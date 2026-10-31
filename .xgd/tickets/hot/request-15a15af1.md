---
uid: request-15a15af1
id: REQ-471
type: request
title: 'Hero clips: pause button on endless loops (WCAG 2.2.2)'
created_by: EPIC-26
created_at: '2026-10-26T23:38:26.888915+00:00'
updated_at: '2026-10-27T00:03:50.805236+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-2a432012
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-9c3741a8
  commits:
  - working_sha: b55e2acb99ce7b5cb0154aa3440a43888d97aaae
    reconcile_sha: null
    main_sha: null
  - working_sha: 48ccec31b87ecb39fd486f2ecf56b95709913ec8
    reconcile_sha: null
    main_sha: null
  version: 0.2.674
  story_points: 3
---

## Intent

WCAG 2.2 SC 2.2.2 Pause, Stop, Hide (Level A) requires a way to pause any motion that starts by itself, lasts more than 5 s and sits alongside other content. A mood loop doesn't count as "essential", and honouring reduced motion alone does not satisfy it. The DOC-72 motion survey found that no surveyed site with a loop longer than 5 s offers a pause control, and our `video` node (REQ-461, REQ-470) doesn't either. Operator decision (2026-10-26, EPIC-26): endless loops get **a small pause button that appears on mouse-over**.

## Behaviour

- **Which clips get it:** every `video` node that keeps moving without the visitor doing anything:
  - `playback: 'loop'`, including one with `restMs` (it keeps restarting);
  - the loop part of an intro-then-loop node (`loopSrc`, REQ-470). The button is available from the start, including during the intro.
- **Which clips don't:** a `playback: 'once'` clip with no `loopSrc` (it stops by itself) and a `trigger: 'hover'` clip (it moves only while the visitor points at it and stops when the pointer leaves).
- **The button:**
  - small, in a corner of the clip, and it doesn't change the clip's framing or the layout;
  - hidden at rest, shown while the pointer is over the clip, and shown whenever the button itself has keyboard focus, so keyboard users can find and use it;
  - pressing it pauses on the current frame, and pressing again resumes;
  - its accessible name says what it does ("Pause video" / "Play video", or with `aria-pressed`);
  - a paused clip stays paused for the rest of that page view. Its rest timers and the intro-to-loop handover don't restart it.
- **On touch (`(hover: none)`):** there is no mouse-over, so the button is shown faintly all the time, and fully when touched or focused. Default chosen for the operator, who can override it.
- **Reduced motion:** poster only, nothing plays, so there is no button. This is unchanged from the REQ-461 rule.
- **Typed, not configurable:** the button is a fixed part of the renderer and runtime for qualifying clips. There's no L1 key to turn it off, and no raw HTML or CSS comes from instance data (Security Policy). The L1 schema doesn't change, and `capture(render(L1)) ≈ L1` must still hold: capture ignores the button.
- **Without script:** the clip shows its poster (REQ-461), so nothing is left without a control.

## Why free-coded

A small renderer/runtime addition to the existing `video` node, needed for Level A accessibility.

## Test plan (UATs named `test_UAT_FC_<REQ-ID>_*`)

- **Renderer:** a `loop` node and a `once` + `loopSrc` node emit the pause button; a `once` node without `loopSrc` and a `hover` node do not.
- **Runtime (jsdom):**
  - the button is hidden at rest and shown on pointerenter and on focus;
  - pressing it pauses the video and flips the accessible state, and pressing again resumes;
  - a paused `restMs` loop is not restarted by its rest timer, and a paused intro is not handed over to the loop;
  - under `(hover: none)` the button is shown without hover;
  - under reduced motion there is no button.
- **Round-trip (Chromium):** `capture(render(L1)) ≈ L1` still holds for a looping node now that it renders the button.

-