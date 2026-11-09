---
uid: report-4a6f52c5
id: REPORT-12048
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-09T22:41:28.491623+00:00'
updated_at: '2026-11-09T22:41:28.491623+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-374f88d6
  plan_item_index: '2'
---

Plan item 2 (REQ-217: a picture made in a turn appears in that turn) is applied. Both target stories are updated, and 6 new acceptance criteria document what the code already does. No new stories were created and no code was changed.

The code matches REQ-217's final "What landed, 2026-09-11" section, so nothing is flagged as a code issue. I didn't need to change or retire any existing acceptance criteria.

**What the stories now say:**
- **STORY-172 (`create_image`):** In a builder session, the tool's result includes an instruction to paste one markdown image line, word for word. The line points at the new picture under the business's own path, `/b/<businessId>/api/material/file?uid=<uid>`. If the host offers no way to address material, the result has no display field and the picture is still generated. I changed its kind from feature to upgrade. Clicking the picture to open an editor is left to REQ-220, as REQ-217 says.
- **STORY-107 (`write_image`):**
  - The result includes a line pointing at `/b/<businessId>/preview/<slug>/draft/assets/<file>`.
  - Surface version 9 tells the model to paste the line word for word, so the picture is part of the reply and comes back when the conversation is reloaded.
  - The `1c` CLI gets no line.
  - The chat pane limits an image to the pane's width and 260px in height.
  - Redrawing with replacement changes what earlier turns show, and a drawing in the conversation can't be clicked. Both are intended, per REQ-217 and BUG-84.

**Decisions I made where REQ-217 is silent** (recorded under Reconciliation Decisions in each story):
- The picture's alt text is the file name without its extension or square brackets.
- The height limit is 260px, the value in the code.
- For `create_image`, the paste instruction sits inside the tool's display text rather than the product's own surface prose.
- Surviving a reload is checked through the saved transcript, not through any new replay code.

The plan listed 4 new criteria; I wrote 6 so that each story has its own case for a host with nowhere to show a picture.

The ticket store's push to `github.com` was refused by the sandbox on every write. The changes are saved locally, but you'll need to push them yourself.

```
Upgrade mutations applied for plan item 2 of 8

Target Stories: story-39c992d3, story-b3de4571
Primary Story UID: story-39c992d3
Stories Modified: 2
ACs Modified: 0
ACs Added: 6
ACs Removed: 0

tickets_modified:
  stories:
    - "story-39c992d3"
    - "story-b3de4571"
  acceptance_criteria:
    modified: []
    added: ["acceptance_criterion-98f92375", "acceptance_criterion-84c577a8", "acceptance_criterion-9b0c0a93", "acceptance_criterion-a193c964", "acceptance_criterion-23a7433e", "acceptance_criterion-ce27ecb1"]
    removed: []

Progress: 2 of 8 plan items complete
```

| New AC | Story | What it covers |
|---|---|---|
| AC-2567 | STORY-172 | `create_image` result includes a pasteable line under the business's path; fetching it returns the picture |
| AC-2568 | STORY-172 | Nowhere to show it: no display field, generation still works |
| AC-2569 | STORY-107 | `write_image` result includes a line under the business's path; a redraw gives the same line; not clickable |
| AC-2570 | STORY-107 | Surface version 9 says paste word for word, lists it as an absence; the picture survives reload |
| AC-2571 | STORY-107 | `1c` CLI: drawing is written with no line |
| AC-2572 | STORY-107 | Chat pane: image at most the pane's width and 260px tall |