---
uid: acceptance_criterion-f4433020
id: AC-726
type: acceptance_criterion
title: Malformed structured axes are rejected by the envelope
created_by: xgd
created_at: '2026-07-29T03:50:06.355848+00:00'
updated_at: '2026-08-09T05:40:38.030126+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A document whose structured effect axes leave the safety envelope is rejected by
validation, with the offending field located in the returned error list.

**The envelope bounds the shared surface group once, wherever it is carried.**
Because every box-rendering kind carries the identical surface group, the same
bounds apply to it on every kind rather than on whichever kinds were checked by
hand: a background-image URL is scheme-checked on a container, a text run, a
slot or a control exactly as on a box, and a left-accent border's width is
bounded exactly as the uniform border's is. A value cannot escape the envelope by
being declared on a kind nobody remembered to check.

Rejected specifically: a gradient stop colour or a border colour that is not a
hex literal; a background-image URL whose scheme is not http(s) or relative
(`javascript:`, `data:`, `vbscript:`, `file:` are all refused), on any kind that
carries one; a shadow whose offset, blur or spread falls outside the
effect-length bounds (±10000px); a uniform-border width, a left-accent-border
width, a backdrop blur, a mask feather, or a transform rotation outside the same
bounds; a corner radius outside the length bounds; a transform scale outside
0.01–100; and any unknown/extra key on a structured form — a gradient, gradient
stop, shadow, border, mask, transform or scrim object carrying a freeform key is
refused rather than having the key silently ignored, so no raw-CSS escape hatch
can be smuggled in beside a typed field. A gradient declaring fewer than two
stops is likewise refused.

The equivalent in-range, hex-coloured, allowlisted-URL document is accepted, so
the boundary is the value's range and scheme rather than the presence of the
axis — or the kind that declares it.

## Verification
Submit documents each violating one of the rules above — a non-hex gradient stop,
a non-hex border colour, a `javascript:` background-image URL, an out-of-range
shadow offset/blur/spread, an out-of-range left-accent-border width, an
out-of-range transform scale, a single-stop gradient, and a structured form
carrying an extra key — and observe a "not ok" result naming the offending path
for each. Repeat the URL and border-width violations with the offending axis
declared on each box-rendering kind in turn (container, text, image, slot,
control) and observe every kind rejected identically. Submit the corresponding
well-formed document exercising every structured family at once and observe
acceptance.