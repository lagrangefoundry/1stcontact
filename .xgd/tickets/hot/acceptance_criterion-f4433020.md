---
uid: acceptance_criterion-f4433020
id: AC-726
type: acceptance_criterion
title: Malformed structured axes are rejected by the envelope
created_by: xgd
created_at: '2026-07-29T03:50:06.355848+00:00'
updated_at: '2026-08-03T01:32:23.933078+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
A document whose structured effect axes leave the safety envelope is rejected by
validation, with the offending field located in the returned error list.
Rejected specifically: a gradient stop colour or a border colour that is not a
hex literal; a box background-image URL whose scheme is not http(s) or relative
(`javascript:`, `data:`, `vbscript:`, `file:` are all refused); a shadow whose
offset, blur or spread falls outside the effect-length bounds (±10000px), a mask
feather or border width outside the same bounds, or a transform rotation outside
them; a transform scale outside 0.01–100; and any unknown/extra key on a
structured form — a gradient, gradient stop, shadow, border, mask, transform,
scrim or padding object carrying a freeform key is refused rather than having the
key silently ignored, so no raw-CSS escape hatch can be smuggled in beside a
typed field. A gradient declaring fewer than two stops is likewise refused.

A **text leaf's self-painted chip surface** is bounded exactly as the equivalent
box axes are, and by the same rules: its shadow offsets/blur/spread and its
border width take the effect-length bounds, its corner radius takes the length
range, its fill and border colour must be hex literals, and an unknown key on any
of them is refused. A run cannot paint a surface the substrate would refuse on a
box.

The equivalent in-range, hex-coloured, allowlisted-URL document is accepted, so
the boundary is the value's range and scheme rather than the presence of the
axis.

## Verification
Submit documents each violating one of the rules above — a non-hex gradient stop,
a non-hex border colour, a `javascript:` background-image URL, an out-of-range
shadow offset/blur/spread, an out-of-range transform scale, a single-stop
gradient, an unclamped chip radius or chip shadow on a text leaf, and a
structured form carrying an extra key — and observe a "not ok" result naming the
offending path for each. Submit the corresponding well-formed document exercising
every structured family at once and observe acceptance.
