---
uid: bug-f1331d2e
id: BUG-313
type: bug
title: 'Layout review: findings the owner chose to keep are re-raised on every hand-back;
  right-aligned single control flagged off-grid'
created_by: EPIC-19
created_at: '2026-10-28T22:19:19.458593+00:00'
updated_at: '2026-10-29T16:39:51.383807+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-4ef6c6e5
  commits:
  - working_sha: c2e5547d3320a386367d542c954bba7f8ccbe0d2
    reconcile_sha: null
    main_sha: null
  - working_sha: 627f9cb3e5b178e2ed2c14fa738283fd50357f8e
    reconcile_sha: null
    main_sha: null
  version: 0.2.699
  story_points: 3
---

## Symptom

On production, 2026-10-28, on the 1st Contact site, the Site consultant sent two near-identical messages in a row. Each listed the same flagged layout items as "something you chose to keep" and said it had changed nothing. Its `bc` notes:
- "Every item matches decision 3 [owner chose to keep it] or 4 [false positive on the `distribution: end` row]. The checker re-raises faults the owner chose to keep on every hand-back. That gives two possible loops: rebuilding something the owner chose, or replying with nothing."
- "It reports the right-aligned single-control row as off-grid."

The items: no separate header with the name (the wordmark does it), Sign in and "Apply to join the early beta" at 15px, the spacing around "Your intelligent front office", and Sign in on the right edge of the content.

## Root cause

- The layout review (`tools/generate/src/cli/ai/layout-check.ts`, and the host's review hold) doesn't consult the plan's recorded decisions. A finding the client explicitly kept is raised again on every hand-back, so the consultant gets another review cue and answers with nothing new. This is the same class as BUG-297 ("your no sticks") at the layout-review surface.
- A row with `distribution: end` holding a single control (Sign in) is measured as off the grid, although it sits where the row places it.

## Fix

1. **A recorded keep silences the matching finding.** When the plan holds a decision in which the client chose to keep something the review flags, recorded with the finding's identity (the rule, the node or section, and the measured value), the review doesn't raise it again and doesn't cue the consultant for it.
   - The finding comes back only if the thing changes, or the measured value moves beyond what was kept.
   - The consultant can record such a keep with the client's words. Reuse the decision ledger; no parallel store.
2. **No cue when there's nothing new.** A hand-back whose findings are all kept or already answered starts no review round.
3. **The right-aligned single control isn't off-grid.** The grid check treats a row's `distribution: end` (and `center`) placement as on-grid for its children.

## What changed

- **Recording a keep.** `set_decision` with decision `layout_kept` (created on first use: "Flagged layout the client chose to keep", area style, tier detail) takes `findings` — the look's lines the client chose to keep, copied as the look said them (`home, desktop (1280px): …`) — and the client's words in `client_said` (both required; a line not in a look's form is refused). The decision becomes `chosen` with the client's answer, its `kept` list grows (deduplicated), its value lists the kept lines, and a decision-log entry is written in the client's words. This is the existing decision ledger, so the critic's brief reads the keep among the decisions. `findings` on any other decision is refused.
- **A kept finding is not raised again.** The site's layout checker (`siteLayoutChecker`, used by the host's look after a build *and* the builder's page map) leaves out every finding matching a kept line: same page, width, section and words, with every measurement within the BUG-256 tolerance (2px). If the page, width, section or wording changes, or a measurement moves further, the finding comes back and is held as before.
- **No cue when nothing new.** A keep recorded in the round that answered a look releases that line's layout hold at once (as BUG-297's "no" does for the structure), so a hand-back whose remaining findings are all kept starts no layout round. On later messages kept findings never enter the hold at all.
- **Telling the consultant.** The look's "THIS BUILD IS NOT DONE" line and the layout continuation cue say how to record a keep (`set_decision layout_kept`, lines in `findings`, words in `client_said`) instead of repeating it to the client.
- **Grid check.** The `edges` check no longer measures a lone control as the section's content when its row places it: a flex row with `justify-content` end/centre/around/evenly (L1 `distribution: end|center|around`), or a column with `align-items` end/centre, is taken as the frame. A start-placed lone control is measured as before.

## Design decisions

- Keep identity is the look's own line (`layoutLine`), matched with the BUG-256 "unmoved" rule refactored into a shared `sameMeasures`, so no new finding-id scheme is introduced and the consultant can copy what it was shown. Per-width lines are separate keeps.
- Filtering lives in `siteLayoutChecker` so the builder isn't told to "fix" what the client kept either.
- Surface text was kept minimal: the consultant's authored prompt grows ~220 bytes. Note `test_UAT_FC_REQ-466_each_role_s_authored_prompt_is_measured_and_inside_its_target` / `REQ-473_the_consultants_authored_size_is_inside_the_lowered_budget` were already over budget on xgd-working before this change (205,134 > 205,000; now 205,356).

## Test plan

- `tests/test_UAT_FC_BUG-313_kept_finding_is_not_re_raised.workers.test.ts` (real routes in workerd, scripted model, fake browser layout check):
  - `test_UAT_FC_BUG-313_kept_finding_is_not_re_raised`: a look raises Sign in at 15px; the consultant records the keep with the line and the client's words → the plan holds a `chosen` `layout_kept` decision with that line and quote, and no layout cue follows the hand-back; the next build's look of the unchanged page omits it and starts no round; when Sign in moves to 12px the finding is back and held.
  - `test_UAT_FC_BUG-313_all_kept_hand_back_starts_no_round`: on an established site with a recorded keep, a build whose only finding is the kept one gives exactly one hand-back (two consultant requests) and no layout cue.
- `tests/test_UAT_FC_BUG-313_end_distributed_single_control_on_grid.test.ts` (real renderer + real Chromium): `test_UAT_FC_BUG-313_end_distributed_single_control_on_grid` — Dina 4's home with a top row holding one Sign in button, `distribution: end` and `center`, reports no `edges` finding for that row at any width (red without the fix: "content from 1097px to 1200px, off this site's grid").
- Regression: layout-check/priming/plan-surface node suites and the layout/set_decision workers suites. Failing identically on unchanged xgd-working (pre-existing, not caused here): BUG-237 contact form, BUG-276 logo, REQ-358 map, REQ-415 clean page, REQ-418 table ×2, REQ-436 ceiling, REQ-466/REQ-473 prompt budgets.