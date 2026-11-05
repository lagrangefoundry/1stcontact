---
uid: comment-3cb141fd
id: COMMENT-7191
type: comment
title: Comment on request REQ-638
created_by: xgd
created_at: '2026-11-03T16:22:20.647653+00:00'
updated_at: '2026-11-05T14:57:35.636446+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-9d8c8275
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d651f26b-9c7a-4c34-85fa-a17fcef2a771",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="79c34e66-c16d-4424-8940-a13af93f3a33-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T16:22:07.192722+00:00" -->
#### You
Please can you free code this work per the protocol.

Please ask anything here that you are unsure about from the ticket and the design document, particularly after you have reviewed the code and prompts.

Please do this work on a branch, complete it but DO NOT merge it back until I am ready to test it. This is a huge change, I want the opportunity to halt everything else so I can try it out and roll back if its not ready.

OK?

<!-- xgd-turn id="79c34e66-c16d-4424-8940-a13af93f3a33-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T16:26:43.255616+00:00" -->
#### Claude
Reviewing DOC-82 against the code now (plan-core, host-core, priming, guides) so I can come back with informed questions before building.

Still mapping the code — now tracing `set_stage` and the progress panel.

Nearly done surveying — checking the first-draft review/hold flow in host-core, then I'll write up questions.

I've read the ticket, DOC-82, DOC-75, and the code: plan-core (stages, facts, the per-turn plan entry), plan-seed, plan-surface, stage-guide-core, the first-build refusals in account-core, the review and announcement holds in host-core, and the priming route, rules and material-track sections. About 25 test files pin `set_stage` or the stage machinery.

Yes to the plan. I'll do it all on `free-REQ-638` as one ticket with many commits and leave it unmerged until you say so. Production deploys from xgd-working, so merging would effectively go live; it waits for your go. I haven't cut the branch or touched any code yet.

These are the points I'm unsure about. Each has my recommendation, so you can just reply "all as recommended except N".

**1. What the progress panel shows.** I'd replace the seven `stages` with the nine pieces. Each piece is not started, in progress, done, skipped or delegated. Marking it done, skipped or delegated needs the client's words (`client_said`), like `record_client_answer`. Pieces 6, 8 and 9 (build, final checks, publish) are facts rather than agreements, so they wouldn't need the client's words. The client-facing labels would be shortened, roughly:
- What the site is for
- Why people pick you
- Your material
- The look
- Pages
- Building
- Refining
- Final checks
- Live

I'd keep the op name `set_stage` so the ticket's wording still holds. Are those labels and states right?

**2. Existing plans.** Dev and production already have stored stages. I'd convert them once on read, conservatively:
- getting to know you done → pieces 1 and 2 done
- other sites done → piece 4 done
- first draft done → pieces 5 and 6 done
- refining and colours both done → piece 7 done
- finishing touches done → piece 8 done
- live → all done

After that nothing ticks. Or would you rather every existing site start with all nine not started?

**3. Where the goal and the client's choices live.** I'd add five seeded decisions for DOC-82 §4: story focus, scope, starting point, prices and involvement. The aligned definition of done would be a brief field (`definition_of_done`): their priorities over the seven tests, in their words. The existing `site_job`, `audiences` and `quality_bar` decisions stay. Is that OK, or do you want a single goal object instead?

**4. What "the client agreed the plan" means for the first `Delegate`.** I'd add a whole-plan record, set through the plan write with the client's words, which makes `plan_agreed_at` true. The first `Delegate` is refused only until that's set. The alternative is to key it off pieces 4 and 5 both being settled. I prefer the explicit record, because DOC-82 §5.3's plan covers order and what's already done, not just look and pages.

**5. A build with no design written.** With `design_first` gone, a site could be built before `set_design` runs. Builders build with the design. My plan is that the host uses what `read_design` measured as the design when none is written, rather than refusing. Is that OK?

**6. Where NOT_LOOKED and NOT_CRITIQUED fire once they're "unhooked from stage ticks".** Today they refuse ticking Finishing touches or Ready to publish. I'd move both to refuse marking piece 8 (final checks) done. The pre-publish review would still fall due when Publish opens, as now. The alternative is gating the Publish button itself, which is a bigger change.

