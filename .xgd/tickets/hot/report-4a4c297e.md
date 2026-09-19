---
uid: report-4a4c297e
id: REPORT-4402
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T11:31:59.460894+00:00'
updated_at: '2026-09-19T11:31:59.460894+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Context

The commit being picked is `8b484d5832` — *Merge branch 'free-BUG-40' into
xgd-working*, author date 2026-09-01 12:28:09 -0700.

**This same upstream merge is already integrated into HEAD** as `5c50b10a2a`
(identical subject and author date, committed 2026-09-14). Every conflict below
is therefore a re-application of a commit whose effect already landed, in most
cases further refined afterwards by reconcile workflows that ran on
2026-09-10/09-11 (`fix_uat_validation`, `fix_uat_coverage`) — i.e. the OURS side
here is *later* on the working timeline than the incoming free-coded side, which
inverts 2c's usual premise.

After resolution the tree is byte-identical to HEAD for all five UU files, and
the two DU paths are removed from the index. This is the BUG-1109/BUG-1122
"redundant commit" shape, not a discard: STEP 3 confirms each incoming hunk is
present in HEAD (verbatim or superseded by a later refinement of the same
intent). `--skip` was NOT called; finalize will detect the empty staged diff.

## Files resolved

- `package.json` — UU, config scalar (2g). HEAD `0.2.40` vs incoming `0.2.33`.
  Kept HEAD: the incoming bump is free-coded version bookkeeping that HEAD has
  already moved past seven bumps; taking it would move the version backwards.
- `tests/reconciliation-assistant-conversation.test.ts` — UU, reconcile AC test
  (2c/3a). Conflict is one test for AC-1055. HEAD's
  `..._an_identifier_is_answered_only_when_it_names_a_site_this_account_holds`
  is a strict superset of the incoming
  `..._that_names_no_site_is_refused_before_anything_is_streamed`: it asserts
  the same BUG-38 inversion (a held-over id now resolves, 200 + event-stream),
  the same refusal set (`site-no-such-site`/`site-ghost`, `site-`,
  `../../etc/passwd`, `site-../<slug>`) plus four more cases and a
  cross-account refusal over a second workspace. Kept HEAD.
- `tests/reconciliation-builder-workspace-origin.test.ts` — UU, reconcile AC
  test (2c/BUG-1301 precedence). The incoming hunk rewrites a
  `worker.fetch(previewUrl(...))` assertion, but `worker` no longer exists in
  this file on HEAD: `fix_uat_validation` (`7a17bd8cd9`, 2026-09-10) converted
  this leg to the real Cloudflare Access loopback harness (`call()`) and moved
  the store-backed sweep to `reconciliation-workspace-admission.workers.test.ts`,
  documented in the surviving comment. Applying the incoming hunk would
  reference an undefined binding. Kept HEAD.
- `tests/reconciliation-copy-edit-parameter-sheet.test.ts` — UU, reconcile AC
  test (2c/3a). The incoming's biconditional
  (`'the sheet is rendered exactly when there are parameters to put in it'`) is
  already present verbatim on the HEAD side, which additionally asserts the
  sheet rows and the picture/"never by the region's KIND" block. Kept HEAD.
- `tests/reconciliation-platform-build-deploy-smoke.test.ts` — UU, reconcile AC
  test, 13 conflict regions (2c/3a). Every region is the same shape: HEAD
  carries the incoming change after a later rename/extension
  (`SITE_CHECKS`→`PUBLIC_CHECKS`, `ACCESS_CHECKS`→`CONTROL_CHECKS`,
  `skippedBroken`→`skippedIncomplete`), or replaces a block the incoming
  deleted (the dropped `BUILDER_ORIGIN` assertions are gone on both sides; HEAD
  adds the `TENANT_ID`/`ACCESS_TEAM_DOMAIN`/`ACCESS_AUD` check in their place).
  Kept HEAD in all 13.
- `tests/test_UAT_FC_REQ-158_system_kb.workers.test.ts` — DU, `git rm`
  (BUG-1301 precedence, see below).
- `tests/test_UAT_FC_REQ-159_project_kb.workers.test.ts` — DU, `git rm`
  (BUG-1301 precedence, see below).

## Incoming changes preserved

