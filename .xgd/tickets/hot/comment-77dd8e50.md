---
uid: comment-77dd8e50
id: COMMENT-7793
type: comment
title: Comment on request REQ-648
created_by: xgd
created_at: '2026-11-04T21:41:23.745579+00:00'
updated_at: '2026-11-04T23:27:18.393869+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-2272efe6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e29608e0-4449-4242-b9b8-a8be7d1797e0",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a8a979d5-cede-46f5-a1ec-a1a04a7febf2-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T21:40:44.558803+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="a8a979d5-cede-46f5-a1ec-a1a04a7febf2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T21:49:46.021584+00:00" -->
#### Claude
I've read REQ-648 and the `catalog` module. Next I'm looking for where the starter template, the floor tests and the guidance live.

The "floor tests" turn out to be the host's layout check that runs after every build (REQ-415/422). I'm finding that code now.

I'm now checking what the L1 layout language can already express (responsive columns, a fixed photo frame, a one-line title) so the starter grid can be built from it.

I've confirmed the L1 grid only takes a fixed column count, so a 4/3/2 grid needs a new typed L1 field. Now looking for where a new catalog grid gets its starter slots.

I'm finding where the consultant's and builder's existing shop/catalog notes are. DOC-75 turns out to have no shop section, so I'm checking the builder's L1 tool notes and the plan surface instead.

There's an existing "L2 preset" mechanism (`presetSlots`) that supplies a module's default look on `add_component`. That's where the catalog starter belongs; checking whether the catalog has one.

I have a few questions to settle before I start, because the starter grid can't be built from what L1 has today.

**What I found**
- **Columns:** an L1 grid takes one fixed `columns` number. There's no way to say 4 on desktop, 3 on tablet, 2 on phone. The existing breakpoint track (REQ-104) can only switch between stack, row and grid.
- **One-line title:** text can be told not to wrap (`nowrapFromPx`), but nothing truncates it with an ellipsis. Also, the existing `clipped` layout check would report a truncated title as "cut off by its box".
- **Sold badge over the photo:** there's no way to place a child in a corner of its box. The only overlap tool is a translate, and a translated badge still takes up space under the photo. That would make sold cards taller than unsold ones.
- **File size:** a fluid image gets `sizes="100vw"`. On a 4-column desktop grid, the browser would then fetch a ~1,280 px rendition for a ~300 px card, so the starter would fail its own file-size check. The card doesn't know how wide it's drawn, because the module renders it separately from the `list` it sits in.
- **4:5 frame:** images only take *named* aspects from the site's design. `portrait` is a valid name, but a design doesn't have to define it, and a site without it can't use it.
- **Guidance:** DOC-75 has no shop section today, and REQ-638 is still being built. So I'll add a short shop paragraph to DOC-75 and a catalog note the builder reads when it lists or adds the component, as the ticket's coordination section says.

**Questions (my recommendation first)**

1. **Can this ticket add four typed L1 primitives?** This is the security policy's route ("add a typed primitive, never a raw-CSS hole"):
   - a per-width column count on a grid;
   - a `maxLines` setting on text, rendered with an ellipsis, which the `clipped` check accepts as deliberate;
   - a way to pin a child to a corner of its box, for the badge;
   - the catalog passing each card's drawn width (viewport ÷ columns) into the card render, so the photo's `sizes` is right.

   If you'd rather keep L1 smaller, I'd drop the corner pin and put the Sold badge on the price line instead of over the photo.

2. **Where does the 4:5 frame come from?** I recommend the starter names the design's `portrait` aspect, and any design that doesn't define one gets 4:5 by default (and `square` 1:1). A site then changes the frame through its design, which fits the guidance ("a square frame for a minimal look"). The alternative is a fixed 4:5 ratio on the image itself, which a site can only change by editing the card.

3. **What happens to a grid with no `list`?** I recommend the module draws the starter 4/3/2 grid when `list` is missing (replacing "absent, the cards stack"). `add_component` would also fill any slot the consultant leaves out from the starter, not just when every slot is left out. The new check then catches a `list` deliberately set too narrow, e.g. one column at desktop.

One small point: the check will run at the layout check's existing widths (1,280 / 900 / 375), not the 1,400 / 900 / 390 in the test plan. They fall in the same desktop/tablet/phone bands.