**7. Reviewing each page during the first draft.** The host would run the critic on each page as its builder finishes, findings going to the consultant quietly. "Your first draft is ready" stays held until every page in the site plan is built, reviewed, and has its high findings answered. That reuses today's announcement hold, with a new trigger. The cost is one critic call per page instead of one for the whole draft. Is that acceptable? And is "every page" right as the pages recorded in `pages_navigation`? That decision would still be written, just no longer required before building.

**8. How playbook sections reach the consultant.** The ticket says "fetched when it reaches for its tool". I'd attach a DOC-75 section to the first result of its tool, once per site:
- `ask_comps` or `add_comp` → the comparison board
- `pin_notes`, `write_positioning` or `offer_headlines` → the story board
- `set_design` or `offer_looks` → the design and looks
- the first `Delegate` → the first draft
- `critique` → checking your work

Priming would carry a one-line index with each section's search phrase, so the consultant can pull any section whenever it wants. This reuses the existing hand-over mechanism, but driven by tool calls instead of stages. The alternative is an explicit `read_playbook` op.

**9. How hard the initiative check should be.** The ticket says to replace the gear-change line with "a general check".
- **Soft (my recommendation for the first cut):** priming rule 6-style text, plus a per-turn line: "End this turn doing something (say what, with an estimate) or with one clear question; next on the agreed plan: X."
- **Hard:** the host also detects a turn that ends with nothing running and no question, and sends one capped continuation cue. That needs a heuristic for "no question", which could misfire.

I'd start soft and add the cue if the run-throughs show both sides waiting. Is that OK?

**10. The opening.** I'd drop the stages paragraph and lead with the gather-first ask: their site, social pages via the platform export ("I'll tell you how to download it"), and uploads, alongside "tell me about your business". I'd keep a shortened View · Edit · Input / Progress tour. Is the tour still wanted in the first message?

**11. Home's phone-screen budget.** I'd put the budget and the rough height of each kind of section in two places: the site-plan playbook section, and the result of `set_decision('pages_navigation')`. Both would use the measurements the host already makes for the long-home report.

Two things I'll just do, no answer needed:
- This is well over the 20-point free-coding size. I'll keep it as one ticket, as you asked.
- I'll report the REQ-466 prompt budget measured before and after. I'll list every deleted or rewritten test in the ticket as I go. I'll rewrite DOC-75 per A.6 in the same branch.

Once you've answered, I'll set the ticket to `free_coding`, cut the branch and build it through.

<!-- xgd-turn id="6db49ad8-d802-4d2e-ae78-cd0d240b6fae-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T17:10:35.443431+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="6db49ad8-d802-4d2e-ae78-cd0d240b6fae-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T17:11:24.172491+00:00" -->
#### Claude
Almost ready to code. Your edits settle five of my eleven questions, and the other six aren't covered in the ticket.

**Settled by your edits:**
- **Existing plans (2):** no conversion. Every site starts with all nine pieces not started.
- **The first build (4, 5):** one refusal that names everything missing. It needs the client's agreement to the plan, recorded with their words ("just build it" counts), and a written design. Nothing falls back to `read_design`'s measurements.
- **Playbook (8):** each section is handed over with its tool's manual the first time that tool is used on a site. Priming already has the awareness map, so no separate index.
- **Opening (10):** no panel tour. The host gets a new "client opened Input" event, and the plan entry's "hasn't found Input yet" line stops once they've opened it or answered a question.

**Still open — what I'll do unless you say otherwise:**
1. **Progress panel.** The nine pieces replace the stages, labelled roughly: What the site is for, Why people pick you, Your material, The look, Pages, Building, Refining, Final checks, Live. I've changed one thing from my earlier proposal to match acceptance 1: every piece, including Building, Final checks and Live, is marked only as agreed, skipped or delegated, with the client's words. Nothing is exempt.
3. **Goal and choices.** Five new seeded decisions cover DOC-82 §4: story focus, scope, starting point, prices and involvement. The definition of done is a new brief field, `definition_of_done`, holding the client's priorities in their words.
6. **NOT_LOOKED and NOT_CRITIQUED.** Both refuse marking Final checks done. The pre-publish review still falls due when Publish opens.
7. **Reviewing each page.** The host runs the critic on each page as its builder finishes, so the first draft costs one review per page instead of one. "Every page" means the pages in `pages_navigation`, which is still recorded but no longer required before building.
9. **Initiative.** Soft for now: a priming rule plus a per-turn line naming the next item on the agreed plan. No host cue unless the run-throughs show both sides waiting.
11. **Home budget.** Home's phone-screen budget and the rough height of each kind of section go in the site-plan playbook section and in the result of `set_decision('pages_navigation')`.

