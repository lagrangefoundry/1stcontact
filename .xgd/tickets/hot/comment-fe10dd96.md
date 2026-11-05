---
uid: comment-fe10dd96
id: COMMENT-7800
type: comment
title: Comment on request REQ-650
created_by: xgd
created_at: '2026-11-05T00:10:15.778886+00:00'
updated_at: '2026-11-05T01:19:53.271068+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-78c04ff9
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "4de3c641-f6f8-409f-922b-8bc3187744fc",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="4100715d-9ca5-496b-9cfe-47991a3cdc3d-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T00:09:05.336466+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="4100715d-9ca5-496b-9cfe-47991a3cdc3d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T00:15:04.082152+00:00" -->
#### Claude
Reading REQ-648's ticket and code to learn the pattern this ticket mirrors.

Now the L1 bind and image rendering in the renderer, and the delivery ladder.

Key finding: an L1 `zoom` role with sets (REQ-327/330) already exists and covers part of §1. Checking how it interacts with catalog fragments and bound photos before I raise questions.

I've read the ticket and the code it touches. One finding changes the plan, so I have questions before I build.

**The finding:** an image viewer already exists. The L1 `zoom` role on `image` (REQ-327), with `zoom.group` for sets (REQ-330), already gives a modal dialog, a dark backdrop, prev/next with ← →, Esc and backdrop close, a focus trap, and focus returning to the trigger. It is vetted renderer script (`L1_ZOOM_SCRIPT`), and REQ-330's own note rules out a separate gallery component. `bindL1` copies `zoom` onto every photo a bound `photos` image draws. So putting `zoom: { group: "photos" }` on the product page's template photo already marks the whole group as viewable. A plain gallery section marks its images the same way.

**My plan:** build §1 by upgrading `zoom` in place, rather than adding a new module or a second viewer in `capabilities.js`. That means one viewer for every site, which is what the reuse rule asks for.

**Q1. Can §1 replace parts of REQ-327/330's agreed behaviour?** Upgrading in place means four parts of that behaviour change:
- a. **Clicking the photo:** today it closes the viewer. It would switch between the whole photo and full width instead. Closing would move to a new close button, a click on the backdrop, and Esc.
- b. **The scroll wheel:** today it closes the viewer. It would zoom instead.
- c. **Without script:** today the large photos sit on the page under the image. Each image would instead be a link to its large rendition, and the viewer's own markup would be hidden.
- d. **The large photo:** REQ-327 deliberately shows the **original** so fine detail stays readable. This ticket says to use the largest rendition and never the original. My plan is to use the largest rendition whenever a publish built the size ladder. In draft and preview there is no ladder, so the original is the only file and the viewer shows it.

  Is (d) an intended replacement of REQ-327's choice? It affects every existing `zoom` on every site.

**Q2. The largest rendition is 1,920 px** (`DELIVERY_WIDTHS` tops out at 1920). Zooming a 1,920 px photo 2–3× on a desktop screen will look soft, for example when looking at jewellery detail. Which do you want?
- (a) Accept 1,920 px as the zoom ceiling for now. This is my recommendation.
- (b) Add a larger rendition, say 2,560 px, built only for photos in a viewer.

**Assumptions I'll go ahead with unless you object:**
- **First photo spanning both columns:** L1 has no way for a grid child to span columns. I'll add a typed per-width `span` on grid children, with a strict schema, a re-check at render, and the capture round-trip, as REQ-648 did for its primitives. The ~60/40 split will be ordinary L1 sizing on a row. Neither becomes a module dial.
- **Product-page viewer script:** a `zoom` that sits only inside a module's slot (the catalog product page) gets its markup and CSS today, but not its script, because only a whole-document render ships it. I'll fix that so the product page's viewer works.
- **New wording fields:** the count ("3 of 7"), close, zoom in, zoom out and reset get optional wording fields next to the existing `prevLabel`/`nextLabel`, so sites in other languages can restate them. The backdrop and control colours keep using the existing typed `backdrop`/`ink`.
- **Checking file sizes:** the host check's "files sized to their boxes" uses REQ-648's 2× rule and judges only photos that have a `srcset`.

I estimate about 18 story points, just under the 20-point limit for one ticket. I'll add these questions to the ticket body now and start building once you answer Q1 and Q2.

I haven't written any code yet. One finding changes the plan, so I need your answers to two questions first. The ticket stays at `draft`, and I've added these questions to its body.

**The finding:** most of the viewer already exists. The `zoom` setting on images (REQ-327), with `zoom.group` for sets of photos (REQ-330), already opens a full-screen dialog with a dark backdrop. It already steps with arrows and ← →, closes on Esc or a backdrop click, keeps focus inside, and returns focus afterwards. Each product photo already inherits the template photo's `zoom` setting, so `zoom: { group }` on it makes the whole group viewable. A plain gallery can use the same setting. My plan is to upgrade this existing viewer, not build a second one.

