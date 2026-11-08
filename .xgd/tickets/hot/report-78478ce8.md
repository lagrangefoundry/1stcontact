---
uid: report-78478ce8
id: REPORT-11587
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-08T21:44:20.749891+00:00'
updated_at: '2026-11-08T21:44:20.749891+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-7ba3af93
  plan_item_index: '3'
---

Plan item 3 is done. STORY-157 now covers REQ-216: driving a draft picture with `after`, the `INTERACTION_FAILED` refusals, the draft-only rule, and the "behaviour is off" caption on edit pictures. All six new ACs show up as children of the story.

**One conflict between code and intent, written up as a code issue for `fix_uat_coverage`:**
- REQ-216 says controls are matched by "a field's label, `aria-label`, a control's visible words, a placeholder. **There is no way to name a selector, an id or an attribute**".
- The code that matches form fields (`fillNames` in `interact.ts`) also accepts the field's `name` attribute and its element `id`, so `fill "email_input" with …` would find a field by an internal attribute.
- AC-2479 follows the intent: a field cannot be found by its `name` or `id`. The UAT for AC-2479 will fail until the code drops those two.

**Where the intent didn't say and I followed the code** (these are under `## Reconciliation Decisions` in the story):
- Matching ignores case and extra whitespace, and an exact name wins over a partial one.
- A click can also match a control's `title` or the `alt` text of an image inside it.
- The "what is there" list in a no-match refusal stops at eight names.
- The page gets 2000ms to settle after each step.
- A step during which the page navigates away is also an `INTERACTION_FAILED` refusal.
- A driven picture's label names the steps it was taken after.
- `compare` puts the edit caveat in a `notes` list.

**Left for other plan items:** stored-image pictures (REQ-218), driving the edit channel (REQ-215), and `compare` / `check_fidelity` verdicts. The story only claims two things there: `check_fidelity` reads a driven draft in the same driven state, and `compare` carries the edit caveat.

Each ticket write logged a denied network connection to `github.com:22`. The tickets were saved locally, so this looks like a background sync, but it may mean they haven't been pushed.

```
Upgrade mutations applied for plan item 3 of 8

Target Stories: story-58b2cec4
Primary Story UID: story-58b2cec4
Stories Modified: 1
ACs Modified: 1
ACs Added: 6
ACs Removed: 0

tickets_modified:
  stories:
    - "story-58b2cec4"
  acceptance_criteria:
    modified: ["acceptance_criterion-19a996bc"]
    added: ["acceptance_criterion-a44d10a6", "acceptance_criterion-7d8eb748", "acceptance_criterion-b6064255", "acceptance_criterion-98d492a4", "acceptance_criterion-cd3568b7", "acceptance_criterion-59e5750f"]
    removed: []

Progress: 3 of 8 plan items complete
```

The new ACs are AC-2477 (the two-form grammar), AC-2478 (step order and driven state), AC-2479 (matching by name), AC-2480 (failure refusals), AC-2481 (draft-only) and AC-2482 (edit caption). AC-2026 was changed so the picture shape includes `after`, for draft pictures only.