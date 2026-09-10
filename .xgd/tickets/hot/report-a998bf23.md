---
uid: report-a998bf23
id: REPORT-3635
type: report
title: 'Capability-Intent Alignment: Client Material Store: What A Site Is Made From,
  As Tickets (level=uat)'
created_by: xgd
created_at: '2026-09-10T02:16:50.749112+00:00'
updated_at: '2026-09-10T02:16:50.749112+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-dfb0a4ff
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Client Material Store: What A Site Is Made From, As Tickets
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Anchor report: report-e37a6b4a. Previous attempts: 0.

Scope: 24 active acceptance criteria (AC-1476 … AC-1499) across the three `feature`
stories on CAP-106, and the tests that evidence them. Every AC is `status: active`,
`kind: behavior`; none is `regression_only`. Every one of the 24 carries exactly one
`test_UAT_AC<n>_*` test, and all five test files fall inside a configured vitest
project include glob (`vitest.node.config.mts` → `tests/**/*.test.ts` minus
`*.workers.test.ts`; `vitest.workers.config.mts` → `tests/**/*.workers.test.ts`), so
none of this evidence is orphaned from the runner.

Level cascade applied: the story level (REPORT-3633) and the ac level (REPORT-3634)
both passed with zero violations and zero needs_review, so AC bodies are the working
reference here. Intent was consulted only to build the ledger below; no AC proved
internally inconsistent enough to require escalating to REQ-162's body.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-162 (`request-13a5e206`) | free_and_reconciled | merged at `4b43dd9a5c` | Stood the product ticket store up: the D1 schema step transcribed from the shared `@lagrangefoundry/ticketing` component, the single wiring point (`ticketStoreFor`), the account-scoped handle, the attachment blob store in a bucket of its own, and the `material` / `reference` / `brief` vocabulary with its rights-and-provenance block | YES |

REQ-162 is the sole intent in the ledger. It is `fields.intent_uid` on all three
stories (`story-ab1ecd62`, `story-a7a12d81`, `story-e07c589b`); none of the three
carries an `updated_by` entry, and no AC in the tree carries an `intent_uid` or
`updated_by` of its own. A grep of `.xgd/tickets` for `capability-dfb0a4ff` and for
each story UID returns only the capability, the three stories, this capability's own
validation reports and their comments — no second request references the tree. All 24
ACs were created inside one two-hour window on 2026-09-01/02, consistent with a single
authoring pass. Nothing is retired, and there is no `ready_to_reconcile` /
`reconciling` / `bundled` intent pending against this capability, so the current
cumulative intent is exactly what REQ-162 asked for.

## Alignment Ledger

