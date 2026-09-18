---
uid: report-cb1a548f
id: REPORT-4313
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T05:49:23.255091+00:00'
updated_at: '2026-09-18T05:49:23.255091+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

Incoming commit: 68a949cc08 "Merge branch 'free-BUG-36' into xgd-working"
(free_coded, 2026-08-23). HEAD: 1fa86b3ce9.

## Files resolved

- **apps/control-app/src/router.ts** — UU, code file, rule 2c.2
  (non-overlapping changes: combine). Two conflict hunks, BOTH with an
  empty incoming side: HEAD added import lines (`./tickets`,
  `./knowledge`, `./system-knowledge`, `./session-knowledge`,
  `./describe`, `./fetch-guard`, `./material`) and `RouterDeps` members
  (`tickets`, `knowledge`, `index`, `describeImage`, `fetch`) directly
  adjacent to the lines BUG-36 deleted. The incoming deletions had
  already applied to the common context on both sides of each hunk, so
  the conflict was pure adjacency, not competing intent. Kept HEAD's
  added lines; dropped the empty incoming sides.

- **bin/access-token** — AA, code file, rule 2b (one side is a strict
  superset — keep the superset). Both sides added this 250-line script.
  HEAD's version is the incoming file plus a `CLOUDFLARE_API_BASE` test
  seam (`CLOUDFLARE_API` constant retaining the incoming's literal
  default, `API` derived from it) and the matching `Environment:` docstring
  entry. `diff` of the incoming blob against the resolution shows
  additions only — no incoming line is lost.

- **package.json** — UU, config scalar, rule 2g with a stated reason.
  HEAD `0.2.40` vs incoming `0.2.10` (bumped from `0.2.9`). Kept HEAD's
  `0.2.40`: the version scalar is release bookkeeping rather than
  developer code intent, and taking the incoming value would regress the
  repo version by 30 releases and collide with the free_coded version
  gate. The incoming's intent — the version has advanced past `0.2.9` —
  is satisfied by the retained value.

## Incoming changes preserved

- **router.ts** — all three incoming hunks verified present in the
  resolved file: (1) `import { storeFor, TenantNotConfiguredError, type
  StoreEnv } from './store'` with `storeForImport` removed (line 28);
  (2) the `importStore?` `RouterDeps` member removed; (3) the
  `/api/import` route opening through `deps.store ?? storeFor` under the
  "The SAME opener every other route uses (BUG-36)" comment (line ~523).
  `git grep storeForImport` and `git grep importStore` return nothing
  repo-wide, so the BUG-36 refactor is complete and has no dangling
  callers.

- **bin/access-token** — resolution is a strict superset of the incoming
  blob (verified by `diff` against `68a949cc08:bin/access-token`:
  additions only).

- **package.json** — the incoming literal `0.2.10` is intentionally not
  retained, as explained above. This is the only incoming value not
  carried forward, and it is bookkeeping, not code.

- No hunks were dropped under the BUG-1301 precedence exception. No test
  function on either side was deleted.

## Note: this cherry-pick nets to no diff vs HEAD (BUG-1109/BUG-1122)

After staging, `git status --porcelain` and `git ls-files -u` are both
empty. This is a REDUNDANT commit, not a discarded one — the incoming
commit's content had already reached HEAD by another route (post-watermark
sync). Evidence:

- The incoming commit's patch for the other 10 files it touched
  (`apps/control-app/ACCESS.md`, `src/store.ts`, `bin/publish`,
  `tests/test_UAT_FC_BUG-36_publish_credential.test.ts`,
  `tests/test_UAT_FC_BUG-36_tenant_bootstrap.workers.test.ts`,
  `tests/test_UAT_FC_REQ-149_publish_in_the_cloud.workers.test.ts`,
  `tools/generate/src/cli/{builder,index,push}.ts`,
  `tools/generate/src/store/d1r2-store.ts`) reverse-applies cleanly
  against HEAD — i.e. HEAD already contains it exactly.
- Both new BUG-36 UAT test files are present in `git ls-tree HEAD`.
- The three conflicted files are covered above: router.ts holds every
  incoming hunk verbatim, bin/access-token is a superset, package.json is
  a superseding version.

Per STEP 4, no `--skip` was issued; the tree is staged and
CHERRY_PICK_HEAD is left intact for cherry_pick_finalize_resolution.

## Flagged for post-merge review

The enrichment metadata classified all three files as "intent unknown on
one or both sides". Flagging as instructed, though each resolution above
rests on verified content rather than the timestamp tiebreak:
`apps/control-app/src/router.ts`, `bin/access-token`, `package.json`.
