---
uid: request-9d8c8275
id: REQ-638
type: request
title: 'Consultant model cutover (DOC-82): a great-site goal, a client-agreed plan,
  tools as means'
created_by: EPIC-19
created_at: '2026-11-03T01:27:04.216294+00:00'
updated_at: '2026-11-05T15:33:37.388347+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-3cb141fd
  story_points: 20
  commits:
  - working_sha: 7fe13f6b5225e221ac93e44c87a804ce05687e4b
    reconcile_sha: null
    main_sha: null
  - working_sha: 0f81cb1d3aee6668b8b1bddac0b5257d45b7a048
    reconcile_sha: null
    main_sha: null
  - working_sha: 601f4de63e5bd602cd2f6bd7267511e3fe17c944
    reconcile_sha: null
    main_sha: null
  - working_sha: 9a433b2e38884efc7ecf97a4626c75e042c0a1b1
    reconcile_sha: null
    main_sha: null
  - working_sha: 53bf894c33c7a366538b09bef3393b1c8a65158f
    reconcile_sha: null
    main_sha: null
  - working_sha: 40f6a0745f04a03e03acf63f58555409cdac0644
    reconcile_sha: null
    main_sha: null
  version: 0.2.780
---

# Consultant model cutover (DOC-82)

**The spec is DOC-82** (doc-8143b197). This ticket builds all of it in one cutover, then we revise from run-throughs. The operator wants one ticket with many commits: don't split it, and don't stage a transition that keeps mechanisms DOC-82 removes.

## Problem

The tools are running the show. The consultant executes stages, stage guides, holds, gates and refusals instead of building a great site with the client. In a full test build on 2026-11-02 it:
- asked the client to operate the machinery ("I can only build the card from notes you've hearted");
- rushed a headline because a guide said one must be agreed before the first draft;
- pinned base facts to the story board;
- missed the material that mattered (prices, classes, testimonials) until the client pointed at it.

Patching each behaviour adds rules and doesn't converge. The process exists because the consultant used to be too passive, so removing it must not leave client and consultant waiting on each other.

## What changes

### 1. A goal

The consultant brings DOC-82 §2's view of a great site to the client, aligns on it in conversation, and records the result as the client's definition of done for this site.

- The floor (tests 1, 4, 6 and 7) holds on every site.
- The client's choices (DOC-82 §4: story personal or product-led, scope, starting point, prices, involvement) are recorded as their decisions and can be changed later. They are five new seeded decisions (story focus, scope, starting point, prices, involvement).
- The agreed definition of done is a new brief field, `definition_of_done`: the client's priorities over DOC-82 §2's seven tests, in their words. The existing `site_job`, `audiences` and `quality_bar` decisions stay.
- **These are recorded as they come up in conversation, never asked as a form.** Nothing requires them, and no gate or agenda line pushes for them.

### 2. A plan the client agrees, in place of the stages

The plan holds DOC-82 §3's nine pieces.

- **The agreement pieces (1–5 and 7, Refine) are done when the client agrees, skips or delegates them.** The consultant marks each with the client's words (`client_said`). No piece ticks itself from a mechanism such as a hearted note or a ticked card.
- **The fact pieces (6 Build, 8 Final checks, 9 Publish) are marked by the consultant when the fact holds,** without the client's words. The host refuses the mark when the fact is false: Build while a planned page is unbuilt; Final checks while NOT_LOOKED or NOT_CRITIQUED would fire; Publish until the site is actually live.
- **Publishing is the client's call, and it signs everything off.** The Publish button is never gated by the plan. When the client publishes, the host records every piece not yet done as done, as the client's decision, and marks Publish done. This is the one write the host makes to the plan itself, and it records a client action rather than standing in for one. The pre-publish look and review still fall due when Publish is opened, as today (DOC-82 A.4).
- Each piece's state is one of: not started, in progress, done, skipped, delegated.
- The client's progress panel shows the plan, with the nine pieces labelled roughly: What the site is for, Why people pick you, Your material, The look, Pages, Building, Refining, Final checks, Live.
- These all go: stage `requires`, STAGE_ORDER, TICKS_ITSELF, settleStages self-ticking, startNextStage, the stage notices, the stages-behind and passed-over lines, the self-ticking "Due:" lines, and the priming "route".
- `set_stage` becomes the plan write.

### 3. The flow

DOC-82 §5:

- **Gather first.** The opening asks, in the very first exchange, for the client's site, social pages (using the platform exports, REQ-635) and uploads, alongside "tell me about your business".
- **Align.** This is a conversation, and the consultant brings a perspective.
- **Take stock.** Ask what they like, what they dislike and what better would look like. Existing material is evidence of what was done, not of what they want.
- **Plan.** The consultant proposes and the client agrees or adjusts.
- **Work.**