| Element | AC it evidences | Intents aligned to | Outcome |
|---|---|---|---|
| `test_UAT_AC1476_the_step_is_declared_in_the_migration_sequence_and_applies_after_the_site_stores` (`tests/reconciliation-product-ticket-store-schema.test.ts:80`) | AC-1476 | REQ-162 | aligned — reads `migrations_dir` from both halves of `apps/control-app/wrangler.toml`, asserts `0003_ticket_store.sql` orders after `0001_site_store.sql`, then runs the real `wrangler d1 migrations apply` against a fresh local D1, dumps `sqlite_master`, re-applies for the no-op, and asserts the runtime harness `tests/support/d1-site-factory.ts` enumerates the identical sequence |
| `test_UAT_AC1477_every_published_statement_is_present_and_a_missing_one_is_named` (`…schema.test.ts:181`) | AC-1477 | REQ-162 | aligned — imports the component's real `SCHEMA_STATEMENTS`, compares whole statements not table names, reflows whitespace to prove formatting is not disagreement, deletes one statement from the migration text and asserts the check names it, and pins the single locally-authored statement to the `tenants.config` ALTER |
| `test_UAT_AC1478_one_registry_serves_both_stores_and_carries_the_ticket_store_field` (`tests/reconciliation-product-ticket-store.workers.test.ts:87`) | AC-1478 | REQ-162 | aligned — asserts exactly one table matches `/tenant|account/i`, `PRAGMA table_info(tenants)` carries `config`, a row the *site* store wrote reads back `'{}'`, the ticket store answers to that same row without adding a rival, and a first-ever registration through the ticket store succeeds |
| `test_UAT_AC1479_a_ticket_created_through_the_wiring_reads_back_through_a_second_handle` (`…store.workers.test.ts:151`) | AC-1479 | REQ-162 | aligned — creates through `ticketStoreFor`, asserts the reader handle `not.toBe` the writer, and re-reads type, title, fields and body, in workerd against real D1/R2 |
| `test_UAT_AC1480_the_configured_account_is_registered_on_demand_and_a_recorded_one_keeps_its_status` (`…store.workers.test.ts:177`) | AC-1480 | REQ-162 | aligned — counts `tenants` before/after to prove exactly one row was added with `status='active'`, then deactivates it and asserts the handle is refused *and* the status was not silently upserted back to active |
| `test_UAT_AC1481_a_deployment_that_names_no_account_is_refused_when_the_store_is_built` (`…store.workers.test.ts:219`) | AC-1481 | REQ-162 | aligned — four spellings of unset, each against an `untouchableDb()` proxy so "refused before any operation" is observable rather than asserted, plus the named error's distinctness from `BlobsNotConfiguredError` and its naming of both `[vars]` and `[env.production.vars]` |
| `test_UAT_AC1482_a_deployment_with_nowhere_to_put_attachment_bytes_is_refused_when_the_store_is_built` (`…store.workers.test.ts:248`) | AC-1482 | REQ-162 | aligned — same construction-time shape for `BLOBS`, and additionally proves the *component's* own policy is unchanged by building a store the component's way and observing it refuses `attach` at first call rather than at construction |
| `test_UAT_AC1483_a_handle_sees_only_its_own_accounts_tickets_on_reads_and_listings` (`…store.workers.test.ts:291`) | AC-1483 | REQ-162 | aligned — cross-account `get` returns the same `not_found` a never-minted uid does, the ticket is absent from both `query` and `list`, non-vacuity via the owning handle, and a passed-in `tenant_id` is inert |
| `test_UAT_AC1484_a_write_aimed_at_another_accounts_ticket_is_refused_and_the_target_is_unchanged` (`…store.workers.test.ts:339`) | AC-1484 | REQ-162 | aligned — cross-account `update` rejects `not_found`, and the target is re-read through its own account's handle with title, body, fields *and* `version` unchanged |
| `test_UAT_AC1485_the_build_emits_an_absolute_re_export_reports_it_and_names_a_stale_install` (`…schema.test.ts:315`) | AC-1485 | REQ-162 | aligned — three planted fixtures (working / stale / absent) run the shipped `ticketing-installed.ts` under a real `node`, then a real `1c assets` run against a mirror root asserts the absolute re-export, its own line in the build report, and an enumerated (never wildcard) `.d.ts` covering every name `apps/control-app/src/tickets.ts` imports |
| `test_UAT_AC1486_attached_bytes_come_back_as_a_record_naming_their_content_address_and_size` (`tests/reconciliation-material-blob-storage.workers.test.ts:88`) | AC-1486 | REQ-162 | aligned — `sha256` compared against a digest computed in the test (not merely shape-matched), size compared to `byteLength` *and* a literal, filename/content-type round-tripped, the record listed under its parent and absent from a sibling, and a bare `{uid, bytes}` call proving no account/location/registration is needed |
| `test_UAT_AC1487_attached_bytes_are_in_the_material_store_under_the_accounts_address_and_absent_from_the_public_sites` (`…blob-storage.workers.test.ts:169`) | AC-1487 | REQ-162 | aligned — real `env.BLOBS` and real `env.SITES` both bound, bytes fetched back and compared, every key in the account namespace checked absent from `SITES`, `SITES` asserted wholly empty, and repeated for freely-republishable material to prove classification does not change the destination |
| `test_UAT_AC1488_the_same_file_is_one_object_within_an_account_and_two_across_two_accounts` (`…blob-storage.workers.test.ts:229`) | AC-1488 | REQ-162 | aligned — same digest / different absolute keys across two accounts, deleting A's object leaves B's, dedup counted as *objects in the namespace* before/after a second identical attach, and a call passing `tenant_id`/`key` for another account places nothing there |
| `test_UAT_AC1489_neither_half_points_attachment_bytes_at_the_public_sites_store` (`tests/reconciliation-material-blob-storage.test.ts:172`) | AC-1489 | REQ-162 | aligned — the forbidden targets are read from `apps/public-site/wrangler.toml` rather than spelled as literals, each half of the control app's config checked independently, `SITES` asserted still declared, and a re-point mutation asserted detectable on each half |
| `test_UAT_AC1490_both_halves_declare_the_material_store_and_name_the_same_target` (`…blob-storage.test.ts:130`) | AC-1490 | REQ-162 | aligned — the deployed half read only from `env.production.r2_buckets`, paired by binding name rather than counted across the file, with drop-one and re-point mutations proving both the pairing and the same-target clause have teeth |
| `test_UAT_AC1491_the_vocabulary_names_three_material_kinds_the_conversation_kinds_and_the_attachment_record` (`tests/reconciliation-material-types.workers.test.ts:83`) | AC-1491 | REQ-162 | aligned — the conversation kinds are read off `chatSchemas()` and the attachment schema compared by identity (`toBe`) to `ATTACHMENT_SCHEMA`, so a local copy that merely matches today would fail; each material kind is then created with no status supplied and reads back `status === null` |
| `test_UAT_AC1492_material_and_reference_carry_the_same_six_part_rights_and_provenance_statement` (`…types.workers.test.ts:139`) | AC-1492 | REQ-162 | aligned — one statement object offered to both kinds, all six parts read back, `pack.schema('reference').fields` compared to `material`'s, and every member of all three enums exercised on both kinds through real creates |
| `test_UAT_AC1493_an_out_of_set_ownership_or_file_sort_value_is_refused_and_leaves_no_record` (`…types.workers.test.ts:212`) | AC-1493 | REQ-162 | aligned — out-of-set and empty values for `rights` and `kind` on both carriers, each rejecting `code: 'validation'`, the whole fresh account then listed empty, and a subsequent accepted create proving the listing is not vacuous |
| `test_UAT_AC1494_republishability_and_exportability_are_required_true_or_false_answers` (`…types.workers.test.ts:248`) | AC-1494 | REQ-162 | aligned — omission of each answer on each carrier refused, `'yes'`/`'no'`/`'true'`/`'false'` refused rather than interpreted (including the string `'false'`, which truthiness would read as affirmative), nothing stored, and all four boolean combinations round-tripped |
| `test_UAT_AC1495_captured_and_fetched_material_must_name_its_address_and_an_upload_is_not_asked_for_one` (`…types.workers.test.ts:314`) | AC-1495 | REQ-162 | aligned — `captured`/`fetched` without an address refused on both carriers with nothing stored; an upload accepted and asserted `'source_url' in fields === false`, i.e. absent rather than blank; both address-bearing origins round-tripped |
| `test_UAT_AC1496_a_brief_names_its_site_and_carries_a_document_that_is_not_blank` (`…types.workers.test.ts:359`) | AC-1496 | REQ-162 | aligned — no-site refused, three whitespace-only bodies and a wholly absent body refused, account listed empty, then a valid brief round-trips site and document, plus a second site in the same account proving "one per site" is not "one per account" |
| `test_UAT_AC1497_a_material_is_a_valid_record_before_any_text_has_been_extracted_from_it` (`…types.workers.test.ts:422`) | AC-1497 | REQ-162 | aligned — both carriers accepted with no body and reading back `''` with the rights block complete, a supplied body round-tripped, and the contrasting brief refusal asserted so the optional body reads as a decision |
| `test_UAT_AC1498_material_may_name_the_site_it_was_gathered_for_or_belong_to_the_account_at_large` (`…types.workers.test.ts:462`) | AC-1498 | REQ-162 | aligned — both carriers with and without `site_slug`, absence asserted as `'site_slug' in fields === false` rather than an empty value, and a query proving material for one site is not returned for another |
| `test_UAT_AC1499_a_conversation_persists_as_a_record_found_by_its_session_identifier` (`…types.workers.test.ts:500`) | AC-1499 | REQ-162 | aligned — the chat record accepted in the kind's own `open` state with no state supplied, the transcript stored as a `chat_transcript` comment listed back under it, a second session proving the session-id query selects rather than merely returns, and the record's body still `''` afterwards |

