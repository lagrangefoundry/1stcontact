---
uid: request-74aaa5ee
id: REQ-478
type: request
title: 'Comparison board: rename "The look we''re going for" to "Look summary", and
  the consultant calls it that'
created_by: EPIC-19
created_at: '2026-10-27T22:20:15.773081+00:00'
updated_at: '2026-10-27T23:58:05.411351+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-c0456922
  commits:
  - working_sha: 64c02a33987fa4ed4ed4281bb8089a23cd153e59
    reconcile_sha: null
    main_sha: null
  - working_sha: 3c39eb55be52005db378fa33e1e380f58d6d642a
    reconcile_sha: null
    main_sha: null
  version: 0.2.686
  story_points: 2
---

## Why

The card at the top of the comparison board is labelled "The look we're going for". That's a sentence, not a name, so there's nothing short for the operator, the client or the consultant to call it. In conversation it gets called the "summary card" or "the direction card", and those terms also collide with "Your position" on the story board. The operator's name for it is **Look summary**.

## What

1. **The card's visible label becomes "Look summary"** (`COMPS_DIRECTION_LABEL` in `apps/control-app/src/builder/config.js`), along with its `aria-label` and any tooltip that names it.
2. **The consultant calls it "the Look summary".** Wherever text tells the consultant how to refer to the card in front of the client, it says "the Look summary on the comparison board". That covers the plan-surface text (`tools/generate/src/cli/ai/plan-surface.json`), host lines (`story-core.ts`, `plan-core.ts`), the consultant's instructions and the stage guides (DOC-75). This replaces "The look we're going for", which BUG-302 put in, and any leftover "direction card" or "summary card" in client-facing wording. Internal names (`visual_concept`, `heart_direction`, `edit_direction`) stay as they are.
3. **"Your position" on the story board is unchanged.** The consultant must never call it a "summary" card, so the two names stay distinct.

## Test plan

- `test_UAT_FC_REQ-478_look_summary_label`: the comparison board's top card is labelled "Look summary", including its accessible name.
- `test_UAT_FC_REQ-478_consultant_names_the_look_summary`: the consultant's priming, reminders, plan-surface text and host lines name the card "the Look summary". None of them still tells it to say "The look we're going for", "direction card" or "summary card" to the client.
- Retarget the BUG-302, REQ-432 and BUG-269 tests that pin the old label.


## As implemented

- `COMPS_DIRECTION_LABEL` (control app) and `LOOK_CARD_LABEL` (host, `story-core.ts`) are both "Look summary"; the card's `aria-label` follows. The How you can help line (`DIRECTION_HELP` and the help text in `config.js`) reads "Agree the Look summary".
- `LOOK_CARD` is a name, not a quoted sentence: "the Look summary" (it was `the “The look we’re going for” card`). Every host line built from it follows: the waiting reminder, "Your client hearted the Look summary.", the settled notice, the set_decision line (`DIRECTION_SAY`, whose suggested message is now "I've written up the Look summary: [the comparison board](…)") and the plan-log entries ("Look summary: revised by the consultant: …").
- The plan surface says: "The comparison board is "Sites we're comparing"; its card is the Look summary — call it "the Look summary on the comparison board". Never invent another name for either, and never call "Your position" a summary." The `visual_concept` description says to call it "the Look summary" to the client.
- The stage guides (DOC-75) had no wording for this card, so they are unchanged. Code comments that say "direction card" are internal and stay as they are.
- The new UATs are in `tests/test_UAT_FC_REQ-478_look_summary.test.ts`. The BUG-302, REQ-432, BUG-269 and BUG-265 tests are retargeted to the new label.