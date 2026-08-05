---
uid: report-1f5793b1
id: REPORT-1322
type: report
title: 'Dispatch plan: 2026-08-05T22:28:46.462509+00:00'
created_by: xgd
created_at: '2026-08-05T22:28:50.206875+00:00'
updated_at: '2026-08-05T22:28:50.206875+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: dispatch_plan
---

# Dispatch plan run

Timestamp: 2026-08-05T22:28:46.462509+00:00
In-flight count: 0
Candidates evaluated: 1

## Bundle decisions
[]

## Dependency decisions
[]

## Notes
Single dispatchable develop candidate (bug-5cabb340 / BUG-32, 1 story point) and an empty in-flight set. No cohort partner exists in the capacity-filtered dispatchable list, so per bundling rule 5 the ticket dispatches individually and no bundle anchor is proposed. No (candidate, in_flight) pairs exist this cycle, so dependency_decisions is empty by construction rather than by omission.

## Raw planner response (truncated)
One dispatchable candidate (BUG-32, 1 pt), zero in-flight intents.

- **Bundling**: rule 5 — a solo candidate with no cohort partner dispatches individually; no bundle emitted (minimum two members, and there is nothing else in the capacity-filtered dispatchable set to cohort with or attach as a rider).
- **Dependencies**: the in-flight set is empty, so there are no (candidate, in_flight) pairs to evaluate. `existing_decisions` for `bug-5cabb340` already shows an empty `evaluated_against`, and nothing new arrives this cycle.

No capability-subtree lookup was needed — mutual exclusion is only meaningful against in-flight work, and there is none.

```json
{
  "bundle_decisions": [],
  "dependency_decisions": [],
  "notes": "Single dispatchable develop candidate (bug-5cabb340 / BUG-32, 1 story point) and an empty in-flight set. No cohort partner exists in the capacity-filtered dispatchable list, so per bundling rule 5 the ticket dispatches individually and no bundle anchor is proposed. No (candidate, in_flight) pairs exist this cycle, so dependency_decisions is empty by construction rather than by omission."
}
```