---
uid: bug-a8f4755c
id: BUG-222
type: bug
title: 'Plan cadence: a builder session that wrote the site no longer records the
  first-pass or revision-round milestone'
created_by: EPIC-19
created_at: '2026-10-18T14:34:56.728286+00:00'
updated_at: '2026-10-18T16:51:06.613301+00:00'
completed_at: null
last_field_updated: status
status: free_coding
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

## Diagnosis (2026-10-18): candidate 3 — the fixture predates REQ-397

The real host path delivers what it should. The Delegate result the cadence wrapper saw was `{"outcome":"reported","wrote":false,"account":{"changed":{"differences":[]},"from":0,"to":0}, …}`. So the annotation runs (rules out 1), `account.changed` is present (rules out 2), and `wrote:false` is **true**: the builder wrote nothing.

The builder wrote nothing because its scripted `set_l1` on `home` was refused by the leased store (`leased-store.ts`, [[REQ-397]], landed 2026-10-16, after these UATs were written on 2026-10-03):

> Error: set_l1 failed. `home.json` is not in this session's scope (none declared); nothing was written.

Since REQ-397, a builder may overwrite an existing draft file only if the commissioning `Delegate` call names it in `scope`. Builders created without a scope may only create new files. The REQ-379 fixtures delegate with no `scope`, so the builder's write to the existing home page is refused, the builder reports `wrote:false`, and correctly no milestone is recorded. In the product, the consultant is taught files and scopes whenever the store is leased (`host-core.ts`, `files: … scopeSupported(lib)`), and the REQ-397 suite delegates with `scope`. The cadence wrapper, the account annotation and the milestone hooks are all correct.

## Fix

- A builder session that reported and wrote the site records `first_pass_at` the first time and increments `revision_rounds` after, as REQ-379 specifies, on the real host path. **No host change is needed. This already holds.**
- The REQ-379 cadence fixtures now commission builders the way REQ-397 requires: each `Delegate` call whose builder writes the home page names `scope: ['home']`. The fixture's builder therefore writes the site for real, through the real Delegate toolbox, the leased store, the account annotation and the cadence wrapper. Only the model is scripted. That run is the confirmation against the real delegation output.
- The assertions are unchanged.

## Test plan

- The two failing UATs pass unchanged in intent.
- `test_UAT_FC_REQ-379_a_builder_session_that_wrote_nothing_is_not_a_milestone` still passes.
- Regression: the rest of the REQ-379 cadence suite, the REQ-397 lease suite and the REQ-356 plan suites.
