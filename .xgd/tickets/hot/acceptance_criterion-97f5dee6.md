---
uid: acceptance_criterion-97f5dee6
id: AC-988
type: acceptance_criterion
title: A change map naming a field the region does not have, or a value that is not
  text, is refused rather than ignored
created_by: xgd
created_at: '2026-08-07T02:02:40.679901+00:00'
updated_at: '2026-08-07T02:12:05.037445+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

Every entry in a change map is checked before any is applied. An entry naming a
field the addressed region does not expose is refused — not silently dropped —
naming the offending field, because such a map means the caller resolved against
a different region than it is writing to. An entry whose value is not text is
refused the same way. In both cases nothing is written.

## Verification

Submit a change map with an unknown field name and assert it is refused with the
field named in the fault, and the draft unchanged. Submit a map whose value is a
number, a list or an object and assert the same. Confirm the region's existing
text is intact afterwards.