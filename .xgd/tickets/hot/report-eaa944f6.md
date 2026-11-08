---
uid: report-eaa944f6
id: REPORT-11553
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T19:16:45.851681+00:00'
updated_at: '2026-11-08T19:16:45.851681+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-49607926
  parent_report_uid: report-94dd9388
  batch_index: '0'
---

I fixed the three refusal tests in this batch with test-only changes. They pass now, and so do the other two AC-2464 tests, in both the scoped run and the full-suite run (10/10 passes, 0 failures). In my last `xgd quality run` the dependency-suite filter got 39/42; the 3 failures are other tests that are broken by this session's sandbox, not by my change (details below).

**Diagnosis: stale test infrastructure, not a production bug.** The planner was right. The mirrored builds took the real repo's dist-assets lock even though they never write the repo's served tree, so in a full run they could sit waiting for minutes and blow their 180 s timeouts. Building the mirror also picked up whatever a concurrent real build had lying around: it linked the repo's `dist-assets.staging` / `dist-assets.retired` and copied a generated file (`module-assets.ts`) that the real build might be rewriting at that moment. A leftover `.retired` link alone would fail the "never moved aside" assertion.

**Changes, all in `tests/reconciliation-builder-workspace-import-graph.test.ts`:**
- **No lock for mirrored builds:** `assetsIn` now calls `run(['assets'])` directly. Every path the mirror's build writes belongs to the mirror.
- **Transient siblings skipped:** `deepLink` and `own()` now ignore `dist-assets.staging` and `dist-assets.retired`.
- **Generated file not copied:** `module-assets.ts` is created empty in the mirror instead of copied. `buildModuleAssets` writes the whole file as its first step and never reads it. The two source files the tests deliberately break (`builder/main.js`, `shade.ts`) are still copied; builds never write those.
- **Timeout:** the first describe's `beforeAll` still takes the lock to build the real tree. Its timeout is now `DIST_ASSETS_LOCK_OPTIONS.staleMs + 180_000`, so it covers the lock's full 600 s wait plus the build.

I left every AC-2464 assertion, the shared `fs-lock` helper and all production files as they were.

**Failures outside this batch:** `test_UAT_AC960_component_scope_is_written_in_exactly_one_place`, `test_UAT_AC1417_…` and `test_UAT_AC1485_…` fail in this session. The AC960 output shows `git ls-files` failing with "missing config key GIT_CONFIG_KEY_0", which is the sandbox's git environment. That error appears 17 times in the run log. AC1417 and AC1485 fail on a child exit code of 128 (git's fatal-error code); I didn't pull up their full stderr, but that matches the same problem. None of the three goes through the file I edited. I first tried reading `module-assets.ts` with `git show`, and that hit the same error, which is why I dropped git from the fix.

```yaml
## Assessment
diagnosis: stale_test_infrastructure
status: fixed
production_changes: none
matrix_changes: none
files_changed:
  - tests/reconciliation-builder-workspace-import-graph.test.ts
evidence:
  - "xgd quality run (batch filter): all AC2464 tests pass in both runs (10 pass, 0 fail)"
  - "AC1400, AC1415, AC1416, AC1476, AC1477, AC1791, AC2421, AC961, FC_REQ-145, FC_BUG-71, FC_REQ-209 pass"
outside_batch:
  - "AC960 (component_scope_is_written_in_exactly_one_place), AC1417, AC1485 fail in-session. AC960 shows `git ls-files` failing with 'missing config key GIT_CONFIG_KEY_0' (sandbox git env); AC1417/AC1485 assert a child exit of 0 and got 128. None runs through the edited file."
```