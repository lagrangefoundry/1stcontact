---
uid: acceptance_criterion-99fa308b
id: AC-1462
type: acceptance_criterion
title: A run leases one browser and gives every capture its own isolated context
created_by: xgd
created_at: '2026-08-31T22:53:30.684692+00:00'
updated_at: '2026-08-31T23:04:42.723068+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-080c6036
  kind: behavior
  regression_only: false
---

## Criterion

Capturing a page at N viewport sizes within one run acquires exactly **one**
browser, not N. Each capture takes a fresh, isolated context from that one
browser and destroys it when the capture ends, so every capture starts cold —
its own cookie jar, its own cache, its own storage, none of it carried over from
the previous size.

When the run ends, the browser is released.

## Verification

Drive a ladder of six viewport widths through one run and assert:

- exactly one browser acquisition occurred;
- six isolated contexts were opened and six were destroyed;
- the browser was released once, at the end of the run.

Cold-start-per-size matters beyond economics: a consent or A/B cookie set at the
narrowest width would otherwise pin every wider capture to that variant, which
is a capture-fidelity change wearing a performance costume.