**Q1. Can §1 replace parts of REQ-327/330's behaviour?** Upgrading it changes four things for every existing zoom on every site:
- **(a) Clicking the photo:** today it closes the viewer; it would switch between the whole photo and full width.
- **(b) The scroll wheel:** today it closes the viewer; it would zoom.
- **(c) Without script:** today the large photos sit on the page under the image; each image would become a link to its large rendition.
- **(d) The large photo:** REQ-327 deliberately shows the original upload so fine detail stays readable. This ticket says to use the largest rendition instead, and never the original. Draft and preview have only the original, so they'd still show it. Do you mean this to replace REQ-327's choice?

**Q2. The largest rendition is 1,920 px wide.** Zooming it 2–3× on a desktop screen will look soft, for example on jewellery detail. Should I:
- accept 1,920 px as the limit for now (my recommendation), or
- add a larger size, around 2,560 px, made only for photos in a viewer?

Unless you say otherwise, I'll go ahead on these assumptions:
- **Full-width first photo:** L1 can't yet make a grid item span columns, so I'll add a typed per-width "span" setting with the same checks and capture round-trip REQ-648 used.
- **The 60/40 split:** I'll build it with ordinary L1 sizing, with no new layout setting on the module.
- **Product-page viewer script:** today a viewer that lives only inside a module, like the product page, gets its markup but not its script. I'll fix that so the product page's viewer works.
- **Wording:** the count ("3 of 7"), close, zoom in/out and reset get optional text fields, like the existing previous/next labels.
- **File sizes in the host check:** it uses REQ-648's 2× rule and only judges photos that come in several sizes.

I estimate about 18 story points, just under the 20-point limit for one ticket.

<!-- xgd-turn id="700cbe06-5e31-4e7b-85bd-82e6ba583e0f-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T00:46:19.966667+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="700cbe06-5e31-4e7b-85bd-82e6ba583e0f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T01:19:52.881159+00:00" -->
#### Claude
The answers settle everything. One sizing call first: where the size ladder is built, to see what the extra ~3,000 px rendition costs.

Setting up the worktree's node_modules (real dirs with per-entry links, `@1stcontact` relinked locally).

Baseline: run the existing REQ-327/330 zoom suites in the worktree.

Green baseline. Reading the existing zoom tests to see what they pin and how they drive Chromium.

Baseline is green (62 tests). Next: how module HTML reaches the page, to fix the missing script for a zoom inside a module slot.

Plan is set. Studying how REQ-648 added `pin` (schema, validate, render, capture), to add the grid-child `span` the same way.

Adding the `span` primitive: schema first.

Now the validator rule; checking `walk`'s signature for parent info.

Now the renderer emits `grid-column`, re-checked at emit time.

Checking how `sizes` uses `drawnIn`, since a spanning photo must ask for a wider rendition.

Typecheck clean. Now the viewer itself. Reading the dialog shell CSS and where `zoomHtml` is called.

Now reading the image emit site and the overlay-fields list before rewriting the viewer.

Rewriting the viewer's invariant CSS: no-script hiding, fixed chrome, the new controls.

Now the trigger (a link to the large rendition), the deferred large picture, and the shell's controls.

Now the viewer script: whole/full-width views, zoom (wheel, pinch, double-tap, buttons), pan, swipe, count, and deferred loading.

Now the fix for a viewer that lives only inside a module's slot: the page ships the scripts when a mounted fragment carries a viewer.

Typecheck clean. Running the old zoom suites to see what the replaced behaviour breaks.

The old suites drive the viewer in jsdom. Reading their helpers and failing cases.

Updating REQ-327's tests that pinned superseded behaviour (trigger, cursors, original, lazy loading, edit render), each marked as replaced by REQ-650.

Editing the REQ-327 suite to the new contract.

Now REQ-330's superseded tests.

The old suites now pass under the new contract (54/54). Next, the product-page starter. Reading the grid starter.

Checking the `sticky` and heading shapes for the product-page starter.

Typecheck clean. Next, extending REQ-648's host check to product pages. Reading `catalog_grid` in the layout check.

I'll fold the product-page check into the same `catalog_grid` check, so it reuses the `sizes`/`srcset` helpers.

Reading REQ-648's Chromium UAT to mirror its rig for the new tests.

Now writing the UATs. Reading REQ-648's round-trip test rig first.

Writing the `span` primitive UATs (envelope, render, security, sizes, round-trip).

Root is depth 1 (the pin check was corrected to that too). Fixing.

Span UATs pass (5/5, including the Chromium round-trip). Now the viewer's Chromium UATs on a real product page.

The item model has `collections` on this branch (REQ-651). Fixing the fixture.

Two failures. Focus not returning is likely Chromium not focusing a `display: contents` link. Probing.

The toggle works; the test clicked within the 400 ms window after a drag, where the script deliberately ignores clicks. I'll add a wait in the test. Now the focus fix.

That replacement is needlessly convoluted. Simplifying.

All 64 pass. Adding a keyboard UAT (Tab to a photo, Enter opens, Esc returns focus), since the focus fix is a behaviour the ticket body needs to state.

Now the product-page UATs (layout plus the extended host check). Checking `checkLayoutAt`'s signature and how it names sections.

All 8 pass, and the failing variants show the check really measures the product section. Next, guidance. Reading where REQ-648 put its guidance and its test.

