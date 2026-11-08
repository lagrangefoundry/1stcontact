---
uid: bug-1ff04fdc
id: BUG-369
type: bug
title: Checkout `cancel` control label sits at top of its button.secondary box; no
  way to vertically centre a control
created_by: xgd
created_at: '2026-11-06T01:58:44.362381+00:00'
updated_at: '2026-11-06T15:39:45.384902+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-b164723c
  severity: medium
  commits:
  - working_sha: af7e872400749a560696bcfe2efca082c554fffa
    reconcile_sha: null
    main_sha: null
  - working_sha: ab3205e1665babad144cd98c9b0a07b3758a68f1
    reconcile_sha: null
    main_sha: null
  version: 0.2.799
  story_points: 1
---

**Context:** checkout v1 component, page presentation slot `page`. A row (`layout: row`, `align: stretch`) contains two boxes: `component: button.primary` wrapping control `continue`, and `component: button.secondary` wrapping control `cancel`. Both controls have identical padding (12/28/12/28), role caption, textAlign center; both boxes are width hug, height fluid.

**Expected:** both buttons the same height with labels vertically centred.

**Actual (desktop 1280):** both boxes stretch to ~66px; the `continue` control fills its box (label centred), but the `cancel` control renders at its natural ~45px height at the top of its box, so the CANCEL label sits ~20px from the top border and ~45px from the bottom.

**Tried (all reverted):**
1. Row `align: center` + both boxes height hug → labels centred in their own boxes but boxes differ by ~21px (continue 66, cancel 45). So `continue` and `cancel` controls render at different intrinsic heights despite identical padding/type.
2. Fixed height 66 on the cancel box → label sits at top again. Controls have no `sizing` field, and boxes have no vertical alignment field, so there is no in-vocabulary way to centre a control in a taller box.

**Likely causes:** `cancel` control renders as an inline link (not block/flex filling its box) while `continue` renders as a button; or button.secondary component styling doesn't centre its child. Suggest: make control elements fill/centre within their parent box, or give the two controls the same intrinsic box model.

**Repro:** add checkout v1 with `cancelLabel` set, place `continue` and `cancel` controls in button.primary / button.secondary boxes side by side in a stretch row; screenshot at 1280.


## Root cause

- A \`box\` renders as a plain block \`<div>\`: its child sits at the box's top, so a box its row stretches taller than its control strands the label at the top.
- A link control (\`<a>\`) with no fill or border of its own stays \`display: inline\`, so its own vertical padding does not count toward its height, while a \`<button>\` (inline-block) counts it. Hence \`cancel\` hugs ~21px shorter than \`continue\` with identical padding and type.

## Fix

1. **A box that holds exactly one control centres it down its height.** Such a box is the control's frame (a \`button.*\` component wrapping a control): it lays out as a column flex box with its content centred vertically; the control fills the box's width, so the control's own \`textAlign\` places its label across. A box with other or more children, or with pinned children, is unchanged.
2. **A link control always counts its padding.** An unpainted link control is \`display: inline-block\` (a painted one keeps BUG-367's centred inline-flex), so a link and a button with the same padding and type are the same height.

## Test plan

\`tests/test_UAT_FC_BUG-369_control_centred_in_its_box.test.ts\` (Chromium): the ticket's tree — a stretch row of two button boxes wrapping a \`<button>\` and an \`<a>\` control with identical padding and caption type —
- both boxes are the same height and each label is vertically centred in its box (stretch row);
- in a centre row with hug boxes, the two boxes are the same height (the link's padding counts).
Regression scope: BUG-367/368 checkout Chromium suites, REQ-99 interaction-state, the L1 render suites.


## What changed (as landed)

\`packages/framework/src/l1/render.ts\`:
- \`box\` emission: a box whose only child is a \`control\` (and which has no pinned children) emits \`display: flex; flex-direction: column; justify-content: center\`. The control is a flex item that fills the box's width, so the control's own \`textAlign\` still places its label across; down, the label sits in the middle however tall the box is stretched.
- \`control\` emission: a link control with no fill or border of its own gets \`display: inline-block\` (a painted link keeps BUG-367's centred \`inline-flex\`), so its vertical padding takes room. A link and a button control with identical padding and type are now the same height.

The remaining difference between the two boxes in a hug row is the design's own: \`button.secondary\`'s border (1px on each edge), not the control's box model.

## Verification

- \`tests/test_UAT_FC_BUG-369_control_centred_in_its_box.test.ts\`: red before the fix (Cancel label 11px off-centre in the stretched box; the hug boxes differed by 22px), green after. Run in a sandbox with \`CHROMIUM_LAUNCH_ARGS=--single-process\`.
- Regression scope (119 files that render controls, boxes, checkout or fragments): no new failures against the unchanged-renderer baseline. Every remaining failure is environment-related and already failing on the baseline. \`packages/framework\` typecheck is clean.