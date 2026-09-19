---
uid: report-882bd885
id: REPORT-4393
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T11:02:15.193115+00:00'
updated_at: '2026-09-19T11:02:15.193115+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

Cherry-picked commit: 835230e1bd60b8c2dbd2d681962a4a9ac78abdb7 — "Merge branch 'free-REQ-155' into xgd-working" (mainline parent 694e0cff8d).

## Files resolved

- `package.json` — UU, config scalar (2g / metadata timeline rule). HEAD `0.2.40` vs incoming `0.2.32`. Kept HEAD's `0.2.40`: it is the later working-timeline position, and a package version bump is reconcile bookkeeping, not developer code intent. Re-applying `0.2.32` would move the repo version backwards.

- `tests/req93-l1-slot-mounted-behaviors.test.ts` — UU, test/code file (2c.2, non-overlapping changes combined). The only conflict hunk was an adjacent-import collision at the top of the file: HEAD added `mobileOverflow` / `throwsOnRender` conformance-fixture imports, incoming added nothing at that point. Kept HEAD's two imports and removed the markers. The incoming side's own import (`fsReferenceBundle`) merged cleanly one line above and is present at line 62; no test function was added, modified or removed on either side.

- `tests/reconciliation-colour-census-and-retrofit.test.ts` — DU, resolved with `git rm` under 2a ("deleted as part of a legitimate refactor, incoming modification now obsolete") and the BUG-1301 PRECEDENCE note (see below).

## Incoming changes preserved

- `tests/req93-l1-slot-mounted-behaviors.test.ts` — the incoming commit's entire change to this file is the REQ-155 sync→async reference-store conversion: the `fsReferenceBundle` import, `await writeL1(fsReferenceBundle(ref), …)` / `await writeForms(fsReferenceBundle(ref), …)`, `await cmdRepro(...)`, the `async` on `test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour`, and the `expect(() => …).toThrow` → `await expect(…).rejects.toThrow` rewrites. All of it is already in HEAD (verified with `git show HEAD:tests/req93-l1-slot-mounted-behaviors.test.ts` — lines 62, 583, 584, 586, 614, 616, 617, 620, 621), landed by an earlier cherry-pick of the same free-REQ-155 work in this bundle. Present via a different route, not discarded.

- `package.json` — incoming's only change is the `0.2.31` → `0.2.32` version bump; deliberately not applied, per the reasoning above. No code content on either side.

### Hunk dropped under the BUG-1301 precedence exception

- File: `tests/reconciliation-colour-census-and-retrofit.test.ts`
- HEAD-side commit that removed the target: `b8399b2fcf` — "fix(uat): retire the superseded colour-retrofit UATs and stale wording" (2026-09-10), reachable from HEAD.
- Why the removal is a legitimate refactor, not a resolution shortcut: `b8399b2fcf` was the ac-level repair for report-dde93f42 (uat level, capability-b4ac88fc). Its message documents that this file is the pre-REQ-137 original which claimed AC-939…AC-947 a *second* time with four byte-identical test function names — so the AC→test index could not attribute them — and that its AC-944 test asserted a pixel-identity guarantee REQ-137 had already superseded, passing as evidence for a retired guarantee. `tests/reconciliation-colour-retrofit-shade-model.test.ts` is named there as a strict superset and is the surviving file. The deletion predates this cherry-pick, is a deliberate operator-visible decision with verification recorded in its message, and was not made by me here.
- What the dropped hunk contained: only the same mechanical REQ-155 async conversion (`fsReferenceBundle` import, `await writeL1(fsReferenceBundle(dir), …)`, `await cmdRepro(...)`, one `it(...)` made `async`). No test function was added or removed by the incoming side. The superseding file already carries the identical conversion in HEAD (`tests/reconciliation-colour-retrofit-shade-model.test.ts` lines 76, 283, 946), so no REQ-155 behaviour is left unexercised by dropping it.

## Staging

`git status --porcelain` is empty: the resolution nets to no diff vs HEAD, because both the async conversion and the UAT retirement already reached this branch by other routes. Per STEP 4 this is not a failure — `--skip` was not called, CHERRY_PICK_HEAD is left intact for `cherry_pick_finalize_resolution`.
