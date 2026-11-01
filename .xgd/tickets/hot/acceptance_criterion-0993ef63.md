---
uid: acceptance_criterion-0993ef63
id: AC-2084
type: acceptance_criterion
title: With no ticket store available (the 1c CLI) capture behaves as before and states
  that no reference material was written; a failed adoption is reported and the bundle
  is kept
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T01:51:24.347409+00:00'
updated_at: '2026-11-01T01:51:24.347409+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
**No ticket store.** On a host with no ticket store (the `1c` CLI, where no adoption dependency is supplied), `capture_site` captures exactly as it did before and succeeds. The bundle is stored and readable through `list_references` and `describe_reference`. The result's `reference` reports `adopted: false`, `uid: null`, and a `why` stating that the bundle was stored but no reference material was written.

**Adoption fails.** When adoption is attempted and fails (for example the describer or the corpus is unreachable, or the bundle has no capture record), `capture_site` does not fail. It returns its normal result with `reference.adopted: false` and `reference.why` carrying the failure's message. The bundle stays complete in the reference store and can still be described and pictured.

**Not a capture.** A bundle with no capture record is refused by name as not being a capture.

## Verification
1. Through the composed surface with a doubled browser and no adoption dependency: call `capture_site`. Assert success, a non-empty `reference.why`, and that `describe_reference(bundle)` succeeds.
2. With an adoption dependency that throws `Error('describer unreachable')`: assert `capture_site` resolves, `reference.adopted === false`, `reference.why` contains `describer unreachable`, and the bundle is still listed and describable.
3. Adopt a bundle with no `capture.json`. Assert the error names the bundle and says it is not a capture.
