---
uid: request-a8ccd0dd
id: REQ-135
type: request
title: 'Page editor: text properties — colour, size, weight, italic on the whole segment'
created_by: xgd
created_at: '2026-08-12T00:44:05.882887+00:00'
updated_at: '2026-08-12T01:21:47.905528+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  depends_on:
  - REQ-133
---

# Page editor: text properties — colour, size, weight, italic on the whole segment

**Depends on [[REQ-133]]** (the palette colour picker and the palette editor). This ticket
consumes both: a segment picks *from* the palette, and the user edits the palette *in* REQ-133's
surface. Nothing here ships until that control exists.

Phase 2 of [[DOC-28]] §8 ("text properties"). Related: [[DOC-23]] §5 (the palette colour model,
landed as REQ-114), [[DOC-31]] (restraint as a *locked* decision), [[REQ-131]] (the change journal
the AI needs to notice these edits cheaply).

## Status: design discussion — not yet scoped for code

The body below records the decisions taken so far and the questions still open. It is not an
implementation spec yet. Design mockups (scratch, not committed):
`.xgd/tmp/req135-escalation-mock.html` and `.xgd/tmp/req135-palette-mock.html`.

---

## 1. Scope: the whole segment, never part of it

**Decided: styling applies to the whole clicked segment.**

This is stronger than a simplification — it falls out of the substrate. An L1 `text` node is one
run with one `axes` bag (`packages/site-schema/src/l1/schema.ts` → `l1TextAxesSchema`). Styling one
word out of three means *splitting the run*, which is a structural change, and structure is not
editable from this surface at all ([[DOC-28]] §7.3). Per-run in-text restyling is already parked
with the AI and gated on a semantic rich-text engine ([[DOC-28]] §9.1).

Worth noting what this does *not* forbid: where a page already carries three differently-styled
runs, those are three `text` nodes and therefore three separate segments, each individually
clickable and individually stylable. What V1 refuses is the editor *creating* a new split.

## 2. Background colour belongs to the panel, not to the text

**Decided: background colour is a field on the *container* segment, not on the text segment.**

