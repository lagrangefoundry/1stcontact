---
uid: request-3407f797
id: REQ-623
type: request
title: 'Refinement is consultant-led and client-sourced: the AI''s own review happens
  before the first draft is shown'
created_by: EPIC-19
created_at: '2026-10-31T23:52:13.355978+00:00'
updated_at: '2026-11-01T16:57:01.502971+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-2f03f25e
  commits:
  - working_sha: 14fdb79c70983afa08129d1688ad096d003cf046
    reconcile_sha: null
    main_sha: null
  - working_sha: eaaa2d0124176f918645034e8f6f581f855adfa6
    reconcile_sha: null
    main_sha: null
  version: 0.2.725
  story_points: 8
---

## Why

Principle (operator, confirmed 2026-10-31, clarified 2026-11-01): **the first draft is the AI's best effort. Refinement is led by the consultant, and its changes come from conversation with the client.** The consultant drives the process — it walks the client through the site, asks, and proposes — but every change traces to something the client said. Clients usually have vague concerns ("the colours aren't quite right", "the spacing in that second paragraph feels wrong"); turning them into precise, actionable changes is the consultant's job. On Ariel's Arc Welding (production, 2026-10-31) refinement ran 3 h 24 min (20:24 → 23:48Z) with the client seeing "another 15 minutes" again and again, and most of the work wasn't theirs:

- Since 20:24: 54 builder Delegates and 210 tool calls; only about 8 of the 26 turns carried new client feedback (the rest were lost-turn carry-ons, "please carry on", and "review of the site still owed" host cues).
- **The first draft's review ran during refinement.** REQ-427's first-pass critique (`C1`, trigger `first_pass_complete`) ran at 21:10, 46 min after the draft was marked seen (20:24, BUG-322). Its top finding rebuilt the home hero and is where the shaded box came from ("…over the 16:9 photo, with a scrim behind the text").
- **Reviews chain.** A run whose high finding is answered `fixed` schedules a `recheck` (`critic-core.ts`, `critiqueFallsDue(…, RECHECK)`), and the "review still owed" cue forces it: runs at 22:54 and 23:07. The critic reads cold (BUG-271), so at 22:54 it again proposed a dark gradient behind the hero text after the client had rejected the box.
- **Whole-site tidying each round.** 20:36–21:40: ~15 Delegates "Tidied the … page layouts" across all six pages, not only what the client's change touched.

## What

