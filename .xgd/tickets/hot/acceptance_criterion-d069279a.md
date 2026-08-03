---
uid: acceptance_criterion-d069279a
id: AC-765
type: acceptance_criterion
title: A document column plus a per-node anchor place x and width independently in
  closed form
created_by: xgd
created_at: '2026-08-03T01:34:28.882018+00:00'
updated_at: '2026-08-03T01:34:28.882018+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
A document may declare one shared **centred content column** — a container width,
a horizontal inset, and an optional cap on the content width inside it — and a
node may **anchor** its horizontal placement to that column instead of to its own
keyframes. The column is a closed-form rule (the origin is flat while the viewport
is narrower than the container, then rises at half the viewport's growth), so an
anchored node is placed correctly at *every* viewport width, including widths
between the sampled ones and above the widest.

The two horizontal axes are **independent**: a node may anchor its left edge to
the column while its width stays keyframed, or the reverse. Alignment is a shared
property and width is a private one; coupling them leaves a node whose width
happens to match the column following the column while its flush neighbours drift,
which is worse than not anchoring at all. Each axis is present only when it is
declared, and an axis that is anchored is placed *only* by the column — its
keyframes remain in the document as the record of what the rule evaluates to at
the sampled widths, and are not also emitted, so the two models can never fight.

Two further shapes are expressible:
- a **capped term** (`min(cap, constant + share of the column)`) — what a run with
  its own narrower maximum inside the column looks like;
- an **in-column offset track** — the constant may itself be a per-width track, so
  a node whose layout mode changes across the ladder (a grid that stacks, a
  narrower gutter at mobile) keeps the closed-form column origin and keyframes
  only the small offset inside it.

A node that spans the full viewport is never anchored: its left edge is zero
absolutely, and expressing that as the column origin plus its negation and
interpolating the residual walks the node off-screen between the samples.

An anchor on a document that declares no column is rejected outright, rather than
silently falling back to keyframes that merely look plausible.

## Verification
Render a document declaring a column and nodes anchored by left edge only, by
width only, and by both; measure the rendered left edge and width at the sampled
widths, at widths between them, and above the widest, and observe each matches the
column rule at every one. Render a node whose width is capped and observe the cap
takes over where the column extent exceeds it; render a node whose offset is
tracked and observe it follows the column while its inside-the-column offset
changes at the declared widths. Render a full-viewport-width band and observe it
is not anchored. Render a document with no column and observe its nodes keep their
keyframes untouched. Submit an anchor with no column declared and observe
rejection.
