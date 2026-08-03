---
uid: acceptance_criterion-55408400
id: AC-771
type: acceptance_criterion
title: A centred column is fitted from the modal content edge and emitted only if
  it reproduces every sampled width
created_by: xgd
created_at: '2026-08-03T02:08:38.594012+00:00'
updated_at: '2026-08-03T02:08:38.594012+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
A page laid out in a centred column (`mx-auto max-w-*` plus horizontal padding) is
flat while the viewport is narrower than its container and then rises at half rate.
Interpolating straight across that knee put a left margin at 55.5px where the
reference held 24px, and holding the last keyframe froze it where the reference kept
growing. The fold recovers the rule instead, from where content actually sits:

- the column origin at each sampled width is the **modal** left edge of the content
  laid out in it — not the minimum. A real page has more than one gutter (a header
  set wider than its content), and the extreme edge is whichever happens to be
  widest, not the column the page is laid out in; taking the minimum makes the fit
  fail outright. Full-viewport-width content is excluded, since it says nothing
  about the column;
- the column is the constants — container width, inset, and where the content has
  stopped growing a maximum width — that reproduce every sampled origin and extent;
- the fit needs at least three sampled widths, at least one of which shows the
  origin risen above the inset, and is **rejected outright** unless it reproduces
  every sampled origin and extent to within a pixel. A page with no centred column
  keeps its keyframes untouched;
- the column is declared on the document only when at least one node actually
  anchors to it, so an unfitted page carries no dead constant.

Once fitted, the reproduction's content origin matches the reference's rule at
widths between the samples and above the top of the ladder, not only at the sampled
widths themselves.

## Verification
Fold a capture of a page laid out in a centred column with a nested narrower
maximum; assert the recovered container, inset and maximum match the authored rule,
and that the rendered content origin equals the reference rule at widths below,
between, and above the sampled ladder. Fold a capture with no centred column and
assert no column is declared and every node keeps its keyframes. Fold a capture
whose origins cannot be reproduced by any single column and assert nothing is
emitted.