- `package.json` — no code change; version scalar only.
- `tests/reconciliation-assistant-conversation.test.ts` — incoming intent (the
  BUG-38 inversion and the names-no-site refusals) present in HEAD's AC-1055
  test, superset.
- `tests/reconciliation-copy-edit-parameter-sheet.test.ts` — both incoming
  hunks present; the first (`const shapes = new Set(...)` containment loop plus
  `'a parameter is never a word'`) is byte-identical in the resolved file at
  lines 471-483.
- `tests/reconciliation-platform-build-deploy-smoke.test.ts` — all cleanly
  merged incoming hunks verified present in the resolved file:
  `FAKE_CONTROL_ORIGIN`/`FAKE_WORKERS_DEV_ORIGIN` and their `correctOrigin()`
  entries, the origin-keyed transport double
  (`TABLE[url.origin + url.pathname] ?? TABLE[url.pathname]`), the
  `--control-origin`/`--workers-dev-origin` arguments in the AC-1336 run, the
  `ACCESS_DEV_OPEN` exemption filter, and the
  `bin/deploy.d/secrets/10-anthropic-api-key` hook added to the scanned file
  list and read for the push messages.
- `tests/reconciliation-builder-workspace-origin.test.ts` — HUNK DROPPED under
  the BUG-1301 precedence exception. HEAD-side commit `7a17bd8cd9`
  (*Workflow fix_uat_validation completed: done*, 2026-09-10) removed the
  `worker.fetch(previewUrl('alpha','draft'))` served-ness assertion from this
  leg, replacing it with a derived root-relative check across both channels
  plus the gate refusal via `call()`, and relocating the store-backed
  assertion to `reconciliation-workspace-admission.workers.test.ts`. That is a
  legitimate refactor — it is documented in the file's own surviving comment,
  it is exactly the concern the incoming comment raises (a 200 that depended on
  leftover miniflare state), and the `cache-control: no-store, must-revalidate`
  property the incoming hunk added is independently asserted in HEAD by
  `reconciliation-workspace-transport.test.ts`, `tests/support/transport-contract.ts`
  and `test_UAT_FC_REQ-145_builder_in_workerd.workers.test.ts`. Not a
  resolution shortcut.
- `tests/test_UAT_FC_REQ-158_system_kb.workers.test.ts` and
  `tests/test_UAT_FC_REQ-159_project_kb.workers.test.ts` — HUNKS DROPPED under
  the BUG-1301 precedence exception, and no test function was lost.

  Both incoming hunks are a one-line DOC-COMMENT reword only
  (`the real \`@lagrangefoundry/knowledge\` component` → `the real shared
  knowledge component`). No assertion, no test function, no behaviour.

  Neither path has ever existed on this branch (`git log HEAD -- <path>` is
  empty). The implementation they exercise IS integrated — `eb4ee1610d`
  (free-REQ-158) and `936c9edc1b` (free-REQ-159) both landed — but the reconcile
  workflow's documented `check_fc_orphans` step renames each FC UAT suite onto a
  formal AC-named reconciliation suite (report-2746490a enumerates exactly these
  two files with their UAT counts and the plan items that claim them). The
  renamed targets are present in HEAD and were verified case by case:

  - REQ-158's five UATs → `reconciliation-assistant-conversation-deployed-knowledge.workers.test.ts`:
    `test_UAT_AC1651_the_deployed_assistant_answers_from_a_design_document_names_it_and_ranks_it`,
    `test_UAT_AC1652_the_deployed_session_is_primed_with_the_map_and_granted_the_read_set_on_both_axes`,
    `test_UAT_AC1653_an_absent_embedding_model_degrades_to_no_knowledge_operations`.
  - REQ-159's twelve UATs → `reconciliation-client-knowledge-base.workers.test.ts`
    (AC1655-AC1665: tenant-scoped search, index location, incremental indexing,
    absent-index-reads-null, the embedding model) and
    `reconciliation-client-knowledge-clocks.workers.test.ts`
    (AC1668-AC1677: the enumerate/cluster floor as a character budget, the
    excerpt fallback, refusal with no describer, the two clocks).

  So the FC files' targets were removed by a legitimate, earlier-integrated
  reconcile decision, and every behaviour they assert is still asserted on
  HEAD under an AC name. Restoring them would re-import two orphaned suites
  the branch deliberately renamed away, duplicating those assertions.
