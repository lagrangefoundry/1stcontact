---
uid: bug-75f3f0d7
id: BUG-411
type: bug
title: 'Layout keeps: a kept line saved without the finding''s fix advice never matches,
  so the nudge re-raises it'
created_by: EPIC-19
created_at: '2026-11-09T20:22:49.507643+00:00'
updated_at: '2026-11-09T20:39:59.246277+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-b1e58835
  commits:
  - working_sha: 77536859c4cd1950f70eeaa777d16b5079c0fe1b
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 85ddb36fb806ad9fa93987054872541c7a4eeeea
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.2.854
  story_points: 3
---

## Source

PLATFORM_ISSUE-15 (production, 2026-11-09). The consultant recorded crop findings as kept (`set_decision layout_kept`), copying each line as the nudge gave it but without its trailing fix advice (": frame it on the subject (objectPosition), or give it a shape nearer its own."). `set_decision` accepted them, yet the end-of-turn layout nudge re-raised the same lines on at least four consecutive turns, with no client message and the draft unchanged at one change count. Each repeat cost a turn and pushed the consultant to re-ask the client.

## Root cause

`keptLine` in `tools/generate/src/cli/ai/layout-check.ts` matches when the **kept text starts with** the finding's whole line (`said.startsWith(line)`). The line (`layoutLine(f)`) includes the finding's text with its fix advice. So a keep recorded without the advice, which is the natural reading of "the lines as said here in findings" and what the consultant did, is shorter than the line and never matches. Nothing tells the consultant its keep matched nothing.

The other half of the report (re-firing when nothing changed, and repeating findings marked "unchanged after a fix round") is BUG-405 items 7–10, built after this report was filed. Confirm it on production once deployed. If it still repeats, it belongs here too.

## Expected behaviour

1. **A keep matches its finding whether or not it includes the fix advice.** The comparison uses the finding's identity (page, width, section, kind, and what's wrong, with measurements within tolerance) and ignores the advice part. A keep that adds or drops trailing punctuation or advice still matches.
2. **The advice is separated from what's wrong in the finding itself,** so the line the nudge prints and the line a keep stores have one well-defined form, and the tool's description says which part to copy.
3. **`set_decision layout_kept` reports matches.** It answers which current findings each kept line matches, and refuses (or warns about) a kept line that matches none, so a keep that would do nothing is caught when it's written.
4. **Existing keeps recover.** Keeps already saved without the advice start matching with no rewrite.

## What changed (as built)

- **One form for a finding: `<what is wrong>: <fix advice>`.** The advice starts at the first `": "` outside double quotes and brackets; a finding with no such colon is all what-is-wrong. `findingParts(text)` (in `layout-keep.ts`, re-exported from `layout-check.ts`) splits it into `{ wrong, fix }`. A look's line stays `<page>, <width>: <where> <what is wrong>: <fix advice>.` as before, so nothing the consultant or builder reads changes.
- **`keptLine` matches on identity only.** Both the kept text and the said line are cut to their identity (page, width, where, what is wrong; no advice, no closing full stop). The kept identity must equal the line's, or continue past it only at a boundary (space or `. , ; :`, e.g. a host note after it). Measurements in the identity must each be within `UNMOVED_PX` (2px). So a keep with the advice, without it, with or without the full stop, all match; a keep whose measurement moved beyond tolerance does not (unchanged from BUG-313). Keeps already stored without advice match with no rewrite. The host's "unmoved since last said" comparison (BUG-405) uses the same `keptLine`, so it also ignores a change in advice wording alone.
- **`set_decision layout_kept` checks each kept line against what the looks said** (the plan's `layout_said`, written by the host after each look). It answers `matched: [{ kept, matches: [lines] }]`, and refuses with `PLAN_INVALID` (nothing recorded) a line that matches none, naming it and saying which part to copy. Lines already in the keep are not re-checked (a kept finding is no longer said). Rules recorded in advance (REQ-655, `<page> #<node>: <rule>`) are not checked against looks.
- **The tool's `findings` description** says to copy each line from its page and width to the end of what is wrong, that the advice after the next colon may be left off, and that a line matching nothing is refused.
- `UNMOVED_PX`, the measure pattern and `sameMeasures` moved from `layout-check.ts` to `layout-keep.ts` (shared by the plan and the check); `layout-check.ts` re-exports `UNMOVED_PX` and `keptLine`.

## Design decisions

- Split by a rule on the existing wording rather than a new `fix` field on every finding: the ~90 in-page checks already word findings as "what is wrong: what to do", so a field would duplicate the text and touch every check. Known edge: the table/grid "rows do not line up from row N: "a" sits beside "b"" wording puts the cell names on the advice side, so a keep of that finding holds for that row whatever the cells say. Accepted: page, width, section, kind and row still identify it.
- Refuse rather than warn: a keep that matches nothing does nothing, and the consultant can retry in the same turn.

## Test plan

`tests/test_UAT_FC_BUG-411_keep_matches_without_advice.test.ts`, through the consultant's real plan surface and the host's filter (`keptFinding` over `keptLayout`):
- `kept_with_or_without_advice_is_not_raised_again`: two crop findings kept, one with its full line and one without its advice; neither is raised by the next look; the finding splits into what is wrong and its advice.
- `keep_whose_measurements_moved_is_not_a_match`: a keep stays a match within tolerance and stops matching when the crop share moves beyond it.
- `set_decision_answers_matches_and_refuses_a_line_matching_none`: a call with one matching and one non-matching line is refused naming the bad line and records nothing; a call with a matching line answers the said line it matched.
- `keep_stored_before_without_advice_now_holds`: a plan already holding an advice-less keep suppresses that finding and nothing else.