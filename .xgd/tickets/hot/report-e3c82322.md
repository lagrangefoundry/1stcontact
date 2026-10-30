---
uid: report-e3c82322
id: REPORT-5818
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T20:04:11.425892+00:00'
updated_at: '2026-10-02T20:04:11.425892+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution — `dc7958c81c` (REQ-338)

**Pick:** `dc7958c81c0985775c260f21ab14655e80f85496` — _fix(fold,capture): paint each band once, and read the veil it is under [FREE-CODED]_ (author 2026-09-28 21:45:59 -0700), 12 files, +1485/−76
**Branch / HEAD:** `resync-377b581e`, HEAD `94f9b7946f` (unmoved)
**Apply target:** `ec118d67626fd31cfce67ca88dc9908ecdde70ed`
**Retry count:** 1, `prior_stage_failure` empty.

## Conflicted files

| Path | Class | Regions | Resolution |
|---|---|---|---|
| `package.json` | 2g (config scalar) | 1 (`version`) | incoming (`--theirs`) |

The pick's other 11 paths (`packages/framework/src/l1/render.ts`, `packages/site-schema/src/l1/schema.ts`,
`tools/generate/src/l1/fold.ts`, four `tools/generate/src/cli/capture/*` files, the REQ-271 test and the
three new REQ-338 tests) applied cleanly and were left exactly as git staged them.

## What each side changed

- **Base** (`d62f12632d`): `"version": "0.2.401"`
- **Ours** (`617f5c5443`): `0.2.403` — set by `c25e071607` (BUG-163 pick, already on this branch).
- **Theirs** (`10a256dd24`): `0.2.404`

`git diff :1: :2:` and `git diff :1: :3:` are each exactly that one line, so nothing else in the file
needed adjudicating. `version` is a monotone counter bumped by each FREE-CODED commit; incoming is
ours + 1, i.e. the next bump in sequence, and this pick is the commit that carries it. Incoming wins,
which is also what §2g says for scalar config conflicts. The resolved file is byte-identical to stage 3.

The enrichment's "take the more recent commit by timestamp" rule agrees here (incoming 21:45:59 vs
ours' 21:28:36), but the decision rests on the counter order, not on wall-clock order. With both
deltas one line, there is nothing left to flag for post-merge review in this file.

## Verification

- No conflict markers remain; `git status --porcelain` shows only the pick's 12 paths, all staged
  (`M `/`A `); `git diff --cached HEAD -- package.json` is `-0.2.403` / `+0.2.404`.
- CHERRY_PICK_HEAD intact (`dc7958c81c`), HEAD unmoved. Only paths inside the pick's own diff are staged.
- `vitest run tests/test_UAT_FC_REQ-271_band_surface_fill.test.ts`: 6/6 pass.
- `tsc -p tools/generate --noEmit`: no errors in any file this pick touches.

## Not verified

- The three new `tests/test_UAT_FC_REQ-338_*.test.ts` files could not be executed in this worktree:
  each fails at import with `Cannot find package 'miniflare' imported from
  tools/generate/src/fonts/seed.ts` (reached via `tools/generate/src/cli/font-mirror.ts`). `miniflare`
  is declared in `tools/generate/package.json` (since `aaca57be9e`, 2026-09-24) but is not installed in
  this worktree's `tools/generate/node_modules`. `seed.ts` is not part of this pick, so this is the
  worktree's install state, not the resolution — but it means those 3 suites ran 0 tests here. They
  need a run after `pnpm install` in this worktree (or in the interactive role).
- `tsc` reports the same missing-module error at `src/fonts/seed.ts(66,27)`, plus the three
  `templateUid` / `OutgoingMessage` errors in `apps/control-app` that were already on the branch.
