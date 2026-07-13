---
uid: comment-68a507b8
id: COMMENT-147
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-07-13T21:20:49.296335+00:00'
updated_at: '2026-07-13T21:20:49.296335+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-b9bf2fb0
  kind: note
---

The fix plan report was created successfully: **REPORT-527 (report-b9bf2fb0)**.

## Summary

I diagnosed the regression failure and produced a single-batch fix plan.

**What the report claimed:** 54 orphaned ACs (AC-575..AC-628) + a failed `javascript-vitest` suite showing `total: 0`.

**What I found by investigating (not guessing):**

1. **The 54 orphans are one failure fanned out, not 54.** The AC-coverage gate builds its "covered" set from *passing* tests, then set-diffs against in-scope ACs. The regression worktree's JS suite collected **zero** tests (a pnpm/`node_modules` hoisted-symlink glitch — confirmed by the repair machinery in `worktree_setup.py`), so the covered set was empty and every AC was flagged orphaned.

2. **Reproducing the exact plugin filter in a normal environment** (this worktree, node_modules present) collects all 54 AC tests → **53 pass, 1 fails**. All 54 tests genuinely exist.

3. **The one real failure is AC-609.** `test_UAT_AC609_retired_width_names_removed` fails because the tracked site document `storage/sites/faelan/draft/site.json` still carries retired container-width tokens (`narrow`/`default`/`wide`) that REQ-55 removed.

4. **Code is already fully migrated** (`CONTAINER_STEPS`, `CONTENT_WIDTH_DIAL`, `containerTokensSchema` all use only `bleed` + `sm..7xl`). The retired keys in faelan are **dead data** — unconsumed by the framework and unreferenced by any faelan module. Per stabilize mode (code is truth), the fix is to align the stale site data to the shipped code.

**Plan:** one batch — no disjoint file set to split across, and splitting would hide the shared cause. The batch carries all 54 AC test names (blast radius: keep 53 green while making AC-609 pass) with a `test_scope` covering all 54 so the gate re-collects the full set and confirms zero orphans. Flagged one non-gating stale doc-comment at `schema.ts:722`. No spec changes needed; AC-609 correctly encodes REQ-55 intent.
