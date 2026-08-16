---
uid: acceptance_criterion-ffa07ea7
id: AC-1079
type: acceptance_criterion
title: 'Every call against the site is recorded: which operation, its effect, its
  arguments, allowed or refused and by which rule, and what became of it'
created_by: xgd
created_at: '2026-08-10T09:06:34.171389+00:00'
updated_at: '2026-08-16T03:39:01.559669+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-93905de4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

One record is written per call, whatever the outcome. Each record identifies the
surface and the operation, its declared effect, the arguments it was called with,
the policy decision (allowed or refused) together with the rule that decided it,
and the outcome afterwards. An allowed call that then fails is recorded as both —
allowed by policy, unsuccessful in outcome, with the failure's code — so the log
is usable for reconstructing what was actually done to a site.

## Verification

Issue three calls against a site: a read, a write that succeeds, and a write that
the site refuses. Assert exactly three records were written. Assert the read
records the surface, the operation and the read effect; the successful write
records the write effect, the arguments it carried, and an allow decision with no
refusing rule; and the refused write records an allow decision with an
unsuccessful outcome carrying the error code.