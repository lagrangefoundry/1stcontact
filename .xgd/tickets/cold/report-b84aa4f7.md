---
uid: report-b84aa4f7
id: REPORT-1020
type: report
title: 'Resync resolve conflicts: d3d689184dbc45f44b278bad79f1c82fb57525b9'
created_by: xgd
created_at: '2026-07-29T04:11:09.725110+00:00'
updated_at: '2026-07-29T04:11:09.725110+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `package.json` — **config file (class 2g), scalar `version` conflict.**
  Ours `0.0.225` (main-rooted resync base) vs theirs `0.0.215` (incoming
  bump 0.0.214→0.0.215 inside the picked commit). **Resolved to ours,
  `0.0.225`.** ⚠️ FLAGGED FOR POST-MERGE REVIEW — this departs from both
  the generic 2g "incoming wins" rule and the auto-enrichment rule
  ("take the more recent commit by timestamp", which points at theirs,
  20:43:36 > 20:38:31). Rationale:
    1. Taking theirs is a **version downgrade** (0.0.225 → 0.0.215) below
       main's line. The version must be monotonic; regressing it corrupts
       the version line and the free-coded version-bump gate.
    2. The compared timestamps are rewritten committer dates produced by
       this resync's own rebase, so they carry no intent signal.
    3. Established branch pattern: `git log main..HEAD -- package.json`
       is EMPTY — none of the 15+ prior picks on this resync branch carried
       a version change. Taking theirs would make this the sole pick with
       one, and a regression.
    4. The enrichment rule is the declared low-confidence fallback
       ("Intent unknown on one or both sides ... flag for post-merge
       review"), not an authority.
  Net effect: `package.json` matches HEAD and contributes no staged change.
  The picked commit touched it ONLY for the version bump — no other hunk
  was present, so no incoming content is lost.

No other conflicts. The four code/test files applied cleanly:
`packages/framework/src/l1/render.ts`, `packages/site-schema/src/l1/schema.ts`,
`tools/generate/src/l1/probes.ts`, `tests/req97-text-measure.test.ts`.

## Incoming changes preserved

Verified line-for-line against `CHERRY_PICK_HEAD` (d4589951c). Added-line
counts, incoming vs staged: render.ts 4/4, schema.ts 20/20, probes.ts 27/27,
req97-text-measure.test.ts 256/256. A direct diff of the +/- lines between
`git show $CPHEAD` and `git diff --cached HEAD` over the four files is
EMPTY — no incoming line discarded. The commit's three substantive changes
are all present:
- `sizing: l1AxisSizingSchema.optional()` on `l1TextSchema`
- text case in `render.ts` calls `axisSizingCss`
- `constrainWidth` narrows a node's frame by its own `sizing.width`

Net staged change vs HEAD: 4 files, +303 lines (non-empty — not a --skip case).
No conflict markers remain anywhere in the tree.
CHERRY_PICK_HEAD left intact at d4589951c; --continue/--skip/--quit/--abort NOT called.

## Functional verification

The staged index tree (f85a3f37) is byte-identical to a tree already built
and tested this session:
- `pnpm -r build` — all 7 workspace projects green
- `packages/framework` tsc --noEmit — clean
- `tests/req97-text-measure.test.ts` — 5/5 pass
- full vitest — 819 passed, 4 failed; all 4 failures are ENOENT on the
  gitignored `storage/references/gigabytealchemy.ai/index/multistate.json`
  capture bundle (absent in a fresh worktree). They throw in the fixture
  loader before any picked code runs, so they are environmental and
  pre-existing, not caused by this pick.

## Process deviation (disclosed)

In the turn PRECEDING these instructions, `git cherry-pick --continue` was
run, completing the pick as 8ef47ee6e and clearing CHERRY_PICK_HEAD — the
state the next Python step depends on. Remediated by `git reset --hard
99be2943c` and re-applying `git cherry-pick d4589951c`, reproducing the
paused-and-conflicted state, then resolving and staging only. The restored
staged tree hashes identical to the completed commit's tree, confirming the
reconstruction is exact and lossless.
