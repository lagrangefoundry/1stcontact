---
uid: request-3f57cd0c
id: REQ-139
type: request
title: 'Editor: lock controls that cannot express what the element holds'
created_by: xgd
created_at: '2026-08-12T18:13:37.478932+00:00'
updated_at: '2026-08-20T12:50:12.239100+00:00'
completed_at: '2026-08-20T12:50:12.239100+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  depends_on:
  - REQ-133
  - REQ-135
  commits:
  - working_sha: 5983c45588ea2e50f9828c437f36da11f94b6567
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 6b94ba96367a3f0cb7ec6dfc7f5dfe3d5661dae5
  version: 0.1.47
  story_points: 3
  bundled_in: bundle-77b28def
  chat_comment: comment-2d304414
---

## What changed

When a segment holds something richer than the simple control can express, the
editor offered the control anyway — and it either did nothing or quietly
destroyed what was there. It is now shown **visibly unavailable, with the
reason**.

The mechanism half-existed. `L1FieldDescriptor.locked` (REQ-135) did exactly
this for one case (italic on a family that declares no italic face), and
`applyCopyFields` already refused a locked field on the write side. This
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
| **Unsupported** | Expressible, but the site cannot honour it | italic with no italic face (REQ-135) |

The test is **"is the write observable and complete?"**, NOT "is another axis
present". `gigabytealchemy/home` carries a background image under an `overlay`,
and the picker there is still good — a scrim tints an image, it does not hide it.
A sibling axis is not occlusion.

Never hide the row. Absence reads as "this build has no such feature" rather than
"not for this element", and the two have very different fixes — REQ-135's own
argument for `locked` over dropping the field.

## What was built

**Derivation** (`packages/site-schema/src/l1/edit.ts`)

- `L1FieldDescriptor.reason` — the sentence that accompanies every `locked`.
  Plain English, naming the escape hatch ("Ask me in chat to change it"), never
  an axis name. It travels to the modal, the CLI and the AI's tool surface,
  because all three read these descriptors.
- A lock is derived as a **pair** (`{locked, reason}`), so one cannot be produced
  without the other.
- **`GLYPH_GRADIENT_LOCK`** — a `text` run carrying `gradientFill` locks its
  `color` row. The renderer paints a glyph gradient by clipping the background
  layers to the text, which requires `color: transparent`; the axis the picker
  writes is still valid and paints nothing. Measured: one run across every stored
  site — the Gigabyte Alchemy wordmark, which carries `color: {ref: 'neutral'}`
  *under* its gradient, so the row withdrawn is one that showed a real, editable,
  meaningless colour.
- **`NO_ITALIC_FACE_LOCK`** — REQ-135's existing lock, now with its reason.

**Write side** — `lockError` joins `typeError` / `rangeError` / `colorError` in
the refusal chain, and refuses with the descriptor's own `reason`, so the
sentence a greyed-out control shows and the sentence a refused write returns are
one string with one definition site.

**Client** (`apps/control-app/src/builder/`)

- `mountColorField` honours `locked`: the button is `disabled` (not merely
  dimmed — a class closes neither the keyboard nor the screen reader), the row
  carries `is-locked`, and the swatch still reports what the element paints.
- `annotateLocks` in `editor.js` draws the reason under the row it explains, once
  per sheet, for **both** control families — `mountFields` marks its own locked
  rows `is-locked` but has no vocabulary for a reason, and the colour row is
  drawn by the dialog.
- `builder.css` styles `.is-locked` and `.builder-lock`. Nothing styled either
  before: the italic lock REQ-135 shipped was enforced and invisible.

**CLI** — `1c copy get`'s listing appends `(locked: <reason>)` to a locked field.

## Design decisions made during implementation

- **A lock refuses a CHANGE, never the status quo.** The same rule `rangeError`
  and `colorError` already state, and it bites harder here: the modal posts every
  staged field, not only the touched ones, so a locked colour is re-posted on any
  Save — including one that only rewrote the words. Refusing it would have made
  an unavailable control freeze the *whole segment*, and the one node carrying a
  gradient is a headline. (This also fixes the latent form of the same bug in
  REQ-135's italic lock, which would have refused any Save on a run whose family
  declares no italic face.)
- **The colour row now carries `data-field`**, the same attribute `mountFields`
  stamps, so one pass finds a locked row and hangs its reason on it whichever
  control drew it — one selector, one CSS rule, one place that renders reasons.
  REQ-140's UAT asserted the colour row had *no* `data-field` as a proxy for "the
  component did not claim this field"; it now names `.fields-row[data-field=...]`,
  which is what only the component emits and what that assertion was always
  about.
- **`surfaceGradient` on a panel does NOT lock its fill.** A surface gradient is
  a background *layer* over the background colour, so a translucent one shows the
  fill through: the write stays observable. Only the definitively inert case is
  locked.
- **Responsive font size stayed out of scope.** Operator call, 2026-08-13:
  `scaleTrack` scales the whole track proportionally, so the fold's measured
  shape survives — the honest generalisation of "make it bigger", not a loss.
  (Measured, for the record: varying size tracks appear on 8 runs of
  `gigabytealchemy/home`, 14 of `xgd/home`, 7 of `xgd/whitepapers`.)
- **Was blocked on colour controls** (`depends_on: REQ-133`, `REQ-135`), which
  landed with REQ-140. Building the gate before the control it guards would have
  shipped nothing visible.

## Test plan

`tests/test_UAT_FC_REQ-139_locked_controls.test.ts` — the real `1c` commands, the
page `1c render --edit` wrote, and the real `defaultModal`:

- `..._a_gradient_painted_run_locks_its_colour_and_says_why` — locked with a
  reason naming the gradient and the chat, still offered, still in position,
  still reporting the axis; the identical control on the run below is untouched.
- `..._every_locked_control_carries_a_reason` — structural sweep over every
  segment: no `locked` without a `reason`, and the run in a family declaring no
  faces keeps a working italic.
- `..._a_scrim_over_a_photograph_is_not_occlusion` — a band carrying image +
  overlay + fill keeps both controls open, and the write lands.
- `..._a_change_to_a_locked_control_is_refused_with_its_reason` — refused at the
  field, message identical to the descriptor's reason, draft byte-unchanged.
- `..._a_locked_control_does_not_freeze_the_rest_of_the_segment` — the status-quo
  carve-out: the words save while the locked colour rides along.
- `..._the_cli_listing_marks_a_locked_field`.
- `..._a_locked_control_is_drawn_unavailable_and_shows_why` — `is-locked` on both
  families, the swatch disabled, clicking it reaches no picker, reason rendered.
- `..._an_ordinary_run_keeps_a_working_colour_control` — no note where there is
  nothing to explain.

Regression scope run: the full suite. 211 files / 1538 tests pass; the 12 files
that fail (assistant / chat / tool-surface suites) fail identically on the
unmodified base.