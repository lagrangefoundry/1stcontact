---
uid: acceptance_criterion-76ca3389
id: AC-833
type: acceptance_criterion
title: A row lays out as a stack below an authored breakpoint, as one subtree
created_by: xgd
created_at: '2026-08-06T02:36:44.974312+00:00'
updated_at: '2026-08-09T05:41:05.409833+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-3569e1a4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A container declares a **per-width layout track** — an ascending list of `{ at, value }`
breakpoints over the closed set of layout modes — and the published page flows its
children differently at different viewport widths from a **single subtree**.

- The **first keyframe is the base**, in force *below* its own `at`; each later keyframe
  takes over from its `at` upward, `min-width` semantics, inclusive. A track of
  `stack@0 → row@768` publishes a stylesheet whose base rule flows the container as a
  column and whose 768px block flows it as a row.
- The container's static `layout` remains the representative **widest** value, so a
  consumer that does not resolve per width still reads the mode the page renders at its
  widest.
- **`at` is an authored breakpoint, not a captured sample.** Unlike a geometry, scalar or
  padding track — which keyframe at the document's captured widths because they are
  sampled and interpolated between samples — a layout breakpoint may sit at a width the
  document never captured, and is accepted there.
- There is **one** subtree: each child's content appears exactly once in the emitted
  markup at every width. This is what the axis replaces — the duplicate-subtree
  workaround under paired visibility thresholds put both copies in the DOM.

## Verification
Publish a page containing one container that declares `stack@0 → row@768` with two text
children. Observe in the emitted stylesheet that the base rule flows it as a column and
that the 768px breakpoint block flows it as a row; observe in the emitted markup that
each child's text appears exactly once. Repeat with a breakpoint at a width absent from
the document's declared widths and observe it is accepted and emitted. Observe that the
page's own layout report agrees at both widths — children sharing an x and differing in y
below the breakpoint, differing in x and sharing a y above it.