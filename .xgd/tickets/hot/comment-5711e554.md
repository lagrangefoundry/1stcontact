---
uid: comment-5711e554
id: COMMENT-4859
type: comment
title: Comment on request REQ-370
created_by: xgd
created_at: '2026-10-03T22:03:10.412585+00:00'
updated_at: '2026-10-03T22:30:42.057685+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-f30f4176
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d5cf92d9-9c03-47a5-8c7b-5907d2b72e00",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="e2d0fbbc-73d9-45ff-8695-5d7322630681-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T21:58:54.038271+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="e2d0fbbc-73d9-45ff-8695-5d7322630681-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T22:30:41.303714+00:00" -->
#### Claude
I've cut the branch and am mapping the six issues to their code — starting with the `tel:`/`mailto:` capture fix (issue 5).

Found the jsdom harness pattern for capture tests; reading it so I can reuse it for issues 2, 3, 5 and 6.

Reading the fold's backdrop/band assembly to place the hero photo beneath its scrim (issue 1).

Setting up the worktree (generated dir + webui symlink), then writing an offline fold probe against the real hearingzone bundle.

Now implementing issue 1: a captured z-index map, a `groundImagesUnder` pass, and nesting the photo ahead of its scrim.

Issue 1 folds correctly now (photo sits before its scrim inside the band). Moving to issue 4 — self-surface button runs.

Issue 4 lands within 0.2px on all three buttons. Now issue 5 — `tel:`/`mailto:` in the extractor.

Now issue 6 — the settle step for scroll-reveal images.

Now issue 3 — the preserved-whitespace axis across schema, renderer, capture and fold.

Following the `verticalAlign` carried-axis path for `whiteSpace`: extractor → section run → value axis → fold → schema → renderer.

Issue 3's L1 axis, renderer, capture and fold are in. Now issue 2 — the inline-SVG rectangle panel.

Writing the SVG-rectangle detector and recording it as a painted field.

Capture schema bumped to 15; typechecking everything now.

Typecheck clean across all three packages. Writing the UATs now, reusing the REQ-366 fixture helpers' shape.

Down to the SVG case; checking what the extractor actually emits for it.

Rewriting the throwaway debug test cleanly.

Still one miss on the SVG case — probing whether it's dropped after `fieldsUnder`.

All 18 new UATs pass. Running the broader suite to catch regressions (detached, since it's long).

While the sweep runs, appending the implementation record to the ticket body (preserving the original text).

Most failures look environmental (builder/webui/delegation). Checking the ones that could touch fold/render/capture.

Those 13 fail identically on clean `xgd-working`. Baselining the remaining non-builder failures too.

Builder failures are unbuilt-assets artifacts of the worktree. Finding the one remaining count difference.

No regressions: every other failure matches clean `xgd-working`, is a worktree assets artifact, or (REQ-319) passes on rerun. Committing.

`module-assets.ts` wasn't touched by me — checking it before staging.

A test regenerated a build artifact during the sweep; restoring it and committing only my files.

Committed. Updating the ticket body, then locking and merging back.

Body appended with the original intact. Now lock and merge.

Merged cleanly. Moving to `free_coded` (letting the gate do the version bump itself).

I've implemented all six issues on REQ-370 and merged them into `xgd-working`. The ticket is now `free_coded`, with two commits recorded: the code commit and a version bump the gate made itself. On the real hearingzone bundle, issues 1 and 4 now fold correctly. Issues 2, 3, 5 and 6 are unit-tested but won't show on the page until you re-capture. I couldn't run a browser here, so I haven't re-gated anything and the region scores are unconfirmed.

**What changed**
1. **Hero photo under its veil (fold):** when a photo and a translucent overlay share the same box, and the capture recorded the photo at a lower z-index, the photo now goes into the overlay's band just before the overlay. It's also clipped to the overlay's box, because the photo hung 11.56px past the band. On the real bundle, `section-band-0` is now `[image-1, backdrop-0, …runs]`. A photo recorded above the overlay is left where it was.
2. **Blue SVG panels (capture):** an inline `<svg>` whose only shape is a solid rectangle filling it is now recorded as a painted box with that colour. Icons and other SVGs are still not recorded. I didn't add the panels to the "what's behind this text" lookup: the review text overhangs them, and adding them would have painted each panel twice.
3. **Kept spaces (`break-spaces`):** L1 has a new text setting, `whiteSpace: 'break-spaces' | 'pre-wrap'`, and the renderer outputs it.
   - Where a run is also pinned to one line, only the wrap is switched off (`text-wrap-mode: nowrap`). Plain `white-space: nowrap` would throw the kept space away again.
   - The capture records the setting and no longer trims the edge space; the fold carries both onto the text.
4. **Button labels (fold):** a run that is its own button is now placed at its actual line, centred on its letters, instead of on the button's top border. On the bundle the three buttons are within 0.2px of the reference.
5. **`tel:`/`mailto:` links (capture):** the capture now keeps these hrefs, using REQ-359's validation rule. Every other non-web scheme is still refused.
6. **Scroll-reveal photos (capture):** a new settle step runs in both browser drivers. It reveals a loaded image whose wrapper is fully transparent and also shifted. Being transparent alone isn't enough, so fading carousels are left alone, and anything inside a carousel or slider is skipped.

I also bumped the capture schema from 14 to 15, so the current bundle will now report that it needs a re-capture.

**Tests:** `tests/test_UAT_FC_REQ-370_zyro_residuals.test.ts` has 18 UATs, all passing. They include negative cases: a photo recorded above the veil stays put, an icon SVG isn't recorded, and a carousel slide and a plain fade aren't revealed. The capture tests run the real page scripts in a simulated DOM, not a browser. The full node suite had 43 failures, none from this change:
- 33 fail identically on clean `xgd-working`.
- 9 builder tests fail only because the worktree has no built assets.
- 1 (`REQ-319` dev processes) failed under load and passes on rerun.

**What you need to do next**
- Run `1c refold` on the hearingzone bundle, then re-capture it to pick up issues 2, 3, 5 and 6. Then re-gate to confirm region 1 (51% of the score) and region 2 (45%) drop out.
- After the re-capture, check whether the 8 unexplained "+2px" shifts in the Where To Find Us band have closed. The ticket suspects issue 3 owns them, but nobody has shown that yet.
- The ticket stays at `free_coded` until you promote it. The original body is untouched, with a "What landed" section appended.

<!-- xgd-chat-end -->