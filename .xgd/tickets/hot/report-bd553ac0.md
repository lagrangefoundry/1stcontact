---
uid: report-bd553ac0
id: REPORT-7571
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T11:30:20.194329+00:00'
updated_at: '2026-11-01T11:30:20.194329+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-e674c60a
  parent_report_uid: report-e5febd9c
  batch_index: '0'
---

Six of the seven listed failures are fixed and their tests pass in the scoped run. The seventh, AC975, now fails on purpose with a clear message, because Chromium can't launch in this session's OS sandbox. I couldn't take its browser measurement here. Nothing is committed yet.

**AC960 (component scope written once).** Under the granted exception I reworded only the JSDoc at `tools/generate/src/cli/ai/ledger-core.ts:17` to "The shared `ai-ticketing` component already declares …". No code changed. `test_UAT_AC960_` and the whole `bug32-webui-scope-rebrand` file pass.

**AC967 (site follows the business).** I did not touch `app.js`.
- In `tests/reconciliation-builder-business-scope.test.ts` I deleted only the failing-listing step and its now-unused `failNext` flag. Every other assertion stays, and the test passes.
- AC-967 (`acceptance_criterion-92c52943`) is rewritten in place. The claim that a failed listing keeps the pane is gone, along with its verification sentence, and a note cites this fix plan. Nothing new claims that a failure empties the pane.
- STORY-99 now has a correction under its 2026-11-01 decisions saying clause (c) misdescribed the code and has been withdrawn.

**AC964 and AC1400 (admission gate).** Both now pass.
- **Real local D1:** I added `localD1()` to `tests/support/local-d1.ts`. It's a new export, so existing users are unaffected. It reads the same `wrangler.toml` and the same on-disk database that `applyLocalD1Schema` and `seedIdentity` write to, so there's no hand-written seed SQL, stub store or second schema. It turns off remote bindings and points wrangler's dev registry at a temp folder, so tests never reach a Cloudflare account or register in the operator's global wrangler state.
- **Fixture changes:** both suites apply the schema and seed their own identity under their configured tenant. Each suite uses its own email so another suite's seed can't decide which tenant the user sits in. The site store (R2) still throws if touched, and the doc comments now say these routes touch D1 for admission only.
- **AC1400's "no account" probe** now uses a configured tenant that has no account row. The test checks that the row is absent both before and after the request, so it also proves the store was never opened. The refusal for an unadmitted caller and the "no artifact served in place of a route" checks are unchanged.

**AC975 (frame fills the window).** The earlier passes were the old warn-and-return path; no measurement was taken. A plain `node` script can't launch Chromium here either, so the cause is the sandbox, not state shared with AC964. Both "no browser" paths now throw, and the error includes each launch attempt's reason. Outside this sandbox, where Chromium can start, it should measure; that's untested.

Two tests in the same files fail here, outside this batch: AC965 and `test_UAT_FC_REQ-115_control_app_fronts_the_builder_same_origin`. Both use wrangler's `unstable_dev`, which tries to reach `api.cloudflare.com` and is blocked, and I changed neither.

```yaml
## Assessment
blocked_by: null
status: fixed (6/7 verified green); AC975 fails loudly in this sandbox (Chromium cannot launch), measurement unverified here
files_changed:
  - tools/generate/src/cli/ai/ledger-core.ts (JSDoc only, under the granted exception)
  - tests/reconciliation-builder-business-scope.test.ts
  - tests/reconciliation-builder-workspace-origin.test.ts
  - tests/reconciliation-workspace-build-artifacts.test.ts
  - tests/support/local-d1.ts (new localD1 export; backward compatible)
tickets_updated:
  - acceptance_criterion-92c52943 (AC-967)
  - story-e674c60a (STORY-99)
```
