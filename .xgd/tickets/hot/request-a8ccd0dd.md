---
uid: request-a8ccd0dd
id: REQ-135
type: request
title: 'Page editor: text properties — colour, size, weight, italic on the whole segment'
created_by: xgd
created_at: '2026-08-12T00:44:05.882887+00:00'
updated_at: '2026-08-12T20:56:47.025758+00:00'
completed_at: '2026-08-12T20:54:12.595777+00:00'
last_field_updated: result
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  depends_on:
  - REQ-133
  commits:
  - working_sha: null
    reconcile_sha: null
    main_sha: 345dcb7685ac02043945a8c4cd65ef3aba7b1fa7
  version: 0.1.37
  merged_at_commit: 345dcb7685ac02043945a8c4cd65ef3aba7b1fa7
  chat_comment: comment-5d147d68
result: pass
---

# Page editor: text properties — colour, size, weight, italic on the whole segment

**Depends on [[REQ-133]]** (the palette colour picker and the palette editor) — for its *colour*
half only. See §9: the typography half has no palette dependency and is scoped for code now.

Phase 2 of [[DOC-28]] §8 ("text properties"). Related: [[DOC-23]] §5 (the palette colour model,
landed as REQ-114), [[DOC-31]] (restraint as a *locked* decision), [[REQ-131]] (the change journal
the AI needs to notice these edits cheaply).

Design mockups (scratch, not committed): `.xgd/tmp/req135-escalation-mock.html`,
`.xgd/tmp/req135-palette-mock.html`.

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

**Decided: variant B — the inherited row.** A read-only swatch of the panel's current fill,
labelled *from the panel behind this text*, with an `edit the panel ↗` link. The rejected
alternative (A) was a bare `Panel background… ↗` link in the footer. B costs one extra row and
answers "what is behind this?" as well as "where do I change it?" — the first time someone hunts
for a background control it *teaches where backgrounds live* rather than merely routing them.

**Decided: a dirty modal saves before it navigates.** The alternatives were warn-then-discard and
disable-while-dirty; both leave the user holding staged text with no good move. Save-then-open
keeps "one modal, one diff" intact. It does make a navigation gesture also a commit, so the label
must say so when the modal is dirty.

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

**Decided: an absolute control spanning 6–128, in PIXELS** — it has to cover a subscript and a
full-bleed hero from one control. The request was phrased in points; L1 is px throughout
(`fontSizePx`), and 6–128 px is the range that matches the axis rather than converting into it
(6–128 pt would be 8–171 px). The control says `px` and means it.

The number in the control is the run's **representative (widest) value** — what `axes.fontSizePx`
holds today. The write is **proportional**: every keyframe in `responsive.fontSizePx` is scaled by
the same ratio. That is what reconciles a broad absolute range with the responsive ladder
(`l1TextResponsiveSchema`, BUG-18): a headline running 72px desktop / 36px at 320 taken to 96
becomes 96/48, not 96 flat at every width. A control that wrote the axis directly would delete the
mobile keyframe silently, and the page would break at a width the user never looked at.

**The range binds a change, never the status quo.** A run the fold captured at 160px is outside
6–128, and clamping it merely because the modal was opened would silently reshape a page nobody
edited. So the bound is checked only against a value that actually differs from the current one.

**A run that declares no size** (it inherits) has no base to scale: the control seeds from the
rendered value, and the first change writes an explicit axis.

`lineHeightPx` and `letterSpacingPx` are tracks for the same reason and get no control → **out of
V1**.

## 5. Weight and italic: a closed list derived from the declared faces

**Decided.** `resources.fonts` binds a family to its served `.woff2` with `weight`/`style`
(`l1FontFaceSchema`). Offering weight 700 when no bold face is declared yields *synthetic* bold —
ugly, and engine-dependent. So the control offers only the weights/styles the site actually
declares for that family, plus whatever the node currently holds. Same closed-list discipline the
image picker already uses. A style with no declared face renders as a **disabled** control, not a
missing one, so the absence is legible rather than mysterious.

## 6. The V1 field set