The scripted opening is rewritten to match.

- **No up-front panel tour.** The first message stays about their business and their material. The consultant explains a panel (Input, the story board, the comparison board) when it first matters, in one line.
- **The host tracks whether the client has found Input.** A new event records the client opening Input (today that happens only in the browser, `openInput` in `builder/app.js`, and the host never hears of it). The host already records who answered each question and when (`answered_by`, `answered_at`). Until the client has opened Input or answered at least one question, the per-turn plan entry says so ("the client hasn't found Input yet"), and every time the consultant posts a question it tells the client in one line where to find it. Once either has happened, the line stops. The same approach may cover the other panels.

### 4. Initiative

DOC-82 §6: **every turn ends with the consultant either doing something (said, with an honest estimate) or having asked the client one clear, specific question, and that move serves the agreed plan.**

- If the client raises something else, the consultant follows them, then brings the plan back.
- This replaces REQ-428's gear-change line with a general check. REQ-428's promise hold stays.
- **Soft for the cutover:** a priming rule plus a per-turn line naming the next item on the agreed plan ("End this turn doing something (say what, with an estimate) or with one clear question; next on the agreed plan: X"). There's no host continuation cue for it. One gets added only if the run-throughs show both sides waiting. The host-started turns after the client finishes something stay (§6).
- One question and one action per message stays (priming rule 5, minus "Input's places one at a time").
- Rule 2 ("suggestions only after the hand-over") becomes: bring a perspective early, but change nothing the client hasn't agreed.

### 5. Tools are means

DOC-82 §7.

- **Guides become a playbook, tied to the tool manual.** The stage guides are no longer injected by stage. Each DOC-75 section belongs to its tools, and the host hands it over with the tool's manual the first time the consultant uses that tool, once per site:
  - `ask_comps` or `add_comp`: the comparison board;
  - `pin_notes`, `write_positioning` or `offer_headlines`: the story board;
  - `set_design` or `offer_looks`: the design and looks;
  - the first `Delegate`: the first draft;
  - `critique`: checking your work.

  This reuses REQ-477's hand-over mechanism, driven by tool use instead of stages. REQ-477 showed that a rule the consultant has to remember to look up gets skipped, so the hand-over stays host-driven. The KB's **awareness map**, already in priming, is how the consultant finds any playbook section whenever it wants; no separate one-line index is added. The section arrives just after the tool's first use, which is acceptable because the checks that matter stay in the tools themselves.
- **DOC-75 is rewritten** per DOC-82 Appendix A.6. The "musts" A.6 removes go, including "a headline must be agreed before the first draft", "a design must exist before any build", "the opening always runs", "one area per message" and the fixed hand-over format. The rest become advice.
- **Graphics.** No hand-drawn SVG for logos or illustrations. A logo is a wordmark in the site's own type, and marks come from image generation.

### 6. Gates removed (DOC-82 A.8–A.11)

- **Story board:**
  - STORY_SETTLED, the reopen reason and REOPEN_SAY;
  - NOTES_UNREACTED and its line;
  - REQ-632's pin cap per message;
  - FOCUS_OPEN blocking pins, headlines and positioning;
  - NO_POSITIONING and "card only from hearted notes";
  - one story step per task;
  - the board-facts self-tick and its lines;
  - the empty-board push.

  A client's own headline is accepted as theirs. The tools' shape checks stay: 2–3 sourced headline options, no re-offering, and "a heading is not a note".
- **Comparison board:**
  - SITES_FIRST;
  - the `sites_settled` and `direction_agreed` self-ticks and their "ask them to heart it" lines;
  - the board-finished "before anything else" script;
  - the "not yet raised" agenda line;
  - DIRECTION_ORDERED's refusal, which becomes advice.
