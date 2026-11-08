---
uid: comment-4d326d31
id: COMMENT-7814
type: comment
title: Comment on bug BUG-355
created_by: xgd
created_at: '2026-11-05T19:32:59.665562+00:00'
updated_at: '2026-11-05T20:17:44.784687+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-832b3ecf
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c4582a5b-cd86-4535-ae9d-9fc5601b5c47",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="64771f41-301d-4985-97af-893dabcc372b-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T19:32:23.724428+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="64771f41-301d-4985-97af-893dabcc372b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T20:17:42.663336+00:00" -->
#### Claude
I'm exploring the renderer and layout check to trace the four faults in BUG-355 (grid columns, video overlay, bleed strip, scrim near-miss) before cutting a branch.

While that scan runs, I'm moving to item 2: how the `overlay` composition is rendered, and why a `video` child stops layering.

Now item 3, the ~8px strip down a `bleed` hero's left edge. Two suspects are 8px: the UA `body` margin and the pin's default inset. Next I'll read how `width: bleed` is emitted.

I'll render the real stored home page and measure the hero in Chromium, to find what makes the 8px strip.

I have a design for all four items. Setting the ticket to `free_coding` and cutting the branch.

Branch cut. Now making the worktree runnable: per-entry `node_modules` links, with `@1stcontact` recreated as in-worktree links, plus the generated control-app files.

The worktree already had `node_modules` provisioned, so a few of my links landed inside existing linked dirs. I'll remove the strays, and check none were written into the main checkout.

Clean. Now implementing, starting with the `fill` pin in the schema, renderer and validator.

Now the schema edit.

Now the renderer.

Now the `overlay` composition. Checking `onlyPicture` and the `box` kind before writing the video branch.

Now the composition changes: a picture can be an image or a video, and `overlay` with a video layers it.

That draft referenced a variable that doesn't exist. Rewriting it properly: capture the band group's own declaration before it is reframed.

Now the layout check. First the overlap false positive: a control laid over a picture is only a fault when the picture is drawn on top of it.

Now the new check: a layer over a picture must match its edges within 2px, or sit clearly inside it. Checking the thresholds file format first.

Now the check itself, placed after `cover`.

Checking whether finding kinds are listed anywhere else (severity maps, rubrics) that a new kind must join.

Adding the new kind to `CRAFT_KINDS`, then finding where builder guidance on visibility and heroes lives.

Now typechecking the changed packages.

Typecheck is clean apart from two pre-existing `control-app` errors in files I didn't touch. Before writing the UATs I'll confirm a Chromium layout suite runs here, using an existing one.

Chromium suites run here. Checking the video node's schema before writing fixtures.

Writing the UAT file: cards columns render and are validated, the video overlay at 375/768/1280, and the three layer-edge cases, all through the real renderer and Chromium.

The minimal design object is too thin for the renderer's design rules. I'll use the platform's own starter design rather than invent one.

Layout needs `contentWidth`. Giving the fixture design a content width, gutter and a small space scale.

Five pass. The remaining failure is a fixture slip, duplicate card ids across the two sections.

A browser-side closure can't capture the band id; passing it as an argument instead.

All six pass. Now confirming they fail without the fix: set the source changes aside as a patch, run, then restore.

Still passes unfixed, so this fixture's clip probably isn't drawn with an `<img>` poster. Checking when a clip is "deferred".

The real hero's clip had a `loopSrc`, which makes it pausable, wrapped, and drawn with an `<img>` poster. I'll give the fixture clip the same shape.

Running a targeted regression set: the layout-check suites, the priming suites, and the composition, pin and grid suites.

18 failures. Baselining the same files on the main checkout before reading any of them as mine.

Three failures are new on the branch: BUG-281's structure check, REQ-358's document map, and REQ-463's composition test. Looking at each.

BUG-281 and REQ-358 pass on rerun (load flakes). REQ-463 fails for real, so I'll read it.

REQ-463 and BUG-355 now pass together. Running the REQ-463 workers suite as well, since it also exercises compositions.

