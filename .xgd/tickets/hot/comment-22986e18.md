---
uid: comment-22986e18
id: COMMENT-5762
type: comment
title: Comment on request REQ-470
created_by: xgd
created_at: '2026-10-26T19:22:52.995165+00:00'
updated_at: '2026-10-26T19:46:58.269724+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-9c9650ab
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "84279f8c-b963-45f9-83cc-9c7378dc7f94",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f00ef373-af7e-4602-94fa-ce59b1c38607-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T19:21:48.950117+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="f00ef373-af7e-4602-94fa-ce59b1c38607-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T19:46:55.093679+00:00" -->
#### Claude
Ticket is at `free_coding`, branch `free-REQ-470` cut. Reading the REQ-461 video code now before I make changes.

Still reading: renderer, runtime script and capture are mapped; now the fold, the existing REQ-461 tests and the consultant guidance text.

Now the existing REQ-461 tests, so the new UATs follow their harness.

Writing the schema and validator changes now.

Now the renderer and the runtime script.

Capture and fold next.

Now the consultant guidance (op description only, per the BUG-129 budget).

Typecheck is clean across all four packages. Writing the UATs now.

25/25 green. Now the Chromium round-trip, the BUG-48 rule provocations, and the guidance UAT.

Round-trip passes in Chromium (ran, not skipped). Adding the BUG-48 provocations for the two new rules.

Narrowing which rule key lacks a provocation in the BUG-48 coverage test.

`ascendingAnimateStops` is the unprovoked rule — not one of mine. Reverting the debug line and confirming it's pre-existing.

Pre-existing (from 5ea0b90de5, another ticket). Checking that my keys pass once that one is skipped, since the loop stops at the first failure.

With unprovoked keys skipped, all 8 pass — so both new rules refuse with their exact statement. Confirming the base failure on clean xgd-working:

Baseline fails identically — pre-existing. Now the guidance UAT (workers pool).

Guidance + REQ-461 clip tool suites green. Running a wider regression scope (L1 envelope, render, capture/fold, priming budget).

Regression run hit vitest's long-filter quirk; retrying with short substring filters.

Three failures in capture suites; checking whether they're pre-existing on clean xgd-working.

All three fail identically on clean xgd-working — pre-existing. Last check: the workers-pool priming-budget suites.

Everything in scope is green. Updating the ticket body with an as-built section, then version bump and commit.

Updating the ticket body (append-only, preserving existing content).

Committing the code on the branch, then lock → merge working in → bump → merge back.

Lock held. Merging xgd-working into the branch, then bumping the version at the tip.

Fast-forwarded onto xgd-working. Moving the ticket to `free_coded`.

REQ-470 is built and merged into xgd-working, and the ticket is at `free_coded` (commits `d6598bdf68` and `31482444fd`, version 0.2.671, 5 points). I didn't need to ask you anything first; the decisions I made myself are below. The pilots on Dina's Diner and Lagrange Foundry still need you: generating the clips, placing them on dev, and `bin/deploy --env dev`.

**Intro then loop**
- The `video` node has a new optional `loopSrc`. It passes the same URL and `.mp4`/`.webm` checks as `src`, and is resolved and published as an asset like `src` and `poster`.
- The page uses a single `<video>` element. When the intro ends, the same element switches to the loop clip and loops, or rests `restMs` between plays. While the loop loads, the element shows the poster, which is the frame both clips meet on, so the handover doesn't jump. I haven't checked this in a real browser yet; the Dina pilot is where to look for a flicker.
- `replay: once_per_session` skips the intro on a repeat view and goes straight into the loop. `every_visit` plays the intro every time.

**Hover**
- `trigger: 'hover'` is a new allowed value. Hover is taken from the clip's nearest focusable ancestor (for example the card's link), or from the clip itself if there isn't one. Mouse over or keyboard focus plays it from the start; leaving stops it and puts the poster back.
- Nothing is downloaded until the first hover. I didn't add a separate "pointer is near" preload, so the clip starts loading on the first hover itself.
- On a device that can't hover (`(hover: none)`), it plays once the first time it scrolls into view and doesn't replay.

**Both:** with reduced motion turned on, only the poster shows and neither clip is fetched. Capturing a rendered page and folding it back gives the same node, for both features.

**Decisions I made**
- Two new validation rules: `loopSrc` is only allowed when `playback` is `once`, and a `hover` clip can't have `loopSrc` or `replay`.
- `restMs` is now also allowed on a `once` clip that has a `loopSrc`; it applies to the loop part.
- The consultant guidance is in the clip tool's description, so it doesn't count against the priming budget. It now offers reveal-then-loop alongside either/or, says the client agrees the order too, and names hover as the trigger for illustrations. Hover clips don't count towards the one-hero limit.
- The one-line summary every consultant turn sees drops "hero": it now reads "A slow clip from a stored picture."

**Tests:** all the new UATs pass. They cover the rules, the page markup, the browser behaviour (simulated), the Chromium round-trip and the guidance. The existing clip tests and the priming-budget suites still pass.

Four tests fail, and they fail the same way on clean xgd-working, so they aren't caused by this change:
- The test that checks every validation rule can be triggered (BUG-48) fails because `ascendingAnimateStops` and one other rule have no example input. `ascendingAnimateStops` came in with commit 5ea0b90de5. I added example inputs for my two new rules, and they pass.
- Three capture tests fail: `reconciliation-l1-fold` AC694, `req83` hints, and `REQ-269` link target.

The ticket body has an "As built" section with these decisions and the test list.

<!-- xgd-chat-end -->