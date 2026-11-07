---
uid: comment-1d633a43
id: COMMENT-7912
type: comment
title: Claude response for batch_fix_assessment report
created_by: xgd
created_at: '2026-11-07T06:17:39.884043+00:00'
updated_at: '2026-11-07T06:17:39.884043+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-88761605
  kind: note
---

The failing AC-2329 test now passes, along with the rest of the batch's scope: 25 of 25 across the three test files. The schema fix itself (adding `.strict()` to `siteCapabilitiesSchema` in `packages/site-schema/src/schema.ts`) was already committed by an earlier pass (`efd9fae0c4`), so I didn't need to edit `schema.ts`.

**What I changed:** only the test, `tests/reconciliation-behavior-account-chrome.test.ts`. It used to check just `validateSite(...).ok === false` for `{ acounts: true }`. As the planner asked, it now also checks:
- at least one error is reported at a `capabilities` path;
- that error's message names `acounts`;
- a site with no capabilities record, `{ accounts: true }` and `{ accounts: false }` all still validate.

**Checks:**
- **The test proves the behaviour:** with `.strict()` temporarily removed, the AC-2329 test fails ("expected true to be false"). I put `schema.ts` back, and it matches the committed version.
- **Committed sites:** the only site that declares capabilities is `storage/sites/1stcontact/draft/site.json`, and it has only `accounts: true`, so nothing existing breaks.
- **Not run:** lint. `npx eslint` failed because the sandbox blocked the npm registry download. The edit is small and typed against the existing `ValidationError` shape.

No AC or story changes were needed: AC-2329 already states the closed-record rule. The story's "Code issue: the capability record is not closed" note is now out of date, but it is the outer reconcile's to resolve, not this batch's.

## Assessment
```yaml
status: fixed
failures_fixed:
  - test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none
production_changes: none in this batch (packages/site-schema/src/schema.ts .strict() already committed in efd9fae0c4)
test_changes:
  - tests/reconciliation-behavior-account-chrome.test.ts  # typo rejection asserts issue path+key; legal shapes still validate
verification: "vitest on 3 scoped files: 25/25 pass; mutation (drop .strict()) makes AC2329 fail"
```