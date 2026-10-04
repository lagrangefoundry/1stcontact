---
uid: comment-2e888819
id: COMMENT-4890
type: comment
title: Comment on request REQ-383
created_by: xgd
created_at: '2026-10-04T16:08:16.470604+00:00'
updated_at: '2026-10-04T16:58:29.264018+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-47824940
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "0f7c12fe-1658-4e26-9b23-c89f4f986527",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ff3d1038-911a-4d68-acf9-e6fd746a5625-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T16:07:00.708110+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ff3d1038-911a-4d68-acf9-e6fd746a5625-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T16:58:27.736653+00:00" -->
#### Claude
Branch `free-REQ-383` is cut. Now reading the fold/probe code for issues 1 and 2.

Reading `promoteToFlow` in probes.ts for issue 2.

Reproducing the baseline; the fresh worktree is missing control-app's generated files, so I'm copying them over from the main checkout.

Baseline reproduces exactly (12/18/10 escapes, recovery 84.00/30). Implementing issue 1 in `nestBackingSurfaces`.

The gate grades the retained `l1.json`, so I'm copying the bundle to a scratch dir and refolding it there.

Issue 1 now produces owning backdrop containers (escapes remain only because recovery isn't served yet — that's issue 2). Now fixing `promoteToFlow`.

Baseline from unmodified code matches the ticket. With issue 1 the recovery fidelity got worse (812px), so I'm digging into the recovered document.

Issue 2 alone is exact (maxDelta 0.0125, 0 residuals, nothing dropped). The 812px regression comes from issue 1 at 320px in the contact section, so I'm inspecting that structure.

Served recovery is now exact, with 0 escapes (overlaps went from 524 to 164). There are 30 "unmatched" entries left to check.

Those 30 are the captured backdrops (5 per width). As containers they're no longer leaves, so the geometric box pairing can't see them. Checking what the evaluator exposes.

Adding the missing import, then re-running the probe.

Issues 1 and 2 are now exact on this bundle: nothing dropped, recovery 0.0125px / 0 residuals / 0 unmatched. Moving on to issue 4 (chip inset rounding).

`foldPadding` also rounds every side to whole pixels, so I'll move both to the hundredth precision the fold uses for geometry. Checking the responsive track path too.

Now issue 5 (paint order from `paintStack`).

Fold residuals are 0 and recovery is still exact, but 12 new `buried` findings appeared, probably from the paint-order change. Checking them.

Implementing the capture side in the extractor script.

Now the folded field and the contact-form module.

Running the typecheck and lint.

Syntax check passed; the harness just needs the script's whitespace regex constants. Re-running.

Before writing new UATs I'm launching the full node suite in the background to catch regressions.

While that runs I'm writing the UATs, starting from the REQ-377 sticky-header fixture.

The suite exited early; checking why.

Background launches die in this sandbox, so I'm running the suite in the foreground in halves (A–R, then S–Z/test_*).

On base, 7 of the 9 fail the same way. Re-running the remaining two (colour census, knowledge base) alone in the worktree to separate flakiness from a real regression.

Both pass alone, so they were load flakes. Running the `test_UAT_*` half.

All pre-existing. Confirming BUG-48 fails with the same assertions on base, then running the last batch.

The BUG-48/REQ-148 failure sets differ from base, and REQ-371 (pill height) is likely mine. Diffing.

Only REQ-371 is an intended change: issue 4 deliberately supersedes its 18/17 split. Updating that assertion and the req51 control list, then checking REQ-349 on base.

REQ-349 also fails on base, so no regressions remain. Writing the REQ-383 UAT file now, modelled on the REQ-265 control fixture.

A backdrop with `backedBy` runs is still childless in the fixture. Debugging the fixture's fold.

Found it: `nestBackingSurfaces` returns early when there are no reconstructed surfaces, before it considers owning backdrops. On a page where every band is carried, that case is the norm.

Now the owning works; the last assertion just picked the white carrier. Pointing it at the blue one.

All 12 pass. To confirm they actually detect each defect, I'm running them against the base sources: save my source changes as a patch, check out base, run, re-apply.

The tree is intact; only my `echo ===` tripped zsh. Re-running the comparison in two steps.

My debug line was malformed. I'm restoring the UAT and putting the comparison in a throwaway file instead.

The real bundle still serves recovery exactly (0.0125px, 0 residuals, 0 unmatched) with 0 escapes. Re-running the full node suite, since the probes change can affect other pages' tests.

Same set as before plus REQ-150; checking it.

Load flake (passes alone). Last batch.

Node suite: only pre-existing failures remain. Checking the workers project for contact-form coverage.

The workers project does run individually; the JSON reporter just came back empty. Running the 12 files with the default reporter here and on base.

The workers results match base exactly. `module-assets.ts` shows as modified, though, and I never edited it. Checking.

No linter is installed, so typecheck is the gate. Tidying the import order in probes.ts and re-running tsc on both packages.

Clean. Updating the `CAPTURED_BACKDROP_ID_PREFIX` docblock, which still says a captured backdrop is always a childless leaf.

Before committing I'm reading my notes on this project's version-bump and `free_coded` gate quirks.

Committing on the branch with explicit paths (no `git add -A`), then updating the ticket body before merge-back.

Committed. Re-reading the ticket, which changed on disk earlier, before appending the implementation record.

The body was extended mid-build (423 lines, up from about 330). Reading what was added.

An operator re-measurement against a second bundle (hearingzone510) was appended mid-build. Running my build against that bundle in a scratch copy.

