---
uid: report-87e9af9e
id: REPORT-1691
type: report
title: 'Resolve conflicts: branch-BUG-32'
created_by: xgd
created_at: '2026-08-08T01:18:52.611252+00:00'
updated_at: '2026-08-08T01:18:52.611252+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: branch-BUG-32
---

## Files resolved

- **`tools/generate/src/cli/builder.ts`** — implementation file (STEP 3d),
  both sides matrix-managed `develop` on intent bug-5cabb340.
  Ours = `coding_green` (0f308ea), theirs = `fix_review` (4662d00).
  Resolved to **THEIRS wholesale** by the later-working-timeline rule.
  Both sides implement the SAME intent (universal `no-store`); theirs
  supersedes ours rather than diverging from it: ours declared a local
  `const NO_STORE` and restated `'cache-control'` at each route/404/403,
  theirs imports `NO_STORE` from `./serve` and sets it once via
  `res.setHeader` before routing. Nothing in ours is lost in meaning —
  every restatement it added is covered by the single `setHeader`.
  Taking theirs also repaired a latent break: git's auto-merge had kept
  ours' local `const NO_STORE` (line 132) alongside theirs' import
  (line 11), a duplicate-identifier error that would not have compiled.

- **`tests/reconciliation-builder-workspace-origin.test.ts`** — UAT file
  (STEP 3a). Ours = `coding_red` (998e418), theirs = `fix_review` (4662d00).
  The conflict was confined to one test function,
  `test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable`,
  modified differently on each side, so the timeline rule applied and
  **THEIRS won**: theirs replaces a hand-maintained probe list with a
  structural check that reads the routing table out of the origin's own
  source and asserts both directions of coverage.
  Resolved by **splicing theirs' AC977 block only**, NOT by taking theirs
  wholesale. Taking the whole file would have resurrected
  `test_UAT_AC972_publish_creates_a_revision_for_the_displayed_site`,
  which ours had deliberately relocated to
  `tests/reconciliation-builder-workspace-mounted.test.ts` (verified
  present there) — a wholesale take would have duplicated it.
  Splicing also removed a HEAD-only leftover that git had left outside the
  conflict markers as false common context (a call to the deleted `noStore`
  helper at old line 440), which would have been a reference error.
  **No test function was deleted**: all 10 in the file before and after,
  plus AC972 intact in the mounted suite.

## Rebase status

**Completed.** A rebase was paused at commit 67/98 (`4662d00`
"Workflow fix_review completed: done") onto `10e848c4`. After resolving
the two files above and staging them, `git rebase --continue` replayed the
remaining 31 commits with no further conflicts. All 98 applied;
`rebase-merge`/`rebase-apply` both absent, no `UU` entries, no conflict
markers anywhere in tracked files.

## Timeline lookups

`xgd working-timeline 998e418 0f308ea 4662d00`:

| commit | workflow | timestamp | iso |
|---|---|---|---|
| 998e418 | coding_red | 1786147037 | 2026-08-07T23:57:17Z |
| 0f308ea | coding_green | 1786147481 | 2026-08-08T00:04:41Z |
| 4662d00 | fix_review | 1786149244 | 2026-08-08T00:34:04Z |

`fix_review` is latest on both files, so THEIRS won both conflicts.

## Rebase-induced regression, repaired (outside the conflict set)

Rebasing onto the updated `main` introduced a **semantic conflict git could
not see textually** — no markers, so it was not in the STEP 2 inventory.
`main` contributed two files whose prose names the superseded component
scope, while this branch's own committed guard forbids that literal:

- `tests/reconciliation-builder-workspace-mounted.test.ts:6`
- `tests/req118-image-selection.test.ts:370`

This broke `test_UAT_AC960_component_scope_is_written_in_exactly_one_place`,
which is BUG-32's own subject and is explicit that the ban covers "prose
such as a comment". Evidence it is rebase-induced rather than pre-existing:
the pre-rebase branch tip (`e2e4462`) had **zero** occurrences of the
superseded scope under `tests/`; both offending files carry it at the
rebase base `10e848c4`.

Repaired with two minimal scope-neutral rewords (the guard's clause (b)
bars substituting the in-use scope, which may appear only in its single
declaration plus the declared browser-source exception). No test logic
touched — doc comments only. These two edits are left UNCOMMITTED for the
state's auto-commit step, per instructions.

## Verification

- `tests/reconciliation-builder-workspace-origin.test.ts` — 10/10 pass.
  AC977 reads `builder.ts`'s routing table directly, so this is positive
  evidence that the two independently-resolved files agree.
- `bug32-webui-scope-rebrand` + `origin` + `mounted` + `req118` — 26/26 pass.
- Full suite: **1227 passed, 67 skipped, 6 failed (184 files)**.

### The 6 remaining failures are PRE-EXISTING and unrelated to this task

`tests/reconciliation-copy-edit-gesture-modal.test.ts` (story-3bf94bd4,
5 failures) and `tests/req115-builder-composition.test.ts` (REQ-115,
1 failure). Not caused by the resolution or the rebase:

- Both test files are **byte-identical** to the pre-rebase branch tip
  (`git diff --quiet e2e4462 HEAD` clean on each).
- Their subject, `apps/control-app/src/builder/`, is **unchanged** across
  the entire rebase (empty diff `e2e4462..HEAD`).
- They fail identically **in isolation**, so it is not cross-file pollution.
- Neither is in the conflict set; neither was touched by this task.

Flagged for the next phase rather than fixed — they are outside the
conflict-resolution mandate.
