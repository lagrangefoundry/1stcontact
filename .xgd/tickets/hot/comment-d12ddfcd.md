---
uid: comment-d12ddfcd
id: COMMENT-7940
type: comment
title: Comment on request REQ-664
created_by: xgd
created_at: '2026-11-07T21:32:27.883989+00:00'
updated_at: '2026-11-07T22:07:46.090712+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-d281d707
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "083cd71d-2ae5-4bef-8640-4254e87639b0",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="4ddd06b1-c5a0-4652-96cb-1c20fd95a56b-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T21:31:04.787951+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="4ddd06b1-c5a0-4652-96cb-1c20fd95a56b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T22:07:43.173306+00:00" -->
#### Claude
I've confirmed REQ-664 isn't a duplicate. Now I'm reading the existing `video` node code from REQ-461/470/471 (schema, renderer, runtime, capture, pause button) so the slideshow can build on it.

Still mapping the video code: now looking at how `render.ts` emits a video and its runtime script.

I've mapped the whole video path: schema → validate → render/runtime → capture → fold. Next I'm reading the existing video UATs to copy their patterns, then I'll cut the branch.

Not a duplicate, so I'm moving to implementation: setting the ticket to `free_coding` and cutting the branch.

Worktree is ready. Running the existing video UATs once as a baseline before I change anything.

The capture round-trip tests skip in this sandbox. I'm checking my notes on how to get them running before I write the slideshow's round-trip UAT.

Real WebM clips can be recorded in-page and played in Chromium, so I can test the clip carousel properly. Reading the BUG-305 test to reuse its clip-recording helper.

Design settled. Before writing the renderer I'm checking how `render.ts` emits `@keyframes` and media-gated rules.

I have what I need from the renderer. Now reading the fold side (`foldVideo` and its call site) so the captured slideshow folds back into a node.

Starting the code now, beginning with the schema: a new strict `slideshow` node next to `image`/`video`.

Now writing the schema additions.

Schema added. Next, the validator: envelope bounds (2–8 slides, hold 2–15 s, fade 0.3–4 s), URL checks, and asset references.

Validator typechecks. Now the renderer; first checking the number formatter so the keyframe percentages come out precise.

The design is settled: a CSS-only cross-fade for stills (so it needs no script), plus a small runtime that takes over only when slides carry clips. Writing the renderer pieces now.

Runtime written. Now the emitter: the slideshow's markup and its stylesheet, including the CSS cross-fade keyframes.

Framework typechecks. Quick look at the rendered markup and CSS before I write the UATs.

Markup and CSS look right: the cycle timings check out (3 slides × (3 s + 1 s) = 12 s), and only the first photo is eager and preloaded. Now the capture side, so `capture(render(L1)) ≈ L1` holds.

Now the fold: a captured first photo carrying a slideshow folds back into a `slideshow` node.

Two control-app errors are unrelated to my change (I'll confirm they're pre-existing). The `probes.ts` one is mine. Fixing it and tidying the fold's id handling.

Remaining errors are in files I haven't touched, so they're pre-existing. Next, asset resolution: slide photos and clips have to be mirrored and resolved the same way a video's files are.

Now the UATs. First file: validation, the security envelope, still-only markup, and asset references (no browser needed).

The one failure is a test bug: the runtime script itself names those attributes. Fixing the assertion to look at markup only.

Node UATs pass (11/11). Now the browser suite: no-script CSS fades, reduced motion, the clip carousel with real recorded WebM clips, pause, and the capture round-trip.

Five of six pass, including the capture round-trip. The clip-carousel case fails on fetch order, so I'm dumping the event log to see what actually happened.

The pause itself works (`playState` is `paused`), but `currentTime` is suspiciously small (~75 ms), as if the animation restarted. Investigating before I adjust the test.

The browser suite passes reliably (6/6, twice). Next, the consultant/builder guidance and the L1 reference the builder reads. Checking how the clip guidance was added for REQ-470.

The motion budget is guidance-only (no code enforces it), so one sentence in the guidance covers it. Adding a short slideshow paragraph to the clip operation's description.

Four BUG-48 reference-coverage tests fail. Reading the messages before deciding whether they're mine or pre-existing.

Cause found: the BUG-48 suite requires every structural rule to have a case that provokes it, and my new `slideVideoIsAClip` has none. Adding one to its table, next to the video rule's case.

My entry is present, so the missing key is a different rule. Checking whether this test already fails on clean `xgd-working`.

