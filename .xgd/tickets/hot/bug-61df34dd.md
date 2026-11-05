---
uid: bug-61df34dd
id: BUG-319
type: bug
title: 'Look summary: no heart, and no request to heart it, until every comparison
  site is commented on or skipped'
created_by: EPIC-19
created_at: '2026-10-31T20:02:32.808357+00:00'
updated_at: '2026-10-31T20:47:46.785966+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-b912bd71
  commits:
  - working_sha: 2f4bd4197b3abfaac5b1d3338cb21aaabbdfe0a6
    reconcile_sha: null
    main_sha: null
  - working_sha: bed1e630cb7f2673a6bab09c087ae7a4888d1f44
    reconcile_sha: null
    main_sha: null
  version: 0.2.714
  story_points: 3
---

## Symptom

Operator, full site build on production (2026-10-31): the Look summary card (the `visual_concept` direction, REQ-432) appeared with its heart, and the Site consultant asked them to heart it, before any comparison site had finished capturing. They hearted it to see what happened. Once the sites arrived and they commented on them, the consultant revised the summary and asked them to read and heart it again.

## Root cause

- `directionView` (`tools/generate/src/cli/ai/plan-core.ts`) shows the card, heart included, as soon as `visual_concept` has a value: state `proposed`. Nothing consults the comparison board.
- The `other_sites` stage (`plan-seed.json`) finishes on `["sites_settled", "direction_agreed"]` with no order between them, and `direction_agreed`'s `missing` line ("the client has not hearted it — ask them to heart or correct it…") is on the consultant's agenda whenever the direction is `proposed`, whether or not `sites_settled` holds.

## Fix

The heart is neither offered nor asked for until the comparison sites are settled — every site on the board commented on or skipped, or the client has skipped the board (`sites_settled`, unchanged).

1. **Before the sites are settled, the card has no heart.** The Look summary card still shows the consultant's current direction (the consultant may write and revise it as the client comments — that is how it is formed), marked as taking shape, e.g. "Taking shape — you can agree it once you've been through the sites". No heart button; editing it into the client's own words is also held back (editing counts as agreeing, REQ-432). How-you-can-help does not list "Agree the Look summary" yet.
2. **The host refuses an early agreement.** `clientDirectionAction` refuses `heart_direction` and `edit_direction` while `sites_settled` does not hold (a refusal the board shows plainly, not a silent no-op), so a stale tab or a scripted call cannot agree it early. `restore_direction` is unaffected.
3. **The consultant is not told to ask for the heart early.** While `sites_settled` does not hold, `direction_agreed`'s missing line does not ask for the heart: it says the direction is being formed from the client's comments and is agreed after the sites. Once `sites_settled` holds and the direction is `proposed`, today's line applies (ask once, in a short message of its own, with the show_client link — BUG-269).
4. **Order of the stage.** `other_sites` still finishes on both facts; agreement can only come after settlement, so in practice sites first, then the look.
5. A direction already agreed before this lands stays agreed (no migration).

## Test plan

UATs `test_UAT_FC_<this ticket>_*` through the plan surface / comparison board as BUG-302 / REQ-432 tests do:

- Comps on the board with one still open, direction written: the board's direction view has no heart / is marked taking shape; `heart_direction` and `edit_direction` are refused; the consultant's agenda line for `direction_agreed` does not ask for a heart.
- Every comp commented on or skipped (and separately: board skipped): the heart is offered, `heart_direction` agrees it, and the agenda line asks for it.
- No comps yet, direction written: no heart.


## What landed

- **`sitesSettled(fields)` and `directionShown(fields)`** (`plan-core.ts`). `sites_settled` now reads `sitesSettled`. `directionShown` is the direction as the client sees it: a `proposed` direction is **`forming`** while the sites are not settled. A direction already agreed stays `agreed`, which covers item 5.
- **The card** (`directionView`, state `forming`): no `help` line, so How you can help and the Input board's "waiting" leave it out (both key on `state === 'proposed'`). The comparison board draws a forming card with its text, the line "Taking shape — you can agree it once you’ve been through the sites" (`COMPS_DIRECTION_FORMING`, styled like the revision line), no heart, and text that is not clickable for editing.
- **The host** (`clientDirectionAction`): refuses `heart_direction` and `edit_direction` with `SITES_FIRST`, "the Look summary can be agreed once every site on the comparison board is commented on or skipped", while the direction is forming. `restore_direction` is unaffected. Un-hearting an already agreed direction is allowed. `/api/plan/comp` answers the refusal with **409** `{code: 'SITES_FIRST', error}`, which the board shows as its direction error.
- **The consultant**: while forming, `direction_agreed`'s missing line is `DIRECTION_FORMING_LINE`. It says to keep the direction current as the client comments, and not to ask them to heart it until every site is commented on or skipped. Once settled, the BUG-269 line asks for the heart.
- **`waitingOn`** (BUG-264): a forming direction is not waited on.

## Design decisions made during implementation

- **Writing the direction while it is forming is not announced as new client input.** `set_decision` on `visual_concept` returns no BUG-265 `new_input` or link. It says `DIRECTION_FORMING_SAY`: the direction shows to the client as taking shape, so don't ask them to agree it yet; the plan entry says when. This stops every revision during the comps being announced as a card to agree. Once the sites settle, the agenda line asks for the heart with the show_client link.
- Existing UATs that heart or announce a direction with no sites settled (REQ-432 direction card and wire, BUG-302 card boards and client cards, REQ-478, BUG-265 direction announcement) now settle the sites in their fixtures by skipping the board. Their assertions are unchanged.

## UATs

- `tests/test_UAT_FC_BUG-319_look_summary_after_the_sites.test.ts`: one site open (card taking shape, no heart, no edit, no help line, write says don't ask, agenda doesn't ask); host refuses an early heart or edit with SITES_FIRST; every site settled (heart offered, asked for, agrees, stage done); board skipped (heart offered and agrees); no sites yet (no heart); agreed before stays agreed.
- `tests/test_UAT_FC_BUG-319_early_agreement_refused_on_the_wire.workers.test.ts`: `/api/plan/comp` answers an early heart or edit with 409 SITES_FIRST, the stored direction is unchanged, and after skip the heart agrees.