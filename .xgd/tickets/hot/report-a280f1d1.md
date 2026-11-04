---
uid: report-a280f1d1
id: REPORT-10855
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-04T16:14:57.599282+00:00'
updated_at: '2026-11-04T16:14:57.599282+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-fde7370b
  parent_report_uid: report-61b51ef3
  batch_index: '0'
---

I fixed every failure in this batch by changing tests only; no production code was touched. All 36 tests across the five affected files now pass. The tests had been written against the store layout from before REQ-190 (opaque keys) and needed to catch up with the frozen code.

**The four failing tests**
- **`test_UAT_AC1392`** looked for asset objects under the old path `draft/<tenant>/<slug>/`. It now asks the store for the site's key and reads `draft/<siteId>/assets/…`.
- **`test_UAT_AC1448`**: its helper that deletes a site's rows behind the store's back used the old `tenant_id`/`slug` columns, which no longer exist. It now finds the site's key through the store, deletes every row by that key (revisions included), and checks the site is really gone.
- **`test_UAT_AC2229`, both cases**:
  - `provisionBusiness` now takes `accountId`, which the tests pass as `owner.user.account_id`.
  - The starter slug is now always `unnamed` and business keys start with `biz_`, so the collision case pins the business key and puts an authored site at `unnamed` before provisioning.
  - Both cases now also check that no second site appears and the existing site keeps its key.

**The six orphaned criteria (AC-2238 to AC-2243)**
These had no tests named after them. The REQ-190 tests already proved them under their temporary `test_UAT_FC_REQ-190_*` names, so I renamed the files and tests onto the criteria. This also clears the leftover FC tests that reconcile requires to be gone.
- `tests/test_UAT_FC_REQ-190_baseline.test.ts` became `tests/test_reconciliation_baseline_schema.test.ts`, covering AC-2238, AC-2239 and AC-2241.
- `tests/test_UAT_FC_REQ-190_opaque_keys.workers.test.ts` became `tests/test_reconciliation_opaque_site_keys.workers.test.ts`, covering AC-2239 to AC-2243.
- AC-2243 says to check the schema, and the old test didn't, so its test now also confirms `site_revisions.id` and `site_changes.at` are INTEGER columns and both `site_id` columns are TEXT.

No acceptance criterion or story text needed changing: each one already describes what the code does.

**Not checked:** I couldn't run lint. ESLint isn't installed and the sandbox blocks the npm registry. The test files also aren't covered by any `tsconfig`, so there is no type-check either.

**Outside this batch, left alone:**
- `test_UAT_AC1393` (lines ~507 and ~542 of `reconciliation-cloudflare-site-store.workers.test.ts`) still uses the old `draft/<tenant>/<slug>/` prefix. It passes, but those checks probably now prove nothing because they look under a prefix the store no longer writes to.
- Comments in `apps/control-app/wrangler.toml`, `db/migrations/0001_baseline.sql` and the REQ-149 FC test still mention `test_UAT_FC_REQ-190_tenant_id_literal`. Under the frozen-code rule I didn't edit them; that test is now `test_UAT_AC2238_the_platform_business_literal_matches_both_deployment_blocks`.

Nothing is committed; the changes are in the working tree for the workflow to pick up.

```yaml
## Assessment
blocked_by: null
```