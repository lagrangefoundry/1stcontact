---
uid: comment-0099a9c5
id: COMMENT-7873
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-05T21:54:03.765995+00:00'
updated_at: '2026-11-05T21:54:03.765995+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-84738adf
  kind: note
---

I filed the iteration 2 fix plan as **REPORT-11068** (`report-84738adf`). It has two batches, and each one lifts the `code_frozen` rule for its own files. In both cases I checked the builder's diagnosis against the reference state and found it correct. I didn't run any tests, since this is only the plan.

| Batch | Test | Root cause | Who decides | Files the builder may edit |
|---|---|---|---|---|
| 0 | AC-2329 | `siteCapabilitiesSchema` doesn't reject unknown keys, so a misspelt `acounts` is silently dropped instead of failing validation. | **Rung 1:** REQ-200 is in this bundle and says the record is closed "so a typo is a validation error". The story already lists this as a code issue. | `packages/site-schema/src/schema.ts` |
| 1 | AC-1624 | `composeModuleAssets` joins every module's `client.js` into one scope. Three modules each declare `const ERROR_SELECTOR`, so the bundle won't parse and every page throws (4 violations for 4 desktop widths). | **Rung 2:** at the reference, `tools/generate/src/cli/module-assets.ts:42-75` and `:122` wrap each module in its own block (BUG-75). | `tools/generate/src/cli/module-assets.ts`, and `packages/framework/src/modules/module-assets.ts` regenerated with `1c assets` |

- **Batch 1 departs from the builder's proposal.** The builder wanted to rename the clashing constants. The reference code's own comment rejects renaming because it only waits for the next clash, so the plan tells the builder to scope each module instead.
- **The cause of AC-1624 is inferred, not observed.** The builder couldn't launch Chromium, so nobody has seen the 4 violations. The plan asks the builder to print the violation text if any remain once the bundle parses.
- **Other tests in scope:** each batch also runs the tests of the code it changes. Batch 0 adds AC-2330–2332 and the REQ-200 apex/session tests. Batch 1 adds AC-1622, AC-1623, AC-1400, the REQ-145 build-artifact tests and the REQ-93 tests.
- **Weak tests flagged:** the REQ-145 build-artifact test checks the generated file against its inputs but never parses the combined bundle, which is how this clash shipped unnoticed. The AC-1624 test doesn't print what the violations were, so the failure can't be diagnosed without Chromium.

When the report was filed, the sandbox blocked an outbound connection to `github.com:22`, probably a ticket sync. The report was still created locally.