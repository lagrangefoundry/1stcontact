---
uid: bug-378e5ec0
id: BUG-190
type: bug
title: 'values-diff: pseudo-glyph runs measured by host box vs glyph advance, own-vs-ancestor
  fill compared one way, aggregate mislabelled'
created_by: repro-console:repro-joyfulculinarycreations-com#7
created_at: '2026-10-03T19:42:43.950023+00:00'
updated_at: '2026-10-03T23:29:52.013181+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  defect_class:
  - instrument-asymmetric
  - instrument-no-axis
  - instrument-blind
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-386c6971
---

# values-diff: a pseudo-glyph run is measured by its host box on one side and its glyph advance on the other, own-vs-ancestor fill is compared one way only, and a "filter ×17" aggregate is 16 pseudo rows

Filed by `repro-console:repro-joyfulculinarycreations-com#7`. Bundle
`storage/references/joyfulculinarycreations.com/index` (`captureSchema 14`), artifacts
`storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-7/diff/`. Evidence from this one
bundle. Companion gap ticket: REQ-372.

`defect_class`: **`instrument-asymmetric`**, `instrument-no-axis`, `instrument-blind`.

**31 of this round's 56 deltas** (12 `renderedTextBox` + 2 `position` + 16 `pseudo` + 1 aggregate)
describe no pixel difference. Meanwhile the round's second-largest pixel defect (REQ-372 issue 1,
19.05% of ranked score) has **0** deltas. These deltas are new since iteration 5 (23 → 56). They arrived
with REQ-366's capture fix (`d20a12c157`, `CAPTURE_SCHEMA 12 → 13`), which began recording `::before`
glyphs. So they are the ruler meeting a new population, not the reproduction getting worse.

## Item 1 — a pseudo-glyph run is measured by two different procedures · `instrument-asymmetric`

*Defended:* the reference side's `renderedTextBox` is the host element's box, and ours is the glyph's
text range. The two numbers measure different things, so they disagree even where the ink is identical.

- d20a12c157's commit message: "the capture records an empty element's ::before/::after quoted-string
  glyph as a run (pseudoGlyph, **the pseudo's typography, the element's box**)". In
  `expected-manifest.json` every one of the 16 glyph records has `renderedTextBox == box` (e.g. the
  check icon `U+F00C`: both `{x:386.66,y:1417.89,width:22.5,height:18}` = the `i`'s `width:1.25em`).
- The reproduction renders the glyph as a real text node, so its `renderedTextBox` is the glyph advance:
  same check icon `{x:386.66,width:18}`.
- Pixels: check-icon ink is x 387–403 (reference) vs 387–404 (ours). It is the same glyph in the same
  place, yet values-diff reports `renderedTextBox  text 23×18 → text 18×18` **HIGH ×5**.
- The same mechanism produces the other 7 HIGH `renderedTextBox` rows (40×40 → 50/30/45/45/39 and
  16×16 → 12/14) and both CRITICAL `position` rows:
  `"" text @ (518, 3747) → text @ (523, 3747)` is `U+F46D`, whose ink is 523–552 vs 523–553 (**identical**).
  The ref x is the 1em box edge and ours is the centred glyph's edge.
- **It points the wrong way.** The glyph that *is* displaced (`U+F109`: ref ink 250–299, ours 255–304,
  REQ-372 issue 2) reads position-clean, because both sides report x 255.
- `pseudo  before → none` **MEDIUM ×16**: the reproduction draws the glyph as text by design. The axis
  compares the mechanism and not the appearance, so it can never close.

**Proposed change:** for a reference element with `pseudoGlyph` set, compare `renderedTextBox` against
the actual run's **box** (host box against host box), or record the pseudo's own glyph rect on the
reference side (`getBoundingClientRect` cannot reach a pseudo, but a Range over the generated content
cannot either; measure the host's box minus its content-box padding, or read the pseudo's
`width`/`left` from computed style). Skip the `pseudo` axis when the actual side renders the same glyph
codepoint as a text run.

*This will remove deltas.* None of them measure anything, and it frees the position axis to see
REQ-372 issue 2.

**See:** (the glyph runs' `text` is a single private-use codepoint, which the digest prints as `""`)
```
jq -c '[.deltas[] | select(.text|test("^[\\x{e000}-\\x{f8ff}]$")) | .property] | group_by(.) | map([.[0],length])' \
  storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-7/diff/values-diff.json
```
→ **now** `[["a11yRole",2],["position",2],["pseudo",16],["renderedTextBox",12]]`. **Fixed:** at most the 2
`a11yRole` rows remain (real, owned by REQ-332's carousel item).

## Item 2 — own-vs-ancestor fill is compared in one direction only · `instrument-no-axis`

*Defended:* the reproduction paints an opaque plate the reference does not, both manifests carry the
same `surfaceFill`, and the only field that differs (`surface.self`) is never compared in that direction.

`values-diff.ts:2835`:
```
const surface = exp.surface?.self === true && act.surface && !act.surface.self ? act.surface : null
```
This handles BUG-22's split control (reference self-painting, reproduction split into label + backing
box). The reverse (**reference `self:false` over a band, reproduction `self:true` on the run**) falls
through to the own-axis comparison, where both sides read `surfaceFill "#000000"`. On this bundle that
is the five header nav links. Ref `surface {self:false, box:{0,0,1280,800}}`, ours
`surface {self:true, box:{642.19,70,142.19,46}}`, and the reproduction paints `(0,0,0)` where the
reference shows `(77,78,79)` (`regions.json` #2, score 6883.91 = 19.05% of the ranked score).
**0 deltas.**

**Proposed change:** when `exp.surface.self === false` and `act.surface.self === true` and the actual
surface box is materially smaller than the expected one, emit a `surface` delta (e.g.
`surface band 1280×800 → own plate 142×46`). The reproduction has invented a surface. *This will add
5 deltas on this bundle*, and they are real until REQ-372 issue 1 lands.

**See:** `jq -c '.elements[] | select(.text=="Meet the Chef" and .box.y<200) | .surface' storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-7/diff/{expected,actual}-manifest.json`
→ `self:false` vs `self:true`. `jq '[.deltas[] | select(.text=="Meet the Chef")] | length' …/values-diff.json`
→ **now** `0`. **Fixed:** ≥1 until the fold is fixed, then 0.

## Item 3 — the systemic aggregate names a property that is 1 of its 17 rows · `instrument-blind`

*Defended:* the headline reports a filter drift that does not exist. Exactly one element carries a
`filter` in either manifest (`brightness(0.67) contrast(0.88) saturate(1.06)…` on the hero backdrop).

`values-diff.ts:4065-4091` groups sub-threshold deltas **by `kind`** and labels the synthetic row with
`sample.property` / `sample.expected → sample.actual` of the first member. `kind: "treatment"` holds 16
`pseudo` rows plus 1 `filter` row, and the first is the filter. So the digest's 6th-ranked line, escalated
to **HIGH**, is `filter on ⟨17 elements⟩ — systemic treatment drift ×17 / e.g. present → none`.

**Proposed change:** group by `property` (or label the row with the set of properties it holds and
their counts, e.g. `pseudo ×16, filter ×1`).

**See:** `jq -c '.deltas[] | select(.systemic) | [.property,.expected,.actual]' …/values-diff.json`
→ **now** `["filter","systemic treatment drift ×17","e.g. present → none"]`. **Fixed:** the label
names `pseudo`, or two rows.