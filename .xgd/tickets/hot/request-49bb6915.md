---
uid: request-49bb6915
id: REQ-409
type: request
title: 'Execution budgets: deliver an outcome, never stop half-done to ask permission'
created_by: xgd
created_at: '2026-10-18T18:25:12.050358+00:00'
updated_at: '2026-10-19T00:14:57.217802+00:00'
completed_at: null
last_field_updated: title
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  epic_parent: epic-95bc3b15
  chat_comment: comment-0bb9ad56
---

## What I was trying to achieve
Hand the client a first draft I would defend. In practice the first builder's output had structural gaps: a missing hero section, page colours not using the palette, broken form styling, and a floating header. Fixing them took four more delegations inside one consultant turn. All of these were my own mistakes to fix, not decisions for the client.

## What stopped me / what went wrong
- **Budget and turn shape.** A long build→check→fix chain inside one turn is fragile. The consultant cannot know whether there is room for another pass, and the client cannot tell why the consultant comes back when it does.
- **Progress is opaque to the client.** The only things the client sees during the run are the `note` lines ("Fixing the top banner…"). These arrive with no frame, so a novice reads them as things going wrong, not as quality control.
- **No mid-run client input.** Anything the client says during the chain is not visible to the consultant until the end, and in practice it was lost entirely (filed separately as a bug).

## What would have let me finish
1. An explicit "first-draft mode" in which the consultant may continue across turns (or with an extended budget) until its own acceptance checks pass. It must not take taste decisions, which still stop and wait for the client.
2. A client-facing progress channel written in plain language, e.g. "Checked the draft: headline missing → adding it (step 2 of ~4)", distinct from the one-line delegation note.
3. Client messages delivered to the consultant between tool calls, so it can acknowledge them and fold them in mid-run.

## Suggestion vs gap
The gap is (a) a bounded but sufficient budget for self-correction on the first draft, and (b) visibility in both directions while it happens. The three items above are suggestions for closing it.



## Notes (EPIC-19, 2026-10-18)

The three asks mostly have homes already; what's left is narrower than a first-draft mode.

- **Item 3 (client messages mid-run)** is BUG-224. Not repeated here.
- **Item 2 (plain-language progress)** is largely BUG-215 (ready_to_reconcile): a turn line with the opening estimate and a step line timed from when the step started, with routine steps shown as light step lines. Anything still missing after BUG-215 is deployed belongs here, e.g. a step count ("step 2 of ~4").
- **Item 1 (budget for self-correction).** Four repair passes on a first draft are mostly the other defects showing: builders passing checks that were false (BUG-225), whole-page scopes that let a fix rewrite other sections (BUG-225, REQ-410), and builders running one after another (REQ-410). Fix those first and re-measure. If a first draft still can't finish inside one turn, the narrow version of this request is: the consultant may continue a first draft into a follow-up turn of her own, without a client message, only for her own acceptance checks, never for a taste decision, with a fixed cap and the client told.