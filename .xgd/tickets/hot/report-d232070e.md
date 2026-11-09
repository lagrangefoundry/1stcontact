---
uid: report-d232070e
id: REPORT-12055
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-09T23:07:33.181087+00:00'
updated_at: '2026-11-09T23:07:33.181087+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-179b8c06
  parent_report_uid: report-d2930bf8
  batch_index: '0'
---

All four failing AC tokens now have one passing UAT each, on the current account-chrome contract. Only test files were changed; no production code was touched.

**What I changed**

- **`tests/reconciliation-behavior-account-chrome.test.ts`**
  - **AC-2329 and AC-2332 updated:** the test site now uses whatever version the catalog lists as latest for account-chrome, instead of hardcoding `version: 1`. The test was already building its slots from the current preset, so it gets the required `sent` and `error` slots. Every assertion is unchanged:
    - all three states are in the published bytes;
    - an undeclared or `false` declaration publishes nothing;
    - the misspelt `acounts` key fails site validation;
    - the chrome is byte-identical across two different sites;
    - the links are real `<a>` elements with L1 paint and the configured `href`;
    - a `javascript:` URL throws `ContentSafetyError`.
  - **Old v1 AC-2330 and AC-2331 tests deleted.** They are replaced by the v2 tests already in `tests/reconciliation-behavior-strict-contract.test.ts`. I also removed the imports only they used and updated the file's header comment.
- **`tests/reconciliation-behavior-strict-contract.test.ts`**, AC-2330: I copied over the three v1 assertions that still hold under v2 and that the v2 test lacked:
  - the label defaults to the "Email address" wording;
  - the enhanced marker `data-account-chrome-enhanced` is set once the script runs;
  - a network failure shows the authored error text matching /could not reach the server/i.

  I left out the assertions that were only true under v1 (`account-chrome@1` being in the catalog, and four slots). The v2 AC-2331 test already covers everything else the v1 copy checked.

**Verification:** I ran `npx vitest run` on both files: 2 files, 7 tests, all passing. The run also printed an error from wrangler failing to write its log file; the sandbox blocked that write and it did not affect the tests. I couldn't lint, because `npx eslint` needed to download eslint and the sandbox blocks the npm registry. I removed every import the deleted tests had used.

**No ticket changes:** AC-2330 and AC-2331 already describe the v2 behaviour, and the code matches AC-2329 and AC-2332.

The v2 tests in the strict-contract file still use `account-chrome@2` and `getModule(..., 2)` as literal values. The planner said to keep that file passing, so I didn't change them. If the catalog moves to v3 (the planner says the reference is already there), those tests will fail the same way these four did.

```yaml
## Assessment
status: fixed
fixes:
  - test: test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none
    change: "buildSite version now latestModuleVersion('account-chrome'); slots from current accountChromePreset(); all assertions kept"
  - test: test_UAT_AC2332_link_control_emits_a_real_anchor_with_an_allowlisted_href
    change: "same fixture fix; all assertions kept"
  - test: test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_sent_is_status_blind
    change: "v1 copy deleted; covered by the v2 UAT in reconciliation-behavior-strict-contract.test.ts, which now also asserts the default label text, the enhanced marker, and the authored error text"
  - test: test_UAT_AC2331_catalogued_with_a_preset_on_the_contract_with_no_paint
    change: "v1 copy deleted; covered by the v2 UAT in reconciliation-behavior-strict-contract.test.ts (no assertion that still holds under v2 was missing from it)"
production_code_changed: false
tickets_changed: none
verified: "npx vitest run on both files — 7/7 pass"
not_verified: "lint (eslint not installed; npx download blocked by sandbox)"
```