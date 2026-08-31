---
uid: acceptance_criterion-09480871
id: AC-1446
type: acceptance_criterion
title: There is no way to format the current moment, and the determinism resolution
  is recorded as a contract a module author will find
created_by: xgd
created_at: '2026-08-31T12:39:18.145085+00:00'
updated_at: '2026-08-31T12:47:20.142568+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0598c150
  kind: behavior
  regression_only: false
---

## Criterion

The formatting seam offers no operation, overload or default that supplies the
current moment: every formatted moment is one the caller passed in explicitly.
A module author reaching for the seam therefore cannot make a render's output
depend on when it ran, without going outside the seam entirely.

The resolution of the determinism question is stated where a module author will
encounter it rather than left as folklore. The platform's build-determinism
contract states that render output stays byte-deterministic and that
time-varying content is resolved on the client or at request time and is never
derived from the render clock, and points at the formatting seam as the
sanctioned way to show a moment — rather than reading as a blanket prohibition
on showing a date at all. The seam states the same rule at its own entrance.

## Verification

Confirm that formatting a moment is impossible without supplying one — there is
no zero-instant form to call. Confirm the build-determinism contract carries the
resolution, names the byte-deterministic property, and refers the reader to the
formatting seam; and confirm the seam itself carries the rule in the same terms,
so a reader arriving from either direction finds it.