1. **The first draft is handed to the client only after its review and fixes are done.** REQ-427's first-pass critique, its answers and its rechecks all happen before the draft is shown (the hand-over waits on them, as the layout and review holds do). Nothing the AI would have wanted to fix about the first draft is left for refinement.
2. **No critic reviews during refinement.** Between the hand-over and Publish, no critique falls due: no first-pass run, no `recheck`, no "review still owed" cue. The pre-publish review (`before_publish`) stays.
3. **The consultant leads; the client's concerns are the source.** The consultant runs refinement as a guided conversation: it takes the client through the site (page by page, or by area: words, pictures, layout, colours and type), asks what they think, and draws out concerns. A vague concern is refined into an actionable change: the consultant says what it thinks is behind it, and offers one to three concrete options (as Looks for design-wide changes like colours and type, or a before/after for a section), and the client picks. Precise requests are just done.
4. **A refinement round changes only what came from the client**, plus fixing what the checks find broken in the parts that change touched (layout findings on other pages and sections are not raised to the consultant during refinement, and the consultant doesn't brief whole-site tidying).
5. **Anything else the AI notices is offered, not built.** The consultant may give a different perspective ("I'd also suggest…"), one at a time (REQ-621), as a suggestion with its reason; it is built only if the client says yes. The client always decides.
6. **Colours and fonts is a short, consultant-led stage settled with Looks.** It isn't part of refinement's open-ended conversation: the consultant offers three looks straight away (one close to the current design, two that each differ in one clear way), the client picks or says what they like, there's at most one more round, and then it moves on. A look is design-only (no builder pass), so the stage takes minutes. Its stage guide ("Stage guide: colours and fonts", written into DOC-75 on 2026-11-01) must actually reach the consultant: `stage-guide-core.ts`'s stage list gains a `colours_and_fonts` entry (heading "colours and fonts", started when that stage is in progress), which it lacks today, so the guide is never sent. Offering looks makes no critique due here (point 2 covers it: `LOOKS_OFFERED` doesn't schedule a review between the hand-over and Publish).
7. **The guides say the same thing.** DOC-75's "Stage guide: refinement" was rewritten on 2026-11-01 to this approach (the consultant leads a guided conversation, turns vague concerns into one to three options, changes only what came from the client, offers anything else as a suggestion). Code and priming in this ticket must agree with it; where the consultant's other priming contradicts it (e.g. "When they lead: this is where they try things"), the guide wins and the contradiction is removed.
8. **The critic never overrides a client decision.** A pre-hand-over or pre-publish finding that contradicts a recorded client decision (BUG-326) is not acted on; at most it's raised with the client as a perspective under point 4.

Related, not repeated here: BUG-322 (first draft counted as built/seen too early), BUG-320 / BUG-324 (lost turns and redone work), BUG-326 (client decisions recorded and binding).

## Test plan

- `test_UAT_FC_<id>_draft_shown_after_review`: with the first pass built, the hand-over (draft shown / "ready to look at") is held until the first-pass critique has run and every finding is answered, including a recheck.
- `test_UAT_FC_<id>_no_critique_in_refinement`: after the hand-over, answering a high finding `fixed`, finishing a revision round, and a turn end don't make a critique due or send the "review still owed" cue; opening Publish does.
- `test_UAT_FC_<id>_colours_stage_guide_delivered`: setting `colours_and_fonts` in progress delivers DOC-75's "Stage guide: colours and fonts" to the consultant's next turn, once.
- `test_UAT_FC_<id>_looks_make_no_review_due`: after the hand-over, `offer_looks` and `choose_look` don't make a critique due.
- `test_UAT_FC_<id>_round_checks_only_what_changed`: a revision round touching `home.json#hero` reports layout findings for that section only, not for other pages.
- The consultant priming (refinement stage guide) says the consultant leads refinement as a guided conversation, turns vague concerns into one to three concrete options for the client to choose, changes only what came from the client, and offers anything else as a suggestion the client decides on.

## What landed (2026-11-01)

- **Refinement, for the critic**, is: the client has seen the first draft and answered it (`draft_seen_at` and `feedback_at` after `first_pass_at`), and Publish is not opened (`refining()` in `critic-core.ts`).
- **Point 1, hand-over after review**: the existing REQ-458 holds already did this: `show_client` refuses `draft` (`DRAFT_NOT_REVIEWED`), the agenda leads with the review, and the turn-end hold carries on until the first-pass critique, its answers and its recheck are done. This ticket adds a UAT that pins it.
- **Point 2, no critic reviews during refinement**: `critiqueFallsDue` does nothing in refinement unless the trigger is `before_publish`. That covers the first pass, `looks_offered` and `recheck`. `revisionFallsDue` (a revised page or a changed design) answers nothing, and `answerFinding` schedules no recheck. `critiqueOwed` is empty in refinement unless the pre-publish review is due or its findings are open. So there is no "review still owed" cue, no `Review:` line in the plan reminder, and no turn-end hold. Opening Publish, or a refused attempt at Ready to publish, still makes `before_publish` due.
- **Point 4, a round changes and checks only what it touched**: in refinement, the host's look after a `Delegate` reports layout faults on a page the build changed only in the top-level sections it changed. It reads them from the account's differences (L1 address `0.N`). A page changed with no section address (module or slot scoped, summarised places, the whole page), or shown because a shared part or the whole site changed, is still checked whole. Structure findings (home length) and the site-structure checks are unchanged.
- **Points 5 and 7, priming**: consultant rule 2 now says: "When they prefer you to lead: until the first draft is handed over, go ahead with the improvements you judge worthwhile… When they lead, and always once the first draft is handed over: an improvement they didn't ask for is a suggestion, one at a time with your reason, built only if they say yes." The "this is where they try things" line is only in DOC-73, a draft that is not live priming, so no live priming change was needed for it. DOC-75's refinement guide already carried point 3's method.
- **Point 6, colours and fonts**: `stage-guide-core.ts` gained a `colours_and_fonts` rule (heading "colours and fonts"), started when that stage is in progress. The DOC-75 guide is handed over once.
- **Point 8, the critic never overrides a client decision**: when a decision carries the client's words, the critic's brief adds `CLIENT_DECIDED`: a fix that would undo a client decision, or a smaller version of what they turned down, is reported only as a low-severity perspective. `critique`'s result tells the consultant that such a finding is never fixed, only put to the client (`decision`) or dismissed.

### Design decision

If the client writes with the draft on screen while its first review is still running, that still counts as seeing it (BUG-269/BUG-322 semantics, unchanged). Refinement then starts, and that first-draft review is dropped rather than run during refinement. Gating "seen" on the review was rejected: the plan can't tell whether a host has a critic, and sites without one keep `critique.due` set forever. The REQ-458 holds are what keep the review ahead of the hand-over.

### UATs

- `tests/test_UAT_FC_REQ-623_refinement_is_client_sourced.test.ts`: `draft_shown_after_review`, `no_critique_in_refinement`, `looks_make_no_review_due` (with a before-hand-over contrast where looks do make a review due), `critic_does_not_override_client_decisions`, `priming_says_refinement_is_client_sourced` (DOC-75 refinement guide and rule 2), and `colours_stage_guide_delivered` (through `streamPrompt` with the shipped DOC-75).
- `tests/test_UAT_FC_REQ-623_round_checks_only_what_changed.workers.test.ts`: `round_checks_only_what_changed`. In refinement a build changing home's section `0.1` raises that section's fault and not section `0.0`'s.