- **Places:** REQ-621's PLACE_HIDDEN, hidden-place results, hidden panel places and the "one place at a time" line; and the focus line's push.
- **Before the first build:**
  - `design_first`, `structure_first` and `effect_first` are replaced by **one check before the first build: the client has agreed the plan, and the design is written** (DOC-82 A.14 (2), plus the operator's 2026-11-03 decision to keep design-first). It's one refusal that names everything missing in a single message, never separate refusals in sequence. The agreed plan is an explicit whole-plan record set with the client's words; "just build it" counts as agreeing. Since the agreed plan includes the look, the design check rarely fires on its own; it catches a look agreed in chat with no `set_design`. There is no fallback to `read_design`'s measurements in place of a written design. This check is to be judged in the run-throughs.
  - FIRST_DRAFT_LEAD's scripted hand-over, EFFECT_HAND_OVER, DRAFT_UNSEEN_LINE's "other questions wait", and checks muted until the draft is seen.
- **Notices of what the client did** (settled, board finished, focus finished, asks finished, direction changed, and the host-started `finished-cue` turns) keep the information and the host-started turn. Their scripted instructions go.
- The dead `lost-continuation-cue` template goes.

### 7. The first draft: visible while it builds, invited when it's ready

DOC-82 A.14 (1).

- The client can watch the preview fill in and comment at any time; the talker takes comments as feedback.
- **Each page gets its quiet review as soon as it is built,** so the review overlaps the build. The host runs the critic on each page as its builder finishes, with findings going to the consultant quietly. That costs one review per page.
- "Every page" means the pages in `pages_navigation`. That decision is still recorded, but no longer required before building. A page added after the first draft has started joins the list, and the invitation waits for it too.
- The consultant **doesn't invite the client to look ("your first draft is ready") until every page is built, reviewed and fixed.**
- The other critic triggers become optional tools: looks offered, revised or design changed, and the recheck. REQ-623's quiet refinement becomes the default.
- The pre-publish review stays.

### 8. Home length is planned ahead

DOC-82 A.14 (4).

- When proposing the site plan, the consultant sizes home for a phone. The host gives it home's phone-screen budget and the rough height of each kind of section, in the site-plan playbook section and in the result of `set_decision('pages_navigation')`.
- The section heights come from measurements the host already makes (the long-home report) or from the starter templates. Don't invent numbers.
- The host still reports a long home after a build, and the consultant may mention it once.
- **Nothing is held.** The structure hold and `home-structure-cue` go.

### 9. What stays

Every **Keep** in DOC-82 Appendix A.1–A.4 is carried across unchanged in intent:
- the client's decisions and words bind;
- the honesty rules;
- running safely (leases, turn closing, continuations, talker, publish address, one focus task at a time);
- the layout look after builds;
- NOT_LOOKED before publishing, unhooked from stage ticks;
- the pre-publish review and REQ-628's suggestions;
- the speak-first gate.

## Acceptance

1. **The stage machinery is gone.** Nothing in the host ticks, reopens, orders or auto-starts a plan piece.
   - An agreement piece (1–5, 7) changes only when the consultant writes it with the client's words: agreed, skipped or delegated.
   - A fact piece (6, 8, 9) is marked by the consultant and refused while the fact is false.
   - The only host write is on the client's publish, which marks every remaining piece done as the client's decision.
1a. **The five §4 choices and `definition_of_done` are never required** by any refusal or agenda line.
2. **The opening asks for existing material** (site, social exports, uploads) in its first message.
3. **None of the refusals named in "Gates removed" can fire.** Each removed code is absent from the host.
4. **A first `Delegate` is refused only when the client hasn't agreed the plan or no design is written,** with one refusal naming everything missing. Once both hold, it's accepted without a site-plan or effect decision having been recorded separately.
5. **Stage guides are not injected by stage.** A playbook section is handed over with its tool's manual the first time that tool is used on a site, and not again. No stage change hands one over.
5a. **Until the client has opened Input or answered a question,** the per-turn plan entry says they haven't found it. Once either has happened, it doesn't.
6. **While the first draft builds,** each page is reviewed when it finishes. The draft invitation ("your first draft is ready") is held until every page is built and reviewed. The preview stays visible throughout.
7. **A long home is reported and never holds** the hand-back. The site-plan step receives home's phone-screen budget.
8. **Every Keep mechanism in DOC-82 A.1–A.4 still behaves as before.** Their existing tests still pass.
9. **Five operator run-throughs in dev:**
   - a rich paster;
   - a bits-and-pieces answerer;
   - one who knows exactly what they want;
   - one who wants it product-led;
   - one with an existing site.

   Each is judged on the conversation and the resulting site against DOC-82 §2, and never on whether a step fired. No turn ends with both sides waiting.

## Notes for the builder

- **No migration of existing plans.** The only real sites are the operator's own, which weren't built with this process. Every site starts the new plan with all nine pieces not started. Don't write a conversion from stored stages.
- **Tests that pin removed mechanisms are deleted or rewritten** to the new behaviour, not kept. Say which ones in the ticket as you go.
- **The priming rewrite will move the REQ-466 prompt budget.** Report the measured before and after; don't trim unrelated text to fit.
- **Paused tickets.** This ticket supersedes the gate parts of REQ-621 and REQ-632 (both live). Parked BUG-331 (the headline and card gate) is resolved by §6 and can be closed when this lands.
- **Questions go to EPIC-19.**

## As built (branch `free-REQ-638`, not merged)

Commits, in order:
- `83f8c024fa2346ca0eae81f2a77954dd9fc98f07`: plan pieces replace stages; DOC-82 gates removed
- `52cd7594458f66f58c130bed0e45974ec4fb8798`: goal-and-plan priming, plan surface, Input and publish events
- `6351179545abbcc17e2339676e997343360bec81`: REQ-638 UATs; tests of removed stage machinery deleted or rewritten

**The plan.**
- The nine pieces live in `plan-seed.json` under `stages`: purpose, reason, material, look, pages, build, refine, final_checks, publish. The panel labels them What the site is for, Why people pick you, Your material, The look, Pages, Building, Refining, Final checks, Live.
- A piece is one of: not started, in progress, done, skipped, delegated.
- `set_stage` is the plan write:
  - An agreement piece needs `client_said` to be done, skipped or delegated (`CLIENT_WORDS`). The words are kept on the piece (`said`) and in the decision log.
  - A fact piece is marked done only, and is refused while false (`NOT_YET`). Building waits for a first pass and every page named in `pages_navigation`'s new `pages`. Final checks waits on `NOT_LOOKED` and `NOT_CRITIQUED`, and a refused attempt makes the review before publishing due. Live waits for `published_at`.
- `agree_plan` records the client's yes to the whole plan (`plan_agreed`, with their words) and logs it.
- A successful publish runs `sitePublished` from the publish route. It records every unsettled piece as done by the client (`said.by: 'publish'`) and stamps `published_at`.
- Stored pre-DOC-82 stages are dropped on read, not converted.
- The banner draws stored states. Skipped is the client's only, and delegated reads "Left to us". The comparison-sites link now hangs off The look.

**The goal.**
- Five seeded `choice_*` decisions: story, scope, start, prices, involvement.
- The brief gains `definition_of_done`.
- Neither is required by any refusal or agenda line. Open choices are kept out of the plan entry's decision lists.

**Per-turn plan entry.**
- It now opens with the pieces line, then the initiative line ("End this turn doing something … next on the agreed plan: X. Follow your client first…").
- While the client hasn't found Input it adds "The client hasn't found Input yet…". The builder reports the client opening Input through `POST /api/plan/seen`, which records `input_opened_at` once. A question the client answered also counts.
- While the first draft builds, it adds the draft-waiting line in place of "Review:".
- Removed: the stages, behind and passed-over lines, every Due line, the gear-change line, the features and comp-board pushes, and the empty-board push.

**First build.**
- One `plan_first` refusal names everything missing: the client hasn't agreed the plan, or the design isn't written. No fallback to `read_design`.
- It replaces `design_first`, `structure_first` and `effect_first`.

**First draft.**
- `firstDraftWaiting` lists what the invitation still waits for: unbuilt planned pages, built pages not yet reviewed, and open findings.
- The host runs `critique` itself, focused on the next unreviewed built page (trigger `page_built`). It does this after each builder finishes and at each round's end. It runs one review at a time, never while the last one's findings are open, and only until the client has seen and answered the draft.
- The existing review hold makes the consultant answer the findings.
- `show_client` with target draft is refused (`DRAFT_NOT_REVIEWED`) while anything waits. The announcement hold uses the same rule.
- No whole-draft review falls due at the first pass.
- Looks, revision, design-change and recheck reviews no longer fall due. A recheck is offered in the answer's result.

**Home length.**
- Recording `pages_navigation` returns `home_budget`. It gives the budget, which is the long-home check's own `maxScreens` (6 today), and what the host last measured of home: screens over sections.
- After a build the host still reports a long home and offers once.
- Nothing is held: `home-structure-cue`, the structure hold and its note are gone. The misstated-home correction stays.

**Gates removed.**
- STORY_SETTLED and REOPEN_SAY; NOTES_UNREACTED; the pin cap and the per-message stamp it counted (`client_message`).
- FOCUS_OPEN on pins, headlines and positioning; one story step per task.
- NO_POSITIONING. The card needs no hearts. Headlines are sourced from a card line, a note or the client's words. A client's own headline is recorded with `offer_headlines {client_headline, client_said}`.
- The board facts and their lines.
- SITES_FIRST and the forming card. DIRECTION_ORDERED is now advice.
- Removed scripts: the board-finished "before anything else", the agenda pushes, PLACE_HIDDEN, hidden places, hidden-place results and the "one place at a time" line, and the focus line's push.
- FIRST_DRAFT_LEAD, EFFECT_HAND_OVER, DRAFT_UNSEEN_LINE, STRUCTURE_SAY.
- The scripted instructions in the settled, board-finished, focus-finished and asks-finished notices, and in `finished-cue` and `finished-talker-cue`.
- The dead `lost-continuation-cue`.
- A UAT scans the host source to confirm these codes are gone.

**Playbook.**
- `stage-guide-core.ts` now maps each DOC-75 section to its tools:
  - comparison board: `ask_comps`, `add_comp`
  - story board: `pin_notes`, `write_positioning`, `offer_headlines`
  - design and looks: `set_design`, `offer_looks`
  - first draft: `Delegate`
  - checking your work: `critique`
- The host hands a section over in the result of that tool's first call on a site, once. The next turn's start carries it once more so it stays in the history. Nothing is handed over by stage.

**Priming.**
- `route` is replaced by `goal-and-plan`. It covers the §2 view of a great site and the floor, recording the definition of done and choices, the flow (gather, align, take stock, plan, work), the pieces, and tools as means.
- Rule 2 is now "bring a perspective early; change nothing they haven't agreed". Rule 5 loses Input's places.
- Rule 13 (initiative) and rule 14 (no hand-drawn logos or illustrations) are new.
- The material track is rewritten as advice, with no fixed order. Who-you-are, the knowledge pointer, builder-copy and talker-discovery are updated to match.
- The opening is rewritten to gather first, with no panel tour. The opening cue says so.

**The plan surface** declares all of the above and drops the removed refusal codes. The talker may run `agree_plan`; `set_stage` stays withheld.

## Design decisions made while building

- **DOC-75 is not changed live.** The KB that production deploys is built from xgd-working's ticket store, and tests read DOC-75 from that store too. The rewritten DOC-75 (per DOC-82 A.6) is parked as COMMENT-7250 on this ticket, to apply when testing starts. The new code accepts both the old and new headings. Until it's applied, `set_design` and `offer_looks` hand nothing over, because the old doc has no "design and looks" section, and the old "musts" still ride the other sections.
- **Per-page review is the host calling the plan's own `critique` op,** focused on one page. That keeps one review mechanism, one recorded run shape and the existing hold, rather than adding a second.
- **Building's planned pages come from a new structured `pages` list on `pages_navigation`.** Its value is free text, so there was nothing to check against.
- **The plan entry had to shrink to fit its 2,000-character cap.** The pieces line uses ids, and the initiative and Input lines were cut to one short sentence each.

## Tests deleted or rewritten

Deleted (they pinned removed mechanisms): BUG-221 stage moved off; BUG-235 two stages; BUG-269 first-draft review comes first (both); BUG-301 unseen draft holds questions; BUG-306 effect before the first draft (node); BUG-319 look summary after the sites, and its wire test; BUG-322 next stage starts; REQ-432 stages settle (both); REQ-434 story board settles (both); REQ-445 hand-over and stage order; REQ-477 stage guides handed over (replaced by REQ-638 playbook); REQ-621 Input one place at a time.

Single tests deleted:
- BUG-297's two hold tests; BUG-306 `first_build_held_until_effect_decided`.
- REQ-379 revision round; REQ-390's stage tests, and the legacy-phase one on the wire.
- REQ-425 `getting_to_know_you_finishes`; REQ-428 note cap and gear change.
- REQ-444 lead with the draft link; REQ-449 revision and design-change reviews.
- REQ-460 `structure_first` and the structure "say"; BUG-287 hold clears; BUG-292's two home-structure tests.
- REQ-623 draft shown after review and the colours guide; REQ-629 stage order and ticks itself; REQ-632 pin cap; BUG-304 one guide per turn.

Rewritten to the new behaviour:
- **First draft:** REQ-427 (per-page host review holds the hand-back; recheck offered, not due; final checks wait for the pre-publish review), REQ-458 (page review on a vanished build; draft refused until reviewed), BUG-279, BUG-290, REQ-438.
- **Pieces and plan entry:** REQ-415, REQ-628, BUG-230 and BUG-235 (onto final_checks via the rewritten `planUpTo`), REQ-398, REQ-390 tracker, BUG-209 and REQ-419 (banner draws stored pieces), REQ-356, REQ-364, REQ-379, REQ-428 agenda, REQ-480 timeline, REQ-479, BUG-311.
- **First build and first draft copy:** REQ-448 (one `plan_first` refusal), REQ-450 and REQ-455 (first-draft copy resets from Building), REQ-452 and REQ-454 (fixtures carry the agreed plan).
- **Home length:** REQ-460 and BUG-287 (long home reported, never held; site plan gets home's budget; direction order is advice).
- **Story board:** REQ-408 and REQ-425.
- **Priming and opening text:** REQ-473 v2, REQ-481, REQ-632, REQ-403, REQ-416, REQ-424, REQ-426, BUG-65, BUG-241, BUG-245, BUG-264, BUG-275, BUG-284, BUG-322, REQ-399, REQ-623.

Test helpers: `designWritten` also records the agreed plan, and `planUpTo` brings a plan up to a piece.

## Test plan (as built)

- `test_UAT_FC_REQ-638_the_plan_the_client_agrees` covers 12 cases: nine pieces; agreement needs words; facts refused while false; Building waits for planned pages; nothing but the consultant moves a piece; publish signs off; agree_plan; choices never required; initiative line; Input-found line; story tools hold nothing back; removed codes absent.
- `test_UAT_FC_REQ-638_playbook_with_its_tool` checks the section-to-tool mapping, and that a section is handed over on first use and not again.
- `test_UAT_FC_REQ-638_input_found_on_the_wire.workers` covers `/api/plan/seen`.
- AC4 is covered by REQ-448. AC6 by REQ-427, REQ-458 and BUG-279. AC7 by REQ-460 and BUG-287. AC2 by REQ-632 and REQ-481.
- The full suite was run in three batches. Every failure was rerun on the untouched base (f6baa29928). The only failures not on the base are REQ-473 (the budget, below). Two failures that showed up once in batch runs passed when rerun alone.

## Prompt budget (REQ-466), not trimmed

| | before | after | change |
|---|---|---|---|
| Consultant authored | 190,542 | 193,700 | +3,158 |
| system | 71,301 | 73,046 | +1,745 |
| tools | 119,500 | 120,913 | +1,413 |

The consultant's target is 191,200, so `test_UAT_FC_REQ-473_the_consultants_authored_size_is_inside_the_lowered_budget` is red on the branch. It needs a review or a target change, by the operator. REQ-466 was already red on the base (critic 8,653 against 8,600).

## To merge (when the operator is ready to test)

1. **Apply DOC-75 from COMMENT-7250:** `xgd ticket update doc-50b859e0 --title "Playbook: the Site consultant's tools" --body-file <body>`. Then rebuild the KB. This touches what xgd-working's next deploy ships.
2. **Update the tests that pin DOC-75's current wording** to the new text: BUG-202, BUG-245, BUG-304, BUG-322, REQ-378, REQ-389, REQ-400, REQ-408, REQ-423, REQ-473 v2, REQ-623, REQ-632, and `tests/support/stage-guides.ts`'s title.
3. Bump the version and merge back per the free-coding protocol, then run `move-to-free-coded` with the three SHAs above.
4. Afterwards, BUG-331 can be closed.


## Merge guard: don't lose later playbook and floor changes (EPIC-19, 2026-11-04)

Step 1 of "To merge" replaces DOC-75's body with the draft in COMMENT-7250 (written 2026-11-03). Work has landed or is queued since then that this replacement must not wipe:
- **REQ-648** (shop display: product grid standard) adds shop-grid guidance to the consultant's and builder's playbook and priming, a starter catalog `list`/`card`, and a **host floor check on catalog grids** (columns, uniform 4:5 photo boxes, no giant photos, right-sized files).
- Any other DOC-75 or priming edit made after 2026-11-03.

So at merge:
1. **Don't paste the draft over DOC-75.** Diff DOC-75's current body against the version the draft was written from, and carry every change made since into the new text. If REQ-648 has landed, its shop-grid guidance moves into the `goal-and-plan` playbook's equivalent place, unchanged in meaning.
2. **Floor checks added since the branch was cut stay floor checks.** That includes REQ-648's catalog-grid check if it has landed. They count toward Building/Final checks exactly like the existing floor tests and are never removed as "gates" under §6: they check the site's quality, not the client's agreement.
3. Re-run REQ-648's UATs (if landed) after the merge, alongside this ticket's.


## Handoff mode (operator decision, EPIC-19, 2026-11-05)

**Replaces "No migration of existing plans" in Notes for the builder.** That note assumed the only real sites were the operator's own. Real clients now get sites prepared for them: the operator (or later, a helper) builds a starter site from the client's existing website and material, then hands it to its owner. The plan model must handle that case without new stages. It's a test of how flexible the goal-and-plan model is.

**The state: a site prepared by someone else, not yet the owner's decision.** Everything in the draft is a proposal. The client's own reactions are what bind (DOC-82).

1. **The consultant knows the situation before the client speaks.** The per-turn plan entry and the opening context carry the host's facts:
   - the client's existing site was captured (URL, date, bundle);
   - the inventory was imported (count, collections);
   - these pages are built;
   - nothing is published.

   They also carry the **handoff note**: the preparer's own words on intent, assumptions and open points (e.g. "the story section is a placeholder", "hero clip chosen by me"). The note is stored on the site (see the site-copy ticket, which carries it across). Plan pieces never read it as agreement.
2. **A new plan state: `prepared`.** On entering handoff mode, the agreement pieces (purpose, reason, material, look, pages) are `prepared`: a proposal exists in the draft, waiting for the owner's view. They are neither `not_started` nor agreed. The panel shows them as "Ready for your view". **Building** is done (the pages exist). Refining, Final checks and Live are as normal. A `prepared` piece becomes agreed from the client's own words, exactly as any agreement piece. Publishing with pieces still `prepared` follows §2's publish rule: the client's publish marks them done as the client's decision.
3. **The opening is about the owner, not the process.** In its first message the consultant:
   - says a first version of their site has been prepared from their current one, and shows it;
   - asks what they want the site to do (a shop front only, or their story too);
   - asks how they feel about the look, the layout and the words;
   - says plainly that anything can be changed, and nothing goes live until they say so.

   No discovery script, and no re-asking what the draft already answers unless the client wants to revisit it.
4. **The client sees a fresh conversation.** The preparer's build conversation is not shown to the client and doesn't carry over as conversation. The consultant gets the facts and the handoff note, not the preparer's chat.
5. **The check before the first build applies only to a site that has never been built.** A prepared site has been built, so its Delegates are never refused for want of an agreed plan.
6. **How a site enters handoff mode:** the site copy carries it in when the destination is marked as a handoff (site-copy ticket). An already-built site on this platform that has no plan under the new model also starts in handoff mode, with the operator as the preparer and no note, so a site built under the stage model is never reset to "not started".

**Acceptance additions:**
- 9: **a sixth run-through, "a prepared site handed to its owner".** A site prepared from the client's existing website, with a handoff note, is opened by its owner. It is judged on whether the opening is about them, whether it uses what was prepared without re-asking, and whether changes go straight to building. The operator may sit with the client for this one; that is two people at one screen and needs nothing from the product.
- 10: a site with a first build and no new-model plan loads with Building done and the agreement pieces `prepared`, never `not_started`, and its next Delegate is accepted.


## Path to the first test (operator, EPIC-19, 2026-11-05)

Supersedes the order in "To merge". Do these in order:

1. **Don't merge `free-REQ-638`.** It was cut on 2026-11-03, and xgd-working has since been rewritten by resync: `git rev-list` counts ~24,700 commits ahead and ~28,000 behind, nearly all of it old history, not this ticket's work. Cut a fresh branch from current xgd-working and **replay only this ticket's three commits** (`83f8c024fa`, `52cd759445`, `6351179545`) with `git cherry-pick`, resolving conflicts there. Record the new SHAs in `fields.commits` (the cherry-picked SHAs, not the old ones). Expect conflicts where work has landed since:
   - the consultant's priming and playbook (REQ-648's shop-grid guidance; follow the merge guard above);
   - the plan panel and progress area (BUG-348; REQ-653 is a draft that will build on this);
   - turn and hand-off code changed by REQ-627.
2. **Build handoff mode** (section above) before the test. Without it the build resets every existing site to all pieces `not_started`, including the prepared shop site the sixth run-through needs.
3. **Prompt budget: not a blocker for this test.** Operator decision: the small overrun (193,700 against 191,200) is accepted for now. Don't trim to fit and don't change the target in this ticket. Leave `test_UAT_FC_REQ-473_the_consultants_authored_size_is_inside_the_lowered_budget` red, and note it as a known, operator-accepted failure in the ticket when moving to `free_coded`. A separate TODO tracks the review.
4. **DOC-75 by diff, per the merge guard:** carry forward every change made to it since 2026-11-03. Then update the tests that pin its wording (the list in "To merge" step 2).
5. **Bump, merge back, `move-to-free-coded`** with the cherry-picked SHAs, per the free-coding protocol.
6. **The operator deploys to dev only** and runs the six run-throughs. Shop features are covered in the same runs: "one who wants it product-led" on a shop business, and "a prepared site handed to its owner" on the prepared shop site. **Not production** until the run-throughs pass: the next production deploy from xgd-working ships this.



## As landed (2026-11-05): replay, handoff mode, DOC-75, merge

Done in the order of "Path to the first test".

**1. Replayed on a fresh branch.** `free-REQ-638` was cut again from xgd-working (075635a56a), and the three original commits were cherry-picked onto it. The old branch is kept as `orig-REQ-638` and is not merged. Two conflicts came up:
- `account-core.ts`: the single `plan_first` refusal replaces DESIGN_FIRST/STRUCTURE_FIRST/EFFECT_FIRST, and REQ-627's empty-scope refusal (REQ-410) is kept after it.
- `host-core.ts` `withGuides`: the playbook is handed over with its tool's first use, and REQ-627's skip for a detached Delegate hand-off is kept (its section comes with the delivered result).

No conflicts in the priming, the plan panel or BUG-348's progress area.

**2. Handoff mode, as built.**
- **New piece state `prepared`.** It is not settled, and the consultant can't set it (the surface's state enum refuses it). The panel shows it as "Ready for your view", in blue.
- **`fields.handoff`** (in PLAN_KEYS) records `{ at, preparer, note?, captured?: { url, at?, bundle? }, inventory?: { items, collections? } }`. Whatever enters handoff mode records what it knows; the site copy (REQ-654) fills in the captured site, inventory and note.
- **`enterHandoff(fields, record)`** is exported for REQ-654. It sets the agreement pieces before Building (purpose, reason, material, look, pages) to `prepared` unless they're already settled, marks Building done, marks Live done if the site is published, and stores the record.
- **`planOnRead(fields)`** runs wherever a plan is read: `toPlan` in the control app, the plan entry, `read_plan` and the opening. A site with a first build whose stored pieces include none of the new model's ids (old stage ids, or none) enters handoff mode with preparer `operator` and no note. A built site is never reset to "not started".
- **The plan entry**, while any piece is `prepared`, carries a "Handoff:" line: who prepared it and when; that everything is a proposal; don't re-ask what the draft answers; the captured site and inventory if recorded; the pages built now (read live by the host); "Nothing is published" or "It has been published"; and the preparer's note, cut at 500 characters with "(read_plan for all of it)". The pieces line names "ready for their view: …". The initiative line's next item is "their view of what was prepared; their changes go straight to building".
- **The opening** for a site with a `prepared` piece is the seed's `opening_handoff`. It says a first version of their site has been prepared (adding "from your current one" when a captured site is recorded), that it's in the preview, that anything can be changed and nothing goes live until they say so, and asks two things: shop front only, or their story too; and how they feel about the look, the layout and the words. There's no discovery script and no panel tour.
- **`firstBuildMissing`** returns nothing for a plan with `handoff`, so a prepared site's Delegates are never refused for want of an agreed plan.
- **A fresh conversation for the client** (no preparer chat carried over) is the site copy's job (REQ-654). An operator's own legacy site keeps its conversation.

