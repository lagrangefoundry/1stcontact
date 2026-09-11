---
uid: report-e21470fb
id: REPORT-3951
type: report
title: 'Fix reconciliation review: bundle-87be4669'
created_by: xgd
created_at: '2026-09-11T07:03:58.500308+00:00'
updated_at: '2026-09-11T07:03:58.500308+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-87be4669
  needs_more_work: true
  progress_made: false
---

## Stories created

None.

The review found no uncovered behaviour. Category 1 does not apply: all 17 plan
items produced a story, and cross-referencing every `^id: AC-` in
`.xgd/tickets/hot/` against every `test_UAT_AC[0-9]+` in `tests/` leaves an
empty difference — all 145 ACs already carry a named UAT.

## Stories modified

None. **Deliberately none** — see "Why no story edit was made" below.

## Stories deleted

None. **Deliberately none** — see "Why no story edit was made" below.

## FC orphans renamed/deleted

None, and none were outstanding.

- No `fc_orphan_check` report exists for this anchor at all
  (`grep -rl "fc_orphan_check" .xgd/tickets/hot/` returns nothing), so per this
  fixer's own instruction category 3 is skipped entirely.
- Every `test_UAT_FC_*` file on disk belongs to an intent *outside* this bundle
  (BUG-34…39, REQ-122…154, REQ-162). None of the bundle's seven intents
  (REQ-158/159/161/163/164/165/167) has an FC file on this branch. The single FC
  suite that ever existed here, `test_UAT_FC_REQ-165_projected_reference.test.ts`,
  was already renamed to `tests/reconciliation-projected-reference.test.ts` by
  `8b4ccec650`.

## Code changes

None. **Deliberately none** — see below.

## Why no story edit was made, and why no code was landed

I independently re-verified the review's Step 5b finding rather than taking it
on trust. It is accurate and current (`report-5be6c4dd` is the only
`reconciliation_review` report for this anchor, so it is not a stale injection).

**The bundle's implementation is not on this branch.** Verified four
independent ways:

1. `git merge-base --is-ancestor 858d63202f HEAD` → false. The commit object
   exists, but it is not an ancestor of `HEAD`. It is also **not** an ancestor
   of `main`. It **is** an ancestor of `xgd-working` and of
   `reconcile-src-BUNDLE-26`.
2. `git ls-tree -r HEAD apps/control-app/src tools/generate/src/cli db/migrations`
   confirms all ten modules the reconciliation UATs import are absent:
   `material.ts`, `knowledge.ts`, `describe.ts`, `system-knowledge.ts`,
   `fetch-guard.ts`, `identity.ts`, `builder/library.js`, `builder/upload.js`,
   `kb-model.ts`, `0004_identity.sql`.
3. REQ-164's change never landed, and the file now contradicts itself:
   `tools/generate/src/cli/kb.ts:431-432` *documents* that "REQ-164 made it a
   `doc_kind`, and the shipped corpus is now unrestricted (`corpus: {}`)", while
   line 187 still defines `INCLUDE_FIELD = 'system_kb'`, line 199 still defines
   `optedIn()`, line 325 still gates membership on it, and **line 544 still
   declares `corpus: { type: [CORPUS_TYPE], [\`fields.${INCLUDE_FIELD}\`]: true }`** —
   the exact predicate plan item 1 says was replaced.
4. `bundle-87be4669` carries `reconcile_sha: null` on **all twelve** commit
   entries — the cherry-pick recorded nothing as landed.

`git diff --stat main HEAD -- apps tools packages db kb` shows only the REQ-165
work (`kb-projection.ts` +865, `kb.ts` +201) plus ambient intl/conformance
drift — nothing else from this bundle. `git log --oneline main..HEAD | grep
FREE-CODED` yields exactly one commit, a version bump.

### Category 2 is mechanically tempting and substantively wrong

A naive reading makes every one of the 16 stories an "ungrounded story": it
claims behaviour the code on this branch does not have. Acting on that would
mean modifying or deleting 16 stories and ~145 ACs.

I did not do that, for two reasons:

- **The code is not fabricated, it is merely elsewhere.** The behaviour these
  stories document genuinely exists on `xgd-working`. The stories are not
  ungrounded; the *branch* is unpopulated. Rewriting them to match an empty
  branch would delete correct reconciliation output and destroy the matrix
  coverage this run produced.
- **The review forbids it explicitly**: "The story work is not what failed, and
  the fix loop must not rewrite it… Sending `fix_reconciliation_review` at the
  story bodies would degrade work that is already correct." Steps 4 and 6 pass.

### Why I did not land the code myself

The only repair that changes the outcome is landing the eight behaviour-bearing
commits. I judged that out of this fixer's remit and unsafe to attempt blind:

- This prompt states the outer orchestration — "**cherry-pick**, story cycle,
  review, merge" — "is managed externally — it is not your concern."
- The review reaches the same conclusion: "This is a branch-state failure, and
  `fix_reconciliation_review` — which edits stories, ACs and UATs — **cannot
  repair it**… Recommend surfacing to the operator rather than looping."
- It would be a **cross-history** cherry-pick, not a fast replay.
  `git merge-base HEAD xgd-working` = `b167abd969`, with **10,657** commits on
  `xgd-working` absent from `HEAD` and **10,376** the other way. Replaying eight
  commits that introduce ten new modules across that gap produces large add/add
  conflict sets requiring per-hunk judgment.
- I am instructed not to run tests, and the workerd suites cannot execute in
  this sandbox regardless (`EPERM: listen 127.0.0.1`). So I could not verify such
  a landing. This branch auto-merges back to `main`; silently merging thousands
  of lines of unverified, hand-resolved production code is not a risk worth
  taking on a bookkeeping failure.
- Landing the code also requires writing `fields.commits[].reconcile_sha`,
  which is outer-workflow bookkeeping, not matrix state.

### What must happen (operator action)

1. Re-run the cherry-pick of `858d63202f`, `21e6d142d5`, `52fd6302cc`,
   `548c053deb`, `855dd57a7c`, `f6c1366410`, `d4d50859a2`, `61a0becc61` onto
   `reconcile-BUNDLE-26`. All are reachable from `xgd-working` and
   `reconcile-src-BUNDLE-26`. `reconcile_sha: null` on all twelve entries is the
   signal to check first. Note the cross-history gap above — the pick is not
   expected to be clean.
2. Treat `Scoped quality: pass (0 tests, 0 failed)` as a **gate failure, not a
   pass**. All 19 scoped-quality reports in this run read that way; nineteen
   consecutive zero-test passes are how a fully unevidenced matrix reached
   review.
3. Re-run `reconciliation_review` only once the suites actually execute. Until
   something has been observed, no statement about UAT sufficiency is possible.

A likely cleaner alternative to (1), for the operator to weigh: discard this
reconcile branch and re-cut it from a base that already contains the bundle's
commits (`xgd-working`), rather than replaying eight commits across a 10k-commit
history remap. The matrix work on this branch is correct and worth preserving
through that move.

## Confidence

**The next review will not pass, and I could not make it pass.** I am reporting
that plainly rather than manufacturing a story edit to look productive.

Nothing in the three fix categories applies: there is no uncovered behaviour, no
genuinely ungrounded story, and no FC orphan. Every finding in the review
resolves to one action — populating the branch — which this fixer is scoped out
of and cannot verify.

`progress_made=false` is therefore accurate, and the resulting block on
automatic re-entry is the correct outcome, matching the review's own
recommendation to surface to the operator instead of burning
`watchdog.max_fix_cycles` on artefacts that are already correct. Re-entering
this fixer without first landing the code cannot change the verdict.
