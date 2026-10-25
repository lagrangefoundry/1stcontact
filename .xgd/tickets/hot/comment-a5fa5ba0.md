---
uid: comment-a5fa5ba0
id: COMMENT-5632
type: comment
title: Comment on request REQ-460
created_by: xgd
created_at: '2026-10-25T19:29:02.485174+00:00'
updated_at: '2026-10-25T20:09:19.916750+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-7d2e81e5
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "f8cea602-ad7b-4eb2-83b9-6cb1c6d27292",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d1a2e843-0205-44f0-80f4-be41117b4080-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T19:27:33.159915+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="d1a2e843-0205-44f0-80f4-be41117b4080-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T20:09:17.501980+00:00" -->
#### Claude
Reading the code around REQ-448's `design_first` refusal, since `structure_first` will sit next to it.

Found an existing `pages_navigation` plan decision to reuse as the structure decision. Now reading how the consultant sets decisions and how they surface to the client.

Plan side is clear. Now reading the layout check (for the home-page height budget) and the critic rubric.

Home page is resolved by `homePageOf`; the host's `siteLayoutChecker` is the natural place to tell the check which page is home. Checking how layout findings hold a build.

Now the critic rubric (BUG-271 / informed review).

Design settled. Checking how the REQ-429 layout-check UATs exercise a check (real browser vs fake), so the new budget test fits.

Important consequence: every workers suite that clears `design_first` via `designWritten()` would now hit `structure_first`. Checking that helper.

I have the full shape now. Moving the ticket to `free_coding` and cutting the branch.

Environment ready. Writing the plan side: the structure decision, its readiness predicate, and the one-line client announcement.

Now the `set_decision` handler: add the say when the structure's value is new or changed.

Now the seed title, the refusal in `account-core`, and its host wiring.

