---
uid: bug-a8f4755c
id: BUG-222
type: bug
title: 'Plan cadence: a builder session that wrote the site no longer records the
  first-pass or revision-round milestone'
created_by: EPIC-19
created_at: '2026-10-18T14:34:56.728286+00:00'
updated_at: '2026-10-18T14:34:56.728286+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: high
  priority: high
  story_points: 2
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-35ab6e59
---

## Symptom

Two REQ-379 cadence UATs fail on a clean `xgd-working` (2026-10-18, before any change):

- `test_UAT_FC_REQ-379_a_completed_first_builder_session_makes_layout_happy_due_and_flags_the_stale_stages_until_the_consultant_acts` — `stored.milestones?.first_pass_at` is `undefined` (`tests/test_UAT_FC_REQ-379_consultant_cadence.workers.test.ts:207`).
- `test_UAT_FC_REQ-379_a_later_builder_session_is_a_revision_round_and_layout_happy_falls_due_again` — `stored.milestones?.revision_rounds` is `undefined` (`:265`).

So a builder session that wrote the site no longer records the first-pass or revision-round milestone, and the checks they trigger (`layout_happy`, `quality_bar_met`, `motion_offer`) never fall due. If this reproduces in the running product and not only in the test, the consultant's milestone questions are silently dead — the very prompts Finding 13 says only work when the host forces them.

## Where it breaks

`cadence-core.ts:293` calls `hooks.builderCompleted()` only when a `Delegate` tool result has `outcome === 'reported'` **and** `wrote === true`. `wrote` is not upstream's — it is added by our account annotation (`account-core.ts:1421`, `wroteAnything(changed)`), and only when the account has a `changed` record. Candidates to check, in order:

1. The account annotation no longer runs before the cadence wrapper sees the event (wrapper order in `host-core.ts`, or the annotation moved), so `wrote` is absent.
2. `changed` is no longer present in the delegation result's account (upstream delegation result shape changed — lagrange-framework REQ-207's concurrent calls / scope claim on 2026-10-15 is the most recent change to `delegation_toolbox.js`), so `wrote` is never set.
3. The test's scripted delegation output no longer matches what the real path produces, and the product is fine — in which case the fixture is wrong, not the host.

Find which, and fix the cause rather than loosening the assertion.

## Fix

- A builder session that reported and wrote the site records `first_pass_at` the first time and increments `revision_rounds` after, as REQ-379 specifies, on the real host path.
- If the cause is (3), update the fixture to the real result shape and confirm with a run against the real delegation output.

## Test plan

- The two failing UATs pass unchanged in intent.
- `test_UAT_FC_REQ-379_a_builder_session_that_wrote_nothing_is_not_a_milestone` still passes.
- Regression: the rest of the REQ-379 cadence suite and the REQ-356 plan suites.