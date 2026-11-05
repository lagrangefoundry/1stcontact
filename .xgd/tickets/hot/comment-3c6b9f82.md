---
uid: comment-3c6b9f82
id: COMMENT-7799
type: comment
title: Comment on request REQ-649
created_by: xgd
created_at: '2026-11-04T23:54:22.240192+00:00'
updated_at: '2026-11-05T00:24:39.024713+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3aafb366
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a2711f36-cad2-4e4a-8c72-51ac737b71f5",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="8efce2eb-66eb-41ca-9e36-1cb1e012da0c-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T23:53:51.416386+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="8efce2eb-66eb-41ca-9e36-1cb1e012da0c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T23:57:27.410047+00:00" -->
#### Claude
Reading the ticket and the current video emitter in `render.ts` before scoping questions.

Still mapping the code: found where pages get their `<head>`; next, checking how posters are made and whether a 540p clip exists.

I've read the ticket and the current code. Before I start, there are four questions. The code has moved since the ticket was written, so the first one is a correction.

**What the code does today.** A looping clip no longer renders with `autoplay preload="auto"`. Since REQ-471 added the pause button, `render.ts` (around line 5241) treats every plain loop as runtime-driven: it renders with no `autoplay` and with `preload="none"`. The problem now sits in the runtime script (`L1_VIDEO_SCRIPT`). It calls `play()` on `DOMContentLoaded`, which requests the clip before the page's `load` event, alongside the hero image and fonts. So item 2's HTML is already right, and the fix is mostly the runtime's start condition (after `load`, idle, connection checks, near-viewport) plus the poster work. I'll correct the ticket's "Why" section to say this.

**Question 1: do play-once reveal clips count?**
- A clip with `playback: once` and no other options still renders with `autoplay preload="auto"`. A REQ-461 test requires that.
- Its poster is the clip's last frame. If its start were deferred, visitors would see the end state first, then a jump back to frame 0.
- Deferring it properly needs a first-frame still. Nothing produces one: the AnimateImage plugin in lagrange-framework only attaches the last frame, and the Worker can't decode video.
- **My recommendation:** defer only the clips that keep moving by themselves:
  - plain loops, including ping-pong;
  - loops that rest between plays;
  - intros that hand over to a loop. Their poster is already the intro's first frame, per BUG-305.

  For these, the poster already matches frame 0. Reveals would keep their current behaviour until the plugin can provide a first-frame poster, which would be a ticket in lagrange-framework.
- If you want reveals deferred now, they need that first-frame still from the plugin first. I'd file that as a framework ticket, covering both JS and Python.

**Question 2: the smaller phone clip (item 5).** Videogen keeps only one encoding. The resolution ladder lives in lagrange-framework: it steps 1080p → 720p → 540p only until the clip fits the budget, and keeps one result. A separate 540p copy means an extra transcode on the framework side, which is close to what REQ-237 already covers. **My recommendation:** drop item 5 from this ticket. Either add it to REQ-237's scope (the plugin returns an optional 540p rendition), or file a new framework ticket. I'd then add the `<source media>` support here once a rendition exists. Rendering markup for a file that isn't there would be dead code. Which do you prefer?

**Question 3: how the poster becomes a responsive image.** A `<video poster>` attribute can't take `srcset`. My plan:
- Render the poster as a renderer-owned `<img>` with the image ladder's `srcset`/`sizes`, plus `fetchpriority="high"` and a `<link rel="preload" as="image" imagesrcset … imagesizes …>` when the clip is in the first section.
- Lay the `<video>` exactly over it, invisible until `canplaythrough`, then fade it in.
- The `<img>` and its wrapper carry `data-fc-invariant`, so capture still reads back one `video` node and the round-trip check holds.
- With no script, or when a skip condition applies, only the image ever shows.
- The renderer needs a small new output for `<head>` links, which `tools/generate` will place in the page head.

Any objection to this structure?

**Question 4: two details I'll treat as decided unless you say otherwise.**
- **"First screen"** means the clip sits in the page's first top-level section.
- **The connection checks** use `navigator.connection`, which only Chromium browsers provide. Safari and Firefox visitors will always get the clip after the page loads, unless they prefer reduced motion.

