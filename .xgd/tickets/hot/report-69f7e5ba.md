---
uid: report-69f7e5ba
id: REPORT-529
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-07-13T21:24:19.096744+00:00'
updated_at: '2026-07-13T21:24:19.096744+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-29765550
  parent_report_uid: report-b9bf2fb0
  batch_index: '0'
---

Batch complete. Quality gate is **green** (`Overall Status: SUCCESS`, javascript-vitest suite passed, all 645 tests pass, coverage 95.84%).

## Assessment

**Diagnosis** — This batch listed 54 "failing" ACs (AC-575..AC-628), but that was a **regression-environment artifact**: the JS suite collected zero tests in the regression worktree, so the AC-coverage gate marked every in-scope AC orphaned. With `node_modules` present here, the suite collects normally — 53 of the 54 tests already passed. Exactly **one** genuine evidence gap existed: `test_UAT_AC609_retired_width_names_removed`.

**Root cause of AC-609** — This is outcome #2 in the taxonomy (**data stale, code correct**). The production code has fully migrated the content-width vocabulary to the Tailwind scale:
- `packages/framework/src/modules/dials.ts` — `CONTAINER_STEPS` / `CONTENT_WIDTH_DIAL` expose only `bleed` + `sm..7xl`.
- `packages/site-schema/src/schema.ts` — `containerTokensSchema` matches.

The only thing still carrying retired names was the git-tracked site document `storage/sites/faelan/draft/site.json`, whose `theme.container` still defined `narrow`/`default`/`wide`. These are **dead data** — no framework code reads `theme.container` overrides (the resolver uses `CONTAINER_STEPS`), and the module-scan half of the AC-609 test already passed. The test at lines 220-223 correctly caught the stale data.

**Changes made** (2 files, no test edits, no production-code behavior change):
1. `storage/sites/faelan/draft/site.json` — removed the retired container-token keys `narrow`/`default`/`wide`, keeping the valid `bleed: "100%"`. This aligns the shipped site data to the migrated schema so AC-609 observes real, migrated data.
2. `packages/site-schema/src/schema.ts` — corrected the stale `containerTokensSchema` doc-comment (planner nit) that still described `default`/`readable` as canonical, though the schema object no longer defines them.

I did **not** touch the AC-609 test (it correctly encodes REQ-55 intent), and I verified no other site document under `storage/sites` carries a retired name as a `theme.container` override or `contentWidth`/`rowWidth` dial value (the other `"default"`/`"wide"` matches are unrelated `surface`/`tracking` dial values, outside the test's scope).

Working-tree changes are left in place for the outer reconcile orchestration to commit.
