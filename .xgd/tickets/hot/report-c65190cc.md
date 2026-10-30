---
uid: report-c65190cc
id: REPORT-5784
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T10:33:16.167943+00:00'
updated_at: '2026-10-02T10:33:16.167943+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

Pick: `766f26e10cfb3154e57a2cf0530dfcf440e0bfc0` "feat(storage): retire the file-backed authoring tier [FREE-CODED]" (REQ-290, author 2026-09-21 13:09:48 -0700, 134 files). HEAD `2c9b20b23f`, apply target `ec118d67626fd31cfce67ca88dc9908ecdde70ed`, anchor `report-377b581e`. `prior_stage_failure` empty, retry count 1. 127 of 134 paths applied cleanly; 7 conflicted (6 `UU`, 1 `DU`).

The enrichment gave "intent unknown → take the more recent commit by timestamp" on all seven paths. It was not used: on code paths the HARD RULES make incoming authoritative.

## Files resolved

- `bin/copy-to-cloud` — UU, 1 region, class 2c. **Developer's own merge resolution.**
- `tools/generate/src/cli/index.ts` — UU, 2 regions, class 2c. **Developer's own merge resolution.**
- `tools/generate/src/cli/push.ts` — UU, 1 region, class 2c. **Developer's own merge resolution.**

  The conflict on these three is BUG-134 (`87c49670d8`, already on HEAD) against REQ-290, and the developer already resolved exactly that on xgd-working: the commit after the pick is `36365b7dfe` "Merge branch 'xgd-working' into free-REQ-290", parents `766f26e10c` (the pick) and `5e22330e34`. For all three paths the merge's parent-1 blob equals stage 3 (theirs) and its parent-2 blob equals stage 2 (ours) byte for byte (`dcc7001f15`, `15c9fb3e54`, `8c2cbab42c`). So `git checkout 36365b7dfe -- <3 paths>` is the developer's resolution of this conflict, not mine. `git diff --cached --stat 36365b7dfe -- <3 paths>` is empty.

- `tests/reconciliation-site-asset-listing.test.ts` — UU, 1 region, class 2c step 1, keep BOTH. Theirs' `cmdNew('undeclared', { cwd, sandbox: true })` plus ours' "asset store" comment wording (`b8399b2fcf`). Theirs' five other `sandbox: true` / `storage/sandbox` hunks auto-merged.
- `tests/test_UAT_FC_REQ-143_render_store_independence.test.ts` — UU, 1 region, class 2f/2c, integrated. Theirs' only change in the region is `storage/sites/` → `storage/sandbox/` on the first line; ours rewrote the rest of the paragraph (REQ-148/REQ-150 removed the Astro obstacle). Result is ours' paragraph with theirs' substitution. Ours' paragraph names the directory a second time ("is a directory only the host can walk"); the same substitution was applied there so the paragraph does not name two different trees. No test function touched.
- `tests/reconciliation-colour-census-and-retrofit.test.ts` — DU, class 2a, `git rm` under the **BUG-1301 precedence** (below).
- `tests/reconciliation-colour-palette-overlay.test.ts` — UU, 1 region (the AC-932 `describe`), resolved to HEAD's side under the **BUG-1301 precedence** (below). Result is byte-identical to stage 2.

## Incoming changes preserved

- Three CLI files: identical to the developer's merge, which contains every incoming hunk — the `push` case and `pushSite` import gone from `index.ts`, the sandbox root pinned in `run()`, the usage text without `push`/`--sandbox`, the "transport, not a command" header on `push.ts`, the retired-script wording in `bin/copy-to-cloud` — together with BUG-134's two-credential handling (`accessAdvice`, `accessFor`, `endNamesFor`, `LOCAL_ACCESS_CLIENT_*`). Neither file names the retired script or verb any more.
- `reconciliation-site-asset-listing.test.ts`: all six incoming `sandbox` edits present.
- `test_UAT_FC_REQ-143_…`: incoming's `L1_CORPUS_CWD`/`L1_CORPUS_SITES` import, `SITES = L1_CORPUS_SITES`, the rewritten `realSlugs` docblock and both `fsSiteStore({ cwd: L1_CORPUS_CWD, … })` calls auto-merged and are present; the docblock token swap is applied.

