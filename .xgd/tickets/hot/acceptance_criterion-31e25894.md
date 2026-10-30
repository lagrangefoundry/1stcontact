---
uid: acceptance_criterion-31e25894
id: AC-2040
type: acceptance_criterion
title: Each of the five fidelity verdicts is reached under its own condition and carries
  a distinct next step
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T20:46:59.768057+00:00'
updated_at: '2026-10-30T20:12:03.911907+00:00'
completed_at: null
last_field_updated: body
status: active
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
**Bundles.** Build real reference bundles in an on-disk store, each with a black reference screenshot:
- **broken:** a structural oracle pushed past the viewport.
- **broken-everything:** the same, plus unreferenced images and a reference run.
- **silent:** a clean oracle, with no images and no reference run.
- **impoverished:** a clean oracle with three unreferenced mirrored images.
- **our-fault:** a clean oracle with one reference run that the draft does not carry.

**Draft.** The draft is either 4/255 off the reference (within the floor) or 200/255 off it (breaching the floor). Its live page carries no value elements.

**Run each case two ways and compare.** Drive each verdict through `check_fidelity` on the composed Toolbox. Run `1c gate --json` (`cli.run`) on the same bundle directory, with the same draft bytes and the same flattened live-page read. Assert the two reports are the same judgement: verdict, pass, diagnosis, next step, floor, values, coverage, and the perceptual values at the CLI's precision.

**Assert each verdict:**
- **structural-failure:** broken + loud gives `structural-failure`. Broken-everything + loud, which has coverage findings, value deltas and a breach, still gives `structural-failure`.
- **pass:** silent + quiet gives `pass`, with zero deltas and a next step saying "nothing outstanding".
- **pass with deltas left:** our-fault + quiet gives `pass`. Its next step names `<n> delta(s)` and does not say "nothing outstanding".
- **capture-incomplete:** impoverished + loud gives `capture-incomplete`, with findings, zero deltas, percent over threshold above the floor, and a next step naming a CAPTURE defect.
- **reproduction-wrong:** our-fault + loud gives `reproduction-wrong`, with clean coverage, deltas above zero, and a next step that says to work that many.
- **unexplained-disagreement:** silent + loud gives `unexplained-disagreement`, with clean coverage, zero deltas, and a next step naming a FRAMEWORK gap.

**Across the five.** Only the two `pass` cases have `pass` true. The five verdicts are distinct, and their five `nextStep` strings are pairwise distinct.
