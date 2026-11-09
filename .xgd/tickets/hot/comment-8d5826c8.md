---
uid: comment-8d5826c8
id: COMMENT-8072
type: comment
title: Comment on bug BUG-398
created_by: xgd
created_at: '2026-11-09T06:22:42.471779+00:00'
updated_at: '2026-11-09T06:50:43.678192+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-a1e8ec7b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "6448e1a0-9a2d-4747-9765-b6fc7cec96b7",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="74773cb9-df98-4671-bd67-669889f17d6a-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T06:21:15.805075+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="74773cb9-df98-4671-bd67-669889f17d6a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T06:50:28.109350+00:00" -->
#### Claude
Not a duplicate (REQ-664 is the original feature; this is a bug in it). Ticket is at `free_coding`, branch `free-BUG-398` cut. Now reading the slideshow runtime and clip tool.

Reading the upstream clip plugin to see how the source photo is passed in, so the clip can record it.

Mapping how a clip material becomes a placed URL, which the write-time slide check will need.

Looking for where the consultant's page writes are checked, to hang the slide/clip pairing check there.

Still locating the page-write toolbox (it lives outside `apps/control-app`).

Found the single write gate (`validateOrThrow` in `tools/generate/src/cli/edit.ts`). Checking whether it already accepts host-supplied checks.

Precedent found: `refuseUnframedOverlay` uses a host hook `opts.focalPoints` fed from the Library. I'll follow the same pattern for the clip/still pairing.

Now implementing. Part 1: the slideshow (and the wrapped hero video) becomes its own stacking context.

Part 1 done. Part 2: the clip tool records its first-frame photo. Editing `videogen.ts`.

Library side threaded. Now the write-time hook: options, host wiring, and the check/fill in `edit.ts`.

Model-facing refusals can carry per-call detail (`hostDetail`), so I'll add a declared `WRONG_STILL` code alongside `NO_FOCAL_POINT`. Writing the check now.

Now the schema doc comment, then typecheck.

Worktree has its own installed deps. Typechecking the touched packages.

Typecheck is clean apart from two pre-existing errors in files I didn't touch. Now the UATs, modelled on the existing REQ-664 browser test and the REQ-622 write-refusal test.

Writing the browser UAT; looking for the repo's in-house PNG decoder to sample pixels from screenshots.

Writing the clip-tool UAT (workers pool, real D1 store, faked fal) next. Checking `chatLibrary`'s signature.

Updating the REQ-664 guidance UAT, which pinned the out-and-back wording this bug supersedes.

Clip-tool UATs pass. Now the page-write UAT (refusal, acceptance, fill-in).

The fill-in worked; the site just needs to hold the files. Adding them to the fixture.

Write gate UATs pass. Now the browser UAT: stacking through two crossfades, `isolation`, and the first-frame handover.

Second case (first-frame handover) passes. The first fails at the shade pixel — need to see where the shade actually lays out. Probing.

`stacked` alone didn't overlap them. Checking how the renderer lays one element over another.

Using absolute `geometry` placement instead (how a built hero overlaps its layers).

Passes with the fix. Now confirming it fails without the render change.

That only shows the style check; I also want the pixel check proven to fail on the old code. Repeating with the style assertion skipped.

Old renderer reproduces the bug (shade covered mid-fade); fixed renderer passes. Removing the probe and adding the "existing paintOrder workaround still renders" case (expected behaviour 5).

All three browser cases pass. Running the regression scope: every suite touching slideshows, hero clips, the L1 surface, the error codes and the write gate.

Only two files ran — my file list didn't expand. Fixing the invocation.

Checking whether those two failures predate my change (revert, run, re-apply).

Both fail identically on clean xgd-working, so they're pre-existing. Now the workers-pool regression scope.

Workers scope green. Lint on the touched files:

No linter configured in this repo. Committing on the branch; checking for the version-bump script.

Updating the ticket body (keeping the existing sections, adding what changed, the decisions, and the final UAT list) before committing.

Ticket body updated. Committing on the branch, then the lock/merge/version sequence.

Committed. Now locking, merging xgd-working into the branch, and bumping the version there (per the fast-forward recipe).

Merge clean. Quick re-run of my UATs on the merged tree before bumping.

I've fixed both problems in BUG-398 and merged them into xgd-working. The ticket is at `free_coded` with commits `c90a7723` and `26b98ffe` (version 0.2.842), and the branch is cleaned up. It isn't a duplicate: REQ-664 built the slideshow, and this is a bug in it. Nothing has been deployed yet.

**1. The fading slide no longer covers the shade and lettering.**
- The slideshow now keeps its slides' layering to itself (`isolation: isolate` on its root, in `packages/framework/src/l1/render.ts`). Anything placed after it stays in front through every crossfade, with no `paintOrder` needed.
- The hero video that layers a still under its clip gets the same treatment.
- Sites that raised the shade and lettering with `paintOrder` as a workaround still render correctly; a test covers that case.

**2. Each crossfade now lands on the clip's first frame.**
- **The clip records its photo.** The clip tool now stores which photo a clip opens on (`first_frame`): the photo it was made from, or a reveal's start picture. It sits alongside the existing last-frame still.
- **Page writes check the pairing.** When the consultant writes a slide whose clip has a recorded photo:
  - If the slide uses any other still, such as the clip's last frame, the write is refused with a new error, `WRONG_STILL`. The message names the photo to use and its file on the site.
  - If the slide leaves its still out, the photo is filled in automatically.
  - Clips the client uploaded keep whatever still they're given.
- **Clips are one-way.** The consultant is now told to make slideshow clips as one small, slow move starting on the slide's photo, with no need to come back. Out-and-back loops and ping-pong stay for a single hero clip, or when the client asks for one.
- **This replaces REQ-664's earlier advice** to start and end each clip on the slide's photo. I updated the REQ-664 test that checked the old wording, and the ticket body records the change.

**Tests:**
- Seven new tests, all passing. Five use a real browser and a real site, with pixels sampled from screenshots through two crossfades.
- I confirmed the main browser test fails on the old code (the shade gets covered mid-fade).
- 47 related tests in the workers suite pass; in the other suite everything passes except two tests that also fail on clean xgd-working without my change: `BUG-48_every_stated_rule…` and `REQ_175_naming_one_document_key…`.

**Decision for you:** the slideshow's pause button now sits behind anything placed over the slideshow's bottom-right corner. A full-cover shade would hide it and block clicks on it, though it can still be reached by keyboard. Before this fix, the fading slide covered the overlay instead, and sites using the `paintOrder` workaround already had the button covered. If you want the button always on top, it needs its own small follow-up.

The ticket body now describes the final design, the decisions and the tests, so it's ready for you to promote to `ready_to_reconcile` when you choose. To get this live, deploy from xgd-working as usual.

<!-- xgd-chat-end -->