**3. Prompt budget.** As the operator decided, accepted for now and not trimmed. `test_UAT_FC_REQ-473_the_consultants_authored_size_is_inside_the_lowered_budget` is red on purpose: 194,071 against 191,200. A separate TODO tracks the review.

**4. DOC-75 applied by diff** (title "Playbook: the Site consultant's tools"):
- The COMMENT-7250 draft as written.
- The two bullets added since 2026-11-03 (the REQ-648 shop page / listing-grid standard and the REQ-650 product page standard), unchanged, in "the site plan".
- A paragraph in "gathering and taking stock" on a site prepared for them.
- Two facts the draft had dropped, restored: look at a comp's picture when discussing how it looks (REQ-415), and *View on your phone* signs in with the email they use here (REQ-376).

REQ-648's catalog-grid floor check stays a floor check; nothing in this ticket touches it.

Tests pinning DOC-75 were updated:
- `tests/support/stage-guides.ts` finds the doc by its new title and gains `guideSection(name)`, which parses sections the way the host does.
- Updated: BUG-202, BUG-245, BUG-304, BUG-308, REQ-378 (no route any more), REQ-389, REQ-400, REQ-408, REQ-423, REQ-424, REQ-623, REQ-632, REQ-648, REQ-650.

**Tests.** New: `test_UAT_FC_REQ-638_handoff_mode` (5 cases):
- a stage-era built site loads prepared and is never reset, and its next build is accepted;
- a new site is not in handoff mode;
- a copied handoff's plan entry carries the captured site, inventory, built pages, "nothing published" and the note (cut, with the pointer);
- the handoff opening;
- a prepared piece is agreed only with the client's words, is shown "Ready for your view", and is signed off by publish.

All 19 REQ-638 UATs pass. The full node and workers suites were run in batches, and every failing file was rerun on an untouched worktree at the base (075635a56a):
- The only failure not on the base is the accepted budget test.
- Three deploy-script tests failed once under load and pass when run alone.
- `test_UAT_FC_REQ-646_agent_compute_in_containers` hangs on both base and branch (container builds in the sandbox).
- The browser suites (`tests/browser`) can't run in the agent sandbox and weren't run.

**Commits on xgd-working** (non-merge): 7fe13f6b52 (pieces and gates), 0f81cb1d3a (priming, surface, Input and publish events), 601f4de63e (UATs and removed-machinery tests), 9a433b2e38 (handoff mode), 53bf894c33 (DOC-75 pins), plus the version bump commit.

**Next (operator):** deploy to dev only and run the six run-throughs. Not production until they pass. BUG-331 can be closed after that.