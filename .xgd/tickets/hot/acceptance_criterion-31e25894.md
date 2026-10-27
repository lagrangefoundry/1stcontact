---
uid: acceptance_criterion-31e25894
id: AC-2040
type: acceptance_criterion
title: Each of the five fidelity verdicts is reached under its own condition and carries
  a distinct next step
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T20:46:59.768057+00:00'
updated_at: '2026-10-27T20:46:59.768057+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-47fb84e6
  kind: behavior
  regression_only: false
---

## Criterion
Each of the five fidelity verdicts is reached under its own condition and carries a next step distinct from the other four.

| Verdict | Condition | Next step |
|---|---|---|
| `structural-failure` | The structural gate fails, whatever else holds. | Work the structural gate's residuals. |
| `pass` | The structural gate passes and the perceptual floor is not breached. | "Nothing outstanding" when there are no value deltas. When deltas remain, names their count and says to work them. |
| `capture-incomplete` | The floor is breached and reference coverage reports findings. Value deltas may be zero. | Says this is a capture defect: re-capture or close the extraction gap first. Any value deltas are not yet evidence. |
| `reproduction-wrong` | The floor is breached, coverage is clean and value deltas exist. Reports the delta count. | Names that count and says to work the deltas element by element. |
| `unexplained-disagreement` | The floor is breached, coverage is clean and there are no value deltas. | Names a framework gap: a pixel-moving property no axis records. |

The same inputs give the same verdict through `check_fidelity` and through `1c gate`.

## Verification
Drive the shared gate reconciliation with five input sets: structural fail; clean and quiet; loud with coverage findings and no deltas; loud with clean coverage and 2 deltas; loud with clean coverage and no deltas. Assert the five verdicts in turn. For capture-incomplete, assert the value delta count is 0 and the percent over threshold is 80. For reproduction-wrong, assert the delta count is 2. Assert the five `nextStep` strings are pairwise distinct.
