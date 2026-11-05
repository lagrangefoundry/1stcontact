---
uid: request-fbc174c8
id: REQ-437
type: request
title: 'Builder toolbar: the preview modes (View | Edit | Input | Looks) as one segmented
  switch matching Desktop | Tablet | Phone | Fit pane'
created_by: EPIC-19
created_at: '2026-10-23T16:21:39.805500+00:00'
updated_at: '2026-10-23T17:15:11.710954+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 1
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-74a273a3
  commits:
  - working_sha: dc00d167fbc22cae6c53842ee06c2d6748f04f9c
    reconcile_sha: null
    main_sha: null
  - working_sha: b7bd1fa704884485f68f5cf34a95cf6d9cffed64
    reconcile_sha: null
    main_sha: null
  version: 0.2.597
---

## Why

Since REQ-433 the preview has four modes: **View | Edit | Input | Looks**. They
are drawn as separate buttons (`modeToggleAction`, `toolbar.js`, class
`builder-toolbar__modes`). The preview width beside them is already one
segmented control, **Desktop | Tablet | Phone | Fit pane** (`previewWidthAction`,
REQ-388, class `builder-segmented`). The operator wants the modes to be one
mode switch that matches it.

## What changes

- **The modes are drawn as one segmented control**, using the same component
  and styling as the width switch (`builder-segmented`): one joined strip of
  segments, the selected one pressed (`aria-pressed="true"`), with the same
  height, font, borders and pressed style.
- One shared way of drawing a segmented control serves both switches, not two
  copies that can drift. If `previewWidthAction` builds its group by hand today,
  both use the shared builder.
- **Behaviour is unchanged:**
  - order is View, Edit, Input, Looks;
  - clicking a segment calls `panel.setMode`, and the pressed segment follows the
    panel's mode, including mode changes made by links and the host;
  - a mode that is not offered yet (Looks before any look set exists, REQ-419
    and BUG-250) has no segment, unless it is the one showing, as now.
- **Accessible:** the strip is `role="group"` with an accessible name, for
  example "Preview mode", the same way the width switch is "Preview width". Each
  segment is a button with its label as its name.
- The old `builder-toolbar__modes` button styling is removed, not kept beside the
  new one.

## Test plan

`tests/test_UAT_FC_REQ-437_mode_switch_segmented.*`, using jsdom on the builder:

- The toolbar has one `role="group"` named "Preview mode", using the segmented
  control's class, with segments View, Edit, Input and Looks in that order (Looks
  only once offered).
- The mode switch and the width switch share the same segmented-control class and
  pressed-state markup.
- Clicking a segment changes the mode. A mode change from a link (`#show=…`)
  moves the pressed segment.
- Playwright: the mode switch and the width switch compute to the same segment
  height and font size.
- Re-run the REQ-388 width switch, REQ-419/BUG-250 offered-mode and REQ-433 UATs.

-