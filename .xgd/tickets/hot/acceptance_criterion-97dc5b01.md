---
uid: acceptance_criterion-97dc5b01
id: AC-2106
type: acceptance_criterion
title: A coverage check derived from the reference's declared source reports any part
  it does not render, and the shipped reference has none
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T09:19:09.650747+00:00'
updated_at: '2026-11-01T09:19:09.650747+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5836022a
  kind: behavior
  regression_only: false
---

## Criterion

The layout reference names its source as "the L1 element schemas and their
validation envelope", and a coverage check holds it to that claim. The check
derives, at the moment it runs, every part of that source — each element kind,
each writable top-level document key, each numeric bound and each structural
rule — and reports, by name, each one the reference fails to render.

Each part is held against the section that is supposed to render it, not the
body as a whole: element kinds against the element-kinds section, document keys
against the page-document section, bounds and structural rules against the
limits section. A structural rule counts as rendered only when its statement
appears, not merely its identifier. A word that happens to appear elsewhere in
the reference does not satisfy the check.

The generated reference, as shipped, has no gaps.

## Verification

Run the coverage check against the generated reference and confirm it reports
nothing. Run it against the same reference with the limits section removed and
confirm it names every numeric bound and every structural rule and no element
kind; with the page-document section removed, confirm it names every document
key and nothing else. The expected parts are derived from the schemas and the
validator at check time; the test holds no hand-written list of them.
