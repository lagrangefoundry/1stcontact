---
uid: acceptance_criterion-fd72d9d4
id: AC-737
type: acceptance_criterion
title: Gate report carries fold residuals as a channel distinct from probe residuals
  and unmatched entries
created_by: xgd
created_at: '2026-07-29T04:20:20.495518+00:00'
updated_at: '2026-08-09T08:20:04.809658+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The combined gate's report carries the fold's residuals — the captured elements the
folder cannot yet express as an L1 leaf — as a **channel of their own**, separate from
the sample-fidelity probe's residuals and its unmatched entries.

- Running the gate on a capture bundle returns the three probe reports, the promoted
  regions, **and** a distinct fold-residual list; a folder-power gap appears in that
  list and never as a fidelity residual or an unmatched entry.
- Each fold residual identifies what could not be expressed and why (its kind, the
  reason, and the captured axes that were carried), so it is actionable as a framework
  gap rather than an anonymous count.
- The channel reports only what the folder genuinely cannot express. An element the
  framework has since learned to express leaves the channel rather than lingering in it:
  a captured form control binds to its behavior module (REQ-96) and is therefore no
  longer a fold residual.
- The gate's human-readable output reports the fold-residual count on its own line,
  labelled as folder-power gaps and itemised, alongside — not merged into — the
  per-probe residual and unmatched counts.
- Fold residuals do not by themselves fail the gate: the verdict remains the conjunction
  of the three probes, so a reproduction can pass while still reporting known
  folder-power gaps.

## Verification
Run the gate against a retained capture bundle containing elements the fold cannot yet
express (text-free media never boxed at any sampled width, geometry-less runs) and assert
the returned report exposes a non-empty fold-residual list whose entries each carry a kind
and a reason, while those same elements produce no fidelity residuals and no unmatched
entries. Assert a captured form control in that same bundle is absent from the channel:
since REQ-96 it binds to its behavior module through a `control` seam, so it is no longer
a folder-power gap and must not be reported as one. Assert
the human-readable output states the fold-residual count separately from the
sample-fidelity residual and unmatched counts and itemises the residuals. Assert a gate
whose three probes all pass still reports its fold residuals and still passes.