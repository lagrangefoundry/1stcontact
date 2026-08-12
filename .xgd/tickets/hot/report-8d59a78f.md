---
uid: report-8d59a78f
id: REPORT-1868
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-12T18:28:15.752128+00:00'
updated_at: '2026-08-12T18:28:15.752128+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: request-a8ccd0dd
  plan_item_index: '2'
---

Mutations applied. The duplicate entries in `xgd ticket children` are a stale-index display artifact of the branch worktree (the canonical index lives only on main) — on disk each UID is a single, updated, committed file, which `xgd ticket get` confirms.

```
Upgrade mutations applied for plan item 2 of 2

Target Stories: story-3bf94bd4
Primary Story UID: story-3bf94bd4
Stories Modified: 1
ACs Modified: 2
ACs Added: 1
ACs Removed: 0

tickets_modified:
  stories:
    - "story-3bf94bd4"
  acceptance_criteria:
    modified: ["acceptance_criterion-472674ff", "acceptance_criterion-fd4471a9"]
    added: ["acceptance_criterion-35907074"]
    removed: []

Progress: 2 of 2 plan items complete
```

**What changed and why**

- **STORY-101 (story-3bf94bd4)** — the dialog stops being one form. Added an in-scope bullet ("The words in a box, the parameters under it") stating the box/sheet split, that it is decided by the kind of control a field declares rather than by region kind or field name, that the sheet keeps its labels and is bounded, and that the auto-open affordance is counted over the box. Widened "A dialog that composes two controls" → several controls, one diff, one unsaved-changes state. The declared non-goal *"text properties (size, colour, weight, family, background)"* was narrowed to colour, family and panel background (phase B, blocked on REQ-133's palette control) plus line height, letter spacing and alignment — size and weight are now in scope, per REQ-135 §6. Technical Context gained: the second `mountFields` instance and why two instances rather than one split across parents; styling the sheet through the component's own tokens; both control handles declared before dismissal is bound; and an explicit note that *which* parameters exist, their bounds, and the responsive-ladder rewrite belong to STORY-100, not here.
- **AC-1044** — rescoped from "the form" to "the editing box", with the reason stated (clicking words puts the cursor in the words; counting the whole field list would have retired the affordance the day typography landed). Retitled to match.
- **AC-1039** — the dropped label column is scoped to the box; the parameter sheet is the opposite case and keeps its labels because a bare number is meaningless unlabelled. Verification now asserts the sheet's labels are present. Retitled to match.
- **AC-1123 (new)** — the box/sheet split itself: two forms, sheet below box, split by descriptor type never by region kind or field name, no box where a region exposes no words, both staging into one change and one dirty state, sheet height-bounded so Save stays reachable. This is the AC for the previously orphaned FC UAT `words_sit_in_the_box_and_parameters_sit_beneath_it`.

No runtime code was modified, no new story ticket was created, and STORY-100 and its ACs (plan item 1's scope) were left untouched.