If those are fine, say "go". I'll add these six to the ticket body so it covers all of the scope, set it to `free_coding`, cut `free-REQ-638`, and build. I won't merge it back until you say so.

<!-- xgd-turn id="01c55240-5cb0-4aad-bf81-5713222d034d-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T18:12:19.668520+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="c7e3aa14-33a7-4c26-bb2a-59ae41574d45-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T18:12:32.498701+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="c7e3aa14-33a7-4c26-bb2a-59ae41574d45-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T20:02:07.095645+00:00" -->
#### Claude
All open questions are now answered in the ticket. Starting: setting the ticket to `free_coding` and cutting the branch.

Branch `free-REQ-638` is set up in its worktree; now running a baseline of the ~290 affected test files before changing anything.

Baseline recorded (45 pre-existing failures in the affected suites). Now reading the plan-core stage code in full before rewriting it.

Typecheck baseline recorded. Starting phase 1: replacing the seven stages with the nine plan pieces in plan-core.

Writing the new plan seed: the nine pieces, the five §4 decisions, and the gather-first opening.

Now the PlanStage type and the big stage-machinery block (refusal codes, facts, settleStages, startNextStage, notices).

Design for the per-page review settled (the host runs the existing `critique` op after each first-draft build, focused on the new pages). Now replacing the stage machinery block in plan-core.

Fixing a stray brace from the type edit, then re-running the typecheck to list what references the removed stage code.

Still in plan-core: clearing the last references to the old stage machinery so it compiles, then the `set_stage` op and the per-turn plan entry.

Rewriting the per-turn plan entry now: the plan line, the initiative line, "hasn't found Input yet", and the waiting first-draft line, with the gear-change and stage lines removed.

Removing the story-board and Input-place gates in the plan operations, and pointing the "show the draft" refusal at the new readiness rule.

Plan-core compiles; now updating the control-app consumers (plan store, session delta, feedback, tester timeline).

Swapping REQ-428's gear-change counter for the first-draft readiness fact in the plan entry's providers.

Wiring the per-page review: registering a host-side reviewer where the critic is composed.

Plan and host code compile again. Next: make the remaining critic triggers optional (looks, revisions, design changes, recheck).

Now the first-build check in account-core: one refusal (plan agreed + design written) in place of `design_first`/`structure_first`/`effect_first`.

Now replacing the three refusals in account-core with the single `plan_first` refusal and wiring it in host-core.

Now the playbook: rewriting stage-guide-core so a DOC-75 section is handed over with a tool's first use, not by stage.

Typecheck is clean. Next, the story-board gates in story-core.

Story gates are out and it compiles. Now the comparison-board gates and the scripted "notice" instructions.

Removing the home-length hold: the host still reports a long home, offers once, and corrects a hand-back that calls home short, but nothing is held.

Home-length hold is gone and it compiles. Now the comparison-board gates and the scripted notice instructions.

Adding home's phone-screen budget to the `pages_navigation` result, plus the planned-pages list and the direction advice.

Plan, gates, playbook, home hold and notices are done and compiling. Committing this progress on the branch before the priming rewrite.

Part 1 committed. Now the tool declarations in plan-surface.json: `set_stage`, the new `agree_plan`, `set_decision`'s planned pages, and `offer_headlines`'s client headline.

Editing the surface text directly so the diff stays readable.

Surface updated. Adding `agree_plan` to the talker's allowed tools (`set_stage` stays withheld), then the priming rewrite.

Before rewriting priming, measuring the REQ-466 authored-prompt budget on the base commit so I can report before and after.

Base budget measured (consultant 190,542 authored chars against a 191,200 target). Now the priming rewrite. First, checking which sections are duplicated in the no-corpus variant.

Priming rewritten. Sweeping the remaining prompt text for stage-era wording.

Next: the "client opened Input" event, from the builder's `openInput` to the plan.

Wiring the Input-opened event: the panel says whether a mode change was the client's, the builder reports the first Input opening, and a small plan route records it.

Now recording the client's publish on the plan (signs off every piece left), in the publish route.

