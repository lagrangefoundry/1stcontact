---
uid: acceptance_criterion-e04ceb33
id: AC-883
type: acceptance_criterion
title: 'The accent fails visible: with no pointer, no scripting, a hoverless pointer,
  reduced motion or a headless capture, the band presents exactly what it presented
  before the axis existed, and every declaration the axis adds waits for a real pointer'
created_by: xgd
created_at: '2026-08-06T18:09:30.434807+00:00'
updated_at: '2026-08-09T05:41:29.686684+00:00'
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
A published page carrying pointer accents presents exactly the page it would have
presented without them until a real pointer moves over it. In each of the
following, the accented node is presented identically to the same node with the
axis removed:

- no pointer has yet moved on the page (including every automated capture and
  every crawler, which never move one);
- scripting is unavailable or errors before the driver arms;
- the input device is coarse or hoverless, such as a touchscreen — there is no
  cursor to follow, and a bloom under whatever the reader just tapped is noise;
- a reduced-motion preference is set, which the published page honours itself and
  which no site-definition field can override or opt out of.

*Every* declaration the axis contributes waits behind the same condition — not
merely the accent itself, but the compositing context the accent needs — so the
rule is total and carries no exception. Until a pointer moves, a resting page is
pixel-identical to the unaccented page.

## Verification
Render a page with accented nodes and evaluate it five ways: never moving a
pointer, with scripting not executed, with the pointer driver erroring, under a
coarse/hoverless pointer, and under a reduced-motion preference. In each case
assert the accented node's presentation matches the same page rendered with the
accent declarations removed. Compare a fully settled resting screenshot of the
accented and unaccented pages and assert zero differing pixels. Assert no
declaration attributable to the axis applies before a pointer moves, and that no
site-definition field suppresses the reduced-motion behaviour.