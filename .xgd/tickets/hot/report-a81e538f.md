---
uid: report-a81e538f
id: REPORT-4386
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T10:41:52.621742+00:00'
updated_at: '2026-09-19T10:41:52.621742+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

Incoming commit: `53374730fa` — *Merge branch 'free-REQ-165' into xgd-working*, authored
2026-09-01. HEAD (`ab0dc56f30`) already carries two LATER free-coded REQ-165 merges —
`4573b1ee81` (2026-09-11) and `7eed89b2ee` (2026-09-14) — plus the follow-up fix
`bf817873a2` *fix(kb): drop the duplicate doc_kind declaration left by the merge*. Both
sides are therefore free_coded on the SAME intent (REQ-165), so the 2c exception applies:
the later working-timeline position wins per hunk. In every conflicted hunk here that is
HEAD, and HEAD's version is a strict refinement of the incoming text, not a competing one.

- `package.json` — UU, rule 2g (scalar). HEAD `0.2.40` kept over incoming `0.2.30`. The
  incoming value is an older free-coded bookkeeping bump; taking it would move the repo
  version backwards.

- `tools/generate/src/cli/kb.ts` — UU, rule 2c. Two things arrived from the merge:
  1. A DUPLICATE `import { isProjected, projections, type ProjectedDoc } from
     './kb-projection'` (auto-merged in at line 59 beside HEAD's identical import at
     line 57, because the two sides placed it either side of the `kb-model` import). That
     is a duplicate-identifier compile error, and exactly the failure mode `bf817873a2`
     already fixed once for `doc_kind`. Dropped; the single HEAD import remains.
  2. The `KbStatus.projected` JSDoc paragraph. Kept HEAD's wording. The incoming
     paragraph's unique factual content — "the healthy state is `corpus === tickets +
     projected`", and that without the split a current corpus reports itself stale by
     exactly the number of projections — is already documented verbatim in HEAD at
     `tools/generate/src/cli/index.ts:818-822`, next to the check that actually performs
     the comparison (`const exported = s.corpus - s.projected`). No fact is lost.

- `tests/reconciliation-system-knowledge-base.test.ts` — UU (4 hunks), rules 2c/2f. All
  four hunks are inside the one test `test_UAT_AC1293_status_reports_the_corpus_against_
  the_ticket_count_and_each_artefact`. HEAD's side is the later refactor of that same
  test: status assertions are wrapped in `withStore(paging(...))` so `tickets` is asserted
  against a controlled store rather than the machine's real ticket store, and the corpus
  line is asserted by anchored shape against that controlled store. Taken per hunk:
  1. `withStore(paging([]), …) / toMatchObject` (HEAD) over `withStore([], …) / toEqual`
     (incoming) — the asserted object is identical and already contains incoming's
     `projected: 0`.
  2. Incoming's extra un-stubbed `expect(kbStatus(root)).toMatchObject({corpus, projected:
     0, …})` dropped: it is a duplicate of the assertion HEAD retains three lines above
     inside the store stub, and calling `kbStatus()` outside the stub reads whatever
     tickets this machine happens to have. Its only new fact, `projected: 0`, survives in
     the retained assertion.
  3. Post-build status: HEAD's `withStore(paging(CORPUS), …)` wrapper kept; it asserts
     everything incoming's hunk asserts (`corpus`, `projected: 0`, `index/chunks/map`)
     plus `tickets`.
  4. Corpus-line assertion: HEAD's `expect(bare.out).toMatch(/^corpus: \d+ exported \+
     \d+ projected/m)` kept over incoming's `expect(bare.out).toContain(\`corpus:
     ${expected.corpus - expected.projected} exported + ${expected.projected}
     projected\`)`. Incoming's form is not merely older, it cannot compile here: HEAD
     removed the `const expected = kbStatus()` binding it reads, and there is no other
     declaration of `expected` in the file.

  NO TEST FUNCTION WAS DELETED on either side — all four hunks are edits within one
  surviving `it(...)`, and the file's full `it(...)` set is unchanged by this resolution.

- `tests/test_UAT_FC_REQ-165_projected_reference.test.ts` — not conflicted; the incoming
  commit's new 379-line UAT file, staged as added. This is the whole net delta of the
  cherry-pick against HEAD.

## Incoming changes preserved

Every code change in `53374730fa` is present in the resolved tree. Verified by reading the
incoming diff against its first parent (`f034eeee18`) and locating each change in the
result:

- `kb.ts`: `isProjected/projections/ProjectedDoc` import (line 57); `exportCorpus`'s sweep
  sparing the projected namespace, `!isProjected(name)` (line 392); `writeProjections`
  (431); `corpusMembership` (479); `projectedDocument` (521); the two-producers paragraph
  in `KB_USAGE` (1079); the `projected: number` field on `KbStatus` (1099); and
  `projected: files.filter((f) => isProjected(f)).length` in `kbStatus` (1135).
- `kb-projection.ts`, `tools/generate/src/cli/index.ts`, `packages/framework/src/modules/
  index.ts`: merged clean — identical to HEAD, which already carries them.
- `reconciliation-system-knowledge-base.test.ts`: incoming's `projected: 0` assertions are
  present at lines 939, 959 and 974, and the "corpus line names both producers separately"
  assertion at line 1041. Incoming's exact-string form of that assertion lives in HEAD in
  `tests/reconciliation-projected-reference.test.ts:471`
  (`test_UAT_AC1635_status_reports_the_generated_references_separately_from_the_exported_
  documents`), which asserts the full wording against a controlled corpus.
- The new UAT file is staged verbatim from the incoming commit. Its imports were checked
  against the resolved sources: all nine symbols it takes from `kb.ts` (`configPath`,
  `corpusDir`, `corpusMembership`, `exportCorpus`, `kbStatus`, `writeProjections`,
  `projectedDocument`, `resolveEmbedder`, `bindKb`) and all five from `kb-projection.ts`
  (`isProjected`, `projectBehaviorCatalogue`, `projectControlSurface`,
  `projectL1Vocabulary`, `projections`) exist as exports.

No hunk was dropped under the BUG-1301 precedence exception: nothing here targets code a
HEAD-side refactor removed. Every hunk not taken was superseded in place by a later
free-coded revision of the same lines, with its substance retained.

The staged diff against HEAD is the new UAT file alone — the redundant-commit case of
STEP 4, not the discard case of STEP 3: the incoming commit's key changes are present in
HEAD via the 09-11/09-14 REQ-165 merges, as enumerated above. `--skip` was not called;
finalize will detect this itself. CHERRY_PICK_HEAD left intact.

No test suite was run: the resolution reduces the three conflicted files to their exact
HEAD content, so nothing this step produced is unexercised by whatever already passes on
HEAD, and the one added file arrives verbatim from the developer's commit.
