---
uid: acceptance_criterion-51c333aa
id: AC-1144
type: acceptance_criterion
title: A reference carries a continuous shade on [-1, +1], mixing the entry toward
  black or white in Oklab
created_by: xgd
created_at: '2026-08-16T22:15:38.010665+00:00'
updated_at: '2026-09-10T12:00:15.660732+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
---

## Criterion

A colour reference may carry a **continuous** `shade` on `[-1, +1]`, placing that use
somewhere in the entry's generated light↔dark family without the family ever being
stored:

- **Negative mixes the entry toward black, positive toward white**, in Oklab. `-1` is
  pure black and `+1` pure white; in between the colour moves monotonically — it
  never doubles back — and evenly, because Oklab is built so equal numeric steps read
  as equal perceptual steps. That is what makes a slider over the axis linear in what
  the operator's eye sees, which a straight sRGB mix (bunching the change at the dark
  end) or an HSL lightness (distorting hue-dependently) would not be.
- **`0` or absent resolves to the entry's own hex, verbatim** — short-circuited, not a
  round trip through the colour maths that happens to come back. An unshaded
  reference is therefore byte-identical to the literal it replaced by construction
  rather than by the precision of the arithmetic.
- **A shade outside the range is a validation failure, not a clamp.** The document is
  rejected; a clamp would silently paint a colour nobody asked for, which is the
  render-time fallback this model does not have. Every value on the range inclusive,
  including both endpoints, validates.

`shade` rides on the reference rather than on the entry for the same reason `alpha`
does, and the two compose in either combination. That claim and its verification
belong to AC-930, whose headline is precisely that both variation axes are axes of
the *reference*; this criterion owns the shade axis itself — its continuity, its
Oklab mixing, its verbatim zero, and its endpoint validation — and does not restate
the composition rule.

## Verification

Against a palette declaring one entry, resolve a reference with no shade and one with
shade `0` and confirm both give the entry's hex exactly. Resolve at `+1` and `-1` and
confirm pure white and pure black. Sample the whole axis in fine steps and confirm
lightness never decreases as the shade rises, and strictly increases over steps the
eye can distinguish, so a mix that folded back on itself somewhere in the middle
could not pass. Validate documents carrying shades just outside each end and well
outside, and confirm each is rejected while the endpoints and interior values are
accepted. Composition with `alpha` is verified once, under AC-930.
