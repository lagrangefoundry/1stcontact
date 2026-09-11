---
uid: report-a403b09d
id: REPORT-3930
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-11T05:42:12.216635+00:00'
updated_at: '2026-09-11T05:42:12.216635+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-325da65f
---

## UATs generated for story story-325da65f (plan item 12 of 17)

**Test file created:** `tests/reconciliation-upload-overlay.test.ts`
**Tests written:** 11 (one per AC, AC-1725 → AC-1735)
**Tests passed on this branch:** 0
**Tests failed on this branch:** 11 (whole file fails at transform)

```
⚠️ TESTS FAILING — but not for a reason the fix-it loop can repair

Error: Failed to resolve import "../apps/control-app/src/builder/upload.js"
       from "tests/reconciliation-upload-overlay.test.ts". Does the file exist?
```

### Root cause: this story's source was never applied to the reconcile branch

`git diff --name-status main..HEAD` over the source dirs returns **only** `packages/framework/` and `tools/generate/` — the knowledge-base half of BUNDLE-26 (REQ-164/165/158/159). Nothing under `apps/control-app/src` was cherry-picked at all, so `upload.js`, `library.js`, `material.ts`, `knowledge.ts` and the `config.js` `UPLOAD_AREAS`/`UPLOAD_PROMPT` exports are all absent. The code exists on `reconcile-src-BUNDLE-26`; it is not on `reconcile-BUNDLE-26`.

This is **pre-existing and branch-wide**, not something my file introduced. Plan items 7–11 already landed test files that fail identically — I ran two to confirm:

- `tests/reconciliation-library-tab.test.ts` → `Failed to resolve import ".../builder/library.js"`
- `tests/reconciliation-material-ingestion.workers.test.ts` → `Cannot find module ".../src/knowledge"`

### What I did verify

Since the tests would otherwise ship unproven, I temporarily materialised `upload.js` and the two `config.js` constants from `reconcile-src-BUNDLE-26`, ran the suite, and reverted. **6 of 6 overlay-level UATs passed against the real implementation** — AC-1725, AC-1726, AC-1727, AC-1728, AC-1729, AC-1734. The assertions are correct; only the module is missing.

`git status` is clean again apart from the new test file — the graft left nothing behind.

### What I could not verify, and why

The 5 mounted UATs (AC-1730, AC-1731, AC-1732, AC-1733, AC-1735) need `mountBuilder` to compose chat + Library + overlay. Grafting the full builder directory surfaced a second, independent gap: `@lagrangefoundry/webui-list-detail` is not in the shared store here, and it is **not listed in `WEBUI_PACKAGES`**, so the `WEBUI_INSTALLED` skip gate does not cover it — `library.js`'s static import kills the whole file at transform rather than skipping. That gate hole equally affects plan item 11's file on any machine without that component.

I wrote those 5 against the landed `receiveFiles`/`uploadNote`/`api.uploadMaterial` behaviour (sequential per-file handover, the chat turn's exact wording, `slug` travelling on every upload, `library.refresh()` re-reading from the origin), gated behind the repo's existing `describe.skipIf(!WEBUI_INSTALLED)` convention.

```
test_files_created:
  - "tests/reconciliation-upload-overlay.test.ts"
```

Two things need an operator decision, neither of which I can action from inside this prompt's scope: the missing cherry-pick of the REQ-161/REQ-163 commits onto `reconcile-BUNDLE-26`, and whether `webui-list-detail` should join `WEBUI_PACKAGES` so the skip gate reports honestly instead of failing at transform.
