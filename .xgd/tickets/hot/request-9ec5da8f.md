---
uid: request-9ec5da8f
id: REQ-401
type: request
title: 'Plan panel: questions fold to one line with a status box, in two sections,
  matching the chat''s type'
created_by: EPIC-19
created_at: '2026-10-17T15:11:00.170337+00:00'
updated_at: '2026-10-17T15:11:00.170337+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
---

## What changes

The plan panel's questions become a **list of foldable items**, each collapsible to one line. The panel itself is reorganised into two sections. This was decided by the operator on 2026-10-17.

## Requirements

1. **Same type as the chat.** Questions, their answers and their inputs use the chat's font family and font sizes. Today they're larger, which looks odd beside the conversation. Take the values from the chat's own styles, not a copy of them, so the two can't drift apart.

2. **Each item folds to one line**, in this order:
   - a **disclosure triangle**: ▸ collapsed, ▾ expanded;
   - a **status box**:
     - **open:** an empty white box;
     - **skipped:** an empty grey box with a "–";
     - **done:** a box with a ✓;
   - the **start of the question**, cut off with "…" at the end of the line.

   Clicking anywhere on the line, or pressing Enter/Space on it, toggles the item. The status box also has a text equivalent for screen readers ("Open", "Skipped", "Done").

3. **Questions lead with what distinguishes them.** A collapsed line only shows the first few words, so every question's prompt opens with its subject, e.g. *"Phone number for the site — …"* or *"Photos of your vans — …"*, not *"Could you tell me…"*. This is a rule in the consultant's priming and in the plan surface's description of the ask operation.

4. **"Sites we're comparing" is an item, not a section.** The comp board (REQ-378) is shown as one item in the list, with the same fold and status box.
   - It's **open** while comparison is under way.
   - It's **done** once the consultant records the visual-concept decision from it.
   - It's **skipped** if the client skips it.
   - Expanded, it shows the comps as it does today.

5. **Two sections:**
   - **OPEN QUESTIONS:** the open items.
   - **WHAT YOU'VE TOLD US:** done and skipped items.

   An item moves between the sections as its status changes. A section with nothing in it is hidden. Withdrawn questions appear in neither, as now.

6. **Fold state:**
   - **Open items start expanded.**
   - **When an item becomes done or skipped, it collapses once,** at that moment.
   - **The client can expand or collapse any item at any time, and that choice sticks.** It survives re-renders, plan updates and reloads, kept per item in this browser like the builder's other remembered settings. The automatic collapse on completion happens once and never overrides a choice the client made after it.

7. **The consultant announces every question she adds.** Questions appear on the panel only because the consultant added them. Each time she adds one or more, she says so in the chat in one line, naming them and asking the client to fill them in, e.g. *"I've added two questions above — your phone number and the towns you cover. Fill them in whenever suits you."*
   - She never adds a question silently.
   - This is a priming rule, matching REQ-399's rule that the features question is raised in conversation, not seeded.

## Out of scope

- The progress banner (REQ-398, BUG-209).
- The features question's content and options (REQ-399).
- New answer types.

## Test plan

UATs `test_UAT_FC_<this ticket>_*`, on the rendered plan panel:

- Question text and inputs compute to the chat's font family and size.
- A collapsed item renders exactly one line: triangle, status box, then the prompt cut off with an ellipsis. Each status renders its box (empty, grey with "–", ✓) and its accessible text.
- Open items render under OPEN QUESTIONS, expanded; done and skipped items render under WHAT YOU'VE TOLD US. An empty section is hidden.
- Answering an open item moves it to WHAT YOU'VE TOLD US and collapses it.
- Expanding it again, then re-rendering or reloading, leaves it expanded. Collapsing an open item, then reloading, leaves it collapsed.
- The comp board renders as a list item with a status box, not as a separate section, and its status follows the visual-concept decision.
- The consultant's priming contains both rules: questions lead with their subject, and every added question is announced in the chat.
