---
uid: acceptance_criterion-3127e56f
id: AC-944
type: acceptance_criterion
title: 'A completed retrofit moves no colour outside a measured 8/255 bound: unshaded
  references are byte-exact, and the accepted drift is reported'
created_by: xgd
created_at: '2026-08-06T21:08:08.703116+00:00'
updated_at: '2026-08-16T22:25:20.771742+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-5e7eb0c5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Converting a site from colour literals to palette references moves no colour
outside a stated, measured bound, and reports every colour it moved at all:

- every reference carrying **no shade** resolves back to **exactly** the literal
  it replaced, byte for byte;
- every reference carrying a **shade** resolves back within **8/255 on every
  channel** of the literal it replaced — a bound measured from where the two
  populations of stored colours separate (fitting the previously stored ramps
  puts them at 0–8 and the rest at 15 and above, with nothing in between), and
  under what a viewer can distinguish on a flat fill;
- opacity is held to byte-identity in every case: it rides the reference
  untouched, so any difference there is a defect rather than an accepted
  approximation;
- the write is gated on both, checked against the palette about to be written
  rather than against the derivation's intent, and aborts before touching disk if
  anything exceeds the bound;
- the drift that *is* accepted is reported rather than swallowed: the command
  names each colour re-expressed as a shade, the entry and shade it now uses,
  the colour that resolves to, and how far off it is, worst first. A conversion
  in which every reference is exact reports no drift.

This supersedes the earlier pixel-identity guarantee, deliberately: a named step
stored a member's exact hex, while a shade computes it. The measured outcome on
the two stored sites is the evidence — the number of painted colour slots is
unchanged (210 and 91, compared in document order, so no colour was added or
lost), and the worst per-channel movement is Δ5 and Δ8 respectively.

## Verification

Retrofit a stored site and, for every reference in the converted definition,
resolve it against the written palette and compare with the literal that occupied
that position before the conversion: assert exact equality wherever the reference
carries no shade, a per-channel difference no greater than 8 wherever it does,
and exact equality of opacity throughout. Compare the painted colours before and
after in document order and assert the number of slots is unchanged. Assert the
command's report lists exactly those colours whose resolution is not exact, worst
first. Drive the conversion with a colour the shade axis cannot reproduce within
the bound and assert nothing is written.
