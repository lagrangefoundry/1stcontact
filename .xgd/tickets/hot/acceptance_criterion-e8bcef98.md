---
uid: acceptance_criterion-e8bcef98
id: AC-1629
type: acceptance_criterion
title: A band's translucent scrim folds onto the section-background box alongside
  its background image
created_by: martin-github@westhead.me
created_at: '2026-09-10T14:22:29.795530+00:00'
updated_at: '2026-09-10T14:22:29.795530+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
A captured band's translucent **scrim** folds onto the same section-background box
that carries the band's background image, as a second axis of that one box — never
as a node of its own. A scrim is a colour with its **own alpha** (a hero veil such
as `bg-slate-950/30` composited over the photograph), which is a distinct thing
from element opacity: the box carries the veil's colour and its alpha together.

A section is folded when it paints a background image **or** a scrim, so a veil
over a solid band round-trips just as a veil over a photograph does. A band that
paints neither folds no box at all, and a plain band never gains a scrim it did
not have.

Each axis is read independently from the **widest sampled width that carries it**,
because a band may paint an image at some rungs and only a scrim at others; reading
both off one entry would drop whichever the widest sample happened to lack.

The fold is the only step that needed to change for this: the L1 envelope already
accepted a colour with alpha as a typed overlay axis and the renderer already
layered it above the background image within one box, so the axis was in place and
unreachable while the fold read only the image URL.

## Verification
Fold a capture whose hero band records both a background image and a scrim colour
carrying alpha. Assert one section-background box is emitted carrying both axes,
with the scrim's colour and opacity as captured (not flattened to an opaque fill,
and not confused with the element-opacity values the capture also records). Render
that document and assert the scrim paints as a translucent layer **above** the
image rather than replacing it. Then two negative controls: a section that records
a scrim and no image still folds a box carrying the scrim; a section that records
neither folds no box.
