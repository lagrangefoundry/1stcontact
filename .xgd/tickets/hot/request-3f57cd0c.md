---
uid: request-3f57cd0c
id: REQ-139
type: request
title: 'Editor: lock controls that cannot express what the element holds'
created_by: xgd
created_at: '2026-08-12T18:13:37.478932+00:00'
updated_at: '2026-08-13T16:30:57.811325+00:00'
completed_at: null
last_field_updated: depends_on
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  depends_on:
  - REQ-133
---

## What changed

When a segment holds something richer than the simple control can express, the
editor currently offers the control anyway — and it either does nothing or
quietly destroys what was there. This makes the control **visibly unavailable,
with the reason**, instead.

The mechanism already half-exists. `L1FieldDescriptor.locked` (REQ-135) does
exactly this for one case (italic on a family that declares no italic face), and
`applyCopyFields` already refuses a locked field on the write side. This
generalises that one trigger to a family of them.

## The rule

> A control is offered only when it is **faithful**: the value it shows is the
> whole truth about what the element holds, and setting it produces exactly the
> change the operator expects. When it is not, the control is shown **locked with
> the reason** — never hidden, never quietly lossy.

Three ways faithfulness breaks. Same treatment, different cause:

| | Cause | Example |
|---|---|---|
| **Inert** | Another axis on the node overrides the one the control writes, so setting it paints nothing | `gradientFill` emits `color: transparent`; a colour picker writes a value that never appears |
| **Lossy** | The node holds a *structure* where the control offers a *scalar* — showing it is a projection, writing it a flattening | a gradient reduced to one swatch; a mask carrying shape parameters |
| **Unsupported** | Expressible, but the site cannot honour it | italic with no italic face (already implemented) |

The test is **"is the write observable and complete?"**, NOT "is another axis
present". `gigabytealchemy/home` carries a background image under an `overlay`,
and the picker there is still good — a scrim tints an image, it does not hide it.
A sibling axis is not occlusion.

Never hide the row. Absence reads as "this build has no such feature" rather than
"not for this element", and the two have very different fixes — REQ-135's own
argument for `locked` over dropping the field.

## Measured against the real folds

- `gradientFill` — 1 run, and it is exactly the Gigabyte Alchemy title.

## Beyond the derivation

1. **The reason must be visible.** `locked` carries no explanation today. A grey
   control with no cause reads as a bug. The reason is plain English and names
   the escape hatch: "This heading is painted with a colour gradient — ask me in
   chat to change it."
2. **Locked must look locked.** `webui-fields` adds an `is-locked` class and
   nothing styles it — neither its stylesheet nor `builder.css`. The existing
   italic lock is invisible today.

## Decisions

- **Responsive font size is out of scope.** Operator call, 2026-08-13. Today the
  size control shows the widest keyframe and `scaleTrack` scales the *whole*
  track proportionally, so the fold's measured shape survives — that is the
  honest generalisation of "make it bigger", not a loss. Locking it would
  withdraw size editing from every heading on both real sites. It stays editable
  and is not treated as a faithfulness break. (Measured, for the record: varying
  size tracks appear on 8 runs of `gigabytealchemy/home`, 14 of `xgd/home`, 7 of
  `xgd/whitepapers`.)
- **Blocked on colour controls.** Operator call, 2026-08-13: implement this after
  the colour control lands. There is no colour control on any segment today —
  colour waits on [[REQ-133]] (palette popup), which itself waits on [[REQ-137]].
  Building the gradient gate first would ship a guard before the thing it guards,
  with nothing visible to show for it. `depends_on: REQ-133`.

Scope therefore narrows to the **inert/lossy colour cases** — chiefly
`gradientFill` — plus the two presentation gaps above (visible reason, visible
locked styling), and is picked up once REQ-133 is in.

## Test plan

UATs named `test_UAT_FC_REQ-139_*`:

- A run carrying `gradientFill` derives its colour field `locked`, with a reason.
- A run carrying no `gradientFill` derives the same field editable.
- A background-image picker under an `overlay` stays editable (occlusion is
  observability, not sibling presence).
- `applyCopyFields` refuses a post against each newly locked field, naming it.
- The locked row renders visibly unavailable and shows its reason.
