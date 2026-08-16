---
uid: comment-bd3a3186
id: COMMENT-1039
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T01:36:11.109062+00:00'
updated_at: '2026-08-16T01:36:11.109062+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-aabaf2e1
  kind: note
---

**Result: FAIL** — REPORT-2041 (`report-aabaf2e1`), level=uat, 1 violation, 3 warnings, 0 needs_review.

CAP-94 has one story (STORY-107, feature) with 15 active ACs (AC-1095…AC-1109). All 15 have a substantive UAT in `tests/reconciliation-beyond-l1-authoring.test.ts`, each driving a real boundary (bound Toolbox, `1c` argv, or the SVG validator where the AC scopes it there) — no internal mocking, no AST-only checks, no duplicate scenarios within the matrix. Coverage and exclusivity are clean; the findings are all consistency/coverage gaps inside individual tests.

**Violation (uat-edit) — AC-1099.** The criterion "supplying a presentation is optional rather than forbidden" is a control-surface claim, but the only accepted-presentation call goes through `1c module add --slots`. The declared `presentation` parameter (`l1-surface.json` → `add_component`, wired at `tools/generate/src/cli/ai/toolbox.ts:312`) is exercised by no test in the repo, so a mis-wired key would leave the surface manual's promise false with every UAT green. CLI parity is AC-1109's job.

**Warnings:**
- AC-1099 (:326-337) — the "ordinary page content" check asserts only `typeof node.kind === 'string'`, which any node satisfies; and the criterion's "read *and replaced*" half has no module-scoped `set_l1` anywhere (the sibling story-189fc1ac suite's writes are all page-scoped).
- AC-1096 (:203-206) — `toMatch(/must be an object/i)` does not bind to the refusal the AC describes (`edit.ts:1189-1196`, "Writing the top-level settings needs an object of settings to write." plus the group-plus-object hint); neither the code nor the hint is asserted. Recorded in the notes: that branch looks unreachable from both boundaries (CLI requires the key positionally; the surface type-checks `settings` as a required object first), which may want an ac-level follow-up rather than a contorted test.
- AC-1109 — the criterion names reconfigure/remove at the CLI and explicit drawing replacement; `1c module set`, `1c module rm` and a replacing `asset write` are driven by no test. Kept a warning because the AC's own four-outcome Verification recipe *is* satisfied.

One caveat on method: `npx vitest` was refused by this session's permission mode, so the suite was not executed — all findings are static, and the report states plainly that it makes no claim about whether the suite currently passes. The report body file remains at `.xgd/tmp/cap94-uat-report.md` (gitignored); `rm` was also denied.
