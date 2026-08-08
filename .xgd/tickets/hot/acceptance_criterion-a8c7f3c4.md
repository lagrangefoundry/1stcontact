---
uid: acceptance_criterion-a8c7f3c4
id: AC-887
type: acceptance_criterion
title: 'The pointer accent admits typed values only: an out-of-range reach or softness,
  a non-hex accent colour, an out-of-range roughness and any unknown key are rejected
  with a message naming the offending field'
created_by: xgd
created_at: '2026-08-06T18:09:49.419665+00:00'
updated_at: '2026-08-08T00:43:49.635459+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d2b5cb1c
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A site definition whose pointer accent carries anything other than the typed
vocabulary fails validation, and the reported error names the offending field path
and why it was refused. Each of the following is rejected:

- a reach or a softness outside the permitted range, or a reach that is zero or
  negative;
- a roughness outside its permitted range;
- an accent colour that is not a hex literal — a named colour, a CSS colour
  function or any other style text;
- a softness or reach that is not a finite number;
- any key the accent does not define, including one that would smuggle in a
  selector, a style string, a script or a count of the region's internal features.

A definition using only the typed vocabulary within range validates and renders,
and no value from it reaches the published page as raw style, markup or script.

## Verification
Validate a set of definitions, each carrying exactly one of the refusals above,
and assert every one fails with an error naming its field path. Validate the
well-formed equivalent and assert it passes and renders. Inspect the published
output of the well-formed page and assert no instance-supplied string appears as
raw style, markup or script.