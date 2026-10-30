---
uid: report-b292ff57
id: REPORT-5825
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T21:46:43.671530+00:00'
updated_at: '2026-10-02T21:46:43.671530+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution — pick `29a0fdb469` (REQ-352)

- Picked commit: `29a0fdb469f901e2afdc5f01b065ce6f7a0519c7` — `feat(capture): one content-anchor population over both sides [FREE-CODED]` (2026-09-29 18:22:43 -0700)
- HEAD at resolution: `75ee32ff17fb774d6b47f772c073a33984f370c4`
- Apply target: `ec118d67626fd31cfce67ca88dc9908ecdde70ed`
- Retry count: 1, `prior_stage_failure` empty
- Conflicted paths: `package.json`, `tools/generate/src/cli/capture/schema.ts`

## Cause

REQ-347 (`9e6d314409`, already on this branch) and REQ-352 (this pick) each
claimed **capture schema 9**: both add a `**9**` docblock entry, set
`CAPTURE_SCHEMA = 9`, and add `since: 9` axes at the same spot. `package.json`
is the usual version-counter collision (base .409 / ours .412 / theirs .410).

## Resolution: the developer's own merge is the oracle

The developer already resolved this exact conflict on xgd-working in
`e5721207d3` (`Merge free-REQ-352 into xgd-working`, parents `7ceb934925` and
`29a0fdb469` = this pick). Resync never picks merge commits, so that resolution
cannot arrive through the queue. Inputs proven identical before using it:

- stage 2 of both conflicted paths == the merge's first-parent blobs
  (`package.json` `a09cf1de80`, `schema.ts` `26dbe0a0d3`)
- `git diff --stat HEAD e5721207d3^1` over the pick's paths differs only in two
  fold test files (branch-local drift, see below)

Took the merge's blob for five paths, all inside the pick's own diff:

| Path | What the merge did |
| --- | --- |
| `tools/generate/src/cli/capture/schema.ts` | REQ-352's entry renumbered to **10**; `CAPTURE_SCHEMA = 10`, `ANCHOR_POPULATION_SCHEMA = 10`; both REQ-347 `since: 9` axes kept, the anchor axis is `since: 10`. Nothing dropped from either side. |
| `package.json` | `0.2.413` — ours' .412 re-bumped. Incoming's .410 was already retired on HEAD (`ba2f372ae0`: "0.2.410 was claimed by BUG-169"). Only the `version` line differs from ours. |
| `tools/generate/src/cli/capture/index.ts` | exports `ANCHOR_POPULATION_SCHEMA` (applied clean, but the merge edited it outside any marker) |
| `tools/generate/src/cli/capture/value-axes.ts` | `anchorPopulation` note: "capture schema 9" -> "capture schema 10" (same) |
| `tests/test_UAT_FC_REQ-352_one_content_anchor_population.test.ts` | asserts on `ANCHOR_POPULATION_SCHEMA` instead of a hardcoded 9 (same) |

The last three matter: taking only the two marked files would have left the
pick's own UAT asserting `capture schema 9` against a comparator that now says
10, and importing a constant the index did not export.

The auto-enrichment's "take the more recent commit by timestamp" rule was not
applied to either file — it would have picked one side's schema 9 and dropped
the other's.

## Left branch-local

`tests/reconciliation-l1-fold.test.ts` and
`tests/reconciliation-l1-fold-seams-and-refold.test.ts` stay as the pick applied
them. Their staged-vs-merge difference (399/19 lines) is exactly the
HEAD-vs-`e5721207d3^1` difference reversed, i.e. content this branch already
carries that the merge's first parent did not; the merge made no edit of its own
there.

## Verification

- `git diff --cached --stat e5721207d3 -- <17 pick paths>`: only the two fold
  test files above.
- Staged paths outside the pick's diff: none (`comm -23` empty). No conflict
  markers remain. `CHERRY_PICK_HEAD` intact, HEAD unmoved.
- `tools/generate` `tsc --noEmit`: 4 errors, all already on the branch and on
  untouched files (3x `templateUid` not in `OutgoingMessage` in control-app,
  `miniflare` not found from `src/fonts/seed.ts`). None from this pick.
- vitest over the pick's 9 test files: 3 files / 26 tests pass. The other 6
  (`bug13-fold-section-background`, both `reconciliation-l1-fold*`,
  `req48-fidelity-axes`, `BUG-103_manifest_seam`, `REQ-274_one_projection`)
  **did not run** — they fail at import with `Cannot find package 'miniflare'`
  from `tools/generate/src/fonts/seed.ts`, a missing install in this worktree,
  not a result of the resolution. They are unverified here.

## Forecast

Next REQ-352 pick is `c4b05c746f` (`chore: bump version to 0.2.414 for REQ-352`),
whose parent state is .413 — it should now apply to `package.json` without a
conflict.
