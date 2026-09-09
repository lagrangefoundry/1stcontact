---
uid: acceptance_criterion-537a0011
id: AC-1617
type: acceptance_criterion
title: One deterministic reference cell is selected per width, preferring the primary
  engine at rest
created_by: martin-github@westhead.me
created_at: '2026-09-09T23:54:00.143965+00:00'
updated_at: '2026-09-09T23:54:00.143965+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-16f2793c
  kind: behavior
  regression_only: false
  uat_coverage: missing
---

## Criterion
The reference side of a size-aware diff is **one deterministic cell per width**. The
persisted ladder may hold several projections at the same width (more than one engine,
more than one interaction state), so the choice among them is fixed by an ordered
preference rather than left to iteration order:

1. the primary engine (Chromium) **at rest** — the capture's primary cell;
2. failing that, **any** engine at rest;
3. failing that, whatever projection exists at that width.

A width the ladder never reached selects nothing, which is what the fail-loud path of
AC-642 reports.

The same bundle and the same width therefore always select the same reference cell, so
repeated `--size` runs are byte-for-byte reproducible. A non-deterministic choice would
make size-aware diffs flaky in a way every other criterion on this story reports clean
— AC-639 asserts the reference comes from the ladder at the selected width, not *which*
cell at that width. The same selection feeds the cross-size responsive table, so the
two views agree about which cell represents a width.

## Verification
Build a bundle whose ladder holds, at one width, a Chromium-at-rest projection, a
WebKit-at-rest projection and a Chromium hover projection. Assert the selected
reference cell is the Chromium-at-rest one, and that selecting twice returns the same
cell. Remove the Chromium-at-rest projection and assert an at-rest projection of
another engine is chosen; remove every at-rest projection and assert the remaining
projection at that width is chosen. Assert a width absent from the ladder selects
nothing (feeding AC-642's fail-loud path). Assert two successive `--size` runs against
the same bundle produce identical reference values.