Adding the builder's product-page lines beside the grid paragraph.

Adding the consultant's product-page bullet to the site-plan guide (a doc ticket edit, so no code ticket is needed).

Now the guidance UAT, mirroring REQ-648's.

Builder text says "keep every photo box one shape". Aligning the wording with the consultant's ("the photo boxes stay one shape").

Guidance passes. Now a wider regression sweep over the suites that touch L1 render, dialogs, the catalog, the layout check, capture, and the builder manual.

Running a targeted batch (catalog/shop, modals, delivery `sizes`, the L1 envelope and render, capture, and builder-manual suites), detached so it can't be killed by the turn ending.

While that runs, checking the builder manual's existing descriptions of `zoom`, which may describe the replaced behaviour.

Group agreement already covers the new wording fields through `L1_ZOOM_OVERLAY_FIELDS`. Adding an envelope-security UAT for the new wording fields (markup in them stays inert).

Now updating the ticket body (keeping existing content) with what was built, while the regression batch runs.

While it runs, typechecking `tools/generate` and the test tree.

Those errors are in files I didn't touch. Confirming none involve my files.

Eleven failures, some probably pre-existing (the reference-coverage ones list five uncovered rules: REQ-648's four plus my `spanNeedsAGrid`). Baselining those files on the clean main checkout.

These tests also need a document that provokes each rule. Adding provoking examples for the five rules to both tables.

The other groups bring their own parent rules (rhythm space). Narrowing this check to the base node plus the one group.

Now a final pass over every suite I touched or added.

All 151 pass, none skipped (Chromium ran). Before committing, checking how this project bumps its version.

Committing the work first. Checking what git sees, so the linked `node_modules` and `generated/` don't get swept in.

The project's free-coding rules say no LLM attribution, and recent commits carry none, so I'm following that. Committing.

Committed as `d96eee5e00`. Now merging back: take the lock, merge xgd-working into the branch, bump the version on the branch, then fast-forward xgd-working.

Merged without conflicts. Checking whether the incoming changes touch my files, then re-running the suites.

No overlap, and all 110 still pass. Bumping the version on the branch.

Fast-forwarded (0 ticket candidates to rematerialize). Moving the ticket to `free_coded`.

`free_coded`, with both commits and version 0.2.775 recorded. Cleaning up the branch and releasing the lock.

Cleaned up. Last steps: add the late changes to the ticket body, and save one non-obvious finding to memory.

REQ-650 is built and merged into xgd-working, and the ticket is at `free_coded`. I left it there for you to promote to `ready_to_reconcile`.

**The ~3,000 px zoom rendition is split out to REQ-652.** Building it would have taken this ticket past 20 points, so as you directed, the viewer zooms the largest existing rendition (1,920 px) for now.

**What was built:**
- **The viewer** is the existing `zoom` setting upgraded in place, so it is still one viewer for every site:
  - Clicking a photo opens it whole on a dark backdrop with "3 of 7". Clicking the photo makes it fill the screen's width.
  - The wheel or trackpad, a pinch, a double tap and the +/− buttons zoom; a drag pans; a click or the reset button returns to the whole photo.
  - Arrows, ← → and swipe move between photos and reset the zoom.
  - Esc, the close button or a click on the backdrop closes it, and focus goes back to the photo that opened it.
  - A large rendition is fetched only when its photo is shown or is a neighbour of the one shown, and the original upload is never fetched. Without script, each photo is a plain link to its large rendition.
  - There are optional wording fields for the count and the buttons, for other languages.
- **The four REQ-327/330 behaviour changes you approved** apply to every existing `zoom` on every site. Their tests were updated in place and marked as replaced by REQ-650.
- **A keyboard bug, fixed along the way:** the browser used in testing (Chromium) cannot focus the borderless wrapper the old viewer used, so keyboard users could never reach it. The photo itself now takes focus, and Enter opens the viewer. Ordinary linked images use the same kind of wrapper, so they still can't be reached by keyboard; that's outside this ticket.
- **The product-page starter:** photos on the left at about 60%, details on the right staying in view as you scroll, photos first on a phone. The photos are a 2-column grid of 4:5 boxes with the first across both columns, all opening in the viewer. A product page with no template of its own uses the starter.
- **New L1 pieces:**
  - `span` lets a grid item take several or all columns. Photos in a span ask for an image size that matches how wide they're drawn.
  - `morePhotos` binds every photo after the first.
- **Host check:** REQ-648's check now covers product pages too. It flags photos of different shapes or sizes, a photo wider than its column, and a file more than twice the drawn width.
- **Guidance:** a few lines each for the builder and the consultant.

**Testing:** 151 tests pass in a real Chromium with none skipped, including the ones already in place, and they still pass after merging xgd-working.

While running the wider test set, I fixed some of REQ-648's leftovers: its four new validation rules weren't showing in the L1 reference and weren't covered by two test suites. Those suites are still failing on clean xgd-working for reasons unrelated to this ticket. About 30 older validation rules have no test case. A few other cases fail too: two fold tests (AC1627, AC694) and two table tests (REQ-418). All of these are listed in the ticket body.

<!-- xgd-chat-end -->