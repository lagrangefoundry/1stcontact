---
uid: acceptance_criterion-32f514e9
id: AC-2044
type: acceptance_criterion
title: capture_site records a public page as a named reference and returns its name,
  address, page and asset counts, an always-present refusals list, and whether/which
  reference material was written
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T21:19:01.933970+00:00'
updated_at: '2026-11-01T01:51:11.097700+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
Asked to capture a public http or https address, `capture_site` records a reference of that page and returns an object carrying:
- `bundle`: the name the reference is now called
- `url`: the address as captured
- `pages`: the number of recorded states, an integer of at least 1
- `assets`: the number of images mirrored, an integer of at least 0
- `reference`: always present. It says whether reference material was written, as `{adopted: boolean, uid: string | null, created: boolean, why: string | null}`. When a reference ticket was written, `adopted` is true, `uid` names it, `created` is true for a first capture and false for an in-place update, and `why` is null. When none was written, `adopted` is false, `uid` is null, and `why` is a non-empty reason.
- `refusals`: an array that is always present and is empty when nothing was refused

The returned name is then listed by `list_references`, accepted by `describe_reference`, and accepted as the bundle of a picture of kind `reference`.

## Verification
Through the composed surface with a doubled browser serving a public test page:
1. Call `capture_site`. Assert all six fields and their types, with `refusals` equal to `[]`.
2. With no adoption dependency, assert `reference.adopted === false`, `reference.uid === null` and `reference.why` is a non-empty string.
3. With an adoption dependency, assert `reference.adopted === true`, `reference.uid` is a string and `reference.why === null`.
4. Assert the returned name appears in `list_references`, `describe_reference(name)` succeeds, and a `screenshot` of `{kind: 'reference', bundle: name}` resolves.