Code side compiles. Next is the DOC-75 rewrite. First checking where a ticket edit from this branch actually lands, so it doesn't reach production before you merge.

DOC-75 is parked as COMMENT-7250. Committing part 2 (surface, priming, Input event, publish sign-off).

Part 2 committed. Running the ~290 affected test files against the branch to see what breaks.

Many delegation suites fail because the first `Delegate` now waits for an agreed plan, and their fixture helper only writes the design. Checking that helper.

Plan entry now fits. Checking one detail of the decision-list labels, then triaging the failing tests file by file.

Removing the leftover dead code (first-draft hand-over script, effect hand-over, structure "say", the SITES_FIRST status mapping).

Now the partially affected files. Reading the batch-2 failure details.

I'll settle the budget after the final measurement. Now the replay suites.

The replay fixtures build plans with a design but no agreed plan, so their first `Delegate` is refused, which is correct now. Adding the agreement to those fixtures.

Now going through the remaining files' failing assertions in context.

Still triaging tests (about a third done). There's a shared test helper, `planUpTo`, that walks the old stages, so updating it fixes several suites at once.

Still working through the critic, first-draft and design suites. Reading the remaining ones I need to rewrite.

Pruning tests for removed behaviour: revision- and design-change-triggered reviews, the gear-change line, the note cap, `structure_first`, and the structure "say".

Removals are clean now. Re-applying the two edits that the restore undid (REQ-379 and the REQ-428 agenda test).

Rewrote the first-draft review suites. Now the long-home test (reported, never held), then the feedback/timeline tests.

Banner tests done. Next group: features question, comps board, story board, positioning, priming pins, opening text.

The remover overshot in REQ-629: a regex containing an apostrophe confused its quote tracking and it took two extra tests. Checking every file it touched for unintended removals.

Only REQ-629 lost an extra test. Restoring it and re-applying the intended removals by hand.

Now the opening-text tests (REQ-481, REQ-632).

Checking whether the BUG-304 failure is the plan entry being cut at its 2,000-character cap.

The entry fits again since the lines were tightened, and the "Parked:" line is there. Moving on to BUG-290 and the rest.

Writing the first new UAT file: pieces and the plan write, the publish sign-off, choices never required, the initiative and Input-found lines, and the removed gates.

Two things to check before running: `clientAnswer`'s signature, and whether `update_brief` accepts the new `definition_of_done` field yet (I hadn't added it to the brief keys or the surface).

Three issues. Two are in my test. The third is real: the story board's own validation still insists headline sources are card lines. Fixing that validator.

All 12 new UATs pass. Next, the playbook hand-over UAT through the real host, and a workers UAT for the Input-opened route.

Playbook UAT passes. Now the workers UAT for the Input-opened route; borrowing the REQ-364 panel harness.

New UATs pass. Re-running the full set of affected suites to see what's left.

Batch 1 is clean. Running batch 2.

Eight left. Checking why the two REQ-390 files fail to load, then fixing the rest.

Now the remaining assertion updates: REQ-481 names, REQ-632's discovery pin, REQ-379, REQ-426 and REQ-463.

REQ-426's failure is in the pre-existing baseline. REQ-379 still sets the old stages later in the test; reading that part.

Affected suites are green apart from the prompt budget. Checking for other tests that still name old stage ids but weren't in my import-based list.

Many UI tests build mock views with old stage ids; they may pass since the banner draws whatever it's given. Before a full-suite run, checking the one source hit, plan-panel.js.

The comparison-sites link now hangs off "The look" piece. Updating that constant, then running the rest of the suite.

These failures look unrelated (font registry, publish CLI, reconciliation suites). Confirming by running the same files on the untouched base worktree.

My new route isn't in that list, and AC977 also fails on the base. AC964 fails on the branch but not in the base's batch run, so I'm rerunning it alone on the base.

AC964 fails on the base too, and the other two passed when rerun alone, so nothing new in the first third. Running the second third.

No new failures in the second third. Running the last third.

The budget memory says to report an overrun rather than trim to fit, so the consultant target stays at 191,200 and REQ-473 stays red until you decide. Committing the test work and fixes.

All three commits are on `free-REQ-638`. Running a final typecheck of both packages.

Ticket updated. Removing the temporary base worktree I created for comparisons.