If you say "go with your recommendations", I'll cut the branch and build it.

<!-- xgd-turn id="9397f61d-0462-4f93-a500-ee02894ca34f-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T22:52:20.473818+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="9397f61d-0462-4f93-a500-ee02894ca34f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T23:27:16.175057+00:00" -->
#### Claude
Everything I asked is answered, so I'm starting. Setting the ticket to `free_coding` and cutting the branch.

Worktree created. Making it runnable (node_modules links, generated files), as the memory notes describe.

Worktree runs. Now reading the REQ-104 track's render and validation code, which the per-width columns will extend.

Plan is set. Before writing, I'm reading the card record's fields (for the price/action line), the design's space steps and aspect handling, and how capture folds a responsive layout back.

Now editing the schema: the per-keyframe column count, `maxLines` on text, and the corner `pin`.

Adding validation rules for the three primitives.

The pin check landed inside `checkEffects`, which has no `depth`. Moving it into `walk`.

Now design.ts: the default `portrait`/`square` aspects, and the missing-reference check for a pin's inset.

Adding helpers in `layout.ts` that resolve a grid's column count at a width and give its per-width column track, for the renderer and the card `sizes`.

Now the renderer. Reading the box and text emission blocks where the pin and `maxLines` CSS will go.

Writing the three renderer changes: per-keyframe grid columns, the `maxLines` clamp and the pin placement.

Renderer side done and typechecking. Before writing the catalog starter, I'm checking what `src` a bound placeholder image may carry without failing the asset check.

Writing the catalog starter (`l2/catalog.ts`): the 4/3/2 list, the card with its 4:5 cover photo, a pinned Sold badge, a one-line title and the price/action lines, and the pager.

Fixing the badge: the fill axis is `surfaceFill`, and padding is a node-level field, not an axis.

Registering the catalog starter in the preset index, then making `add_component` fill whichever slots the caller leaves out.

Now the catalog component: a missing `list` draws the starter grid, and each card render is told the grid's per-width columns.

Those errors are in control-app files I haven't touched. Checking whether they predate this branch by filtering for my files and comparing the count on the main checkout.

The same 2 errors exist on the main checkout, so they predate this branch. Running the existing catalog, responsive-layout and L1 envelope suites for regressions.

Existing suites pass. Committing this progress on the branch, then writing the layout check.

Backticks in a comment inside the template string. Fixing.

Clean. Now the UATs. Reading the rest of the catalog test support for the item shape.

Images load eagerly, so the browser's choice can be read off `currentSrc`. Simplifying the file rule to judge only photos with a `srcset`.

Now writing the layout UATs.

Skipped, so Chromium isn't available in this config. The memory says browser suites need `pnpm test:browser`, which has a sandbox exclusion. Checking how that script is defined.

Chromium runs with `--single-process`, and 7 of 8 pass. The failure is in my test's own line-height arithmetic. Fixing it.

All 8 pass. Committing, then running the existing layout-check suites to make sure the `clipped` change and the new check didn't break them.

One failure in REQ-415, which the memory lists as red on clean working. Checking it against the main checkout.

Writing the L1 envelope and `add_component` UATs.

Three failures to fix. A design is passed to `validateL1` as an option, not as a document key, and the root-pin rule never fires, probably because the root isn't at depth 0. Checking both.

The root is walked at depth 1, so I'm switching the rule to `depth === 1` and passing designs to `validateL1` as an option.

All 12 pass. Committing, then the capture round-trip, which decision 1 requires for each primitive. Checking how REQ-633's bind round-trip goes through extraction and the fold.

Adding `maxLines` along the same path as `whiteSpace`: read the computed line clamp in extraction, carry it through sections and the value types, and fold it back to `axes.maxLines`.

Now making the edits across extraction, sections, types, the value-axes table and the fold.

Typecheck clean. Writing the round-trip UAT: the starter card in the starter grid, rendered, captured in Chromium and folded back.

Every remaining delta is a font family my fixture never declared (expected `""`, captured `Times`). That's a gap in the fixture, not in the primitives. Giving the fixture's runs a family.

The round-trip passes. The capture changes touch registries other suites check, so I'm running the capture/fold suites that read them.

18 failures. Running the same files on the main checkout to separate pre-existing failures from mine.