### Hunks dropped under BUG-1301 precedence

Both dropped hunks are the same one-line fixture-path swap (`storage/sites` → `L1_CORPUS_SITES`) applied to tests HEAD had already removed:

- `tests/reconciliation-colour-census-and-retrofit.test.ts`: incoming's whole delta from base is `+import { L1_CORPUS_SITES }` and `SITES = L1_CORPUS_SITES` (+2/-1).
- `tests/reconciliation-colour-palette-overlay.test.ts`: incoming's whole delta from base is the same import plus one `cpSync(path.join(L1_CORPUS_SITES, slug), …)` line inside the AC-932 test (+2/-1). With the block gone the import has no consumer, so it is dropped with it.

The HEAD-side commit is `b8399b2fcf` "fix(uat): retire the superseded colour-retrofit UATs and stale wording" (2026-09-10). It is a documented, deliberate removal, not churn: it answers `report-dde93f42`, deletes the census file as a pre-REQ-137 duplicate that claimed AC-939…AC-947 a second time with four byte-identical test names and asserted a guarantee REQ-137 superseded, and removes the AC-932 test because its claims moved to AC-941/AC-944. It names the superset, `tests/reconciliation-colour-retrofit-shade-model.test.ts`, and that file received incoming's same path swap cleanly in this pick (`SITES = L1_CORPUS_SITES`). So incoming's intent — read the relocated corpus — is preserved where these tests now live, and restoring either test would resurrect the duplicate AC claims that commit fixed.

Flag for review: `b8399b2fcf` is main-only. xgd-working's tip still carries both tests (blobs equal to stage 3), so the developer has not made this deletion on that branch. If the two tests are wanted back, `git checkout 766f26e10c -- <path>` restores them with the corpus path already applied.

## Verification

- No unmerged entries, no conflict markers, HEAD unmoved at `2c9b20b23f`, `CHERRY_PICK_HEAD` intact at `766f26e10c`.
- `npx vitest run` on `test_UAT_FC_REQ-290_…`, `test_UAT_FC_REQ-143_render_store_independence` and `reconciliation-colour-palette-overlay`: 21 passed, 1 failed (below).
- `reconciliation-site-asset-listing` and `test_UAT_FC_BUG-134_copy_two_ends` could not be run to completion here: they start a server and hit `listen EPERM` in this role.

## Out-of-marker breakage — reported, not fixed

`test_UAT_FC_REQ-290_nothing_tracked_outside_the_ticket_store_names_the_push_script` fails. It scans every tracked file for the retired script and verb names, and five files that this pick does not touch still carry them:

- `tests/test_UAT_FC_BUG-134_copy_two_ends.test.ts:267` — one comment word. The developer fixed it in the merge `36365b7dfe` itself (`1c push` → `pushSite`), and a merge commit is not cherry-picked, so no later pick will heal it. One-line fix: `git checkout 36365b7dfe -- tests/test_UAT_FC_BUG-134_copy_two_ends.test.ts` (HEAD's blob equals the merge's parent-2 blob, so that is exactly the developer's change).
- `tests/reconciliation-builder-private-access-automation.test.ts` (lines 244, 291)
- `tests/reconciliation-workspace-boot-guard.test.ts` (line 125 — an assertion, `toContain` of the retired script name)
- `tests/reconciliation-workspace-edge-origin.workers.test.ts` (lines 16, 64, 187, 225)
- `tests/reconciliation-workspace-tenant-bootstrap.workers.test.ts` (line 9)

The last four are main-only files, absent from xgd-working, so no pick can heal them. The boot-guard one asserts on page content and may itself now be wrong against REQ-290's builder text. These need a follow-up on main after the resync; left alone here because they are outside the conflict and editing them would be authoring.
