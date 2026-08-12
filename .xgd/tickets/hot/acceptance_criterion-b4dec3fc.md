---
uid: acceptance_criterion-b4dec3fc
id: AC-1124
type: acceptance_criterion
title: A picture declares which part of itself its box shows
created_by: xgd
created_at: '2026-08-12T21:11:32.431804+00:00'
updated_at: '2026-08-12T21:23:01.401331+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
An `image` leaf may declare **which part of the picture its box shows** — the pan
half of a crop. With the media set to fill its box, the box is a window onto a
larger picture, and this axis is where that window looks. The published page
shows it as an `object-position` percentage pair re-derived from the declared
numbers.

The axis is **a pair or nothing**. Both components are required together, and a
document declaring one alone is refused. This is not pedantry: an unspecified
component silently becomes a centred 50% in the browser, so a half-written
position is not "unset on one axis" — it is a load-bearing value the document
never said. Making the pair the unit means the framing is either fully stated or
absent.

**An absent axis means the browser's own centre, not a recorded default.** A
picture that declares no framing emits no `object-position` declaration at all,
rather than emitting the centre it would have painted anyway. Returning a framed
picture to the centre therefore removes the axis rather than writing the default
into the definition, so a definition never grows by recording what the browser
does unasked.

Each component is bounded to 0–100, and an out-of-range component is refused
with the offending field located in the returned error list.

The axis is **carried by the `image` leaf alone**. Declaring it on any other
box-rendering kind is refused as an unknown key.

## Verification
Render an image leaf declaring a framing pair and assert the emitted CSS carries
the matching `object-position` percentage pair beside the fill mode. Render the
same leaf with no framing axis and assert no `object-position` declaration is
emitted. Submit a document declaring only one component of the pair and observe
rejection; submit a component outside 0–100 and observe rejection naming that
field. Submit the axis on a `box` or `container` and observe rejection as an
unknown key.