No new failures: the main checkout fails the same 18 plus 2 more. Committing, then the guidance. I'm reading the memory on system-KB docs first, since DOC-75 is a ticket doc.

DOC-75 is the stage guides, a system-KB doc. Checking its headings and how it reaches the consultant before choosing where the short shop paragraph goes.

Adding the builder's note to the `add_component` description, which is what the builder reads when it adds a component.

Writing the guidance UAT, covering both the builder's manual and the consultant's stage guide.

The builder test passes. The consultant test fails as expected until DOC-75 gets its paragraph at merge. Checking the builder-surface suites for wording pins and budgets.

Same 42 failures on both sides, all pre-existing. Committing the builder guidance and its UAT, then applying the DOC-75 bullet.

DOC-75 updated. Running the guidance UAT and the suites that read the stage guides.

zsh didn't word-split `$L`, so only one file ran. Re-running with the list split.

That failure is in the comparison-board section (`capture_site`), not the site plan, so it's unrelated to this change. Now merging back. Reading the version-gate memory first.

Following the memory: lock, merge xgd-working into the branch, merge back with `xgd-merge`, then `move-to-free-coded` without `--version` so it does the bump itself.

The merge was clean. Re-running my UATs on the merged tree before landing it.

Landed on xgd-working as a fast-forward. Recording the commits and moving the ticket to `free_coded`.

It's at `free_coded` with 6 commits (the gate added the version bump). Setting story points, then cleaning up the branch.

I've built REQ-648 and merged it into xgd-working; the ticket is parked at `free_coded`. All 34 tests in the 4 new test files and the existing catalog render suite pass after the merge.

**What changed**
- **New L1 settings.** Each one is checked strictly on the way in and checked again when the page is drawn, so nothing from a site definition becomes raw CSS:
  - **Columns per width:** the existing breakpoint track (REQ-104) can now carry a column count, 1 to 12.
  - **`maxLines` on text:** cuts it off with an ellipsis.
  - **`pin`:** places an element at a corner of its box without taking up space, so a sold card is the same height as an unsold one.
  - **Card width for the photo:** each card now knows its grid's columns, so the photo asks for a file near its own width rather than the screen's.
  - **Default aspects:** every design now has `portrait` 4:5 and `square` 1:1 unless it sets its own.
- **Starter grid.** A product grid now arrives as the Etsy-style grid: 4/3/2 columns, a 4:5 cover photo, Sold laid over the corner, a one-line title, then price and action. A grid with no `list` draws this instead of stacking. `add_component` fills any part the consultant leaves out from the starter.
- **New floor check (`catalog_grid`).** It runs with the other layout checks at desktop, tablet and phone. It reports too few columns, photos of different sizes, a photo wider than half the grid, and a photo sent a file more than 2× its width. Each finding gives a one-line fix. The existing "text cut off" check now ignores text cut by its own `maxLines`.
- **Round-trip.** `maxLines` now survives capture and comes back when the page is folded to L1. The columns and the pin come back as the positions they produce.
- **Guidance.** The builder's `add_component` notes and the site-plan stage guide (DOC-75) both state the standard and what a site may change.

**Decisions I made while building (recorded in the ticket)**
- **File-size rule:** it only judges photos served with a set of sized files (`srcset`). Draft previews serve full-size originals before publishing builds those files, so judging them would flag every draft with something the builder can't fix.
- **Smallest file:** the smallest rendition the publish makes is 320 px. That is never "too heavy", even though a phone card is about 155 px at the check's 1× pixel density.
- **"Stacked grid is refused"** is now tested as a grid deliberately set to one column, since a missing `list` now draws the starter.

**Things to know**
- **DOC-75 is already live on xgd-working**, so the next deploy ships the shop-page guidance with the code. When REQ-638 lands, its new playbook needs to carry that bullet.
- **The browser tests were run with Chromium in `--single-process` mode**, because normal Chromium can't launch in this sandbox.
- **Regression runs:** I re-ran the suites around what I touched: layout check, capture registries, builder surface and stage guides. Each fails the same tests with and without this work. One example is REQ-415's text-at-the-left-edge failures. The main checkout fails 2 more capture tests than this branch.
- **Not run:** the full test suite.

Story points are set to 13. Promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->