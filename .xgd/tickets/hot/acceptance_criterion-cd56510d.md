---
uid: acceptance_criterion-cd56510d
id: AC-2527
type: acceptance_criterion
title: Renditions are stored through the store port identically on every store; the
  measured-dimension manifest feeds the render and is never stored in the document
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T06:20:52.516275+00:00'
updated_at: '2026-11-09T06:20:52.516275+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
---

## Criterion

A publish hands its renditions to storage through the store port, beside the
revision's rendered output, and the cloud, filesystem and in-memory stores each
hold the same renditions at the same paths for the same publish. A revision
written with renditions reads them back; a revision written without any reads
back none.

The publish also measures each laddered picture's intrinsic width and height and
passes them, with its list of renditions, to the render of that same revision
only. That manifest is not stored in the site definition, the page definitions
or the picture's own record: the document stays the same whether or not a
ladder was built.

## Verification

Run the same publish, with the same fake renderer, against the cloud, filesystem
and in-memory stores. Assert each holds identical rendition paths and bytes for
the revision. Assert the stored site definition is byte-identical with and
without a ladder. Assert the render received each picture's measured dimensions
and only renditions the revision actually holds.
