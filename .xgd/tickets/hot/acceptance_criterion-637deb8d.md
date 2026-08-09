---
uid: acceptance_criterion-637deb8d
id: AC-838
type: acceptance_criterion
title: The envelope rejects an incoherent layout track
created_by: xgd
created_at: '2026-08-06T02:37:59.940583+00:00'
updated_at: '2026-08-09T05:41:10.239520+00:00'
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
The layout track is bounded by the same safety envelope as every other axis, and is
rejected with the offending field located in the returned error list when:

- its **breakpoints do not strictly ascend** — a later keyframe at or below an earlier
  one can never apply, so the track is incoherent rather than merely unusual;
- the container's static `layout` **disagrees with the widest keyframe's mode**. `layout`
  is the representative widest value; letting the two drift leaves every consumer that
  does not resolve per width reading a mode the page renders at no width at all, which is
  worse than declaring none;
- the track carries an **unknown or extra key**, so the axis offers no freeform escape
  hatch back to raw CSS.

Breakpoints themselves are *not* checked against the document's declared widths, because
an authored breakpoint is a design decision rather than a captured sample.

## Verification
Submit documents each violating one rule — descending breakpoints, a static layout naming
a mode other than the widest keyframe's, and a track object carrying an extra key — and
observe a "not ok" result in each case, with the error naming the offending path and, for
the first two, stating the ascending and widest-value rules. Submit a well-formed track
whose breakpoint sits at a width the document never declared and observe it is accepted.