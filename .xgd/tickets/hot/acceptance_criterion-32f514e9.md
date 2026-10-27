---
uid: acceptance_criterion-32f514e9
id: AC-2044
type: acceptance_criterion
title: capture_site records a public page as a named reference and returns its name,
  address, page and asset counts and an always-present refusals list
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T21:19:01.933970+00:00'
updated_at: '2026-10-27T21:19:01.933970+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
Asked to capture a public http or https address, `capture_site` records a reference of that page and returns an object carrying: `bundle` (the name the reference is now called), `url` (the address as captured), `pages` (number of recorded states, an integer of at least 1), `assets` (number of images mirrored, an integer of at least 0) and `refusals` (an array that is always present and is empty when nothing was refused). The returned name is then listed by `list_references`, accepted by `describe_reference`, and accepted as the bundle of a picture of kind `reference`.

## Verification
Through the composed surface with a doubled browser serving a public test page: call `capture_site`, assert the five fields and their types, with `refusals` equal to `[]`. Then assert the returned name appears in `list_references`, `describe_reference(name)` succeeds, and a `screenshot` of `{kind: 'reference', bundle: name}` resolves.
