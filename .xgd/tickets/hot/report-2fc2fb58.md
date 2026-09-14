---
uid: report-2fc2fb58
id: REPORT-4228
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-14T05:00:46.065773+00:00'
updated_at: '2026-09-14T05:00:46.065773+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-0cb7f25b
---

All tests pass. Here's what I built.

**Structure** — one UAT per AC (14 total), split across the runtime boundary the story itself names: no single Vitest project can hold both the filesystem backing (node only) and the cloud one (workerd only).

- `tests/support/reference-bundle-contract.ts` — the five "identically on every backing" criteria (AC-1768/1769/1770/1771/1774), written once and registered by both projects' suites. This follows the project's established pattern (`support/site-store-contract.ts` does the same for `SiteStore`). AC-1770's filesystem-only clause (loose file at the references root, bare host directory) is supplied by the backend via an optional `seedNonBundles` hook, so it runs only where those shapes can exist.
- `tests/reconciliation-reference-bundle-storage.test.ts` — registers the contract against the filesystem and memory backings, plus AC-1762's node counterpart work: AC-1763 (whole bundle lands, decoded member by member), AC-1764 (URL-derived name, re-capture replaces in place), AC-1766 (`refold` over two backings + the no-oracle refusal), AC-1767 (`--ref <dir>`), AC-1775 (offline re-extraction against a bundle whose bytes were never on disk, still performing a real loopback navigation).
- `tests/reconciliation-reference-bundle-storage.workers.test.ts` — registers the contract against R2 inside workerd, plus AC-1762 (capture completes with no filesystem), AC-1765 (cloud ≡ memory equivalence, the second half of the transitive claim), AC-1772 (tenant binding refusals — asserted to be the *same* `UnknownTenantError` `d1r2SiteStore` raises), AC-1773 (isolation + tenant key prefix in `BLOBS`).

Everything runs against real components — real R2, real D1 tenant registry, real loopback HTTP. The only fake is the browser driver.

**One pre-existing failure found, outside this story's scope and not touched:** `tests/reconciliation-offline-reextract-mirror.test.ts` (story-d5de22a5, AC-1607) calls `reextractFromBundle(dir, …)` with a directory string. REQ-155 changed that signature to take a `ReferenceBundle`; `capture.test.ts` and `bug16-*.test.ts` were updated, that file was not. Three of its four tests fail with `TypeError: bundle.read is not a function`. The fix is wrapping the argument in `fsReferenceBundle(dir)`, but it is an existing test file for another story's AC, so I left it alone.

```
UATs generated for story story-0cb7f25b (plan item 1 of 10)

Story: story-0cb7f25b
Test file(s) created:
  - tests/support/reference-bundle-contract.ts
  - tests/reconciliation-reference-bundle-storage.test.ts
  - tests/reconciliation-reference-bundle-storage.workers.test.ts

Tests written: 14 (one per AC; 24 registered executions, since the 5
               backing-agnostic UATs run once per backing)
Tests passed: 24
Tests failed: 0

test_files_created:
  - "tests/support/reference-bundle-contract.ts"
  - "tests/reconciliation-reference-bundle-storage.test.ts"
  - "tests/reconciliation-reference-bundle-storage.workers.test.ts"
```

No runtime code was modified and no existing test file was changed. Both new files typecheck clean under the workspace compiler options; ESLint is not installed in this workspace, so the lint gate could not be run here.
