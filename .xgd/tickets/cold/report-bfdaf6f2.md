---
uid: report-bfdaf6f2
id: REPORT-1063
type: report
title: 'Resync resolve conflicts: f5f29fb9f01dfd222dd5a744af7374b1e371be99'
created_by: xgd
created_at: '2026-07-29T06:39:15.132976+00:00'
updated_at: '2026-07-29T06:39:15.132976+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `tools/generate/src/l1/fold.ts` — **UU**, code file (rule 2c: incoming authoritative).
  The only textual conflict was the import list at line 20: ours (`bb2f37ed9`, fold a
  full-bleed bar as a band) added `isSafeUrl`; incoming (`8bed72adf`, fold self-painting
  chip runs as pills) added `L1_ENVELOPE`. **Non-overlapping → kept BOTH**, in the file's
  existing case-insensitive alphabetical order. Both symbols are live in the file
  (`isSafeUrl` x4: font-face + image src envelope checks; `L1_ENVELOPE` x2: chip radius
  clamp) and both are exported from `packages/site-schema/src/l1/index.ts:7`.
  Discarding either side would not compile.

The other 5 files in the pick applied cleanly (no conflict class) and were left as
staged by git: `packages/framework/src/l1/render.ts`,
`packages/site-schema/src/l1/{schema,validate}.ts`,
`tools/generate/src/cli/capture/values-diff.ts`,
`tests/bug20-chip-self-surface.test.ts` (new).

No ticket, UAT-deletion, or config conflicts arose. No UAT function was removed.

## Incoming changes preserved

Patch-level verification against `CHERRY_PICK_HEAD` (`8bed72adf`):
**48 added lines in the incoming fold.ts hunks, 0 missing from the resolution.**

Incoming symbols present: `L1_ENVELOPE`, `isChipRun`, `chipAxes`, the `if (chip) continue`
surface-row suppression, and the `{...textAxes, ...chipAxes}` spread.
Ours-side symbols retained: `barBandFills`, `BAND_TAIL_PAD`, `isSafeUrl`,
`SYNTHESIZED_SURFACE_ID_PREFIXES`.

The two sides are semantically compatible by construction: `isChipRun` discriminates on
*pill saturation* (radius >= half the run's painted height) and a chip contributes no
surface row, so it never reaches ours-side `barBandFills`. BUG-14's
section-band -> card -> text reconstruction is untouched.

## Verification performed

- Clean full rebuild first (stale `dist` masks type drift): `pnpm -r build` plus
  `typecheck` on `framework` and `generate` — all clean.
- Full suite: **717/720**. Attributed individually, not by count:
  - `BUG-14_real_captures_get_bands_and_treated_cards` — PRE-EXISTING at `bb2f37ed9`
    (`sampleFidelity: expected false to be true`)
  - `REQ-92_form_controls_stay_residuals` — PRE-EXISTING at `bb2f37ed9`
    (`expected 'section-band-0' to match /^surface-\d+$/`)
  Both baselined by reverting the pick in-place and re-running: identical assertion
  messages on both sides. These are the "2 unrelated failures" the incoming commit
  message itself cites. The pick adds 12 passing UATs and introduces zero new failures.
- `bug17-fold-padding` initially ENOENT'd on a gitignored capture bundle absent from this
  worktree. Because that test is `badge_padding` and badges are exactly what this pick
  changes, it was NOT dismissed as environmental: the real capture was linked in from the
  main checkout and the test **passes with real data**.

## Post-merge review flag

The enrichment metadata's fallback rule ("intent unknown -> take the more recent commit by
timestamp, flag for review") was not applied literally, because taking either side whole
would drop a symbol the other side needs and break the build. Keeping both is the
build-correct reading of rule 2c (non-overlapping -> keep both). Flagging
`tools/generate/src/l1/fold.ts` for post-merge review as the rule directs.

Separately, the two pre-existing failures above are on main's tail, unrelated to this
pick, and both look tied to ours-side band work — `REQ-92` asserts `/^surface-\d+$/` but
gets `section-band-0`, i.e. a test not updated when `SYNTHESIZED_SURFACE_ID_PREFIXES`
gained `section-band-`. Worth a ticket; out of scope here.

## Process deviation (disclosed)

This session began before the stage_resolution instructions were injected, and completed
the pick with `git cherry-pick --continue` (commit `d60311151`) — an operation this stage
explicitly reserves for the next workflow step. On receiving the instructions the state
was restored: `git reset --soft bb2f37ed9`, `CHERRY_PICK_HEAD` rewritten to
`8bed72adf8d0e636b718b6b68162f9644ee10533`, `MERGE_MSG` restored from the source commit.
`git status` now reports "You are currently cherry-picking commit 8bed72adf / all
conflicts fixed". The staged tree is byte-identical to the verified resolution; net change
vs HEAD is 6 files, +335/-3. No `--skip`/`--quit`/`--abort` was ever run.
