---
uid: report-efc9cb2c
id: REPORT-5407
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T23:24:40.354681+00:00'
updated_at: '2026-09-28T23:24:40.354681+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Summary

Incoming commit `855dd57a7c` ("feat(builder): the Library tab and the
drop-to-upload overlay [FREE-CODED]", REQ-161) is a **duplicate of
`a6d1b6b7bd`, already integrated into HEAD**, on top of which HEAD
carries two later refinements — `58eca7022a` (free-BUG-42) and
`270aa2aa50` (free-REQ-172). Six conflicts, all resolved by taking
HEAD (the strict superset). No developer code was discarded.

## Files resolved

- `package.json` — UU, config scalar (2g). Version bump conflict.
  Kept HEAD `0.2.40` over incoming `0.2.25`.
- `apps/control-app/src/builder/builder.css` — UU, code (2c). Two
  hunks, incoming side empty at both points; kept HEAD's REQ-172
  reader-window styles and BUG-42 description-prose rules.
- `apps/control-app/src/builder/app.js` — UU, code (2c). Three hunks,
  incoming side empty at all three; kept HEAD's `markdownReady`
  import + option and `getModalHost`.
- `apps/control-app/src/builder/library.js` — AA, both added (2b).
  Eleven hunks; HEAD is a strict superset at every one (REQ-172
  `mountReader`/`readerKind`, BUG-42 `paintDescription` +
  MutationObserver, `preview()` returning `{element, destroy}`).
- `apps/control-app/src/material.ts` — UU, code (2c). Four hunks;
  HEAD superset at each (REQ-172 `content_type` via
  `resolveContentType`, hoisted `filename` local, `not_found` →
  `NotMaterialError` mapping).
- `tests/reconciliation-builder-workspace-chrome.test.ts` — UU, test
  (2f). Five hunks, kept HEAD. **No test function deleted on either
  side.** Both sides restate AC-959/AC-976 against the tab
  DECLARATION rather than a literal `1`; HEAD states it more
  strongly (asserts `TABS.length`, panel-id set equality in both
  directions, opens-on-FIRST-declared-tab, per-declaring-tab
  `is-fill` class) and is the only side that compiles — see below.

## Incoming changes preserved

`git diff --stat a6d1b6b7bd 855dd57a7c` over the four source files
(`library.js`, `material.ts`, `app.js`, `builder.css`) reports **no
differences at all**. The incoming side of those four conflicts is
byte-identical to content HEAD already contains at `a6d1b6b7bd`;
HEAD then adds BUG-42 and REQ-172 on top. Nothing to preserve was
dropped — taking HEAD preserves the incoming content *and* its two
later refinements.

The single difference between the two commits is `package.json`'s
version scalar (`0.2.31` vs `0.2.25`); HEAD's `0.2.40` post-dates
both, so 2g's "incoming wins" would regress the version. Kept HEAD.

Two resolutions were **forced**, not merely preferable — the incoming
text does not compile against HEAD:

- `library.js`: HEAD's `preview()` returns `{element, destroy}` while
  the incoming side returns a bare `wrap`. `openDetail` reads
  `shown.element` and calls `shown.destroy()`, so the incoming shape
  breaks its caller.
- `reconciliation-builder-workspace-chrome.test.ts`: HEAD binds
  `panels` and `first`, and its `delivered` handler signature is
  `(value, tab, index)`. Non-conflicted lines below the hunks
  reference `panels`, `first`, and pass `index`; `git show
  855dd57a7c:` confirms the incoming version defines none of them.
  Only HEAD's side typechecks.

BUG-1301 precedence was **not** invoked — no hunk was dropped on the
grounds that its target had been refactored away. Every incoming hunk
is present in HEAD in identical or evolved form.

## Verification

- `vitest run --project=node` over `reconciliation-builder-workspace-chrome`,
  `test_UAT_FC_REQ-161_library_tab`, `test_UAT_FC_REQ-161_upload_overlay`:
  3 files, 22 tests, all pass.
- `tsc -p apps/control-app/tsconfig.json --noEmit`: clean, exit 0.
- The two `*.workers.test.ts` files could NOT be executed: the workers
  pool dies on `listen EPERM: operation not permitted 127.0.0.1`,
  which this sandbox denies. Unverified by execution; `material.ts` is
  the only workers-side file involved and it resolved to exactly HEAD,
  so it carries the target's already-committed behaviour, and the
  typecheck above covers it statically.

## Staging

Six files staged; no UU/AA/DU/UD lines remain. `CHERRY_PICK_HEAD`
left intact. The five non-test files resolved to byte-identical-to-HEAD,
so the staged diff contains only the four test files plus one
auto-merged comment line in the chrome test — finalize may find this a
near-empty commit, which is expected for a duplicate commit.
