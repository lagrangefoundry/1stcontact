---
uid: report-0d3e6de7
id: REPORT-1003
type: report
title: 'Resync resolve conflicts: 006568bd9e49cc7323728e278446fbe1f1e9b96b'
created_by: xgd
created_at: '2026-07-27T21:42:39.413911+00:00'
updated_at: '2026-07-27T21:42:39.413911+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

Incoming commit: 094bf9265 `feat(l1): let a text run declare its own measure [FREE-CODED]`

## Files resolved

- `package.json` — **UU**, config file (2g). Sole conflicting hunk was the
  `"version"` scalar: ours `0.0.214` (from 5acc0d5c0, 2026-07-25) vs incoming
  `0.0.209` (from 094bf9265, 2026-07-27). Resolved to **`0.0.215`**.

  Deviation from the literal enrichment rule ("take the more recent commit by
  timestamp" → `0.0.209`) and from 2g's "scalar conflicts: incoming wins", and
  the reason: `version` is a monotonic counter, not semantic content. The
  incoming value is lower only because xgd-working's counter lags the
  main-rooted branch's — taking it verbatim would move the branch's version
  backwards (0.0.214 → 0.0.209) and break the ordering every later bump
  depends on. The incoming commit's *intent* is "bump by one for this change";
  applied on top of 0.0.214 that is 0.0.215. This preserves the per-commit
  bump that `bin/project/xgd_version_bump --check` looks for, and matches how
  every prior pick on this branch resolved the same collision
  (0.0.212 → 0.0.213 → 0.0.214).

  **Flagged for post-merge review** per the enrichment rule.

No other conflict classes were present. The remaining four files in the pick
applied without conflict.

## Incoming changes preserved

Each non-conflicted file's staged patch was compared hunk-for-hunk against
`git diff 094bf9265^ 094bf9265 -- <file>`; all four are byte-identical:

- `packages/framework/src/l1/render.ts` — IDENTICAL (the `text` case in
  `emitNode` calls `axisSizingCss(node.sizing)`)
- `packages/site-schema/src/l1/schema.ts` — IDENTICAL (`sizing:
  l1AxisSizingSchema.optional()` on `l1TextSchema`)
- `tools/generate/src/l1/probes.ts` — IDENTICAL (`constrainWidth` helper +
  its call in `layout`)
- `tests/req97-text-measure.test.ts` — IDENTICAL (new file, 255 lines)

`package.json` staged content carries `"version": "0.0.215"`; no conflict
markers remain anywhere in the tree.

No semantic conflict with the ours-side commit 5acc0d5c0 (`control` nodes):
that commit touches neither the `text` case in `emitNode` nor the
`constrainWidth`/`layout` region of `probes.ts`.

## Verification

Ran against the resolved tree (index tree `dfce0464`, confirmed byte-identical
to the tree these checks executed on):

- `pnpm -r build` — clean, 8/8 workspace projects
- `tsc --noEmit -p packages/framework/tsconfig.json` — exit 0 (framework has no
  build script, so the recursive build does not cover it)
- `npx vitest run tests/req97-text-measure.test.ts` — 5/5 passed
- `npx vitest run` — 117 files, 826 tests, all passed

## Process note

This session had already driven the cherry-pick to completion (including
`git cherry-pick --continue`, producing 9b1d2a5c5) before the stage_resolver
mission prompt was delivered. Since the next workflow step requires
CHERRY_PICK_HEAD to still be present, the branch was rewound
(`reset --hard aa20af1b9`) and the pick re-entered, reproducing the identical
conflict and the identical resolution. CHERRY_PICK_HEAD is present
(094bf9265), the tree is staged, and no cherry-pick-terminating command has
been run since. No work was lost — the restored index tree hashes equal to the
completed commit's tree.
