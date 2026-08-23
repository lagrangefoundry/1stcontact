---
uid: request-1ff09fab
id: REQ-138
type: request
title: 'Copy modal: parameter changes preview live in the editing box'
created_by: xgd
created_at: '2026-08-12T17:56:30.149389+00:00'
updated_at: '2026-08-13T02:25:11.961245+00:00'
completed_at: '2026-08-13T02:22:36.521570+00:00'
last_field_updated: result
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: null
    reconcile_sha: null
    main_sha: b2827d1e92f4a7c34a71b2e6df9f9560fc38f041
  version: 0.1.39
  story_points: 2
  merged_at_commit: b2827d1e92f4a7c34a71b2e6df9f9560fc38f041
  chat_comment: comment-a5255c4d
result: pass
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

`tests/test_UAT_FC_REQ-138_live_preview.test.ts` — 6 UATs driving the real
`defaultModal` over a real `1c render --edit` page, with the controls exercised
by the gestures a user makes (click the row, type, blur; pick from the select;
tick the toggle) rather than by calling into the component.

| | claim |
|---|---|
| AC-1 | a clamped headline still responds — the load-bearing one |
| AC-2 | the box keeps the scale it opened at, for a clamped run and an unclamped one |
| AC-3 | Weight, Italic and Capitalisation each restyle the box (three different gestures) |
| AC-4 | turning a parameter back off clears it rather than leaving the last value standing |
| AC-5 | one property per change — an untouched parameter keeps its opening value |
| AC-6 | regression: opening the modal is still REQ-121's dressing |

## Verification

- **The suite fails without the fix**: 4 of 6 fail with the subscription removed.
  The 2 that pass are AC-5 and AC-6, which assert the *absence* of change and so
  pass on the old code by construction.
- **AC-1 pins the design decision**: substituting the naive re-clamp
  (`clampPreviewSize` on the authored value) fails AC-1 and nothing else. The
  fixture confirms the clamp is genuinely engaged — the 72px headline opens
  previewed at 32px, scale 0.44, so 120px previews at 53px where a re-clamp
  would answer 32px and show the operator nothing.
- **Editor/modal regression scope**: 91 passed across REQ-117/118/121/128/132/135
  and the two reconciliation copy-edit suites.
- **Full suite**: 1452 passed, 13 failed. The 13 are pre-existing and unrelated —
  the identical 13 fail on pristine `xgd-working` without this change
  (`reconciliation-assistant-conversation`, `REQ-122_chat_host`,
  `REQ-127_session_binding`; they need an API key).
- **The preview is visually real, not just a variable**: `fields.css` sets
  `.fields-control { font: inherit }`, so family, weight, style and size all
  reach the textarea, and `text-transform` inherits by default.