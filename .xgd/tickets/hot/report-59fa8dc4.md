---
uid: report-59fa8dc4
id: REPORT-4653
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T05:40:18.893009+00:00'
updated_at: '2026-09-21T05:40:18.893009+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Context

Incoming commit is `115f0d39ec` — *"feat(kb): the project knowledge base — tenant
corpus, R2 index, two triggers [FREE-CODED]"* (REQ-159), from `xgd-working`.

That commit was **already reconciled into main** as `a3455307e5` (same subject, on
`origin/reconcile-BUNDLE-23`), and main has since evolved past it. Every conflict
hunk is therefore "older original vs. reconciled-and-evolved", and in all five files
the HEAD side is a superset or a subsequent correction of the incoming side. All five
resolved to HEAD. No incoming content was lost — it is present in evolved form.

Per STEP 4 this stage stages only; `--skip`/`--continue` left to the finalize step.

## Files resolved

- `tools/generate/src/cli/kb.ts` — UU, code (2c). Incoming re-declared `PROJECT_KB`
  (already declared at line 89 on HEAD) and `CORPUS_TYPE` (HEAD re-exports it from
  `./kb-model` at line 77 after the REQ-158 refactor that moved the three constants
  out of this filesystem-touching module). Taking incoming would have produced a
  duplicate-identifier compile error. HEAD side kept. Note the HEAD-side commit
  subject is literally *"fix(kb): drop the duplicate doc_kind declaration left by the
  merge"* — a prior fix for this exact duplication.
- `tools/generate/src/cli/assets.ts` — UU, code (2c). Every hunk is HEAD-adds /
  incoming-empty: `aiKnowledgeEntry`, `writeKbModule`, `KbAssetReport`,
  `writeAiKnowledgeShim`, the staged-directory rename swap, and a strictly larger
  `KNOWLEDGE_EXPORTS`. HEAD is a strict superset. HEAD side kept.
- `apps/control-app/src/knowledge.ts` — AA (2b). Two hunks, both HEAD-side
  corrections: (1) the `DescriberNotConfiguredError` message names the
  `ai-knowledge/describe` entry point, matching the shim `writeAiKnowledgeShim`
  actually generates; (2) `search()` passes
  `indexes: { [this.kb.source ?? PROJECT_KB]: this.index }` instead of incoming's
  `source: this.index`, with an in-code comment explaining that keying the map any
  other way leaves the component with no index for the source and it refuses by name.
  Incoming's form is the bug HEAD fixed. HEAD side kept.
- `tests/support/stub-embedder.ts` — AA (2b). Doc-comment only. HEAD is the superset
  (adds the COUNTED paragraph documenting `calls`) and its terminology — "client-KB
  suites", "one account cannot see another account's vectors" — matches main's actual
  reconciled filenames (`reconciliation-client-knowledge-base.*`,
  `reconciliation-client-knowledge-clocks.workers.test.ts`). Incoming's prose refers to
  "project-KB suites", which do not exist under that name on main. HEAD side kept.
- `package.json` — UU, config. Version scalar: HEAD `0.2.40` vs incoming `0.2.23`.
  2g's "scalar conflicts: incoming wins" is NOT applied here: it would regress the
  package version by 17 bumps on a branch destined for main. HEAD's history shows
  forward-only bumps (`e86aecc7cb chore: bump version to 0.2.39 for REQ-156`), and the
  repo's convention resolves version collisions forward, never backward
  (`chore: version bump — 0.2.2 was taken by REQ-150`). HEAD side kept.

## Incoming changes preserved

Verified by symbol presence in each resolved file:

- `kb.ts` — `PROJECT_KB` (L89), `PROJECT_CORPUS_TYPES` (L92), `CORPUS_TYPE`
  (re-exported L77, used L194/L297/L484/L674/L921). All three incoming declarations
  present, exactly once each.
- `assets.ts` — all four incoming `KNOWLEDGE_EXPORTS` entries present: `loadIndex`
  (L374), `publishAwarenessReport` (L380), `resolveCorpus` (L381), `search` (L382);
  plus `knowledgeEntry` (L89/L588/L612/L631).
- `knowledge.ts` — incoming's public surface intact: `PROJECT_KB` (L92),
  `TRANSCRIPT_INDEX_CHARS` (L103), `ENUMERATE_BUDGET_CHARS` (L126), `indexPrefix`
  (L154), `r2IndexSource` (L168), `ProjectKnowledge` (L288), `projectKb` (L606),
  `projectKnowledgeFor` (L625).
- `stub-embedder.ts` — doc comment only; no code surface to lose.
- `package.json` — version only.

No hunk was dropped under the BUG-1301 precedence exception. Nothing was deleted:
the two new files this commit adds,
`tests/test_UAT_FC_REQ-159_project_kb.workers.test.ts` and
`tests/test_UAT_FC_REQ-159_project_kb_config.test.ts`, merged without conflict and
remain staged as additions. They were NOT removed despite main already carrying the
reconciled equivalents under `reconciliation-client-knowledge-*` names — 2f governs,
and their target code in `knowledge.ts` still exists.

`git diff --check` and `git diff --cached --check` are both clean; `git status
--porcelain` shows no UU/AA/DU/UD lines. `CHERRY_PICK_HEAD` left in place.
