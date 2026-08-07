---
uid: report-6a57992c
id: REPORT-1553
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-07T04:36:38.848213+00:00'
updated_at: '2026-08-07T04:36:38.848213+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-c46abfa6
---

All 6 UATs pass. The two failures in `tests/reconciliation-copy-edit-write-path.test.ts` are pre-existing (they reproduce with that file run alone, before my file existed) and belong to a different story — noted below, not touched.

```
UATs generated for story story-c46abfa6 (plan item 1 of 2)

Story: story-c46abfa6
Test file(s) created:
  - tests/reconciliation-site-asset-listing.test.ts

Tests written: 6
Tests passed: 6
Tests failed: 0

test_files_created:
  - "tests/reconciliation-site-asset-listing.test.ts"
```

**AC → UAT mapping** (1:1, both real entry points — `run(argv)` for the CLI, `startBuilder` over HTTP for the origin; nothing internal stubbed):

| AC | Test | What it pins |
|---|---|---|
| AC-1018 | `test_UAT_AC1018_a_file_present_in_the_site_assets_is_listed_even_when_undeclared` | A site with a full `draft/assets/` and `"assets": []` — every file listed, each carrying its own filename as identity, `onDisk: true` / `registered: false`. |
| AC-1019 | `test_UAT_AC1019_a_declared_asset_contributes_its_identity_and_is_listed_with_no_file` | Declared+on-disk merges to exactly one entry with the definition's id and alt and both flags true; declared-but-absent still listed at `onDisk: false`. |
| AC-1020 | `test_UAT_AC1020_every_listed_asset_is_named_in_the_site_local_handle_a_page_holds` | Bare `beta.png` and qualified `/assets/hero.png` both normalise to one `/assets/…` handle (one entry, not two); the handle equals the `src` the seeded page's image node already holds; order is by handle and stable across calls. |
| AC-1021 | `test_UAT_AC1021_each_asset_reports_what_it_can_be_used_for` | png/jpg/svg → `image`, woff2 → `font`, css → `other`; the unfiltered listing carries all three kinds and the caller narrows. |
| AC-1022 | `test_UAT_AC1022_the_store_answers_from_the_command_line_with_no_editing_gesture` | `1c asset list <slug>` with the site as its only input; full entry shape asserted for every entry; a fresh site answers `[]` with `ok: true`, exit 0. |
| AC-1023 | `test_UAT_AC1023_the_store_answers_from_the_builder_origin_and_refuses_a_missing_site` | `GET /api/assets?slug=acme` → 200 with entries equal to the command line's answer for the same site; `GET /api/assets` → 400 whose body names `slug`, with no `assets` key. |

Notes:

- The origin suite runs **unconditionally** — `/api/assets` touches no `@gendevlabs/webui-*` component, so unlike the FC file's origin block it does not skip on this machine (which has no webui install). AC-1023 is genuinely verified here, not reported as skipped.
- **Pre-existing failures, not mine and not fixed** (no runtime code and no existing test was modified, per the constraints): `tests/reconciliation-copy-edit-write-path.test.ts` fails 2 of 13 — `test_UAT_AC988…` and one other assert `field.type === 'string'` for every copy field, but REQ-118's free-coded change widened `L1FieldDescriptor.type` to `'string' | 'enum'` and an image segment's `src` now reports `enum`. That is story-37a3921b's matrix, not story-c46abfa6's — it needs the other plan item or the reconciliation review to reconcile those ACs against the widened descriptor.