Better (nothing dropped; recovery 1977px/519 → 211px/468), but not served yet. Many residuals are a uniform ~3px at 320. Analysing the distribution.

Applying it.

1024px and up now match base exactly (maxDelta 18px vs base 15px). What's left is a uniform +3px from the very top at ≤768, right after the rail. Inspecting the top of the recovered page at 320.

The +3 starts inside `section-band-0`'s first region (an image at y 59.59 lands at 62.59). Comparing that subtree between base and recovered.

hearingzone recovery is now 18px / 306 residuals (was 1977 / 519), while base has 12, so it is still not served. Everything remaining is that +3px at ≤768 from `card-1`. One more look at that card.

General ownership changes nothing on either bundle; the scrim's runs aren't contained at every width. Reverting to the carriers-only version the ticket proposed.

Passes. Confirming it fails without the cell fix.

It passes without the fix too, so the fixture doesn't reach that path. Dumping how recovery grouped it.

This fixture reproduces it: without the fix `c` lands at 290 instead of 300 at 1280; with the fix every leaf matches. Swapping it into the UAT.

Green with the fix, red without. Correcting the code comment so it describes the real mechanism (a member running over the one below), not "out of order".

Re-running the full node suite for the probes change.

Only pre-existing failures. Reverting the regenerated `module-assets.ts` again and committing the cell fix.

Appending the implementation record to the ticket body, leaving the existing content as written.

Ticket updated. Now merge-back: take the lock, merge `xgd-working` into the branch, then fast-forward the main checkout.

BUG-199 landed schema 20 concurrently, so mine becomes **21**. Resolving by keeping both entries, numbered in order.

Fixing the remaining "schema 20" / "pre-20" references in my own code to 21.

Typechecking the merge and running the capture/values-diff suites both changes touch.

All pass (skips are the browser-only suites). Committing the merge, then fast-forwarding `xgd-working`.

Fast-forwarded. Now correcting the schema number (20 → 21) in the appended ticket section; that needs a whole-body update.

Body intact. Moving to `free_coded` without `--version`, so the gate bumps the version inside its own lock hold.

`free_coded` at version 0.2.485, with 3 commits recorded. Tearing down the branch with the bare clean command.

Done. Saving three non-obvious workflow lessons to memory.

REQ-383 is implemented, merged into `xgd-working` and at `free_coded` (version 0.2.485). On bluelotus the flow version of the page is now served, with no escapes. On hearingzone it improves a lot but still isn't served, for two reasons outside this ticket's five issues.

**What changed, by issue**
1. **Backdrop owns its runs.** A captured backdrop that carries a band now holds the runs on it, the way a band does. Three knock-on changes were needed:
   - Recovery now flows such a backdrop as a whole section.
   - The fidelity check still pairs it with its reference element.
   - A container's position in reading order now comes from its text. Otherwise the footer (which holds an early-listed logo) sorted ahead of the sections above it and broke the pairing: an 812px error at 320.
2. **Sticky header rail kept.** `promoteToFlow` no longer drops children that were already in flow, like the header rail; the recovered flow starts after it. Checking the second bundle exposed one more cause, so I fixed it too: a grid cell was positioned by its bounding box rather than by where its stacked children actually end.
3. **Placeholder text.** The capture now records a field's placeholder words separately from its label, and folds the placeholder's opacity into its colour. The form field and contact-form module take an optional `placeholder`, and values-diff compares it. **The bluelotus reference needs a re-capture** before this shows up there.
4. **Padding precision.** Padding is kept to the hundredth, so the pill is 17.5/17.5. This deliberately overrides REQ-371's 18/17 test, which I updated.
5. **Paint order.** Each element's paint level now comes from its stacking chain where it decisively differs from what it overlaps; otherwise `zIndex` is used as before. The logo is now 8 and the © line 7.

**Results on the two pages** (each refolded in a scratch copy)
- **bluelotusintegralhealing.com:** the flow version is served, matching the capture to within 0.0125px with no position mismatches. 0 escapes (was 40), overlaps down from 524 to 164. There are 12 new `buried` findings: the © line sitting under the logo when text grows 2.5×. That is the reference's own paint order, now reproduced, so I left it.
- **hearingzone510.com:** nothing is dropped any more, and every escape from the band backdrops is gone from the recovered page (1,020 → 0). Recovery fidelity went from 1977px with 519 mismatches to 18px with 306, but that is still worse than the base page, so it isn't served.
  - **The orange "SCHEDULE AN APPOINTMENT" pill (`card-1`):** all 306 remaining mismatches are a 3px shift from it. Its text box covers its 3px border, so in flow the card comes out 46px tall instead of 43.
  - **The hero's dark overlay (`backdrop-0`):** 14 escapes remain from it. Letting every backdrop own its runs, not just those carrying a band, made no difference, so I kept the narrower version.

**Tests**
- 13 new UATs in `tests/test_UAT_FC_REQ-383_carried_bands_rail_placeholder_inset_level.test.ts`. 10 fail on the old code; the other 3 are regression guards.
- I ran the full node test suite in three batches. Every failure also fails on unmodified `xgd-working` or passes when rerun alone. The contact-form tests in the workers project give the same results as before.

**Things to know**
- BUG-199 took capture schema 20 while I was working, so this change is **schema 21**. I renumbered it while merging; the reconcile step will meet the same conflict.
- The `req51` test still fails, but on an older outdated image-card check (from REQ-336), not on my change.

The ticket body has the full record, including the two hearingzone gaps as candidates for their own tickets. I haven't promoted it to `ready_to_reconcile`.

<!-- xgd-chat-end -->