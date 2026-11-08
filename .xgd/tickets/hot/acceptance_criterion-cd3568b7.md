---
uid: acceptance_criterion-cd3568b7
id: AC-2481
type: acceptance_criterion
title: edit, reference, revision and url pictures carrying 'after' are refused before
  a browser is leased, each with its stated reason
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T21:43:38.605411+00:00'
updated_at: '2026-11-08T21:43:38.605411+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
Only a `draft` picture can be driven. A picture of kind `edit`, `reference`, `revision` or `url` that carries a non-empty `after` is refused as invalid parameters before a browser is leased and before any of the session's browser budget is spent. Each refusal says only a `draft` picture can be driven, gives that kind's own reason, and suggests asking for the same thing as a `draft` picture:
- `edit`: the edit channel ships no behaviour, so there is nothing to open or advance;
- `reference`: it is a recording of a page, not a page;
- `revision` / `url`: driving a published revision or somebody else's address would act on a live system.

The surface's declared absences say the same, and that no setting lifts it.

## Verification
With a counting browser seam, call `screenshot` with `after: ['click "Sign in"']` on each of `edit`, `reference`, `revision` and `url`. Assert each is refused with its kind's reason, and the seam was never launched (on the Worker the budget is unchanged). Assert the same `after` on `draft` launches the browser.
