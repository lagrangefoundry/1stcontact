---
uid: comment-5c2cb4be
id: COMMENT-5594
type: comment
title: Comment on bug BUG-267
created_by: xgd
created_at: '2026-10-24T16:01:52.170424+00:00'
updated_at: '2026-10-24T16:20:26.145881+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-7bff70ed
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1ecef197-7cd7-4796-919d-4f997e11820a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="9f0c700e-0347-402a-8622-d446d24ec6a5-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T16:00:22.545086+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="9f0c700e-0347-402a-8622-d446d24ec6a5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T16:20:23.032957+00:00" -->
#### Claude
The body is truncated; let me get it in full.

I'm reading the layout check, scaffold and priming code to map out the three fixes before cutting the branch.

Still mapping: now the critic's rubric and the L1 schema's colour/opacity types.

Checking how the builder's tool surface describes colours, alpha and opacity.

Tracing where the builder's page writes land, to hook the starter-padding cleanup there.

Found an existing PNG codec; checking whether it runs in the Worker so the logo's visible bounds can be measured at upload.

I have the design. Moving the ticket to `free_coding` and cutting the branch, then checking how the test server serves image assets.

Worktree is ready; reading the REQ-440 test to reuse its photo-serving pattern for the new UATs.

Now writing the trim function in the shared PNG codec.

Now the starter-frame cleanup in `scaffold.ts`, applied in the store's page-write planner.

Now the layout check: visible-artwork measurement for logos, plus the three new checks (starter padding, covered picture, faded button).

Now the thresholds and their documentation in `layout-check.json`.

Now the builder priming. Reading the exact lines in both builder variants to splice them textually.

Code changes are in; now looking at an existing placement test to write the trim UAT through the real promotion path.

Writing the UAT file now (browser checks, store write, priming).

Running the new UATs.

Logo and starter-page UATs pass; fixing the hero fixtures to valid L1 (padding at node level, `fluid` sizing).

All seven pass. Now updating the BUG-238 UATs this ticket supersedes (old 56/40 numbers), then a Workers UAT for trimming at placement.

Placement UAT passes. Now the regression scope: layout-check, scaffold, section store, promotion and priming suites.

One failure, apparently unrelated (a priming line naming "Google"). Checking it against the clean main checkout.

Pre-existing on clean `xgd-working` too. Now typecheck and lint.

Typecheck clean. Checking my notes on this project's version bump and free_coded gate before committing.

Committing the work on the branch.

Now updating the ticket body (keeping the existing text, adding what landed and why).

Ticket body updated. Now the merge-back: lock, bring `xgd-working` into the branch, bump the version, fast-forward back.

`priming.json` auto-merged with someone else's change; verifying it and re-running the priming UATs before bumping.

Fast-forwarded onto `xgd-working`. Moving the ticket to `free_coded`.

BUG-267 is fixed and merged into `xgd-working`, and the ticket is at `free_coded` (version 0.2.615). Dina's live home page still has the starter padding, because I didn't edit live data from here.

**Logo too small**
- **Placing a picture on a site now trims its transparent edges.** This happens in `promoteToSiteAsset`, the one step every placement goes through. The Library keeps the original file. So a logo's picture box is now its visible artwork, and the size the builder gives it is the size a visitor sees.
- **The layout check now measures the logo you can see**, by reading the image's own pixels, not its box. It reports Dina's case as "34px tall as drawn (its picture box is 56px…)" and gives the box size that's needed.
- **New sizes:** the builder now starts a logo at about 80px on desktop and 52px on a phone. The check's minimums rose from 48/36 to 64/44. The critic's style lens now asks whether "the logo and name read at a glance".

**Gap above the first section**
- Every page write now strips the starter page's padding and centring once the page has real content. It only removes values that are still exactly the starter's.
- A new check reports any page that still has that padding.

**Dark slab over the photo**
- The builder's instructions now keep any shading behind the text only, never over the whole photo. They also say the darkness must come from the fill colour's transparency, never from fading the whole box, which also fades the buttons inside it. L1 already supported a transparent fill colour, so no schema change was needed.
- Two new checks: a photo mostly covered by a near-opaque layer, and a button faded by its container. Dina's slab trips both.

**Other things to know**
- **The "solid or strongly darkened panel" wording wasn't in the code's instructions.** The consultant wrote it in its own brief, so there was no line to replace. The builder rule and the checks above now cover it.
- **This replaces BUG-238's starting sizes.** Its tests pinned 56/40 and treated a 56px logo as correct; they now pin 80/52.

**Tests:** the new tests are in `tests/test_UAT_FC_BUG-267_first_draft_header_and_hero.test.ts` (run in a real Chromium) and `tests/test_UAT_FC_BUG-267_a_placed_logo_is_its_artwork.workers.test.ts`, and all pass. The REQ-429/415/422/440, REQ-427 critic, BUG-215/238, scaffold, section-storage and placement tests also pass. One REQ-208 test fails ("never learns which vendor drew the image"), and it fails the same way on clean `xgd-working`, so this change didn't cause it.

**Decision for you:**
- **Dina's home page:** it clears itself on the next whole-page edit, such as adding, moving or removing a section, or a page-style change. The new check will also name it the next time the page is checked. If you'd rather not wait, I can make that edit on the live site, but I'd want your go-ahead first.
- **Dina's logo:** it was placed before trimming existed. Placing it again from the Library will trim it.

<!-- xgd-chat-end -->