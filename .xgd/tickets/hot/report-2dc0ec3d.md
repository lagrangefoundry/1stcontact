---
uid: report-2dc0ec3d
id: REPORT-4167
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T23:09:37.328273+00:00'
updated_at: '2026-09-13T23:09:37.328273+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Context that determined every resolution

The incoming commit 53374730fa ("Merge branch 'free-REQ-165' into xgd-working",
author date 2026-09-01 11:31:12) has ALREADY been cherry-picked into this bundle
once, as 4573b1ee81 (committed 2026-09-11 02:58:20, same subject, same author
date, same original commit re-committed via 9ca0dde528 -> 97244b5e67 ->
4573b1ee81). HEAD therefore already carries the whole of REQ-165 — kb-projection.ts,
writeProjections/corpusMembership/projectedDocument, the `projected` field on
KbStatus, the two-producer `corpus: N exported + M projected` status line in
cli/index.ts, and the KB_USAGE two-producer paragraph — in a LATER, further
evolved form than the version being replayed now.

So this cherry-pick is a stale earlier form of a change HEAD already integrated.
Per STEP 4 (BUG-1109/BUG-1122) a near-empty net diff is the expected outcome,
and per STEP 3 the incoming changes are present in HEAD via a different route,
not discarded.

## Files resolved

- `package.json` — UU, config/scalar (2g). HEAD `0.2.31` (bump for REQ-165,
  FREE-CODED) vs incoming `0.2.29 -> 0.2.30`. Kept HEAD `0.2.31`: the incoming
  bump landed with the earlier cherry-pick and was then superseded by a higher
  developer bump for the same requirement. Net diff vs HEAD: none.

- `tools/generate/src/cli/kb.ts` — UU, implementation (2c). Two issues:
  1. Git auto-merged BOTH sides' identical
     `import { isProjected, projections, type ProjectedDoc } from './kb-projection'`
     line (HEAD's above the kb-model import, incoming's below), producing a
     duplicate-identifier compile error. Removed the duplicate, kept HEAD's
     placement — identical text, so nothing incoming is lost.
  2. Doc comment on `KbStatus.projected`. Kept HEAD's wording. That wording is
     verbatim the developer's own later form (present at 4573b1ee81:kb.ts:932);
     incoming's earlier wording refers to "the check below", which is in
     cli/index.ts, not kb.ts. 2c.3.a: HEAD is the later position of the same
     free-coded change.
  Net diff vs HEAD: none. Typechecked clean with `tsc -p tools/generate/tsconfig.json`
  (the only errors reported are a pre-existing `CARETAKER_PURPOSE` duplicate
  declaration in `ai/host-core.ts`, a file this cherry-pick does not touch).

- `tests/reconciliation-system-knowledge-base.test.ts` — UU, test (2c/2f).
  Three conflict regions, all in
  `test_UAT_AC1293_status_reports_the_corpus_against_the_ticket_count_and_each_artefact`.
  HEAD (reconcile bundle-87be4669, story-c4f329d3) restructured this test after
  the earlier cherry-pick landed: the store is now driven through `paging()`, a
  `tickets: number | null` field was added, `withRealCorpusAside` was introduced,
  and every `kbStatus` assertion moved inside a controlled store. Incoming's
  contribution to each region was only the `projected` assertion, so all three
  were resolved by COMBINING (2c.2), not by picking a side:
  1. Kept HEAD's `withStore(paging([]), ...)` / `toMatchObject` (incoming's
     `withStore([])` / `toEqual` predate the paging store API and the `tickets`
     field), and appended incoming's explanatory sentence about `projected`.
     `projected: 0` is asserted.
  2. HEAD deleted a standalone out-of-store `expect(kbStatus(root))` block that
     existed in the merge base; incoming only added `projected: 0` to it. Kept
     HEAD's deletion — the coverage is retained by the in-store assertion
     immediately above it, and the block cannot run outside a store now that
     `tickets` reads it.
  3. Added incoming's `projected: 0` to HEAD's post-`buildKb` assertion, which
     had lost it in the restructure.
  Plus the bare-vs-named region: HEAD had weakened the corpus-line assertion to
  `/^corpus: /m` because the exact wording moved to AC-1635. Tightened it to
  `/^corpus: \d+ exported \+ \d+ projected/m` so incoming's actual intent — the
  line names both producers separately — is asserted here too, without
  reintroducing the removed `expected` binding.
  Verified: `vitest run tests/reconciliation-system-knowledge-base.test.ts -t AC1293`
  => 1 passed.

