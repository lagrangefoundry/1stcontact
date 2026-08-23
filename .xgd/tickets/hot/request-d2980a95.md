---
uid: request-d2980a95
id: REQ-137
type: request
title: 'L1 palette: shade on the reference replaces named steps'
created_by: xgd
created_at: '2026-08-12T17:41:39.063912+00:00'
updated_at: '2026-08-17T02:59:24.541609+00:00'
completed_at: '2026-08-17T02:59:24.541609+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: medium
  depends_on: []
  auto_merge_back: true
  needs_review: false
  commits:
  - 7a0261676b45494d231c6b7136bd6d0d181f9d1b
  - 06ad8ad645f3c03adec7c526467300009e198a45
  - 87306fa43ea10900fecabea6d00f47b11184a3e2
  version: 0.1.42
  story_points: 5
  bundled_in: bundle-d9226698
  chat_comment: comment-05c9b8ab
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

## 6. Outcome (implemented)

### The shade axis

`shadeHex(hex, shade)` in `packages/site-schema/src/l1/palette.ts` is the single
implementation: sRGB → Oklab → mix toward `L=0` (black) or `L=1` (white) by
`|shade|`, driving `a`/`b` toward zero, → sRGB clamped into gamut. `shade === 0`
or absent short-circuits to the entry's own hex, so **an unshaded reference is
byte-identical to the literal it replaced by construction**, not by the precision
of the maths.

The retrofit fits a shade by searching over that same exported function rather
than its own copy of the arithmetic, so the drift it measures is the drift the
renderer will actually produce.

### Palette shapes

| site | before (REQ-114) | after |
|---|---|---|
| `xgd` | 6 entries + 10 steps | **7 entries**, 0 steps |
| `gigabytealchemy` | 8 entries + 22 steps | **15 entries**, 0 steps |

Seven colours a mix cannot reach were split into their own exact entries — four
of `gigabytealchemy`'s "blues" were never a ramp. `xgd`'s `#4aafc9` became
`primary-bright`: lighter *and* more saturated than `#2e86a3`, so not a shade of
it. Accepted deliberately (option (a) this session) rather than widening the
tolerance to 20/255 to keep the family nominally intact.

### AC5 — the before/after values-diff

Painted colours compared in **document order** at the load boundary (old code +
old data vs new code + new data). A sorted comparison re-pairs slots the moment a
value changes and invents swaps that never happened — the first measurement did
exactly that and reported a spurious Δ34.

| site | colour slots | slots changed | worst per-channel Δ |
|---|---|---|---|
| `xgd` | 210 → 210 | 82 | **Δ5** |
| `gigabytealchemy` | 91 → 91 | 33 | **Δ8** |

Slot counts identical, so no colour was added or lost. Every changed slot is a
ramp member re-expressed as a shade; the worst movement is Δ8/255, exactly the
bound §3 approved. Everything outside the bound is an exact literal in its own
entry.

### Re-runnability

`cmdColorsAssign` on either stored site is a **fixpoint** — byte-identical
`site.json` and `pages/*.json` on a second run. This needed a fix during
implementation: three fitted colours drifted across a family classification
boundary (e.g. `#f1f5f9` fell under the neutral chroma floor), so a second run
re-filed them and the palette grew. The derivation now **refuses a fit that would
change a colour's family**, which is what makes the retrofit stable.

Base selection also changed: the base is no longer the lightest member but **the
member that can actually reach the most others**, since a mix only removes chroma
and a low-chroma base can reach nothing.

`xgd`'s curated entry names are reproduced with
`--names slate=text,teal=primary,orange=accent,sand=surface,slate-2=surface-accent,teal-2=primary-bright`;
`gigabytealchemy`'s are all derived.

### Evidence

15 UATs in `tests/test_UAT_FC_REQ-137_palette_shade.test.ts` covering all six ACs
— entry shape, no stored step, the mix in both directions, chroma-only-decreases,
out-of-range rejection, shade/alpha independence, the per-entry usage tally,
derivation emitting no step, the unreachable-colour split, base selection, the
family-change refusal, the shared fit function, retrofitted sites within bound,
fixpoint, and no reference surviving resolution.

One follow-up commit hardened `test_UAT_FC_REQ-137_no_stored_site_carries_a_step`:
it enumerated `storage/sites/` raw and treated every dirent as a slug, so a
`.DS_Store` made it fail with `ENOTDIR` on any checkout Finder had visited. It now
filters to directories, and asserts the 22 stored entries were actually examined —
the claim is "nothing on disk violates this", which an empty store satisfies for
free.

Suites updated for the model change: `req114-palette-model`,
`reconciliation-colour-census-and-retrofit`, `reconciliation-colour-palette-overlay`,
`reconciliation-beyond-l1-authoring`, `test_UAT_FC_REQ-130_beyond_l1`.

`pnpm -r build` clean; `tools/generate` and `packages/site-schema` typecheck clean.

**Pre-existing, unrelated:** 71 tests across 10 AI tool-surface suites
(`test_UAT_FC_REQ-122/126/127/129/130`, `reconciliation-assistant-*`,
`reconciliation-page-composition-surface`) fail identically on a clean
`xgd-working` with no changes applied — `box.run(...)` returns an array where a
string is expected. Not touched by this ticket; flagged for the operator.

### Docs

[[DOC-23]] §5 updated: §5.4's "steps belong to a role" note now points at the new
**§5.6**, which records the entry/reference split, the Oklab rationale, the
chroma-only-decreases corollary, and the superseded [[REQ-114]] AC3 guarantee.

## Origin

Split from [[REQ-133]] §2 at the operator's request, this session. The step→shade model is the
operator's, taken after measuring that most stored steps sit on their base's tint/shade ramp and
the rest are unrelated colors.