I've built REQ-638 on branch `free-REQ-638` in three commits, and haven't merged it. Production deploys from xgd-working, so nothing reaches it until you merge. The ticket is still at `free_coding`; it can't move to `free_coded` until the work is merged.

`xgd branch cut` failed in the sandbox (the known hooksPath problem), so I attached the worktree by hand at `~/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-REQ-638`.

**What it does now**
- **The plan:** the nine pieces replace the seven stages, and nothing in the host ticks, reopens, orders or starts one.
  - A piece the client agrees needs their words before it can be marked done, skipped or left to us.
  - Building, Final checks and Live are refused while they aren't true.
  - A new `agree_plan` records the client's yes to the whole plan.
  - Pressing Publish signs off every piece still open, as the client's decision.
- **First build:** one refusal (`plan_first`) names everything missing: the client's agreement to the plan, a written design, or both.
- **First draft:** the host reviews each page itself as it's built. "Your first draft is ready" is held until every page is built, reviewed and fixed. The preview is never hidden.
- **Removed:** every gate DOC-82 lists, the stage notices, the "Due:" lines and the gear-change line. The scripted instructions in the "client finished something" notices go; the notices themselves stay. The other review triggers are now optional.
- **Long home:** recording the site plan returns home's phone-screen budget (6 screens) and what the host last measured. A long home is still reported and offered once, but never holds the reply.
- **Playbook:** each DOC-75 section is handed over with the first use of its tool on a site, once.
- **Priming and opening:**
  - The route is replaced by the goal, the flow, the pieces, and tools as means.
  - Rule 2 is now "bring a perspective early; change nothing they haven't agreed".
  - Two new rules: the initiative rule, and no hand-drawn logos or illustrations.
  - The opening asks for their site, social exports and uploads, with no panel tour.
  - The plan entry says "the client hasn't found Input yet" until they open it or answer a question.

**Tests:** the full suite was run, and every failure was rerun against the untouched base. The only new failure is the prompt budget, below. 16 test files and about 30 single tests that pinned removed mechanisms are deleted; about 50 files are rewritten to the new behaviour. The ticket lists them all, along with the three new REQ-638 UAT files.

**Before you test, three things need you**
1. **DOC-75 is not updated yet.** Tests and the knowledge base read it from xgd-working's store, so changing it now would change what the next deploy ships. The rewrite is on the ticket as COMMENT-7250, with the command to apply it. Until it's applied, the consultant still gets the old guide text, including the musts DOC-82 removes. So apply it when you start testing.
2. **The prompt budget is over and I haven't trimmed it.** The consultant's authored prompt went from 190,542 to 193,700 characters (system text +1,745, tools +1,413), against a target of 191,200. So the REQ-473 budget test fails on the branch. You decide whether that's a review or a new target.
3. **About a dozen tests pin DOC-75's current wording.** Once it's applied they need updating to the new text. The ticket's merge steps list them, along with the version bump, the merge, `move-to-free-coded` with the three commit hashes, and closing BUG-331.

For the run-throughs, two of my choices are worth watching:
- Each page review is the host running the consultant's own `critique`, one page at a time. It can add a short pause after each page finishes building.
- The site plan now carries a list of page names, which "Building" is checked against. If the consultant doesn't record that list, Building only needs something to have been built.

<!-- xgd-turn id="e938e300-c532-43ff-b975-a12964121669-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T02:30:29.505878+00:00" -->
#### You
Please review your updated instructions for finalization and merge back I would like to proceed with those now,

<!-- xgd-turn id="e938e300-c532-43ff-b975-a12964121669-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T03:56:14.594245+00:00" -->
#### Claude
I'm replaying this ticket's three commits onto a fresh branch cut from current xgd-working, as the "Path to the first test" section says. After that comes handoff mode, then DOC-75, then the merge.

Resolving the cherry-pick conflicts: the first commit's two are done, and I'm checking how REQ-627's detached hand-off handles guides.

All three commits replayed (only two small conflicts, in account-core and host-core). Making the new worktree runnable, then typecheck.

Both typechecks pass apart from two errors in files this ticket doesn't touch. Checking for code left dead by the conflict resolution.

Next: a targeted test run to catch tests that landed since 11-03 and still use the old stages. First, finding the old stage ids.

Replay is clean. Now handoff mode, which the build needs before the first test. First, looking at the site-copy ticket and how a first build is recorded.