That one failure is pre-existing (same failure on clean `xgd-working`), so it's not mine. Now a wider regression run: the video suites, the REQ-82 envelope suites, and the capture/value-axes suites.

All 27 files pass (147 tests). Also running the REQ-82 envelope security/robustness suites the security policy names, plus the fold and capture suites.

132 files. Running them in two foreground batches.

19 failures across 9 files. Most look environmental (deploy, workers, builder origin), but three touch the fold, so I'm baselining all 9 on clean `xgd-working`.

All 9 fail on clean `xgd-working` too, but with 15 failures against my 19. Diffing the two lists to find the extra 4.

Run in isolation the two lists are identical (15 = 15, no diff). The 4 extras in the big batch were contention under load. Running batch 2.

Six capture-related files fail. Since I changed the extraction script, diffing them against clean `xgd-working` in isolation.

Identical again (7 = 7), so everything left over is pre-existing. Next: version bump and commit.

Committing the code first. The version bump comes after merging `xgd-working` into the branch, per the free-coded promotion recipe.

Committed (`7e0013da`). Updating the ticket body now. I'm keeping all existing content and adding a section describing what landed, so every UAT is backed by language in the ticket.

Ticket updated. Now the merge-back sequence: lock, bring `xgd-working` into the branch, bump the version, merge back, then promote.

Merge was clean. Quick rerun of my UATs on the merged tree, then the bump.

The hero slideshow is built and merged into `xgd-working`. REQ-664 is at `free_coded` with both commits recorded, version 0.2.817 and 8 story points. I didn't need to ask you anything first, and it isn't a duplicate: the only related tickets mention slideshows in passing.

**What it does**
- **New node:** `slideshow` sits next to `image`/`video` and rejects unknown keys. It takes 2–8 slides, each a photo plus an optional `.mp4`/`.webm` clip. A still slide shows for 2–15 s (5 s by default) and each fade lasts 0.3–4 s (1 s by default). Unsafe URLs, out-of-range timings and too many or too few slides are all rejected.
- **Still photos** fade in plain CSS, with no script. The first photo loads straight away; the later ones load lazily.
- **Clips** are run by a small new script. Slide 1's clip plays as soon as it can, and the next clip is only fetched once the current one is playing. A clip that isn't ready leaves its slide as a still for the hold time, and the slideshow carries on.
- **When motion can't play:**
  - With reduced motion, only the first photo shows, and nothing else is downloaded.
  - Without script, the photos fade just like a still-only slideshow.
  - On save-data or a 3g-or-slower connection, the clips are skipped and the photos fade instead.
- **Pause:** it gets the same pause button as the video work, labelled "Pause slideshow" / "Play slideshow". Pressing it freezes the fade or the clip, and nothing advances until it's pressed again.
- **Round-trip:** `capture(render(L1)) ≈ L1` holds for both still and clip slideshows. The pause button and the later slides don't come back as content.
- **Consultant guidance:** a short paragraph sits in the clip tool's description, so the budget read every turn is unchanged. It says when to offer a slideshow, and to make each clip in the tool's `loop` mode with the slide's photo as both first and last frame: one continuous move, never a pingpong.

**Choices I made that the ticket didn't spell out**
- I gave each slide its own `alt` text, since each photo is a separate picture.
- I read "the same fit/zoom axes as image" as the framing settings (crop and focal point). The click-to-enlarge `zoom` from images isn't on the slideshow.

**Tests:** 18 UATs across three files, all passing:
- `tests/test_UAT_FC_REQ-664_slideshow_node.test.ts`: validation, the security envelope, and the markup.
- `tests/test_UAT_FC_REQ-664_slideshow_in_a_browser.test.ts`: real Chromium with WebM clips recorded in the page.
- `tests/test_UAT_FC_REQ-664_slideshow_guidance.workers.test.ts`: the consultant guidance.

I also added one case to the BUG-48 reference test, which requires every validation rule to have a case that triggers it.

In a wider run of about 160 related test files, the failures that remain also fail on clean `xgd-working` with the same lists (deploy, workers and other capture suites), so they aren't caused by this. That includes one BUG-48 test that was already failing over a different rule.

**Not done (noted in the ticket):**
- Arrows, dots and swipe (left out on purpose, as the ticket says).
- Turning a client's existing WordPress slider into a slideshow when we capture their live site. Only our own rendered slideshow round-trips.
- Using a slideshow as the background of a hero with text laid over it. That layout code currently only recognises a single photo or clip.

<!-- xgd-chat-end -->