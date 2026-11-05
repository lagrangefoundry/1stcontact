---
uid: comment-36eaca27
id: COMMENT-7805
type: comment
title: Comment on request REQ-652
created_by: xgd
created_at: '2026-11-05T01:08:13.421340+00:00'
updated_at: '2026-11-05T01:35:16.296589+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-6dd070ae
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "718e0260-e37a-4ea0-9250-c7750c68a7b6",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="34abef90-1526-4ab0-9f2c-d9d85c9b5d39-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T01:07:31.971289+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="34abef90-1526-4ab0-9f2c-d9d85c9b5d39-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T01:09:42.941410+00:00" -->
#### Claude
I haven't started coding REQ-652, because something it depends on isn't finished. I have one question before I go ahead.

**The blocker:** REQ-652 builds on REQ-650's viewer, and REQ-650 hasn't landed. It is still `free_coding` on `free-REQ-650`, with no commits beyond `xgd-working` and a dozen uncommitted files in its worktree. Among them are `packages/framework/src/l1/render.ts`, which holds the viewer markup and script, and the L1 schema and catalog binding.

REQ-652 needs to change those same places:
- **The viewer half** (fetch the ~3,000 px file only when the visitor zooms in) only makes sense in the full-width/zoom view, and that view exists only in REQ-650's unfinished work. On `xgd-working` today, a click on the photo still closes the viewer.
- **The publish half** (build the extra rendition only for images that carry `zoom`) needs two things:
  - Publish has to know which assets are zoomed. `ladder.ts` currently works per asset with no idea how each one is used, so this means reading through authored L1 and the catalog product-page template's bound photos.
  - The rendered page has to tell the viewer where the ~3,000 px file is. That happens in `render.ts`, which REQ-650 is rewriting right now.

If I started now, I'd be writing against code that is about to change and would end up merging into REQ-650's uncommitted work.

**Question:** do you want me to wait until REQ-650 is merged into `xgd-working` and then build REQ-652 in full? I recommend waiting. The other option is to build only the publish half now and the viewer half after REQ-650 lands. That splits one change across two sessions and risks a conflict over how the page points the viewer at the new file.

Two details I'd settle myself unless you say otherwise:
- **The new width:** the ladder already accepts sources up to 4,096 px on the long edge, so I'd add a 3,000 px width. Like every other width, it would be skipped when the source isn't wider than 3,000 px.
- **Smaller sources:** an image with `zoom` whose source is too narrow for 3,000 px gets no extra file. When the visitor zooms in, the viewer keeps using the largest rendition it already has.

The ticket is still at `draft` with its body unchanged. I'll set it to `free_coding` and cut the branch once you answer.

<!-- xgd-turn id="05d9f547-ba23-4125-ba00-42b65775e6d9-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T01:24:41.651057+00:00" -->
#### You
Ready now? Please proceed

<!-- xgd-turn id="05d9f547-ba23-4125-ba00-42b65775e6d9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T01:35:15.845006+00:00" -->
#### Claude
REQ-650's viewer has landed on xgd-working. Starting the work.

Worktree is installed. Now reading the delivery/ladder/viewer code.

Reading how publish calls the ladder, so I can tell it which photos carry `zoom`.

Working out how publish learns which photos carry `zoom`. For catalog photos, that means seeing whether the catalog thunk gets the site definition.

Plan is clear. Now the viewer script: finding where it switches into the zoomed view and loads `src`.

I have what I need. Writing the code: the zoom width and the "which assets carry zoom" scan go in `delivery.ts`, the extra rung goes in the ladder, and the URL goes from the renderer to the script.

Now the edits to `delivery.ts`.

Now the ladder.

Catalog photos next. Their per-material index has to re-prepare old wide entries once, so they pick up the new rendition.

Now the renderer and the viewer script.

Edits are in. Running the typecheck.

Writing the UATs now: ladder and publish (node), catalog photos (a fake bucket), and the viewer in Chromium.

Two test bugs, not code bugs. The WebP ladder already encodes at the source's own width (existing REQ-222 behaviour), and the inline script contains the attribute name. Tightening both assertions.

Node UATs pass (7/7). Now the Chromium viewer test. I'm adding an opt-in zoom-rendition option to the shared REQ-650 test rig.

Both viewer UATs ran and passed in Chromium. Now the regression scope: the neighbouring ladder, viewer, catalog-photo and render suites.

All 217 pass. Also running the REQ-647 catalog-photo workers suite and the surface/reference suites that check the framework's exports.

One failure, in a validator wording suite I didn't touch. Checking whether it fails on clean xgd-working too.

That failure is already there on clean xgd-working (REQ-650's suite), so it isn't caused by this change. Next: the version bump and commit. Checking the promotion steps first.

Now updating the ticket body (keeping the existing text) before committing.

Committing the code on the branch.

Committed. Now the lock, merging xgd-working into the branch, and the version bump, per the promotion steps.

Fast-forwarded xgd-working. Merging xgd-working into the branch brought in only ticket files, so no code changed under the tests. Running the ticket overlay check, then the `free_coded` gate.

REQ-652 is built and merged into xgd-working. The ticket is at `free_coded`, version 0.2.777, 5 story points. Promoting it to `ready_to_reconcile` is your call.

**What changed:**
- **Which photos get it:** publish now builds one extra 3,000 px rendition, but only for pictures that carry `zoom` and are wider than 3,000 px. Narrower pictures get nothing, so nothing is ever upscaled. Publish finds zoomed pictures by scanning the whole site definition, including zooms inside a module's slot.
- **Kept out of normal page images:** the new file is recorded separately from the 320–1,920 px sizes, so no ordinary image on a page can ever download it.
- **Viewer:** opening it and the whole-photo view still use the 1,920 px rendition. The first time the visitor enlarges the photo (click to full width, wheel, pinch, double tap or +), the viewer switches to the 3,000 px file and keeps it, so zooming out and in again fetches nothing more. The original upload is never requested. Draft and preview have no size ladder, so they're unchanged.
- **Catalog photos:** every catalog photo gets the 3,000 px rendition when it's prepared, because the product page puts every photo in the viewer. Photos prepared before this change are prepared once more to add it, then left alone.

**One decision for you to check:** catalog photos get the 3,000 px file even when a site's own product page doesn't zoom them. Catalog photos are prepared before publish reads the site's pages, so it can't check. The cost is one unused file per photo on such a site; no page ever asks for a file that wasn't built. I recorded this in the ticket body. Say if you'd rather I move the catalog step so it only builds the file when the product page actually zooms.

**Tests:**
- 7 new tests run real publishing and catalog-photo preparation, with only the image service and storage faked.
- 2 tests in Chromium check what the viewer requests: nothing large on opening, the 3,000 px file exactly once on zooming in, and never the original.
- All 217 tests in the nearby ladder, viewer, product-page and gallery suites pass, as do the catalog-photo and L1 surface suites.
- One test fails, `test_UAT_AC2105_limits_section_states_every_structural_rule_in_the_validators_words` in `tests/reconciliation-l1-reference-coverage.test.ts`. It fails the same way on clean xgd-working, so it isn't caused by this change.

I made one small change to REQ-650's shared test helper (`tests/support/req650-viewer-page.ts`): an opt-in option that adds the 3,000 px file to the test photos. REQ-650's own tests still pass.

<!-- xgd-chat-end -->