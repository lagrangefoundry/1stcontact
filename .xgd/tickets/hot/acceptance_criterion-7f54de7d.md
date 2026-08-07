---
uid: acceptance_criterion-7f54de7d
id: AC-853
type: acceptance_criterion
title: A perceptual breach fails the run regardless of the value gates, and the floor
  it was held to is echoed into the report
created_by: xgd
created_at: '2026-08-06T03:12:47.195006+00:00'
updated_at: '2026-08-07T23:54:12.116883+00:00'
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
The cross-gate verb applies a **perceptual floor** with two bounds — a mean difference
and a percent of pixels over threshold. Exceeding **either** bound is a breach, and a
breach fails the run no matter what the other gates say: a reproduction whose geometry
gate passes cleanly and whose value eye reports few or no deltas still fails when the
perceptual eye reads over the floor. The pre-floor arrangement let a page that had not
reproduced at all pass on a clean geometry gate.

The floor is never implicit. The report carries the exact bounds the run was held to,
and the human-readable output states them on their own line alongside whether the run
sat within or over them. Each bound is overridable per run (`--mean-floor`,
`--pct-floor`); a non-numeric override is refused with a message naming the flag.

The defaults are provisional and deliberately generous — set so that a reproduction an
operator accepts sits well within them and a page that did not reproduce sits well over,
with the range between left unclassified rather than wrongly passed.

## Verification
Reconcile a run whose geometry gate passes and whose value eye reports zero deltas but
whose perceptual mean is over the floor, and assert the run does not pass. Repeat with
the mean within the floor but the percent-over-threshold above it, and assert it still
does not pass. Assert the report and the formatted output both state the bounds in
force, and that tightening the floor for a run turns a previously passing reproduction
into a failing one.