---
uid: report-0ce7f759
id: REPORT-5808
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T16:05:10.638187+00:00'
updated_at: '2026-10-02T16:05:10.638187+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution — `6b9f256e0b` (REQ-325) onto REQ-326

**Picked commit:** `6b9f256e0b5a14368c29efa9069c92f22cff402d` — feat(l1): scroll-position-driven state — `sticky` and `scrollTrack` [FREE-CODED] (author 2026-09-26 00:13:07 -0700, 9 files)
**HEAD:** `d9db19918b` · **apply target:** `ec118d67626fd31cfce67ca88dc9908ecdde70ed` · **prior_stage_failure:** empty · retry 1

## Conflicts (all `UU`, code / UAT test — classes 2c, 2f)

| Path | Resolution |
|---|---|
| `packages/site-schema/src/l1/schema.ts` | keep BOTH (developer merge blob) |
| `packages/site-schema/src/l1/types.ts` | keep BOTH (developer merge blob) |
| `packages/site-schema/src/l1/validate.ts` | integrate (developer merge blob) |
| `tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts` | keep BOTH (developer merge blob) |

Ours on every path is REQ-326 ("one element, more than one entrance behaviour"), which landed
on this branch before REQ-325 — the reverse of xgd-working's order.

## Method — the developer's own merge is the oracle

`e793087f69` "Merge xgd-working into free-REQ-325 [FREE-CODED]" (2026-09-26 00:19:03, six minutes
after the pick) has first parent == the picked commit and second parent carrying REQ-326. It is
the developer's resolution of this exact conflict, and resync never picks merge commits, so it
cannot arrive through the queue.

- Inputs match: `git diff --stat HEAD e793087f69^2` over `render.ts`, all of
  `packages/site-schema/src/l1/` and the three touched test files is **empty**; the four stage-2
  blobs equal `e793087f69^2`'s blobs (`4409662`, `51eb0d5`, `04334c7`, `dfb42c0`).
- Took the merge blob at the four conflicted paths.
- Also took the merge blob for `tests/test_UAT_FC_REQ-325_scroll_position_state.test.ts` (the
  pick's own new file, applied cleanly). The merge widened it by +37/-1: a COMPOSED entrance
  (REQ-326's list spelling of `reveal`) beside a `scrollTrack` is refused by `oneMotionDriver`,
  and a composed entrance alone is accepted. This is the developer's content, not authored here.
- The other four pick paths (`render.ts`, `email.ts`, two reconciliation/req105 tests) auto-merged
  to exactly the merge's blobs.

Result: `git diff --cached --stat e793087f69` over all nine pick paths is **empty** — the staged
tree is byte-identical to the developer's merge at every path the pick touches.

## Incoming preserved (STEP 3)

Lines of the incoming blobs absent from the resolution, all accounted for:

- `types.ts`, BUG-48 test: none.
- `schema.ts`: 3 lines — the `reveal: l1RevealSchema.optional()` field and two doc comments. These
  are base text that REQ-326 rewrote (`reveal` is now `l1EntranceSchema`); not REQ-325 content.
- `validate.ts`: 17 lines — the inline REQ-100 reveal-bounds check in `checkEffects`. REQ-326
  factored it into `checkEntrance` (`validate.ts:447` calls it, defined at `:706`); the merge
  message names this as its one substantive resolution. Subsumed, not lost. REQ-325's new
  `sticky` and `scrollTrack` blocks follow it intact.
- No test function deleted (2f).

## Checks

- No conflict markers in any of the four files; `git status` shows only staged `M`/`A` entries.
- Every staged path is inside the pick's own diff (`comm -23 staged pick` empty).
- `vitest run` on the four suites the pick touches: 4 files, 30 tests, all pass (REQ-325 suite,
  BUG-48 reference coverage, `reconciliation-l1-shared-axis-groups`, `req105-node-axis-groups`).
  Wrangler's debug-log `EPERM` noise in the output is the sandbox, not a failure.
- `CHERRY_PICK_HEAD` intact, HEAD unmoved.

## Notes for review

- The enrichment's rule on all four paths ("intent unknown, take the more recent by timestamp")
  was not followed: on code, incoming is authoritative and both sides were integrable.
- Not run: `tsc`, workers suites, the full test run.
