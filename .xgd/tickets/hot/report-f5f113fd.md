---
uid: report-f5f113fd
id: REPORT-1397
type: report
title: 'Resync resolve conflicts: 311f1bda425960f06bf5f67cd64a34ba1d7d7c4e'
created_by: xgd
created_at: '2026-08-06T18:01:44.262417+00:00'
updated_at: '2026-08-06T18:01:44.262417+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-f47f68ea
---

## Files resolved

- `packages/site-schema/src/l1/validate.ts` — **UU**, code file (§2c: incoming
  authoritative). The conflict was confined to a single import hunk (lines
  17–22); the remainder of the file auto-merged. Both sides added *different*
  imports at the same anchor — a non-overlapping addition, so **both were kept**
  per §2c step 1. No content from either side was discarded, so the
  "incoming wins" tiebreak was never needed.

  Resolved import block:
  ```ts
  import { l1DocumentSchema } from './schema'
  import { collectL1PaletteRefs } from './palette'   // incoming (REQ-114)
  import type { L1Palette } from './palette'         // incoming (REQ-114)
  import { projectIssues } from '../issues'          // ours (REQ-108 tail)
  ```
  All three symbols are referenced in the merged body (`projectIssues` L635;
  `collectL1PaletteRefs` L598; `L1Palette` L582/L594), so neither side's import
  is dead. No import-order lint rule exists in the repo to constrain placement.

## Incoming changes preserved

Verified two ways.

**1. Symbol presence in the resolved file** — every addition from
`2c5186c4b` (`feat(l1): palette colour model, retrofit sites, retire the token
palette`) is present:

- `import { collectL1PaletteRefs }` / `import type { L1Palette }` — present
- `export interface ValidateL1Options` (with `palette?: L1Palette`) — present
- `export function checkPaletteRefs(...)` — present in full, including both
  error branches (undeclared `ref`, and missing `step`)
- `validateL1(input, options: ValidateL1Options = {})` widened signature — present
- `checkPaletteRefs(doc, options.palette, '', errors)` call site — present

**2. Complementary-diff proof** — the resolved file diffed against each side
yields *only* the other side's additions, confirming a clean superset with
nothing dropped:

- `diff <theirs> <resolved>` → only the ours-side additions (the `projectIssues`
  import and the REQ-107/DOC-8 §6 issue-projection return).
- `diff <ours> <resolved>` → only the incoming-side additions listed above.

**Checks run**: `tsc --noEmit -p packages/site-schema/tsconfig.json` → exit 0.
`vitest run tests/req114-palette-model.test.ts tests/site-schema.test.ts` →
35/35 pass.

## Staging

`git status --porcelain` shows no conflict-class lines (UU/AA/DU/UD/AU/UA).
`validate.ts` is staged as `M`; 50 files staged vs HEAD, so the resolution
leaves a net change. `CHERRY_PICK_HEAD` (`2c5186c4b`) is intact and untouched —
no `--continue/--skip/--quit/--abort` was issued.

## ⚠️ Flagged for the next step (NOT a conflict-resolution defect)

A full `vitest run` shows **9 failures across 4 files**, all of which are
**untouched by this cherry-pick and untouched by this resolution**:

- `tests/reconciliation-scaffold-starter-l1.test.ts` (2)
- `tests/reconciliation-l1-navigation.test.ts` (4)
- `tests/reconciliation-l1-shared-axis-groups.test.ts` (2)
- `tests/reconciliation-l1-control-and-texture.test.ts` (1)

These are semantic fallout of the incoming commit meeting *newer main-side*
tests, not of the merge. The incoming commit retires the token palette — it
deletes `const { palette } = defaultTokens` from
`tools/generate/src/cli/scaffold.ts` — so scaffolded sites no longer carry
`theme.palette`, and the main-side assertions `theme.palette.bg` / `.text` now
read `undefined`. The incoming commit updated the 16 `tests/req*` and
`tests/*fidelity*` suites it knew about, but the `tests/reconciliation-l1-*`
suites postdate it on main and were never retrofitted.

This is a real integration gap that needs resolving before publish, but it is
outside the conflict-resolution scope (these files carry no conflict markers and
resolving them would mean rewriting main-side test expectations). Raising it here
so the resync run does not mistake a green staging state for a green tree.
