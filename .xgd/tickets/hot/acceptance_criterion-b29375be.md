---
uid: acceptance_criterion-b29375be
id: AC-752
type: acceptance_criterion
title: A section band tiles full-bleed between captured section edges, never crossing
  the band above it
created_by: xgd
created_at: '2026-08-03T00:58:05.914242+00:00'
updated_at: '2026-08-03T00:58:05.914242+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
Section bands are bounded by the page's own captured section edges, not by where
their text happens to sit.

- **Top.** A band's top snaps *up* from its first run to the section edge that opens
  it — the greatest captured edge at or below that run and at or above the previous
  band's content. Taking the smallest qualifying edge instead would let a band climb
  over every section between the two (the footer painting the whole contact section
  navy), so the snap may never cross into the band above's content; with no
  qualifying edge the run-derived top stands.
- **Bottom.** A band tiles down to the next band's top, clamped to the first captured
  section edge at or after its own content, so a section opening with padding is not
  swallowed by the band above it. A band still tiles past its own content while it
  stays within its own section. The last band gets a fixed visible tail.

## Verification
Fold a capture whose section boxes open above their first run and whose next section
opens with padding; assert the band's top equals the opening section edge (not the
first run's top), that the top snap does not cross the previous band's content when
an earlier edge also qualifies, that the bottom stops at the captured section edge
rather than the next band's first run, and that a band still tiles past its own
content inside its own section. Assert each band keyframe is full-bleed (x=0,
width=viewport) at every sampled width.
