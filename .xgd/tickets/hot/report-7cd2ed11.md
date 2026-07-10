---
uid: report-7cd2ed11
id: REPORT-433
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-07-10T02:20:29.037324+00:00'
updated_at: '2026-07-10T02:20:29.037324+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: bundle-df065afc
---

The fix is verified — all 8 tests in the file pass, including `test_UAT_AC425`.

## Summary

**Issues fixed:**

- **Critical — `test_UAT_AC425_valid_site_validates_and_returns_value` regression** (`tests/reconciliation-site-schema.test.ts:48`): REQ-45 added a `tracking` group to `typographyTokensSchema` with a `.default(...)`, so `validateSite()` now injects that group into its output. The round-trip equality test (`expect(full.value).toEqual(submitted)`) failed because the `fullTheme()` fixture had no `tracking` key. Added `tracking: { normal: '0em', tight: '-0.025em', tighter: '-0.05em' }` to the fixture's `typography` block — matching the schema default exactly (`schema.ts:565`). Since both `minimalSite()` and `fullSite()` share `fullTheme()`, this single edit covers the round-trip assertion.

**Per the review's constraints:** I did not touch `packages/site-schema/src/schema.ts` (the `.default()` is intentional per CLAUDE.md — don't break themes predating the group) and did not convert it to `.optional()`.

**Verification:** Ran the affected file — `8 passed (8)`, including AC425. I did not run the full quality gate (the workflow runs it automatically).

**Confidence: High.** The single blocking issue was a stale-fixture deep-equal mismatch with an unambiguous, in-memory root cause; the fix mirrors the schema default precisely and the targeted run confirms it passes. The only other full-suite failure noted in the report (`test_UAT_AC424`, `sites/1stcontact` absent) was explicitly assessed as pre-existing/environmental and not attributable to this bundle — out of scope for this fix and not something a code change here can resolve.