- `tests/test_UAT_FC_REQ-165_projected_reference.test.ts` — clean auto-add
  (base absent, HEAD absent, incoming present), REMOVED via `git rm` under the
  BUG-1301 PRECEDENCE exception. Detail in the next section.

## Incoming changes preserved

- `package.json` — the version bump is present in HEAD at a strictly higher
  value (0.2.31 >= 0.2.30). Present via a different route.
- `tools/generate/src/cli/kb.ts` — every incoming addition is already in HEAD:
  the `kb-projection` import, `writeProjections`, `corpusMembership`,
  `projectedDocument`, the `projected` field, `kbStatus`'s
  `files.filter(isProjected)` line, and the KB_USAGE two-producer paragraph.
  Verified by inspection of the resolved file.
- `tests/reconciliation-system-knowledge-base.test.ts` — all three `projected: 0`
  assertions are present in the resolved file, and the two-producer corpus-line
  intent is asserted twice: as a shape here, and verbatim at
  `tests/reconciliation-projected-reference.test.ts:471`
  (`test_UAT_AC1635_status_reports_the_generated_references_separately_from_the_exported_documents`).

### BUG-1301 precedence: `tests/test_UAT_FC_REQ-165_projected_reference.test.ts`

Dropped, not by my choice — acknowledging a decision already integrated into HEAD.

- The file was added to this bundle by the earlier cherry-pick of THIS SAME
  commit (4573b1ee81), and then deleted by `369a2cc500` — "Workflow
  reconciliation_uat_generation_prompt completed: done", `xgd-kind: reconcile`,
  `xgd-intent: bundle-87be4669`, `xgd-story: story-5836022a`.
- That single commit is a replacement, not a removal: in the same commit it adds
  `tests/reconciliation-projected-reference.test.ts` (+944) as the file it
  deletes (-379) is removed. The replacement is a strict superset — all 13
  free-coded `test_UAT_FC_REQ-165_*` behaviours reappear as AC-numbered tests
  (AC1634 build-writes-a-projection-per-source, AC1636 membership-from-the-
  declaration, AC1637 each-producer-sweeps-its-own-namespace, AC1638 unchanged-
  projection-keeps-its-stamp, AC1639 every-component-with-its-settings, AC1640
  no-component-the-catalogue-lacks, AC1641 element-kinds-and-value-sets, AC1642
  no-definition-leak, AC1643 every-declared-operation, AC1644 no-internal-ticket,
  AC1645 names-its-source-in-the-body, AC1646 retrieval-returns-the-passage),
  plus AC1635, which is new coverage the UAT file did not have. It imports the
  same API surface (`writeProjections`, `corpusMembership`, `projectedDocument`,
  `projections`, `isProjected`, `PROJECTED_PREFIX`).
- So this is a documented UAT-generation refactor of this exact file from this
  exact commit, made AFTER the commit landed and already integrated into HEAD —
  not LLM churn, and not me deleting an inconvenient test. Re-adding it would
  resurrect 13 duplicate tests that a later, deliberate step retired.
- Verified the replacement is green: `vitest run tests/reconciliation-projected-reference.test.ts`
  => 13 passed (13).

## Pre-existing failure, unrelated to this resolution (for the reviewer)

Running the whole file gives 4 failures — `test_UAT_AC1292`, `AC1295`, `AC1296`,
`AC1297` — all `ReferenceError: optedIn is not defined`. `optedIn` is a leftover
of the pre-REQ-164 membership predicate (now `inSystemKb`). These lines are
identical in `HEAD:tests/reconciliation-system-knowledge-base.test.ts:1275-1310`,
are outside every conflict region, and are untouched by both this cherry-pick and
my resolution. Flagged, not fixed — it belongs to the reconcile review, not to
conflict resolution. AC1293, the only test I changed, passes.

## Staging

`git status --porcelain` shows no conflict classes. Only
`M  tests/reconciliation-system-knowledge-base.test.ts` is staged against HEAD;
`package.json` and `tools/generate/src/cli/kb.ts` resolve to HEAD exactly, and the
UAT file is removed. `CHERRY_PICK_HEAD` left intact for
`cherry_pick_finalize_resolution`.
