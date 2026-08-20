---
uid: report-4f0b9c7c
id: REPORT-2330
type: report
title: 'Resync resolve conflicts: 7292af8f63220275216b82416fc441658a744e02'
created_by: xgd
created_at: '2026-08-20T02:51:01.718115+00:00'
updated_at: '2026-08-20T02:51:01.718115+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-db1949d9
---

## Files resolved

- **`package.json`** — UU, config/scalar. Version conflict only (`0.1.59` HEAD vs `0.1.47` incoming). Kept main's higher `0.1.59`: the incoming bump is free-coded bookkeeping already superseded by main's tip, and regressing the version would break the version-bump gate. No other key conflicted. Net staged diff against HEAD is empty, so the file no longer appears in `git status` — left as-is per instructions (no `--skip`).

- **`packages/site-schema/src/l1/edit.ts`** — UU, code file, INCOMING AUTHORITATIVE. Only two hunks conflicted; all of REQ-139's new machinery merged cleanly. Both hunks were the *same rule* expressed two ways:
  - **Hunk 1 (docblock on `applyCopyFields`)** — HEAD's REQ-135 paragraph ("locked refused ON CHANGE, never on presence") vs incoming's REQ-139 rewrite of the same paragraph. Took incoming. No content lost: HEAD's rationale (the modal posts every staged field, so refusing the status quo would freeze the whole segment) survives in fuller form in the incoming `lockError` docblock, which merged cleanly at line 1130.
  - **Hunk 2 (inline `locked` check)** — HEAD had `if (field.locked && value !== derived.values[name])` inline; incoming deleted it because `lockError()` (already present in the merged result, called at the head of the `refusal` chain) subsumes it. Took incoming. This is a strict improvement, not a discard: `lockError` compares colour fields with `sameColor` rather than `!==`, so a re-posted `{ref: 'neutral'}` colour under a `gradientFill` lock compares equal instead of failing reference identity — exactly the freeze REQ-139 set out to prevent.

## Incoming changes preserved

Diffed the resolved file against `git show 6b94ba963:packages/site-schema/src/l1/edit.ts`. The entire delta is 51 lines, and every one of them is main-side work being *retained*, not incoming work being dropped:

- `writeTypography` gains the `current: L1FieldValue | undefined` parameter and its fontWeight seed no-op guard (main-only, post-dates the incoming commit), plus the updated call site in `applyCopyFields`.

There are no other differences, i.e. the resolved file is incoming's version of this file plus main's newer `writeTypography` refinement. Every REQ-139 symbol from the incoming commit is present and wired:

- `L1FieldDescriptor.reason` (line 270) and the rewritten `locked` docblock.
- `L1FieldLock`, `GLYPH_GRADIENT_LOCK` (line 429), `NO_ITALIC_FACE_LOCK` (line 442).
- `NO_ITALIC_FACE_LOCK` spread into the italic field (line 578, replacing the bare `{ locked: true }`).
- `colorField`'s third `lock` parameter, and `copyFieldsOf` passing `GLYPH_GRADIENT_LOCK` when `axes.gradientFill !== undefined` (line 972).
- `L1TextAxesView.gradientFill` (line 887).
- `lockError` (line 1130), called first in `applyCopyFields`' refusal chain.

The commit's other seven files (`builder.css`, `color-field.js`, `editor.js`, `tools/generate/src/cli/edit.ts`, both UAT test files) merged without conflict and are staged unchanged from the cherry-pick — including the new `tests/test_UAT_FC_REQ-139_locked_controls.test.ts` (A). No test function was deleted on either side.

## Verification

- `git status --porcelain` shows no UU/AA/DU/UD lines; all remaining entries are staged `M`/`A`.
- No conflict markers remain in either file.
- `CHERRY_PICK_HEAD` (`6b94ba96367a3f0cb7ec6dfc7f5dfe3d5661dae5`) left intact; no `--continue`/`--skip`/`--quit`/`--abort` was run.
- Not verified: no typecheck or test run was performed in this step (test runners are unavailable to this session), so the resolution is verified by source inspection and diff-against-incoming rather than by execution.