Coverage: 24 / 24 active ACs carry a substantive UAT. Consistency: every test read
exercises the criterion its name claims — no test was found asserting something other
than, or narrower than, its AC's stated subject. Exclusivity: no AC is evidenced by two
tests, and no two tests in the tree verify the same scenario in the same shape (see
Notes for the two pairs that look adjacent and are not).

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | AC-1489, AC-1490 | — | Both are evidenced by file-reading tests over `apps/control-app/wrangler.toml` rather than by runtime behaviour. This is the correct shape, not a structural-check shortfall: both criteria are *about the configuration file* ("the deployment configuration ... never names the public site's store"), and the file is the only possible evidence for them. Both tests carry mutation checks (drop-one, re-point) that fail when the property stops holding, and the runtime consequence is separately proved against real R2 by `test_UAT_AC1487`. Recorded so a later uat check does not re-litigate it as a missing runtime test. | none |
| 2 | info | consistency | AC-1477 | — | `test_UAT_AC1477_…` is `it.skipIf(!TICKETING_INSTALLED)`. The skip is sanctioned by the AC itself ("the check is only meaningful when the shared component is available ... reports a named skip"), and the skip *message* is separately asserted against real fixtures by `test_UAT_AC1485_…`. Verified in this checkout that the component is present with `blob_store.js` at `/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing/src/`, so `TICKETING_INSTALLED` is true and this test executes here rather than skipping. | none |
| 3 | info | consistency | AC-1483 | — | REPORT-3634's warning #2 asks AC-1483's *text* to add a terminality probe. At the uat level the property is already evidenced: `…store.workers.test.ts:327-330` asserts `forTenant`, `registerTenant` and `listTenants` are all `undefined` on the scoped handle. So that warning is an AC-text-completeness fix only — it needs no accompanying `uat-add`, and the fix editor should not author a second test for it. | none |
| 4 | info | coverage | AC-1478, AC-1488 | — | Two Verification sections name a step the test does not mechanize: AC-1478 ("remove the reconciliation from the schema step and observe the runtime tests fail") and AC-1488's "removing **or replacing** one leaves the other untouched" (removal is exercised at `…blob-storage.workers.test.ts:255-258`; replacement is not). Every *Criterion* bullet of both is asserted, so this is not a coverage gap — the un-mechanized parts are review instructions and a redundant second spelling of an already-proved independence claim. | none |
| 5 | info | consistency | all 24 UATs | — | Evidence-validity sweep found no internal mocking. Every material/store assertion runs through the production `ticketStoreFor` wiring in workerd against real D1 and real R2; the schema tests drive the real `wrangler` and `1c assets` binaries; the presence-check fixtures copy the shipped source byte-for-byte and assert the copy is unmodified. The one substitute in the tree, `untouchableDb()` (`…store.workers.test.ts:65`), is a tripwire that throws on any property access — it exists to make "refused *before* the database was touched" observable, and it strengthens rather than weakens the assertion. | none |

