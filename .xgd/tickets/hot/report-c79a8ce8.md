---
uid: report-c79a8ce8
id: REPORT-11435
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-08T12:47:14.000756+00:00'
updated_at: '2026-11-08T12:47:14.000756+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-0d00566a
  plan_item_index: '1'
---

```
Story #1 created for reconciliation bundle-0d00566a

Story UID: story-44d0a572 (STORY-174)
Title: Marked Points: point at the edit preview and send the pointing as text
Type: feature
Acceptance Criteria: 13 created (AC-2413 – AC-2425)

Progress: 1 of 8 plan items complete
```

The story sits under CAP-87 (In-Page Copy Editing), because Marked Points is a second gesture on the same editable preview. Each ticket write was committed locally, but the push to github.com was blocked by the sandbox.

**What the 13 criteria cover:**
- the toggle and how it takes over the click;
- placing points, letter reuse, and pills going at the end of the draft;
- the label fade (200px to the right, 56px elsewhere, never on a timer);
- the cross drawn as two bars with a 22px hit area;
- the `+` and `×` controls;
- dragging a point;
- what each point expands to on send;
- coordinates inside SVG images;
- the `near:` lines;
- which points get sent;
- the chat bubble keeping the short pill while the assistant gets the full expansion;
- points lasting one turn;
- published renders and the existing editor click being left unchanged.

**Calls I made where the intent tickets were silent or overruled each other** (each one is under "Reconciliation Decisions" in the story):
- **No AC asks for the pill to behave as a single unit.** REQ-210 wanted one backspace to remove it whole, but BUG-72 later scoped that out because the shared chat composer can't support it.
- **Behaviour the code has but the tickets never specified is now written down as ACs:** the 26-letter limit, deleting a point also deletes its pills, only referenced points are sent, and the note telling the assistant to ask which screen width is meant.

**Gaps:**
- **Hover coordinates:** REQ-210 asks for coordinates when hovering a pill, and the code only shows them when hovering a mark inside a drawing. I didn't write an AC for this, treating it as part of the deferred pill work. That's a judgement call, so it may be worth a look.
- **Toggle and editor-click tests:** the existing tests don't check that the toggle is missing in View mode, that leaving Edit mode turns it off, or that sent marks can't be dragged. Those criteria will need new tests.