---
uid: story-244827df
id: STORY-87
type: story
title: 'A capture records the page as painted: real web fonts, who paints each surface,
  per-run geometry, control behaviour and a viewport-height probe'
created_by: xgd
created_at: '2026-08-03T00:23:22.764226+00:00'
updated_at: '2026-08-03T00:53:37.996169+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-4ff83a8b
  capability_uid: capability-d9d373d6
  story_kind: feature
  story_points: 3
---

## Story

**As a** site-reproduction operator, **I want** a capture of a live page to record
the page exactly as it was painted — the real web fonts, which box paints each
surface, where every individual line of text sits, the behavioural facts of its
form controls, and evidence of viewport-height response — **so that** a faithful
reproduction can be built and graded from the captured bundle alone, without
re-visiting the live site and without any downstream stage having to guess at a
fact the capture failed to observe.

## Description

A capture is the single source of truth for everything downstream: the fold that
builds a reproduction, the value comparison that scores it, and the acceptance
gate that grades it are all readers of one recorded value set. A fact the capture
does not record cannot be reproduced, compared or graded by any of them — it is
lost, silently, at the source.

In scope — what a capture must record:

- **Fonts as painted.** The face files a page actually paints with, including
  families served by a cross-origin stylesheet; each run's full declared
  font-family stack (not just its leading name); and measurement taken only after
  the real faces have loaded, including faces first needed by content revealed
  below the fold. Re-extracting a written bundle offline must reach the same font
  facts from the bundle's own mirrored bytes.
- **Who paints what.** Surface fill, surface gradient and left accent rules
  attributed to the boxes that geometrically contain a run — not to its DOM
  ancestors — together with the surface-bearing box's own rect, radius, shadow
  and border, whether the run's own element paints it, the rect of the element
  bearing an accent rule, every section's own rect, and a translucent scrim
  blanketing a section (in any colour syntax a browser accepts, alpha preserved).
- **Per-run geometry.** Where a single element's text wraps into several runs,
  each run's own box and glyph extent — not the shared parent box.
- **Behavioural facts no painted axis can hold.** A captured control's authored
  control type and its enclosing form's submission endpoint.
- **Viewport-height evidence.** A probe projection re-shooting one ladder width
  at a second viewport height, so a viewport-relative height is a measurable
  finite difference rather than an unfittable guess.

Out of scope: what any consumer does with these facts — the fold's surface
reconstruction and responsive fitting (STORY-84), the value comparison's reading
of them (STORY-75), the acceptance gate (STORY-86), and the L1 axes that express
them (STORY-83). This story is the recording contract only.

## Technical Context

- Downstream consumers: the capture-to-L1 fold (CAP-71), values-diff (CAP-63) and
  the 3-probe reproduction gate (CAP-73) all read this value set. The same facts
  are load-bearing for all three, which is why they are stated once here rather
  than duplicated as capture clauses in each consumer's story.
- The height probe is deliberately NOT part of the responsive width ladder: the
  ladder defines keyframes, screenshots and comparison cells, and a duplicate
  width would perturb all three. Consumers key a projection on
  (engine, width, state); the probe is a projection whose key is already claimed.
  The partition rule that keeps a probe out of a ladder cell is stated by its
  consumers (STORY-75, STORY-86); this story owns only the fact that the probe
  is shot and persisted.
- Colours are resolved through a browser colour probe, so any syntax the engine
  accepts (color-mix / oklab / oklch / color()) resolves rather than being
  silently dropped. **Known bounded divergence from intent** (recorded in the
  intent, BUG-24): Chromium serializes `color-mix(in oklab, …)` in a wide-gamut
  form the exact parser does not read, so that one path falls back to a pixel
  read-back and lands within one level per channel of the authored colour
  (e.g. `#030717` for an authored `#020618`). The intent accepts this residual
  because it is self-cancelling across both sides of a comparison; the ACs below
  assert a scrim is recorded with its alpha, not that its channels are exact.
- **Known gap, deliberately out of scope** (intent, BUG-22): offline
  re-extraction bakes the ephemeral loopback origin into section background
  image handles, so its output can be used to verify a bundle but cannot be
  promoted into one.
- A bundle captured before these fields existed simply lacks them; consumers
  treat an absent field as no information rather than as a value. This is data
  compatibility, not a legacy code path.
- Process note from the intent (BUG-16): the font load-check precision change
  reached the branch inside a concurrent free-coded commit rather than its own;
  the behaviour is present and correct on the branch.

## Dependencies

None.

## Story Points

3