`surfaceFill` sits in the shared surface group (REQ-98) and is carried by every box-rendering kind
— including `text`. So the editor *could* fill the text node. It should not: a folded run's box is
glyph-tight, so a fill painted there is a tight rectangle behind the words, which is almost never
what a user means by "the background". The thing they mean is the enclosing painted box/container,
which is **already a distinct segment** — REQ-128 exposes its `backgroundImageUrl` there today, and
`copyFieldsOf` already draws the boundary explicitly ("exposing it there would make the copy modal
a paint surface"). Background colour is one more field on that existing modal.

**The gap this leaves is navigation, not capability.** Innermost-wins means clicking the words
opens the text modal, and [[DOC-28]] §6.5 measured one container on `xgd/home` fully occluded by
its lone text run — so "click just outside the words" is not always available. Hence an
**escalation**: an affordance in the text modal that re-targets to the nearest painted ancestor
segment and opens *its* modal. Navigation, not a duplicated control — still one modal per segment,
one diff per Save.

**Two variants mocked (`req135-escalation-mock.html`), choice still open:**

- **A — footer link.** `Panel background… ↗` sits left of Cancel/Save. Reads unambiguously as
  "leave here, go there". Costs nothing when the user does not want it.
- **B — inherited row.** A read-only swatch of the panel's current fill, labelled *from the panel
  behind this text*, with an `edit the panel ↗` link. Answers "what is behind this?" as well as
  "where do I change it?", and teaches the model (background lives on the panel) rather than just
  routing.

**Unresolved either way: what the escalation does with unsaved edits.** It navigates away from a
dirty modal. Options: save-then-open, warn-then-discard, or disable while dirty. Save-then-open is
the likely answer — it matches "one modal, one diff" — but it makes a navigation gesture also a
commit, which needs to be visible in the label.

## 3. Colour writes a palette *reference*, never a hex

**Decided.** The picker offers `site.palette` entries (REQ-114); choosing one writes
`{ ref: 'slate', step: '900' }` into the axis, not `#0f172b`.

This is what makes "edit the palette entry and every use follows" true, and it is the mechanism
that bounds §7's ugliness risk: from a segment, a user cannot invent an off-system colour. Free hex
entry lives in the palette editor (REQ-133) and is a deliberate, separate act.

Folded sites hold literals everywhere today, so picking converts literal→reference — the refinement
direction [[DOC-23]] §5.2 already wants, and pixel-identical when the chosen entry is that colour.

### 3.1 Steps are in V1 — settled by the data, not by preference

The open question was whether the picker offers palette *steps* or base entries only. Measured
against the real store:

| site | palette |
|---|---|
| `gigabytealchemy` | 8 entries, **28 colours** (`slate` alone carries 8 steps: 50/100/125/700/800/900/925/950) |
| `xgd` | 6 entries, 16 colours (`text` carries 5 steps) |
| `joyful`, `harbor-cafe`, `1stcontact`, … | no palette yet |

A base-only picker would therefore hide **most of the site's actual colours**, and worse: a run
coloured `{ref:'slate', step:'900'}` would not be in its own option list. A select whose options
omit its current value renders with the first option selected and silently swaps the colour on
Save — the exact failure `imageChoices` was written to prevent for images.

So the control is a **ramp grid**: one row per entry, chips for the base plus each named step
(`req135-palette-mock.html`). ~28 chips for the largest real palette, which is a comfortable grid,
not a scroll.

## 4. Font size: absolute number, proportional write

**Decided: an absolute px control spanning roughly 6–128 px** — it has to cover a subscript and a
full-bleed hero from one control.

The number in the control is the run's **representative (widest) value** — what `axes.fontSizePx`
holds today. The write is **proportional**: every keyframe in `responsive.fontSizePx` is scaled by
the same ratio. That is what reconciles a broad absolute range with the responsive ladder
(`l1TextResponsiveSchema`, BUG-18): a headline running 72px desktop / 36px at 320 taken to 96
becomes 96/48, not 96 flat at every width. A control that wrote the axis directly would delete the
mobile keyframe silently, and the page would break at a width the user never looked at.

Two details still to settle:

- **Units.** L1 is px throughout, and the request was phrased in points (6–128 pt ≈ 8–171 px). The
  control should say `px` and mean it; the range needs a decision on whether to take 6–128 as the
  px numbers or convert.
- **A run that declares no size at all** (it inherits) has no base to scale. The control has to
  seed from the rendered value and let the first change write an explicit axis.

`lineHeightPx` and `letterSpacingPx` are tracks for the same reason and get no control → **out of
V1**.

## 5. Weight and italic: a closed list derived from the declared faces

**Decided.** `resources.fonts` binds a family to its served `.woff2` with `weight`/`style`
(`l1FontFaceSchema`). Offering weight 700 when no bold face is declared yields *synthetic* bold —
ugly, and engine-dependent. So the control offers only the weights/styles the site actually
declares for that family, plus whatever the node currently holds. Same closed-list discipline the
image picker already uses. A style with no declared face renders as a disabled control, not a
missing one, so the absence is legible.

## 6. The V1 field set

| Field | Axis | Control | Notes |
|---|---|---|---|
| Text colour | `axes.color` | palette ramp grid (REQ-133) | writes a ref, steps included |
| Size | `axes.fontSizePx` + `responsive.fontSizePx` | px stepper, ~6–128 | scales the whole track |
| Weight | `axes.fontWeight` | enum from declared faces | |
| Italic | `axes.fontStyle` | toggle, disabled without a face | |
| Uppercase | `axes.textTransform` | toggle | cheap, always visible |
| **Panel background** | container `axes.surfaceFill` | palette ramp grid | on the *container* segment (§2) |

**Decided out of V1:** **alignment** — nothing is implemented today, and `textAlign` is inert on a
glyph-tight folded run, so it would be a control that visibly does nothing on most of our sites.
Revisit if a real need appears. Also out: line height, letter spacing, gradient fill, text shadow,
decoration.

## 7. On the user making it ugly

Agreed that this is the AI's job to notice and offer to fix, and that the freedom is worth the
risk. Worth recording that the guardrails above already shrink the space a long way: colour is
palette-only, weight is face-only, size is a scaled track. What remains is genuinely a taste
question rather than a broken-page question.

The dependency that makes the AI half real is **[[REQ-131]]** (the draft change journal). Without
it the AI cannot notice the user's change without a full re-read every turn.

## 8. Architectural note: this is the first editor surface that writes *axes*

Everything the editor writes today (`text`, `src`, `alt`, `backgroundImageUrl`) is a flat scalar on
the node with no responsive dimension. Axes are different: they live in `node.axes`, some of them
have per-width tracks, and colour is a union of hex-or-reference. Consequences for
`packages/site-schema/src/l1/edit.ts`:

- `L1FieldDescriptor.type` gains a colour shape (the `enum` + `format: 'color'` pairing
  `mountFields` already speaks — the same hint mechanism REQ-132 used for images). Note the option
  list is no longer a flat `readonly string[]`: a ramp grid needs entry/step structure.
- `L1SegmentFieldOptions` gains `palette` alongside `assets` — the option list is a property of the
  *site*, exactly as the asset listing is.
- `applyCopyFields` gains axis writes (into `node.axes`, creating it when absent), the proportional
  track rewrite for size, and its value type widens from `Record<string, string>`.
- Palette references are validated by the envelope validator already — a ref naming a missing entry
  is a validation failure, not a render-time fallback.

## 9. Open questions

1. Escalation variant **A (footer link)** or **B (inherited row)** — §2.
2. What the escalation does with unsaved edits — §2.
3. Size range in px vs the points it was requested in; seeding a run that declares no size — §4.