Now the opening path and where plans are normalized on read.

Now the per-turn plan entry and the facts it's given.

Still designing handoff mode: I'm working out which host facts (pages built, inventory, the captured site) the plan entry can read.

Plan: the handoff record carries what the copy knows (captured site, inventory, note), and the host adds live facts: pages built, nothing published. Now finding where the panel names piece states.

Writing the handoff model in plan-core.

Now the seed's handoff opening, and the read path in `plan.ts`.

Now wiring host-core: the handoff opening, and the pages built for the plan entry.

Typecheck clean. Now the panel: "Ready for your view" for a prepared piece.

Checking that `read_plan` returns the whole handoff note, as the plan entry promises.

`read_plan` returns the whole plan fields, so the full note is there. Making it read through `planOnRead` as well, then writing the handoff UATs modelled on the existing REQ-638 suite.

The surface enum already refuses it, which is better. Adjusting the assertion.

All 19 REQ-638 UATs pass. Committing handoff mode.

Handoff mode committed. Next is DOC-75 by diff: comparing its current body with the version the 11-03 draft was written from.

Only two bullets were added since the base: the shop page and product page standards (REQ-648 and its follow-up). Finding where they sit now and where they belong in the draft.

DOC-75 is applied. Now the tests that pin its wording: running every test that reads it, to see which fail.

18 failures across 16 files. Reading each failure message.

Most tests look a section up by its old "Stage guide:" heading, or pin wording the rewrite changed. Reading the new doc in full so I can map each one.

Now the failing assertions in context.

Adding a `guideSection(name)` helper that uses the source's own section parser, then updating each test to the new wording.

Most of these just need the section lookup changed, or the pin moved to the reworded text. Restoring the two lost facts in DOC-75 first, worded so REQ-376's and REQ-378's existing pins still match.

Now updating the test pins to the new wording.

One left: the restored sentence starts with a capital L. Making that pin case-insensitive.

All the DOC-75 pinning tests pass now. Committing them.

Now the full suite on the branch, in three foreground batches.

Batch 1 matches the base exactly: 173 failures on each, none new. Running batch 2.

Three branch-only failures, all in deploy-script suites this ticket doesn't touch. Rerunning them alone on the branch to check whether they're load flakes.

They pass alone, so they were load flakes. Batch 3.

Batch 3 timed out before writing its report. Splitting it in two.

No new failures in 3a. Running 3b.

My chained command ran the whole suite on the base when 3b produced no list. Stopping it.

Batch 3b also hits the 590s limit, so I'm splitting it into thirds and guarding the base run against an empty list.

Something in the last 55 files hangs. Narrowing it down.

All pass except REQ-646 (per-job containers), which hangs. Checking whether it hangs on the base too.

It hangs on the base too, so that's the environment (container builds in the sandbox). Baselining the remaining batch-3b failures.

No new failures, but REQ-473 fails on both, and I expected the budget test to fail only on the branch. Checking which REQ-473 tests fail where.

The budget test is in the workers suites; REQ-473 v2 fails to load on both sides. Running the workers project now, in four chunks.

272 workers failures across 76 files. Baselining those files on the base in two chunks.

The only new failure in the whole suite is the operator-accepted budget test. Getting its current numbers.

Ticket updated. Now the merge: lock, merge xgd-working into the branch, bump the version, then fast-forward back.

xgd-working had moved (BUG-349 and BUG-350 landed), and it merged cleanly. Quick typecheck, plus the new suites and this ticket's UATs, before bumping.

The capture-reference reconciliation suite fails. Checking it on current xgd-working without my commits: moving the base worktree to its tip.

It fails on xgd-working too (6 of 6), so it isn't this branch. Bumping the version on the branch now.

Merged. Now `move-to-free-coded` with the full SHAs.

Cleaned up. Removing the temporary base worktree I created for comparisons.

REQ-638 is merged into xgd-working and the ticket is at `free_coded`, version 0.2.780. Nothing is deployed yet. The next production deploy from xgd-working will ship it, so deploy to dev only until the run-throughs pass.

I followed the "Path to the first test" steps in order:

1. **Replayed on a fresh branch.** I cut `free-REQ-638` again from current xgd-working and cherry-picked the three original commits onto it. Only two small conflicts came up, both with REQ-627, and both are resolved keeping REQ-627's behaviour:
   - REQ-627's empty-scope check stays alongside the new single first-build refusal.
   - REQ-627's skip for a detached hand-off stays in the playbook hand-over.

   Nothing conflicted in the priming, the plan panel or BUG-348's progress area.
2. **Handoff mode is built.**
   - **New piece state.** There's a new `prepared` state, which the panel shows as "Ready for your view". The consultant can't set it; only the client's own words move a piece on, and their publish signs off whatever is left.
   - **Sites built before this change** open as prepared by the operator, with no note. Building is done, the five agreement pieces are `prepared`, and their next build is accepted. Nothing is reset to "not started".
   - **What the consultant sees each turn** on a prepared site: who prepared it and when, the captured site and inventory if recorded, the pages built, that nothing is published, and the preparer's note. The note is cut at 500 characters, and `read_plan` has all of it.
   - **The opening** is about the owner. It says a first version has been prepared, points to the preview, and asks what they want the site to do and how they feel about the look, layout and words. It also says anything can change and nothing goes live until they say so.
   - **The copy side is not built.** `enterHandoff` is ready for the site copy (REQ-654, still a draft), but writing the handoff note and starting the client in a fresh conversation are REQ-654's job.
3. **Prompt budget:** left over, as you decided. The consultant's prompt is now 194,071 characters against a 191,200 target, so the REQ-473 budget test is red on purpose. That's noted in the ticket.
4. **DOC-75 is applied live**, built from the 11-03 draft with three kinds of change:
   - **Carried over unchanged:** the shop page and product page standards (REQ-648 and its follow-up REQ-650), the only changes made to DOC-75 since the draft.
   - **Added:** one paragraph on sites prepared for their owner.
   - **Restored:** two facts the draft had lost: when to look at a comp's picture, and that *View on your phone* signs in with their email.

   REQ-648's catalog-grid check is untouched and still a floor check. 15 test files that pinned the old wording now follow the new text.
5. **Merged:** six commits recorded on the ticket, and the branch is cleaned up.

**Tests:** all 19 REQ-638 tests pass, including 5 new handoff-mode cases. I ran the full node and workers suites and reran every failing file on an untouched copy of the base. Three things are worth knowing:
- The only failure that isn't on the base is the accepted budget test.
- The per-job container suite (REQ-646) hangs on both the base and the branch here.
- The browser suites can't run in this sandbox, so they weren't run.

**Next for you:**
- Deploy to dev only and do the six run-throughs. The dev deploy also rebuilds the knowledge base, so the consultant gets the new DOC-75 text.
- Close BUG-331 once they pass.
- The old branch is still there as `orig-REQ-638` (unmerged). Delete it whenever you like.

<!-- xgd-turn id="dcf9b5da-c1bf-4703-bcb5-1909e4ee7374-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T14:57:06.109755+00:00" -->
#### You
What are the 6 run throughs?

<!-- xgd-turn id="dcf9b5da-c1bf-4703-bcb5-1909e4ee7374-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T14:57:33.062000+00:00" -->
#### Claude
The six run-throughs are acceptance 9 in the ticket: five client types, plus a sixth added by the handoff-mode section.

1. **A rich paster:** a client who pastes or uploads a lot of material up front.
2. **A bits-and-pieces answerer:** a client who gives short, scattered answers that have to be pieced together.
3. **One who knows exactly what they want.**
4. **One who wants it product-led:** run this one on a shop business, so it also tests the shop features.
5. **One with an existing site.**
6. **A prepared site handed to its owner:** a site already prepared from the client's existing website, with a handoff note, opened by its owner. Use the prepared shop site for this one. You can sit with the client for it.

For 1–5, judge the conversation and the resulting site against DOC-82 §2's view of a great site, never on whether a particular step fired. Across all of them, no turn should end with the client and the consultant each waiting on the other.

For the sixth, the ticket's questions are:
- Is the opening about the owner?
- Does the consultant use what was prepared, without re-asking what the draft already answers?
- Do the owner's changes go straight to building?

One thing to know before the sixth. Copying a prepared site into the client's own business, with its note, is REQ-654 (still a draft, not built). Until it lands, any site already built on dev opens in handoff mode with "prepared by the operator" and no note. So you can test the opening and the prepared pieces now, but not the handoff note or the client starting in a fresh conversation.

<!-- xgd-chat-end -->