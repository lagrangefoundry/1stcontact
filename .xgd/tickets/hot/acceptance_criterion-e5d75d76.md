---
uid: acceptance_criterion-e5d75d76
id: AC-1443
type: acceptance_criterion
title: An ambiguous or impossible instant, and an unrecognised zone id, are refused;
  an explicit offset is accepted
created_by: xgd
created_at: '2026-08-31T12:39:15.321439+00:00'
updated_at: '2026-08-31T12:39:15.321439+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0598c150
  kind: behavior
  regression_only: false
---

## Criterion

The date-time formatting operation refuses the inputs whose acceptance would be
unrecoverable once published, and accepts the one that is merely unusual:

- A zone-less wall-clock string (and a date-only string) is refused. The failure
  states that the moment must carry a UTC marker or an explicit numeric offset,
  and reports the offending value. Accepting one would reinterpret it as
  whichever zone the machine running the render happened to be in.
- A value with the right shape that is not a real date-time is refused rather
  than formatted into whatever the runtime makes of it.
- A zone id the runtime does not recognise is refused, and the failure names the
  time-zone as the problem and reports the offending id — rather than surfacing
  an opaque error raised from inside the formatter.
- An instant carrying an explicit numeric offset is accepted and formatted,
  because at a formatting boundary the distinction that matters is ambiguous
  versus unambiguous, and an explicit offset is unambiguous.

## Verification

Attempt to format a zone-less date-time string and a date-only string; assert
each failure names the marker-or-offset requirement. Attempt to format a
shaped-but-impossible date-time and assert it fails. Attempt to format a valid
instant against a fabricated zone id and assert the failure names the time-zone.
Finally format an instant written with an explicit numeric offset and assert it
produces the same local reading as the equivalent UTC-marked instant.
