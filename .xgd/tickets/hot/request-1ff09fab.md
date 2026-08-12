---
uid: request-1ff09fab
id: REQ-138
type: request
title: 'Copy modal: parameter changes preview live in the editing box'
created_by: xgd
created_at: '2026-08-12T17:56:30.149389+00:00'
updated_at: '2026-08-12T18:12:38.687798+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 9a51098f52ca69e11726c6af4ae2d01222883c64
    reconcile_sha: null
    main_sha: null
  version: 0.1.39
  story_points: 2
---

## What the user sees

In the copy edit modal, changing a typography parameter (Size, Weight, Italic,
Capitalisation) in the parameter sheet **immediately restyles the words in the
editing box above it**, so the operator can judge the change before deciding
between Save and Cancel.

Today the box is dressed **once**, when the modal opens (`applyPreview` writes
`--preview-*` custom properties from `readPageStyle`). Nothing re-reads or
re-writes them, so a parameter change is invisible until Save → POST → iframe
reload. The operator is choosing blind and then reloading the page to find out
what they chose.

## Why free-coded

Small, contained addition to an existing loop: the box already reads every
axis it needs through CSS custom properties, and `mountFields` already emits
`change` in buffered mode. Nothing about the write path, the validator or the
diff changes.

## Design

**Only a parameter the operator actually changes overrides the box.** The
opening dressing is left exactly as it is. This is deliberate, not laziness:
the base vars are read from `getComputedStyle` on the rendered run (the
*cascaded* result), while the descriptor values come from the node's own axes
(only what it *overrode*). The two legitimately disagree — a run that inherits
weight 700 while declaring none opens with a `fontWeight` value of `400` — so
re-deriving the whole dressing at open would visibly restyle the box the moment
it appeared. Subscribing to `change` and writing one var per changed field
sidesteps that entirely and keeps REQ-121's opening assertions true by
construction.

Field → custom property:

| field | property | note |
|---|---|---|
| `fontSizePx` | `--preview-font-size` | scaled — see below |
| `fontWeight` | `--preview-font-weight` | |
| `italic` | `--preview-font-style` | `italic` / `normal` |
| `textTransform` | `--preview-text-transform` | `none` clears it |

### Size is scaled, not copied

`PREVIEW_MIN/MAX_PX` (14–32) exist because a 56px display headline reproduced
faithfully is unusable in a dialog (REQ-121). Re-clamping the *authored* value
would make this feature silently fail for exactly the runs where size matters
most: a headline already sits at the 32px cap, so 56 → 80 would show no change
at all.

So the box keeps **the scale the dialog dressed it at**:

```
scale       = openingPreviewPx / openingAuthoredPx
previewPx   = max(PREVIEW_MIN_PX, authoredPx * scale)
```

`scale` folds in both the clamp and any responsive-track difference between the
authored base size and the size actually rendered at the current width. Body
copy previews 1:1; a clamped headline previews proportionally reduced but
responds to every change. No upper cap — the box scrolls.

Accepted bound: shrinking far below the run's own size saturates at 14px, the
same legibility floor REQ-121 already set for the control being typed into.

## Not in scope

- **Colour.** No colour descriptor exists yet (`edit.ts` defers it to REQ-133's
  palette control). The mapping is a table; colour joins it when the descriptor
  lands.
- **Image framing (REQ-136).** The user asked about the text editor. Framing
  parameters change the picture, not the words, and previewing them means
  restyling the picker's thumbnail — a separate change.

## Test plan

`tests/test_UAT_FC_REQ-138_live_preview.test.ts`, driving the real modal through
`mountEditor` on a rendered edit document, as REQ-121/REQ-135 do:

- changing Size restyles the box, proportionally to the opening scale
- changing Weight / Italic / Capitalisation each restyle the box
- an untouched parameter leaves its opening var alone (the divergence guard)
- opening the modal still produces REQ-121's exact dressing (regression)