Adding the structure guidance to the `set_decision` op description (doesn't count against the priming budget).

Plan side done. Now the home-page length budget in the layout check.

Now the host tells the check which page is home.

Now the critic rubric: the visitor-order rule as high-severity messaging.

Now replays of recorded builder cases (REQ-452/454): a case recorded before this ticket has no structure, and must not be refused for it.

Now the shared test helper `designWritten`, which suites use to mean "ready for a first build":

Code compiles. Now the UATs — reading the REQ-448 workers suite to reuse its scaffolding.

Writing the workers UAT file.

Workers UATs pass (3/3). Now the node UAT: a real-browser home-page fixture against the budget, and the critic rubric.

The sandboxed Chromium (single-process fallback) crashed on `newPage`. Checking how other suites drive it in that mode.

Browser leg skipped here as expected. Verifying the in-page `home_length` script offline in jsdom with a throwaway test (deleted after).

jsdom probe passes: reported only for home at phone width over budget. Now running the affected neighbour suites.

REQ-448's first test is the expected one. Checking whether the REQ-452/454 failures are mine.

These suites build their own "ready to build" plan fixture with only `design_at`. Updating those fixtures (and REQ-448's scripted run) to also plan the structure.

Neighbours green. Running the full suite in foreground batches to catch other suites that build on fresh sites.

19 failures. Baseline the same files on clean xgd-working in the main checkout before attributing any.

All 19 fail identically on clean xgd-working (616a6c3f4c) — pre-existing, not from this change. Now the node project in batches.

Suspects in my area: REQ-340 (delegation records), REQ-428 (open decisions list), REQ-408. Checking those against the clean checkout.

Those fail identically on clean too. Shards 2 and 3:

Suspects: BUG-245 (priming), BUG-252 (delegation), BUG-48 (stated rules). Baselining on clean:

Pre-existing as well. Shard 3:

Suspects: BUG-219, REQ-401, REQ-122, REQ-376. Baselining on clean:

REQ-401 passes on clean but fails on my branch. Investigating.

The open-decisions list in the per-turn plan entry carries every title, and my longer title pushed it past its cap. Shortening the title to "Site structure" (shorter than the original).

REQ-401 passes again. REQ-428/408 were already failing on clean; checking the failure is unchanged.

Same failure on both — pre-existing. Now the commit. Checking the free_coded promotion notes for this project's version gate.

Committing the work on the branch.

Now updating the ticket body (appending, existing content preserved) before the merge-back tail.

The append didn't land. Checking the ticket CLI notes.

`--append-body` takes the text as its argument. Retrying that way.

Body appended; original sections intact. Now the merge-back tail — checking the version-gate note first.

Simplest path: lock, merge, then `move-to-free-coded` without `--version`.

Conflicts with work that landed on xgd-working meanwhile. Inspecting.

Both sides add to the same "given" mechanism (BUG-282 added `graphics`). Combining them.

Now host-core: BUG-282 added early returns, so the home flag must be computed before them.

Resolved. Typechecking and rerunning the overlapping suites (mine, BUG-282's, REQ-449/457/448) on the merge result.

Passed on the branch, fails after the merge. Looking at what it counts.

Checking whether this fails on xgd-working's own tip without my change, using my (clean) worktree detached at that commit.

Passes on both parents. Rerunning on the merge to rule out a flake.

Deterministic on the merge only. I'll move the merge into my worktree (merge xgd-working into the branch, reusing the resolutions), so I can test it in isolation, then fast-forward.

Rebased cleanly onto xgd-working. Rerunning the overlapping suites on the rebased branch.

Green. Now aborting the main-checkout merge attempt and fast-forwarding xgd-working.

Landed on xgd-working. Moving the ticket to `free_coded` (letting the gate bump the version itself).

Now tearing down the branch (as its own call).

Done. Updating the memory on the first-build gate, since every future suite with a scripted first `Delegate` will hit this.

REQ-460 is implemented and merged into xgd-working (`815512712f`, plus the version bump the gate added). The ticket is at `free_coded`, with the original body kept and a "What landed" record appended.

**1. Site structure before the first build**
- I reused the plan's existing `pages_navigation` decision and renamed it "Site structure" rather than adding a new one. Its value holds the pages, what each is for, and the order of the home page's sections.
- A first `Delegate` is now refused with `structure_first` (checked after `design_first`) until that decision has a value. The refusal tells the consultant how to plan it: home answers what, where, when, how to get there or call and what it costs, then reviews with teasers. The story, the full menu and catering each get their own page. A site that already has a first draft is not held to this.
- When the consultant records the structure, it is told to say it to the client in one line and offer to change it. If the client changes it, the consultant records the new version the same way.
- I put this guidance in the `set_decision` description and the refusal message, not the consultant's main instructions, because those are at their length limit.

**2. Home page length budget**
- New layout check `home_length`, set in `layout-check.json` to 6 screens on phones (up to 480px wide). It only applies to the home page. A home page over budget is reported for the page as a whole, and the build isn't done until it's fixed, like other layout faults. The fix it suggests is moving content to its own page with a teaser.
- Desktop, tablet and other pages have no budget. The host tells the check which page is home.

**3. Critic**
- The review now treats as a high-severity messaging finding a home page where what it is, where, when it's open, how to get there or call, and what it costs come after the owner's story or below the third phone screen.

**Tests**
- New UATs in `tests/test_UAT_FC_REQ-460_the_site_is_structured_for_the_visitor.workers.test.ts` (3, passing) and `….test.ts` (the critic-rule test passes).
- **The real-browser height test was skipped** because Chromium can't start in my sandbox. I checked the same in-page code with a throwaway jsdom test, and it reported only home, only on a phone, only over budget. The browser test itself still needs a run on your machine.
- I updated the test setups that mean "ready to build" so they also record a structure: the shared `designWritten()` helper, the REQ-448 scripted run and the REQ-452/454 plan fixtures. Replays of builder cases recorded before this change get a placeholder structure, so they aren't refused for a rule that didn't exist yet.
- The REQ-448, REQ-457, BUG-271, REQ-429, REQ-449, REQ-452, REQ-454, BUG-276, BUG-282, BUG-129 and REQ-171 suites pass. So does REQ-401: my first, longer title for the decision pushed a line off the end of the per-turn plan summary, so I kept the title short.
- In the full run, 19 workers-test failures fail the same way on clean xgd-working. In the other test project, I re-ran on clean every failure that touches plans, priming or delegation, and those fail the same way there too. The remaining failures there (rebrand, vocabulary, filing service and similar) look unrelated, but I didn't re-run them individually on clean.

**Merging back:** while I was working, BUG-282 landed changes to the same layout-check code (it now marks which pictures are graphics). I combined the two and rebased my commit onto xgd-working, so the combined code is in one ordinary commit, then re-ran the overlapping suites (all green). One oddity: REQ-452's two-configuration test failed consistently in the main checkout during my first merge attempt there, but it passes in the isolated worktree with the same code.

<!-- xgd-chat-end -->