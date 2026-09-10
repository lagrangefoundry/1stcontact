---
uid: acceptance_criterion-4a491cfa
id: AC-1610
type: acceptance_criterion
title: Section band padding is not compared; the measured adjacent-row gap supersedes
  it
created_by: martin-github@westhead.me
created_at: '2026-09-09T23:48:10.538022+00:00'
updated_at: '2026-09-10T00:34:35.663649+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The section band's vertical padding is **not** compared as a value axis. The measured
adjacent-row gap supersedes it as the vertical-spacing signal, and the band-padding
deltas are dropped rather than left alongside it.

Band padding was always a proxy: it reports the container's declared inset, which is
one contributor among several — margins, row content height, collapsing — to the
spacing a reader actually sees. So it fires when the visible rhythm is identical (the
reference distributing the same visual gap through margins where the reproduction
uses padding) and stays silent when it is not. Keeping both axes would double-report
every real spacing difference and keep emitting the proxy's false ones.

## Verification
Diff a reference and a reproduction whose sections differ in band vertical padding
while their rendered inter-row gaps agree within tolerance; assert **no** delta is
reported — in particular no band-padding delta on any section. Then hold the band
padding identical on both sides while shifting a row so the measured gap differs
beyond tolerance, and assert exactly one delta is reported, on the `gap` axis.