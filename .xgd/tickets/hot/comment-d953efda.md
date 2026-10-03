---
uid: comment-d953efda
id: COMMENT-4821
type: comment
title: Comment on request REQ-363
created_by: xgd
created_at: '2026-10-03T16:34:23.932487+00:00'
updated_at: '2026-10-03T17:07:29.767893+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b98b1cc3
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "ffd0309f-ff0b-41a1-8cd7-ecc8423c04fd",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="1bcfe314-3fed-4e9a-bd3c-daf4ae15fa6e-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T16:30:28.652077+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="1bcfe314-3fed-4e9a-bd3c-daf4ae15fa6e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T17:07:28.478028+00:00" -->
#### Claude
I'm reading the screenshot code path (fidelity-core, picture resolution, surface declaration) before scoping the change.

Still mapping the code: now checking how the model names sections (describe_page's addresses) so tiles can label them.

Still reading the renderer to see how a draft page's top-level sections can be located in the DOM.

Checking the browser drivers' `screenshot`/`navigate` so section positions are measured at the same width the picture is taken at.

Design is mostly clear; checking the root element's class and the body markup, then I'll write the ticket plan and cut the branch.

I have enough to design. Recording the implementation plan on the ticket, then cutting the branch.

Branch cut. Running the existing fidelity UATs as a baseline before changing anything.

Baseline green (36 tests). Now implementing — first the resampler entry point in `perceptual-core.ts`.

Now `picture.ts`: resolved pictures of our own pages carry measured top-level sections.

Writing the configuration file and the pure tiling module.

Now wiring it into the `screenshot` operation in `fidelity-core.ts`.

Now the surface declaration: new params, rewritten `screenshot` prose, and a version bump.

Implementation in place. Typechecking before writing the UATs.

Typecheck clean. Running the existing fidelity suites for regressions.

Now the UAT file. Checking how existing tests double a driven (`after`) shot.

Writing the UAT file.

All 9 pass, but 44s is slow. Measuring where the time goes (encode in the fixture vs decode in the operation).

Fixture encoding (~1.8s per 1280×9059 page, done 7 times) dominates; caching the encoded page once.

78/78 across REQ-363, 157, 218, 216. Widening the regression scope to every suite that imports the touched modules.

Unrelated-looking failure (router error scrubbing; I didn't touch the router). Confirming it fails on clean xgd-working too.

Pre-existing on clean xgd-working, not mine. Now the workerd-side suites that exercise screenshots end to end.

All 30 workerd tests pass. Now the version bump — checking this repo's mechanism.

Everything green. Committing on the branch (explicit paths only; the copied `generated/` dir is gitignored).

Committed. Now the merge-back: lock, merge into xgd-working.

Merged cleanly. Recording the as-built details on the ticket (including the REQ-157 test exception and the refusals the UATs cover).

Noticed a wording wart: a section spanning two tiles says "ask for tiles `2-2`". Fixing on the branch before promotion.

Updating that one phrase in the ticket body, then promoting to `free_coded` (letting the gate do the version bump, per the race the memory notes).

The ticket is `free_coded` (v0.2.443, three commits including the gate's bump). Cleanup refused because REQ-365 now holds the merge lock; checking whether the branch and worktree were still removed.

REQ-363 is implemented, merged into xgd-working and parked at `free_coded` (version 0.2.443, 5 story points). The ticket body now records the design and what was built, so it's ready whenever you want to promote it.

**What the model gets now**
- **Default:** one image, the first screen of the page at normal detail. On the 1280×9059 Charlie's Plumbing page that is 1024×640, not the old 169×1024 sliver. Mobile comes back 375 wide and one screen tall; tablet is 768, never reduced.
- **Each tile's text says where it is and what it costs**, e.g. `tile 1 of 12, page y 0–800 of 9059 px; sections 0.0, 0.1; 1024×640 (reduced from 1280×800), about 874 tokens`. The section addresses are the same ones `describe_page` gives.
- **The model can widen it with three new parameters:**
  - `tiles`: `3`, `2-5` or `all`.
  - `section`: an address like `0.5`. It returns the tile that section's top is in, and says if the section carries on into later tiles.
  - `detail`: `low` (768), `normal` (1024) or `high` (the full 1280, inside the provider's 1568 limit).
- **The whole page is bounded:** one call sends at most 4 tiles. Asking for all 12 returns 4 and says "8 more tiles… ask for tiles `5-8` next".
- **Settings live in `tools/generate/src/cli/ai/picture-tiles.json`:** the default tile, default detail, per-call cap, the widths, the provider limit and the token rate. Changing them needs no code change.
- **Unchanged:** stored images are still shown whole with the old longest-edge rule. `compare` and `check_fidelity` still measure full-resolution pictures, and `after` steps work with tiles.

**How it's built:** the browser still takes one full-page shot per call, and section positions are read in the same session right after the shot. Tiles are cut and reduced with the existing image code, so nothing was added for resizing. The `screenshot` description in `fidelity-surface.json` was rewritten, not added to, and its version went from 7 to 8.

**Limits and side effects**
- Only your own pages (draft, edit, revision) have section addresses. A web address or a captured reference can only be asked for by `tiles`, and asking those for a `section` is refused with a message saying so.
- An existing REQ-157 test lists the parameters that aren't pictures. I added `tiles`, `section` and `detail` to that list; what it checks is unchanged.

**Tests:** 9 new tests in `tests/test_UAT_FC_REQ-363_screenshot_tiles.test.ts` pass, as do the REQ-157, 216 and 218 suites and the other picture and fidelity suites I ran. One test fails: `test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed`. It fails the same way on unmodified xgd-working and checks the router, which this change doesn't touch.

**Left over:** `xgd branch clean REQ-363` refused to run because REQ-365's session now holds the merge lock, so the `free-REQ-363` worktree and branch still exist. They are fully merged; `xgd branch clean --stale` will remove them once the lock is free.

Separately, the Gmail, Google Calendar and Google Drive connectors need authorizing in your claude.ai connector settings before they can be used.

<!-- xgd-chat-end -->