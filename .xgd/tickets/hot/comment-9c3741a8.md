---
uid: comment-9c3741a8
id: COMMENT-5764
type: comment
title: Comment on request REQ-471
created_by: xgd
created_at: '2026-10-26T23:50:07.637404+00:00'
updated_at: '2026-10-26T23:58:56.328987+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-15a15af1
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "3e2ec7ba-17d3-4049-9551-b8c54500c524",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="bb8b3d1b-f669-4169-9cb3-f4c3a3bc45e3-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T23:49:32.586283+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="bb8b3d1b-f669-4169-9cb3-f4c3a3bc45e3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T23:58:55.163467+00:00" -->
#### Claude
Scope is clear and the ticket body is complete. Moving to `free_coding` and cutting the branch.

I'm reading the existing video renderer, its runtime script, and the capture code so I know where the pause button can go without changing layout or the round-trip.

Now implementing the renderer side.

Now the edits — RenderState flag, constants and stylesheet, the runtime, and `videoHtml`.

Installs are present. Running the existing REQ-461/470 video suites to see what my change breaks.

Only the expected break: REQ-461 said a plain loop ships no script, and this ticket deliberately changes that. Updating that assertion and writing the new UATs.

Writing the UATs now: a jsdom file for renderer and runtime behaviour, and a Chromium file for placement and the capture round-trip.

All 33 pass. Now the Chromium suite: placement (corner, no layout change, shown on hover/focus) and the capture round-trip.

Both browser UATs actually ran. Now a wider regression pass over suites that touch video, the L1 renderer security envelope, and the reference docs.

This failure is about schema structural rules, which I didn't touch. Checking it against clean xgd-working.

The BUG-48 failure is already there on clean xgd-working, so my change didn't cause it. Next: typecheck and lint.

Typecheck is clean. Checking whether any KB or guidance text still says a plain loop ships no script.

No stale guidance anywhere. Moving to the commit, after checking the version-bump convention for this repo.

First I'll commit the work on the branch, then update the ticket body before merging back.

Commit is in. Adding an "As built" section to the ticket that records the decisions made during implementation, including the REQ-461 supersession. The existing body stays as it is.

Next: lock, merge xgd-working into the branch, bump the version, fast-forward back, and promote. This runs as a retry loop because other sessions commit to xgd-working concurrently.

REQ-471 is implemented and merged into xgd-working. The ticket is at `free_coded` (commits `b55e2acb99ce` and the version bump `48ccec31b87e`, version 0.2.674, 3 story points). It's ready for you to promote to `ready_to_reconcile` when you want.

**What a visitor sees:**
- **Which clips:** a `loop` clip that isn't hover-played, and an intro-then-loop clip (`loopSrc`), get a small round pause button in the clip's bottom-right corner. It's there from the start, including during the intro. `once` clips without `loopSrc` and hover clips don't get one.
- **Showing it:** the button is invisible at rest. It appears while the pointer is over the clip or the button, or when the button has keyboard focus. On touch screens it is always faintly shown.
- **Pressing it:** it pauses on the current frame and becomes "Play video"; pressing again resumes. A paused clip stays paused for the rest of the page view: its rest timer and the intro-to-loop handover don't restart it.
- **Reduced motion:** nothing plays and there is no button, as before.

**Design decisions you might want to check:**
- **Plain loops no longer `autoplay`.** For the ticket's "without script, the clip shows its poster" to be true, every clip that gets a button now has to be started by the runtime script, including plain loops. That reverses a REQ-461 rule: a page with a plain loop used to ship no script and now ships the video script. I updated the one REQ-461 test that checked this and wrote the change into the ticket.
- **Where the button sits in the page.** It's written as the element right after the `<video>`, not as a wrapper around it, so the clip's framing CSS isn't touched. It is absolutely positioned and placed by the script measuring the clip on screen, so it lands in the right corner whatever the surrounding layout is.
- **Capture ignores it.** The button stays hidden under capture's reduced-motion setting, and it carries `data-fc-invariant`, the marker capture already uses to skip renderer-owned elements. The round-trip still holds.
- **Labelling:** I swap the label between "Pause video" and "Play video" rather than adding `aria-pressed`, so the two patterns aren't mixed.

**Tests:**
- **New:** `test_UAT_FC_REQ-471_video_pause_button.test.ts` (renderer and runtime, 8 tests) and `test_UAT_FC_REQ-471_video_pause_in_a_browser.test.ts` (2 tests in Chromium). The browser tests ran rather than skipped, using Chromium's single-process mode in the sandbox. They check:
  - the button sits inside the corner;
  - the clip and the content after it lay out exactly the same with or without the button;
  - it shows on hover and on Tab focus, and Enter toggles it;
  - the capture round-trip still reproduces the clips' settings, and nothing of the button comes back.
- **Existing:** the REQ-461 and REQ-470 video suites and the REQ-82 envelope suite pass, and the framework typecheck is clean.
- **One failure that isn't mine:** `test_UAT_FC_BUG-48_every_stated_rule_is_one_the_validator_actually_refuses` fails, but it fails the same way on clean xgd-working.

The ticket body keeps its original text and now has an "As built" section with these decisions and the test list.

<!-- xgd-chat-end -->