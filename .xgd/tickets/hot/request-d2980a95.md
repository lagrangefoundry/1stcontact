---
uid: request-d2980a95
id: REQ-137
type: request
title: 'L1 palette: shade on the reference replaces named steps'
created_by: xgd
created_at: '2026-08-12T17:41:39.063912+00:00'
updated_at: '2026-08-12T17:41:39.063912+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  depends_on: []
  auto_merge_back: true
  needs_review: false
---

# L1 palette: shade on the reference replaces named steps

**The model change split out of [[REQ-133]] §2.** REQ-133 (the palette popup) depends on this
landing first: the popup's light↔dark slider has nothing to write until `shade` exists, and its
"one entry, one color" display is false while `steps` does.

Revises [[REQ-114]] (the palette color model, landed). Design: [[DOC-23]] §5.

---

## 1. What changes

A palette entry becomes **one color**. The light↔dark family is not stored; it is *generated*
from the entry, and the position within it is carried by the **reference**.

- **Entry**: `{ value: "#rrggbb" }`. `steps` is **deleted** — no legacy mode, no dual path,
  no reader that accepts both.
- **Reference**: `{ ref, shade?, alpha? }`. `shade` is a **continuous** signed scalar on
  `[-1, +1]`: negative mixes the entry toward black, positive toward white, **in Oklab**, so
  the axis is perceptually even and a slider over it is linear in what the eye sees. `0` or
  absent resolves to the entry's own hex.
- `shade` and `alpha` are independent axes on the same reference, which is what they are.

## 2. Why

This is the argument [[DOC-23]] §5.4 already made about `alpha`, one axis over. Alpha lives on
the reference precisely because an entry carrying it would make one conceptual color occupy N
entries, and the entry would stop being the unit of change.

Named steps are that same mistake. `primary`, `primary/500` and `primary/700` are three stored
hexes that nothing keeps related, so changing "the brand teal" today repaints the 40 references
to the base and leaves the 20 on its steps at the old color. With shade on the reference,
**changing the entry moves the whole family by construction** rather than by a convention
someone has to maintain.

The user-facing consequence is the point: the operator never edits a shade directly. They pick
an entry and move a slider; the palette editor exposes only real colors.

## 3. Measured consequences for the existing sites

Every current step was fitted to its best Oklab tint/shade mix from its base:

- **15 of 22 reproduce within 1–8 bytes of 255** — invisible. All of `text`, `sand`, `surface`,
  most of `slate`, `primary/700`, `green/700`, `green/800`.
- **7 fail hard**, all for one reason: **a tint/shade mix can only reduce chroma, and these are
  more saturated than their base.** `amber/500` `#ffb900` vs base `#f5e6a3` — 101 bytes.
  `blue/500` `#1447e6` vs base `#90a1b9` — 89. Also `blue/300`, `blue/400`, `orange/400`,
  `green/600`, `primary/500`.

Those seven are **not shades of anything** — they are distinct colors that REQ-114's hue-based
family grouping filed under one name. Under this model each becomes **its own entry**, which is
more honest than the current grouping and costs nothing: they stay exact literals.

**So the retrofit is re-run, and it is no longer pixel-identical.** [[REQ-114]] AC3 guaranteed
byte-identity; this supersedes that guarantee with a bounded, measured one: ≤8/255 on the 15
genuine ramp members across `xgd` and `gigabytealchemy`, zero everywhere else. Operator-approved
this session. Reported as a before/after values-diff rather than assumed.

## 4. What this touches

- `packages/site-schema/src/l1/palette.ts` — drop `steps` from the entry schema, add `shade` to
  the reference schema, implement the Oklab mix in `resolveL1Color`. `collectL1PaletteRefs`
  loses its per-step tally: a reference counts against its entry whatever its shade.
- `tools/generate/src/cli/colors.ts` — `groupIntoFamilies` / `toEntry` / `derivePalette` emit
  entries + shades instead of steps, and stop grouping members a mix cannot reach.
- `storage/sites/{xgd,gigabytealchemy}` — re-retrofitted.

## 5. Acceptance criteria

1. A palette entry holds a single color; `steps` no longer exists in the schema, and no
   `site.json` carries one.
2. A reference may carry `shade` on `[-1, +1]`, resolving as an Oklab mix toward black or white;
   `0`/absent resolves to the entry's own hex; out-of-range is a validation failure.
3. `1c colors <slug> --assign` derives entries + shades, and never emits a step.
4. A family member a mix cannot reach becomes its own entry and renders byte-identically.
5. `xgd` and `gigabytealchemy` are re-retrofitted, with the before/after values-diff reported:
   zero delta except on the members re-expressed as shades, each within the measured bound.
6. Full suite green, clean `pnpm -r build`.

## Origin

Split from [[REQ-133]] §2 at the operator's request, this session. The step→shade model is the
operator's, taken after measuring that most stored steps sit on their base's tint/shade ramp and
the rest are unrelated colors.
