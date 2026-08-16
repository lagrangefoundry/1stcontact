---
uid: acceptance_criterion-09f7e071
id: AC-1135
type: acceptance_criterion
title: A picture's framing, shape, colour adjustment and rotation paint identically
  in the edit channel and the shipped channel, because one emitter reads one document
created_by: xgd
created_at: '2026-08-12T22:01:18.986755+00:00'
updated_at: '2026-08-16T04:18:05.291316+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-af36c2cb
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

What an operator sees while adjusting a picture is what the page will show. One
definition rendered through the edit channel and through a shipped channel paints
that picture identically: the same fill mode and the same centring, the same
single colour-adjustment declaration with its functions in the same order, the
same clipped outline for a generated shape, and the same rotation. Nothing about
how a node's own typed axes paint differs between the channel an operator edits
in and the channel a visitor receives.

This holds because the two are one renderer reading one document, rather than two
renderings kept in step — and the criterion asserts it rather than assuming it,
because an editing surface that painted its own preview would be free to drift
from the page the moment it was introduced.

**What differs between the channels by design, and is therefore excluded from
this claim**: the edit channel deliberately does not work, so it emits no
behaviour or motion code, and with it neither a pointer-driven accent decoration
(whose script the channel does not ship, leaving an overlay that would sit at its
resting value forever) nor an untriggered reveal (whose pre-state would render
copy invisible, contradicting the settled-state rule this channel exists to
provide). Those are absences of motion, declared elsewhere in this story. They are
not licence for a picture's framing, shape, colour adjustment or rotation to paint
differently in the two channels.

## Verification

Through the ordinary editing path, give one picture a fill mode, an off-centre
pan, a reduced saturation, a rotation and a generated (seeded) shape. Render that
definition through the edit channel and through a shipped channel, and compare
the framing, shape, colour-adjustment and transform declarations the picture
receives in each: assert they are equal.

Assert the comparison is not vacuous by checking the adjustment is genuinely
present in the rendered output — the off-centre pan and the reduced saturation
both appear — since two empty sets would otherwise compare equal and the
criterion would pass while proving nothing.