Regression scope is green apart from baseline failures. Next is the commit, which needs this project's version bump; checking how that works here.

Now committing the work on the branch.

Before merging I'll update the ticket body, keeping the operator's text and appending what changed, so every UAT is motivated by its language.

Ticket body updated. Now the merge-back: lock, merge `xgd-working` into the branch, bump the version there, fast-forward `xgd-working`, then move to `free_coded`.

The merge was clean and the version is 0.2.784. Re-running the BUG-355 UATs on the merged tree before fast-forwarding.

Fast-forward done. That printed rematerialize path doesn't exist (a known quirk), so I'm using the CLI verb.

It moved to `free_coded`, but printed a version warning. Checking the full message and the ticket's state.

The ticket is `free_coded` with both commits and version 0.2.784 (the warning was boilerplate). Setting story points and tearing down the branch.

Last, checking that removing the worktree left no links in the main checkout pointing into it.

BUG-355 is done and at `free_coded`. Two commits are merged into xgd-working (`3fea82ee` for the fix, `75cb0eca` for version 0.2.784), and the branch is cleaned up.

**What was actually wrong**
- **Grid columns (item 1):** the builder's fields were fine. When the builder wrote, both sections used `composition: cards`. That composition rebuilt the group holding the cards with its own 2–3 columns, throwing away the builder's `columns` and `responsiveLayout`. Validation runs on the page after that rewrite, so it never saw the builder's values either. One of the builder's writes was even inconsistent (`columns: 2`, but a phone-width rule saying 1) and was accepted without a word.
- **Video under `overlay` (item 2):** `overlay` only recognised an image as the picture, so a hero whose picture was a video was left as built, with its text below. The "image and button on top of each other" finding came from the video's poster `<img>`. That check flagged any picture/button overlap without asking which one was on top.
- **The 8px strip (item 3):** I couldn't reproduce it from today's stored hero, which later builder rounds rebuilt. The 8px I could find is the default corner-pin inset on the builder's full-width desktop text panel. It sits 8px inside the video on the left and bottom and 8px past it on the top and right, which is also item 4's near-miss.

**Changes**
- **Columns now render:** a cards group that states its columns (`columns`, or a per-width grid) keeps them. A group that only says stack or row still gets the composition's 2–3 columns, as REQ-463 expects. Stated columns are now validated, so a write like the inconsistent one is refused with a message.
- **New L1 option, `pin: { corner: "fill" }`:** an element covers the whole box it sits in, behind the box's other content.
- **Video overlay:** `overlay` with a video lays the video and the scrim as two such fill layers under the text. That gives one video and one text group, with the text over the video at every width, and the scrim's edges are the video's by construction.
- **Layout check:** a button over a picture is only reported when the picture is drawn over it. A new `layer_edges` check flags a scrim or panel whose edges are 2–16px off the picture's, and names the fix: fill the picture, or be a clearly smaller panel.
- **Builder guidance:** never copy a hero per width; a different treatment at some width is the consultant's call; a layer over a picture matches its edges or is clearly smaller; cards keep the columns their group states.

**Tests:** six UATs in `tests/test_UAT_FC_BUG-355_overlay_clip_and_stated_columns.test.ts`, run in real Chromium, including the three the ticket lists. All six fail on the old code with the reported symptoms (3 columns drawn; "the image and the button … drawn on top of each other") and pass now. In the regression run (64 related test files plus the REQ-463 workers suite), every remaining failure also fails on clean xgd-working, or was load-related and passed when re-run alone.

**Still to do or know:**
- That site's hero still holds the three per-width video copies; a builder pass has to rebuild it as one `overlay` section.
- The dev server keeps serving its old frozen build until `bin/deploy --env dev` is run.
- Not fixed here: the host's "UNCHANGED after a fix round" verdict that blocked further builder passes, and builders ending partial with "not measured" checks when they run out of budget. Both are noted in the ticket.

<!-- xgd-chat-end -->