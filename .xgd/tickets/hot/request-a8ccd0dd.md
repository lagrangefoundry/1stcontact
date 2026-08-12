---
uid: request-a8ccd0dd
id: REQ-135
type: request
title: 'Page editor: text properties — colour, size, weight, italic on the whole segment'
created_by: xgd
created_at: '2026-08-12T00:44:05.882887+00:00'
updated_at: '2026-08-12T00:51:50.655742+00:00'
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

# Page editor: text properties — colour, size, weight, italic on the whole segment

**Depends on [[REQ-133]]** (the palette colour picker and the palette editor). This ticket
consumes both: a segment picks *from* the palette, and the user edits the palette *in* REQ-133's
surface. Nothing here ships until that control exists.

Phase 2 of [[DOC-28]] §8 ("text properties"). Related: [[DOC-23]] §5 (the palette colour model,
landed as REQ-114), [[DOC-31]] (restraint as a *locked* decision), [[REQ-131]] (the change journal
the AI needs to notice these edits cheaply).

## Status: design discussion — not yet scoped for code

The body below records the decisions taken so far and the questions still open. It is not an
implementation spec yet.

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
its lone text run — so "click just outside the words" is not always available.

*Proposal (open):* the text modal carries a **"Panel background…"** escalation that re-targets to
the nearest painted ancestor segment and opens *its* modal. Navigation, not a duplicated control —
still one modal per segment, one diff per Save.

## 3. Colour writes a palette *reference*, never a hex

**Decided.** The picker offers `site.palette` entries (REQ-114); choosing one writes
`{ ref: 'primary' }` into the axis, not `#2e86a3`.

This is what makes "edit the palette entry and every use follows" true, and it is the mechanism
that bounds §6's ugliness risk: from a segment, a user cannot invent an off-system colour. Free hex
entry lives in the palette editor (REQ-133) and is a deliberate, separate act.

Folded sites hold literals everywhere today, so picking converts literal→reference — the refinement
direction [[DOC-23]] §5.2 already wants, and pixel-identical when the chosen entry is that colour.

## 4. Font size must not be a pixel box

**Decided: no absolute px control for size.**

`fontSizePx` may be a **responsive track** (`l1TextResponsiveSchema`, BUG-18) — keyframes across
the width ladder, so a headline runs 72px on desktop and 36px at 320. A plain number control
flattens that: set 32 and the mobile keyframe is gone, silently, and the page breaks at a width the
user never looked at.

*Proposal (open):* size is a **relative step that scales every keyframe** (a small set of named
steps, or ± nudges). Responsive behaviour is preserved by construction, and "a bit bigger" is what
the user meant anyway.

`lineHeightPx` and `letterSpacingPx` are tracks for the same reason → **out of V1**.

## 5. Weight and italic: a closed list derived from the declared faces

**Decided.** `resources.fonts` binds a family to its served `.woff2` with `weight`/`style`
(`l1FontFaceSchema`). Offering weight 700 when no bold face is declared yields *synthetic* bold —
ugly, and engine-dependent. So the control offers only the weights/styles the site actually
declares for that family, plus whatever the node currently holds. Same closed-list discipline the
image picker already uses.

## 6. Proposed V1 field set

| Field | Axis | Control | Notes |
|---|---|---|---|
| Text colour | `axes.color` | palette swatches (REQ-133) | writes a ref |
| Size | `axes.fontSizePx` + `responsive.fontSizePx` | relative step | scales the whole track |
| Weight | `axes.fontWeight` | enum from declared faces | |
| Italic | `axes.fontStyle` | enum from declared faces | |
| Uppercase | `axes.textTransform` | enum | cheap, always visible |
| **Panel background** | container `axes.surfaceFill` | palette swatches | on the *container* segment (§2) |

**Deliberately out of V1:** alignment (`textAlign` is inert on a glyph-tight folded run — a control
that visibly does nothing on most of our sites), line height, letter spacing, gradient fill, text
shadow, decoration.

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
  `mountFields` already speaks — the same hint mechanism REQ-132 used for images).
- `L1SegmentFieldOptions` gains `palette` alongside `assets` — the option list is a property of the
  *site*, exactly as the asset listing is.
- `applyCopyFields` gains axis writes (into `node.axes`, creating it when absent) and its value
  type widens from `Record<string, string>`.
- Palette references are validated by the envelope validator already — a ref naming a missing entry
  is a validation failure, not a render-time fallback.

## 9. Open questions

1. The "Panel background…" escalation (§2) — build it, or rely on clicking the panel directly?
2. The size vocabulary (§4) — named steps, or ± nudges? How many?
3. Is alignment genuinely worth omitting, or should it ship and simply be inert on folded pages?
4. Does a segment's colour picker offer palette *steps* as well as entries, or entries only in V1?