| Field | Axis | Control | Phase |
|---|---|---|---|
| Size | `axes.fontSizePx` + `responsive.fontSizePx` | px stepper, 6–128 | **A** |
| Weight | `axes.fontWeight` | enum from declared faces | **A** |
| Italic | `axes.fontStyle` | toggle, disabled without a face | **A** |
| Uppercase | `axes.textTransform` | toggle | **A** |
| Text colour | `axes.color` | palette ramp grid | B (REQ-133) |
| Panel background | container `axes.surfaceFill` | palette ramp grid | B (REQ-133) |
| Panel escalation | — | inherited row (§2) | B (REQ-133) |

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

- `L1FieldDescriptor.type` widens beyond `'string' | 'enum'` — `'integer'` and `'boolean'` for the
  typography controls (both already rendered by `mountFields`), and later a colour shape (the
  `enum` + `format: 'color'` pairing it also already speaks). Note a ramp grid's option list is no
  longer a flat `readonly string[]`: it needs entry/step structure.
- `L1SegmentFieldOptions` gains `fonts` (phase A) and `palette` (phase B) alongside `assets` — both
  are properties of the *site/document*, exactly as the asset listing is.
- `applyCopyFields` stops assuming every value is a string, gains axis writes (into `node.axes`,
  creating it when absent) and the proportional track rewrite for size.
- Palette references are validated by the envelope validator already — a ref naming a missing entry
  is a validation failure, not a render-time fallback.

## 9. Delivery plan

**Phase A — typography — LANDED.** Size, weight, italic and capitalisation on a text segment, with
no palette dependency. What shipped:

- `packages/site-schema/src/l1/edit.ts` — the descriptor widened to `integer`/`boolean` with
  `min`/`max`/`locked`; `L1SegmentFieldOptions.fonts`; the four fields derived for a `text` node;
  `applyCopyFields` accepting non-string values, writing into `node.axes`, and **scaling every
  `responsive.fontSizePx` keyframe** rather than flattening the ladder.
- `tools/generate/src/cli/edit.ts` — the page's `resources.fonts` supplied to the derivation.
- `apps/control-app/src/builder/editor.js` + `builder.css` — the copy field stays in the dressed
  box; the parameters mount as a second `mountFields` instance in a sheet beneath it. Auto-open now
  keys on the box's fields, so clicking words still puts the cursor in them.
- `tests/test_UAT_FC_REQ-135_text_properties.test.ts` — 7 UATs.

### 9.1 What the real data changed about the plan

Three things were settled by measuring `xgd/home` (62 runs) rather than by reasoning:

- **`fontFamily` is a STACK, `resources.fonts[].family` is a bare name.** Every run carries
  `"Satoshi, Helvetica Neue, Arial, sans-serif"`; every face declares `"Satoshi"`. A whole-string
  comparison is a guaranteed miss, not a near-miss — it would have withdrawn the weight control
  from the entire site, silently. The derivation matches on the first family of the stack.
- **The current weight is usually NOT a declared face.** 10 of 62 runs are set in weight 600, which
  that site declares no face for. §5's "plus whatever the node holds" is the common case, not a
  corner, and without it a heading re-weights itself when an unrelated field is saved.
- **23% of runs carry a size track** (14 of 62), and every run that has one also carries the
  representative axis value. So §4's proportional write is load-bearing on roughly one run in four,
  and the "run declares no size" guard never fires on measured data.

### 9.2 Amended: when italic is locked

§5 said "locked where no italic face is declared". Implemented as **locked only on positive
evidence of absence** — the family declares faces, and none is italic. A family with no declared
faces at all is painted by the reader's own system font, which has real italics, so locking there
would disable a control that works. `xgd/home` declares four Satoshi weights and no italic, so the
lock is visible on a real site.

### 9.3 Test amendments

Eleven assertions across nine earlier suites asserted "a copy segment exposes exactly `[text]`",
which REQ-135 changes by design. Each was narrowed to the claim its AC is actually about (the copy
field is first and holds the words) rather than relaxed. Two were scoped to the box rather than the
dialog: REQ-121 dropped a label column that said "Text" beside the words themselves, and the
parameter sheet is the opposite case — "34" and "700" are meaningless unlabelled.

**Phase B — colour (blocked on REQ-133).** Text colour, panel background, the escalation row (§2).