## Notes for the Editor

**Nothing to repair at this level.** All three levels of CAP-106 have now passed with
zero violations: story (REPORT-3633, 1 warning), ac (REPORT-3634, 2 warnings), uat
(this report, 0 warnings). The two open AC-level warnings and the one open story-level
warning are all text edits and none of them implies a test change — see finding #3 for
the one that might otherwise have looked like it did.

**Two pairs look adjacent and are deliberately not duplicates.**

1. AC-1487 and AC-1489 both say "not the public site's store". AC-1487 is a runtime
   claim about where bytes *went*, proved against two real R2 buckets; AC-1489 is a
   static claim about what the config *says*, proved against both halves of the TOML.
   The header comment at `…blob-storage.workers.test.ts:21-26` states the split
   explicitly, and the mutation that gives AC-1487 its teeth (re-pointing the byte
   layer) is invisible to a config reader. Different shapes, different failure modes.
2. `test_UAT_AC1497_…` contains a brief-without-a-body refusal that also appears in
   `test_UAT_AC1496_…`. In AC-1497 it is one contrast assertion inside a test whose
   subject is a *material's* optional body — the contrast is what makes the optionality
   read as a decision. Not a redundant second test of AC-1496.

**The `origin` enum, for whoever picks up REPORT-3634's warning #1.** That warning
asks AC-1493 to be widened to name `origin` as a third closed set. If it is widened,
`test_UAT_AC1493_…` will need a matching case — an out-of-set `origin` value refused on
both carriers — added alongside the existing `rights` and `kind` cases at
`tests/reconciliation-material-types.workers.test.ts:218-223`. Today the test correctly
covers only what AC-1493 currently claims, which is why it is not a finding here; it
would become one the moment the AC text changes. Note that
`test_UAT_AC1492_…:199-208` already exercises all four *valid* origins on both kinds,
so only the negative case would be new.
