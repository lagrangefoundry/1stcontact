---
uid: bug-2fd35b1d
id: BUG-233
type: bug
title: 'Builder briefs: stop appending the story board to every brief; the consultant
  quotes it when a brief needs it'
created_by: EPIC-20
created_at: '2026-10-20T03:17:09.479920+00:00'
updated_at: '2026-10-20T03:39:07.448218+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  severity: high
  priority: high
  story_points: 3
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-de4386af
  commits:
  - working_sha: 9c0b1f1826dda704befb98a45bd284c5135f96c5
    reconcile_sha: null
    main_sha: null
  - working_sha: c3ea6fc73f2a8e924ff347e0d75552d5ac4a0769
    reconcile_sha: null
    main_sha: null
  version: 0.2.550
---

## Symptom

Every builder brief has the client's story board appended to it by the host, whatever the brief is about. The block ends with an instruction: *"What the client said is most them, in their own words — write the copy from these and add no claim they did not make."* So a builder asked to resize a logo, apply a look, or change only the header is also told to write copy, and some of them do.

Evidence from Bob's Salon 2 (2026-10-18/19, analysis on EPIC-20):

- **48 of 49 builder briefs** carried the block.
- The consultant had to add "IGNORE any story board" (or similar) to **17 briefs** by hand to stop it.
- **Four builder runs** did nothing but put back text an earlier builder had invented from the board.
- It is one of the main causes of the "repair" class of rework, which was 16 of 49 runs and about $7 of that session's spend.
- Still happening: the 2026-10-19 briefs carry it too.
- The operator said at 21:04 on 2026-10-18 that the story board is for the consultant, not the builders.

It also costs tokens: up to 1,500 characters on every brief, counted against the brief ceiling, for briefs that mostly have no use for it.

## Root cause

REQ-408 chose to append the block to **every** brief rather than only to briefs about copy, because "judging which briefs concern copy would be a guess". The guess was left to nobody, and the block's own wording turns it into an order. The code is the `story` limit in `reportingDelegationToolbox` (`tools/generate/src/cli/ai/account-core.ts`, the `[[REQ-408]] — BUILDERS ARE BRIEFED FROM THE STORY BOARD` block in `delegate()`), fed by `storyBrief()` in `story-core.ts` via the `story:` option in `host-core.ts`.

## Fix

**The host no longer appends anything from the story board to a builder brief.** A brief reaches the builder exactly as the consultant wrote it (plus whatever else the host already adds for other reasons, which this ticket doesn't change).

**The consultant decides when the client's words belong in a brief**, since it is the one that knows what the brief is for. It already sees the board every turn (the `Story board:` plan line and the board notice). Its delegation guidance gains one rule, worded in the existing register: *when a brief asks a builder to write or change words on the site, quote the client's chosen headline and the notes that brief needs, verbatim, and say they are the client's own words; when it doesn't, leave the board out.* This goes in the consultant's delegation method prose (`templates/delegation-method` in `priming.json`), not the per-turn tail.

Remove rather than disable: the `story` field on `WorkerLimits`, the append in `delegate()`, the `story:` option in `host-core.ts`, and `storyBrief()` / `STORY_BRIEF_MAX_CHARS` if nothing else uses them. No setting to turn the old behaviour back on.

The comments that argue for appending to every brief (the REQ-408 block in `account-core.ts`, and anything similar beside `storyBrief`) are deleted or rewritten to state the new rule, not left arguing for removed code.

Out of scope: the story board itself, its pane, the consultant's board operations, the per-turn notice and plan line. Only how builders get the board's contents changes.

## Supersedes

This reverses one line of REQ-408 (`request-214b8e48`): *"Builder briefs: every delegated brief gets a short story block appended…"* and its acceptance item *"Builders are briefed from it."* REQ-408 is at `ready_to_reconcile`, so its body can't be edited; this ticket is the later intent and wins. Reconcile should treat any REQ-408 AC or UAT pinning the appended block as invalidated by this ticket.

## Test plan

- `test_UAT_FC_BUG-233_*`: drive a delegation through the real `reportingDelegationToolbox` with a plan whose board has a chosen headline and hearted notes; assert the brief the builder receives is the consultant's goal unchanged, with no story-board text in it.
- Same, asserting a brief that *does* quote the client's words (because the consultant put them there) arrives with them intact, i.e. nothing strips them either.
- Assert the consultant's priming contains the new rule.
- Update or remove the REQ-408 UAT cases that assert `storyBrief` output or the appended block (`tests/test_UAT_FC_REQ-408_story_board.test.ts`, around lines 270–290), and say so in the commit.
- Regression scope: the REQ-408 suites and the delegation suites. Note the delegation suites were red on a clean `xgd-working` before this change (REQ-295/296/341 and others); compare against that baseline rather than expecting green.

## Measure

After it lands, the next comparable session should show no "ignore the story board" lines in briefs and no runs whose only work is restoring invented copy. Read it from the builders' briefs and the change log, as in the EPIC-20 Salon 2 analysis.

## What landed

- `delegate()` in `reportingDelegationToolbox` (`account-core.ts`) appends nothing; the REQ-408 comment is replaced by a [[BUG-233]] one stating the new rule. `WorkerLimits.story` is gone, as are the `story:` option in `host-core.ts` and `storyBrief()` / `STORY_BRIEF_MAX_CHARS` in `story-core.ts` (nothing else used them).
- `templates/delegation-method` in `priming.json` gains, after the "write the brief for someone who cannot see this conversation" paragraph: *"When a brief asks the builder to write or change words on the site, quote the client's chosen headline and the notes that brief needs, verbatim, and say they are the client's own words — the builder never sees the story board. When it does not, leave the board out: a builder handed the client's sayings writes copy from them, asked or not."*
- The story-board section of the consultant's priming (both variants) said *"Builders are given both with every brief."* That was now false, so it reads: *"The board is yours: a builder sees the client's words only when you quote them in its brief."*

## Tests as landed

`tests/test_UAT_FC_BUG-233_briefs_carry_no_story_board.workers.test.ts`, through the real `/api/ai/prompt` and `/api/plan/board` routes in workerd. The board is built for real: pin, heart, offer, choose.
- A brief not about words (resize the logo) reaches the builder with the goal and no headline, hearted note or story-board text, while the consultant is shown the chosen headline on the same turn.
- A brief that quotes the headline and a note arrives intact, with the headline appearing exactly once.
- The delegation method has the new rule, and the priming no longer says builders are given the board.

Both delegation cases fail on the pre-change code. `test_UAT_FC_REQ-408_builders_are_briefed_with_the_chosen_headline_and_the_hearted_notes` was removed because the function it tested is gone. Regression scope (36 files across REQ-408/295/296/341/342/343/354/379/397/409/411, BUG-208/225, priming, delegation): 6 failures in REQ-295 and REQ-342. The same 6 fail on the parent commit without this change.