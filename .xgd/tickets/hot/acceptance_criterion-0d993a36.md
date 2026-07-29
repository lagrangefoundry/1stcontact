---
uid: acceptance_criterion-0d993a36
id: AC-733
type: acceptance_criterion
title: 'No captured element is silently dropped: an unexpressed element becomes a
  typed residual, and a form control always does'
created_by: xgd
created_at: '2026-07-29T04:05:44.833337+00:00'
updated_at: '2026-07-29T04:05:44.833337+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
When a caller asks the fold for its residuals, every captured element the fold
cannot express as an L1 leaf is reported as a typed residual naming its object kind
(media, field, surface or text), the reason it has no leaf, the painted pixel-mover
axes it carried, and the sampled widths it appeared at. This covers a media element
with no resolvable source or no geometry, a text run with no box at any sampled
width, an empty-string run, and a text-free element that is neither media, a painted
surface, nor a known control.

A form control is always routed to a residual — it belongs to a behavior module and
is never synthesized into a raw L1 leaf — even when it paints a surface the language
could otherwise express.

An element the fold *can* express produces no residual. A caller that does not ask
for residuals receives the same reproduction document, with no residual channel.

## Verification
Fold a capture containing a source-less image, a geometry-less run, an empty run, a
form control and an unclassifiable text-free element with a residual collector;
assert one typed residual per element with its kind, reason, captured axes and
widths, and that no leaf was emitted for the control. Fold a capture of fully
expressible elements and assert the residual list is empty. Fold without a collector
and assert the document is unchanged.
