---
uid: report-243d841d
id: REPORT-5577
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T17:26:28.045516+00:00'
updated_at: '2026-09-29T17:26:28.045516+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

Conflicting commit: `70612b3feb6f08b49c701959f2f6eea746ffaf2d`
— "fix(priming): corpus membership comes from the build, not an id list [FREE-CODED]"

## Files resolved

- `tests/test_UAT_FC_REQ-123_system_kb.test.ts` — **DU** (main deleted,
  incoming modifies). Resolved by accepting the HEAD-side deletion
  (`git rm`) under the **BUG-1301 PRECEDENCE** exception to 2f. Sole
  conflict in the tree; the other six paths in the commit's diff
  auto-merged.

## Why the deletion is legitimate refactor, not churn

HEAD's `671a09196f` (2026-09-10) "test(kb): assert the export command
itself, and retire the duplicate suite" retired the file, folding its
coverage into `tests/reconciliation-system-knowledge-base.test.ts`. That
removal is documented in three independent places and verified here, not
taken on the commit message's word:

- The replacement suite's own header (lines 60-67) records the absorption:
  "THIS FILE IS THE EVIDENCE FOR AC-1291 … AC-1306, all of it. It absorbed
  `test_UAT_FC_REQ-123_system_kb.test.ts`."
- All fifteen `it(` scenarios of the retired file map onto a scenario in
  the replacement suite (`test_UAT_AC1291`…`AC1306`, `AC1632`, `AC1633`).
- The one scenario with no matching AC id —
  `a_structured_field_is_dropped_rather_than_stringified` — was checked
  individually and is reproduced as a strict **superset** at
  `tests/reconciliation-system-knowledge-base.test.ts:1346-1358`: the same
  three assertions (`doc_kind` rendered, no `[object Object]`, no
  `references:`) plus `tags:` and a title-punctuation read-back.

This is not the resolver electing to drop a test: the file was already
gone on HEAD before this cherry-pick, by a separate earlier decision with
its coverage migrated.

## Incoming changes preserved

Incoming's edit to the retired file was **only** the fixture extraction —
remove the local `buildIndexesAndMap`/`STUB` definitions, import
`buildIndexesAndMap, STUB_MODEL` from `./support/kb-fixture`. It adds no
assertions. Its entire target is inside the now-gone file, and its
substance landed intact:

- `tests/support/kb-fixture.ts` — added, byte-identical to incoming.
- `tests/test_UAT_FC_BUG-65_priming_names_no_documents.test.ts` — added,
  byte-identical to incoming; consumes the extracted fixture at lines
  17, 210-222. So the stated purpose of the extraction ("BUG-65's
  end-to-end UAT builds its corpus the same way rather than through a
  second copy") is satisfied, and the fixture is not orphaned.
- Nothing in the tree references the deleted file except the replacement
  suite's historical note.

Index vs `CHERRY_PICK_HEAD` restricted to the commit's own seven paths
(`git diff --cached --numstat`) reports only two deltas:

- `tests/test_UAT_FC_REQ-123_system_kb.test.ts` — `0 / 432`, the accepted
  deletion above.
- `tools/generate/src/cli/ai/roles.ts` — `34 / 0`, attributable entirely
  to pre-existing HEAD content (see flag below). Incoming's own hunk — the
  doc-comment rewrite to "IT NAMES SUBJECTS AND NEVER A DOCUMENT
  (BUG-65)" — is present verbatim in the index.

`package.json`, `tests/support/kb-fixture.ts`,
`tests/test_UAT_FC_BUG-65_priming_names_no_documents.test.ts`,
`tests/test_UAT_FC_REQ-171_session_texts.test.ts` and
`tools/generate/src/cli/ai/priming.json` are byte-identical to incoming.

## Flagged for post-merge review (not resolved here — no conflict, out of scope)

`tools/generate/src/cli/ai/roles.ts` carries a **stale 34-line
`CONSULTANT_PURPOSE` export** (index line 74) whose prose still names
`DOC-33`, `DOC-35` and `DOC-31` — exactly the hand-authored id list this
commit exists to remove, including the demoted `DOC-31`. Its doc comment
still reads "IT NAMES DOCUMENTS (REQ-171)", contradicting the corrected
comment now sitting ~40 lines below it in the same file.

Provenance and impact, established before flagging:

- It is **not** incoming content and not something this resolution
  introduced. It is absent from incoming (`70612b3f`), absent from
  incoming's parent, and absent from the whole xgd-working ancestry of
  this path (`git log -S CONSULTANT_PURPOSE 70612b3f -- <path>` returns
  nothing; `git grep` on `70612b3f` finds the symbol in no source file).
  On HEAD it was added by `a0bec92f72` (author 2026-09-02, replayed onto
  this branch 2026-09-29 02:52) and never removed, although
  `656eb6e267` (author 2026-09-07, replayed 09:56) — the commit that made
  the priming configuration — rewrote 561 lines of the same file.
- **Behaviour is correct regardless.** The live priming is assembled from
  `primingDocument` (`priming.json`) at `roles.ts:205-208`, and that file
  is byte-identical to incoming: its `purpose` entry names subjects and
  contains no `DOC-` id. The stale const is dead — declared in
  `roles.ts`, imported and re-exported by `host-core.ts:55,362`, consumed
  by nothing else in `apps/` or `tools/`.

So this is a leftover from an earlier commit's integration, not a defect
in this cherry-pick, and removing a 34-line exported const is authoring
beyond the conflict markers. Left untouched deliberately; worth a cleanup
pass after the resync lands, because the stale comment asserts the
opposite of the decision this commit records.

## Verification not performed

Test suites were not executed. Per the workers/headless constraint, any
`vitest.workers.config.mts` suite and anything shelling out to `wrangler`
is unrunnable in this role (`listen EPERM`), and the resync caretaker rule
forbids test_fix. Verification here is the restricted index-vs-incoming
diff above plus per-scenario coverage reading.
