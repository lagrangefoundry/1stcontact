---
uid: report-e1e4306d
id: REPORT-3954
type: report
title: 'Fix reconciliation review: bundle-87be4669'
created_by: xgd
created_at: '2026-09-11T07:25:53.868643+00:00'
updated_at: '2026-09-11T07:25:53.868643+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-87be4669
  needs_more_work: true
  progress_made: true
---

## Stories created

None. The review was explicit that Steps 4 and 6 pass and that "the story bodies
are correct and must not be edited" — the failure was Step 5b alone.

## Stories modified

None, deliberately. See above. Two prior cycles (report-e21470fb, and this
report's predecessor) correctly declined to manufacture matrix edits.

## Stories deleted

None. The review found no ungrounded story: "The behaviour exists — on
`xgd-working`, in the commits the bundle names. The stories are grounded in
intent and in code; the **branch** is unpopulated."

## FC orphans renamed/deleted

No `fc_orphan_check` report exists for this anchor (4 exist in the store, none
for `bundle-87be4669`), so category 3 was not the trigger for this call.

However, the incoming commits carry 11 `test_UAT_FC_*` files. Each was
**dropped rather than applied** during conflict resolution, because
reconciliation has already converted their behaviour into the branch's own
`reconciliation-*.test.ts` AC-named suites; applying them would have created
exactly the orphans the later gate forbids:

- `tests/test_UAT_FC_REQ-164_corpus_export.test.ts`
- `tests/test_UAT_FC_REQ-159_project_kb.workers.test.ts`
- `tests/test_UAT_FC_REQ-159_project_kb_config.test.ts`
- `tests/test_UAT_FC_REQ-163_ingestion.workers.test.ts`
- `tests/test_UAT_FC_REQ-163_material_pipeline.test.ts`
- `tests/test_UAT_FC_REQ-161_library_tab.test.ts`
- `tests/test_UAT_FC_REQ-161_material_surface.workers.test.ts`
- `tests/test_UAT_FC_REQ-161_upload_overlay.test.ts`
- `tests/test_UAT_FC_REQ-158_system_kb.workers.test.ts`
- `tests/test_UAT_FC_REQ-158_system_kb_bundle.test.ts`
- `tests/test_UAT_FC_REQ-167_identity.workers.test.ts`

`git ls-tree HEAD tests` confirms none of the seven bundle tickets leaves an FC
file on the branch.

## Code changes

**The review's required action #1, carried out.** The bundle's behaviour commits
are now ancestors of `reconcile-BUNDLE-26`.

The review expected this to be intractable ("roughly ten thousand commits on each
side, so a replay is not expected to be clean"). That gap turned out to be almost
entirely ticket-store commits. The load-bearing measurement:
`git log 1bc13abacf..c2f6c582ad -- . ':!.xgd' ':!kb/corpus'` returns **16 commits,
every one of them this bundle's own** — so the bundle's code span contains no
foreign work, and replaying it onto this branch imports nothing the matrix does
not cover.

Seven cherry-picks, in bundle order (merges with `-m 1`):

| New SHA | Origin | Brings |
|---|---|---|
| `58561eb978` | `858d63202f` | REQ-164 — corpus selects by `doc_kind`, unrestricted, exhaustive |
| `3984cfabc7` | `21e6d142d5` | REQ-159 — project KB: `knowledge.ts`, tenant corpus, R2 index |
| `49291aa5cd` | `548c053deb` | REQ-163 — `material.ts`, `describe.ts`, `fetch-guard.ts` |
| `9e42b700e2` | `855dd57a7c` | REQ-161 — `builder/library.js`, `builder/upload.js` |
| `6c118ed699` | `f6c1366410` | REQ-161 — the blob-addressing doc correction |
| `68d30da8db` | `d4d50859a2` | REQ-158 — `system-knowledge.ts`, `kb-model.ts`, `kbBundle`, `writeKbModule` |
| `ddf50669af` | `61a0becc61` | REQ-167 — `identity.ts`, `0004_identity.sql`, the gate's verdict |

Skipped as already-satisfied, not as unapplied:
- `52fd6302cc` (REQ-165) — its content is already on the branch under a different
  SHA; `kb-projection.ts` was present before this call.
- `c056002a52`, `deaf3f98c4`, `9ae7338430`, `c2f6c582ad` — pure version bumps.
  `package.json` on this branch already reads `0.2.31`, which is exactly what the
  last of them bumps to, so every `package.json` conflict was resolved to ours.

Plus one repair of my own:
- `0a004ef6b8` — `tools/generate/src/cli/kb.ts` declared `DOC_KIND_FIELD` /
  `MEMBER_KIND` **twice** after the REQ-164 pick: REQ-165's projector commit had
  already landed its own copy on this branch. That does not compile. Dropped the
  REQ-165-era duplicate, keeping REQ-164's, which matches the bundle tip.

### Conflict resolutions worth naming

- `tools/generate/src/cli/index.ts`, `kb.ts` — REQ-164 and REQ-165 both edit the
  `kb status` line and the `KbStatus` shape. Neither side was taken whole; the
  hunks were **combined**, matching the author's own resolution at the bundle tip
  (`corpus: N exported + M projected (of K ticket(s) …)`, and the staleness check
  compared against the *exported* half rather than the total). `index.ts` now
  differs from the bundle tip by nothing at all.
- `tests/reconciliation-builder-workspace-chrome.test.ts`,
  `tests/support/stub-embedder.ts` — conflicts between the branch's
  reconciliation-authored UATs and the older FC-era versions. **Resolved to ours
  in every case**, per the review's instruction not to rewrite matrix work. The
  branch's versions are the more general statements (they assert against `TABS`
  with an index rather than against a literal).
- `apps/control-app/wrangler.toml`, `access.ts`, `ai/host.ts` and 7 others carry
  genuine main-side work this branch has and the bundle tip does not. A blanket
  checkout would have clobbered it, so these were merged rather than overwritten;
  verified afterwards that the remaining `c2f6c582ad..HEAD` delta in those files
  is additive main-side content only, with no bundle content lost.

### What this should move

- `reconciliation-library-tab.test.ts` and `reconciliation-upload-overlay.test.ts`
  failed as **collection errors, 0 tests** (16 ACs never executed). Both now
  resolve: `createLibraryPanel` and `createUploadOverlay` are exported from the
  files they import.
- `reconciliation-system-knowledge-base-packed.test.ts` failed on `kbBundle` /
  `writeKbModule` not being exported. Both are now exported
  (`kb.ts:1033`, `assets.ts:443`).
- `reconciliation-builder-private-access-verdict.test.ts` (AC-1761) asserted a
  verdict object and got a yes/no; its own failure message named
  `61a0becc61` as the missing commit. `guardAccess` now returns
  `{ ok, identity, email, claims }`.
- The review's **caveat on the two that pass** should also clear: `TABS` now has
  a second declared entry (the Library), so AC-959 / AC-976 / AC-1064 are no
  longer satisfied vacuously by a one-tab builder.

### Verification performed

Per the mission I did **not** run the suite. Static checks instead, since a
cross-history replay's characteristic failure is a duplicate or dangling symbol:

- No conflict markers survive anywhere under `apps tools tests packages db kb`.
- Duplicate-export scan over every changed `.ts`/`.js`: **0** (this is what
  caught the `DOC_KIND_FIELD` collision above).
- Relative-import resolution over `apps`, `tools`, `packages`, `tests`: 1779
  specifiers, no unresolved bundle import. The 19 flagged are pre-existing false
  positives (string literals such as `'./x'`, vite `?raw` suffixes, and
  `./generated/kb.js`, which `1c assets` writes and which is present).
- Every named import the three previously-failing KB suites take from `kb.ts`
  binds to a real export (33 exports, 0 unsatisfied).

Scripts left at `.xgd/tmp/{dupcheck,importcheck,exportcheck}.py`.

### Not done, deliberately

`bundle-87be4669.fields.commits[].reconcile_sha` is still `null` on all twelve
entries. The seven new SHAs are in the table above. I left that field alone
because it is the outer workflow's bookkeeping and its structure is a nested
list-of-objects that a hand-written `--fields` write can corrupt; the dispatcher
gates on it.

## Confidence

**Moderate, and the residual risk is honest rather than rhetorical.**

What I am confident of: the cause the review identified is fixed. The review's
diagnosis was unambiguous — "126 of 145 active acceptance criteria have no
passing UAT on this branch, because the implementation they describe was never
applied to it" — and the implementation is now applied, verified three ways the
review itself used (`merge-base --is-ancestor`, `ls-tree`, and the absence of the
superseded `INCLUDE_FIELD` rule from `kb.ts`).

What I cannot claim: that the suite passes. I was instructed not to run it, so
every statement above is static. Two specific reasons a re-review might still
not reach PASS:

1. **The workerd suites still cannot execute here.** 103 of the AC-named tests
   live in `*.workers.test.ts`, and `workerd` cannot bind a socket in this
   sandbox (`listen EPERM`). That is an environment limit the review already
   recorded, and landing code does not lift it. If the outer workflow runs in the
   same sandbox, those ACs will again have no observed evidence — for a reason
   that is now purely environmental rather than missing code.
2. **A replay across diverged history can leave semantic drift that compiles.**
   I found and fixed one such collision; I cannot rule out another that static
   checks do not see.

Recommendation, unchanged from the review's own item 2: treat
`Scoped quality: pass (0 tests, 0 failed)` as a gate failure. If the next run
reports zero tests again, the suite did not execute and no evidence claim should
be made from it either way.