Once you answer 1–3, I'll update the ticket body, cut the branch and start.

<!-- xgd-turn id="c1e1fa89-d19e-43c0-9a27-f7e6dc658cf5-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T00:12:49.657879+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="c1e1fa89-d19e-43c0-9a27-f7e6dc658cf5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T00:24:38.209623+00:00" -->
#### Claude
The answers settle everything; I'm ready. Updating the ticket body (Why, item 5, test plan) while keeping the decisions section, then cutting the branch.

Branch cut. Making the worktree runnable (node_modules links, generated artifacts), per the setup notes.

Now the edits: state field, result `head`, emitter, and runtime.

Emitter rewritten; removing the now-duplicated old doc comment, then the runtime script.

Typechecks. Now capture (read poster off the picture) and the page head in `tools/generate`.

Only pre-existing control-app type errors. Running the existing video suites to see what my change breaks.

The 8 failures are jsdom runtime tests that expect `play()` straight away; deferral changes that by design. Looking at their harness to drive load → idle → canplaythrough.

Two harness ordering slips; fixing (fire only the deferral's observers, reset the load count before canplaythrough).

Existing suites green. Checking the Chromium suites actually ran rather than skipped.

Existing suites (including both capture round trips) pass with the new markup. Writing the REQ-649 UATs now.

Two markup failures: `sizes` came back null, and the "first section" path test is off by one level. Checking both helpers.

Markup tests pass. Finding other suites that touch clips for the regression run.

BUG-48 fails the same 4 ways on clean xgd-working, so it predates this change. Running the delivery/render suites too.

Adding one check that the published page actually carries the preload in `<head>` (the `tools/generate` side).

All 12 REQ-649 UATs pass in Chromium. Running lint on the changed files, then committing.

Committed. Now the merge-back sequence: lock, merge xgd-working in, bump version, fast-forward, move to free_coded.

The merge brought in only ticket commits, so the test results still hold. Bumping the version and landing.

Free_coded. Recording story points and the two design points that differ from the approved sketch in the ticket body.

REQ-649 is done: it's merged into xgd-working and the ticket is at `free_coded` (commits `da8f1cfc`, `21489f3d`, version 0.2.769, 5 story points). All 12 new tests pass in Chromium, as do the existing video and image-ladder suites. Chromium only ran in its single-process fallback in the sandbox; Safari wasn't tested.

**What changed for clips that keep moving by themselves** (loops, ping-pongs, resting loops, intros that hand over to a loop):
- **Poster first:** the poster is now a real picture with the image ladder's `srcset`/`sizes`. When the clip is in the page's first section, the picture gets `fetchpriority="high"` and a preload link in the published page's `<head>`. Further down the page it loads lazily.
- **Clip later:** the browser only asks for the clip after the page's `load` event and an idle moment, and once the clip is within 200px of the viewport. Once it can play through, it starts from frame 0 and the picture fades out over 400ms. Nothing on the page moves.
- **Never fetched** on `saveData`, on `slow-2g`/`2g`/`3g`, under reduced motion, or with no script. In those cases the pause button stays hidden too, since nothing moves.
- **Unchanged:** play-once reveals, hover clips, and the edit render.

Two points differ from what you approved in the ticket. Both are now written up in the ticket body:
- **Only the picture is marked `data-fc-invariant`, not the wrapper.** Capture skips everything inside an invariant element, so marking the wrapper would have hidden the clip. Capture now reads the poster from the picture next to the clip, and still reads back one `video` node.
- **`sizes` is sometimes left out.** For a full-width clip with no maximum width, the renderer can't name a width, so it omits `sizes`, as it already does for every picture. The browser then assumes the full viewport width.

I also updated the test harnesses for REQ-461, REQ-470 and REQ-471. Their runtime tests expected the clip to play as soon as the page parsed, which this ticket deliberately stops. They now wait for load, idle and `canplaythrough` before checking anything.

One suite, BUG-48, fails, but it fails the same four tests on clean xgd-working, so this change didn't cause it.

<!-- xgd-chat-end -->