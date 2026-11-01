---
uid: acceptance_criterion-319ae86b
id: AC-2186
type: acceptance_criterion
title: The list, detail sections, joined table and both dialogs are styled to the
  webui-fields metrics
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:00:48.460845+00:00'
updated_at: '2026-11-01T19:00:48.460845+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0034d937
  kind: behavior
  regression_only: false
---

## Criterion
The Contacts tab follows the builder's field metrics (webui-fields) on every surface. Nothing renders at the browser's default type size or unstyled.
- **List rows:** the name at 13px. The address beside it is muted and never wraps to a second line.
- **Detail pane:** padded and gapped sections, each under a heading.
- **Joined table:**
  - 13px text
  - cells padded 3px vertically and 8px horizontally
  - a 1px rule under every row
  - column headings in the muted label colour at weight 500
  - empty-state text at 13px, muted
- **Invite and provisioning dialogs:** their text inputs use the same input metrics as other builder modals, and their hint and outcome text is at 13px.

The panel fills its tab's height rather than collapsing.

## Verification
Mount the panel, select a person, and open each dialog in a browser-like DOM with the built stylesheet loaded. Assert these computed styles:
- the list name cell: 13px font size
- table cells: 13px with 8px horizontal padding and a 1px bottom border
- table heading cells: weight 500 in the muted colour
- the empty-state paragraph: 13px
- dialog inputs and hint/outcome text: styled (not the user-agent default)

Assert the panel root fills 100% of its container's height.
