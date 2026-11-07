---
uid: report-8cfad78e
id: REPORT-11188
type: report
title: 'Fix reconciliation review: bundle-7988e925'
created_by: xgd
created_at: '2026-11-07T22:34:30.782352+00:00'
updated_at: '2026-11-07T22:34:30.782352+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-7988e925
  needs_more_work: false
  progress_made: true
---

## Stories created
None

## Stories modified
- story-179b8c06 (STORY-85): the stale Technical Context note "Code issue: the capability record is not closed" now records that it was resolved (`.strict()`, report-078b06e6). This was a non-blocking nit.
- story-0cd18650 (STORY-161): story text unchanged. Its two pending ACs now have UATs and are active (below).

## ACs modified / activated
- AC-2341 (acceptance_criterion-969c91c0): pending → active. UAT: `tests/test_reconciliation_terms_signup_provisioning.workers.test.ts` `test_UAT_AC2341_accepting_with_nothing_held_provisions_the_accounts_own_business_once_and_a_failed_provisioning_records_no_acceptance`. The test drives the real terms-accept POST through `worker.fetch` and asserts:
  - 204, with no new `accounts` row, and one business owned by the contact's account and named after the contact;
  - an owner membership, plus an active grant with `ends_at` null;
  - a servable starter site, and a fresh admission listing that business as selectable;
  - idempotence on a repeat acceptance and after a terms bump;
  - `Unnamed business` for a contact with no name;
  - nothing provisioned when an operator re-accepts bumped terms, or when a member holds a business owned by another account;
  - a failed provisioning (a D1 trigger aborts that contact's membership insert) records no acceptance, keeps the contact admitted with an empty set and served the interstitial, and a retry then succeeds.
- AC-2342 (acceptance_criterion-faa27b9d): pending → active. UAT: `test_UAT_AC2342_accepting_from_the_terms_path_goes_to_the_builder_root_and_elsewhere_reloads_the_requested_url` (same file). It asserts that the success branch of the served control sends `/terms` to `/` and reloads any other URL, on both the interstitial at `/` and `/terms`. After accepting, `/` serves the builder with Site as the first, default tab, and `/terms` stays readable with the acceptance record. The Verification text now says the branch is checked on the served script, because the inline script cannot run in workerd.
- AC-1760 (acceptance_criterion-4c1d0046): dropped the stale aside "and is refused `no_membership` (AC-2173)". This was a non-blocking nit.

## Stories deleted
None

## ACs superseded
- AC-2154 (acceptance_criterion-0fbe6d15): owning story story-387c9dfe (STORY-162), authored under bundle-94dbe947, superseded by bundle-7988e925 (REQ-203). Set `status: superseded`, `superseded_by_uid: bundle-7988e925`. Its UAT was left untouched, as instructed.

## FC orphans renamed/deleted
None. No fc_orphan_check report exists for this anchor.

## Code changes
- `db/migrations/0002_session_rotation.sql`: deleted. This is the misjudged override report-de676490 (item 6): the file added live-database convergence that no in-scope AC or intent asks for, and it was copied from out-of-window REQ-231 commit 59f8754161. No test reads it.
- `db/migrations/0001_baseline.sql`: the comment above `sessions` no longer cross-references `0002` or cites REQ-231. It now states that the table is transcribed from the installed component's `SCHEMA_STATEMENTS` (REQ-202). The nine-column `sessions` DDL and its indexes are unchanged.
- `tests/test_reconciliation_terms_signup_provisioning.workers.test.ts`: new file, with the UATs for AC-2341 and AC-2342.

## Confidence
Moderate to high. All three blocking findings are addressed. Per the instructions, the new UATs were not run in this call. The riskiest assertion is the trigger-induced provisioning failure: it relies on D1 accepting `CREATE TRIGGER ... RAISE(ABORT)` and on `provisionBusiness`'s batch rolling back. The workflow's test run will confirm it. Not addressed (out of scope, recorded by the review for visibility only): five other suites still import `invitePerson` from `people.ts`. The optional deployment-contract AC for REQ-202 was not added, since the review rated it a judgment call and not a failure.
