---
uid: report-2c4e38ae
id: REPORT-4668
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T09:07:44.930684+00:00'
updated_at: '2026-09-21T09:07:44.930684+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

Incoming commit: `52fd6302cc` — "feat(kb): projected reference — the product's
own facts, generated [FREE-CODED]" (2026-08-31).

The governing fact for every file below: this commit's feature is **already
present in HEAD in a later, refactored form**. Its three wholly-new files are
byte-identical between HEAD and the commit:

- `git diff HEAD 52fd6302cc -- tools/generate/src/cli/kb-projection.ts` → empty (865 lines)
- `git diff HEAD 52fd6302cc -- tests/test_UAT_FC_REQ-165_projected_reference.test.ts` → empty (379 lines)
- `git diff HEAD 52fd6302cc -- packages/framework/src/modules/index.ts` → empty

The five conflicts are therefore HEAD-side *evolution* of the same feature,
principally REQ-164 (moved `SYSTEM_KB`/`SHIPPED_SOURCE`/`CORPUS_TYPE` into
`kb-model.ts`; replaced `INCLUDE_FIELD`/`SYSTEM_KB_DOC_KIND` with
`DOC_KIND_FIELD`/`MEMBER_KIND`) plus a later `tickets` count on `kbStatus`.

## Files resolved

- **`package.json`** — UU, config scalar (2g). Sole conflict was `version`:
  HEAD `0.2.40` vs incoming `0.2.21`. Took HEAD. Incoming is the *older*
  timestamp and accepting it would regress the package version; the
  enrichment's "more recent commit by timestamp" rule selects HEAD.

- **`tools/generate/src/cli/index.ts`** — UU, code (2c). Two hunks, HEAD a
  strict superset of incoming in both:
  - import hunk: incoming imports `{buildKb, ensureConfig, exportCorpus,
    kbStatus, writeProjections, KB_USAGE}`; HEAD imports all six **plus**
    `DOC_KIND_FIELD, MEMBER_KIND`. Incoming's new symbol (`writeProjections`)
    is retained.
  - status-line hunk: incoming `corpus: ${s.corpus} document(s)
    (${s.projected} projected)`; HEAD `corpus: ${exported} exported +
    ${s.projected} projected${expected}`. Incoming's new datum (`s.projected`)
    is retained; HEAD additionally splits exported/projected.

- **`tools/generate/src/cli/kb.ts`** — UU, code (2c). Six hunks, all HEAD-side
  refactors of incoming's own additions. Took HEAD throughout; every incoming
  contribution survives under its post-REQ-164 name:
  - `writeProjections()` — present, `kb.ts:431`
  - projection `doc_kind` declaration — present as `[DOC_KIND_FIELD]:
    MEMBER_KIND`, `kb.ts:527` (incoming's `doc_kind: SYSTEM_KB_DOC_KIND`;
    `DOC_KIND_FIELD === 'doc_kind'`, `MEMBER_KIND === 'system_kb'`, so this is
    the identical value under constants that now live in `kb-model.ts`)
  - `projected: number` on the status type — present, `kb.ts:1099`
  - derived-membership rationale comment — present, and HEAD's text is a
    superset that additionally records the REQ-164 predicate change.

- **`tests/reconciliation-system-knowledge-base.test.ts`** — UU, test (2c).
  **Mixed resolution**, not a wholesale side-pick:
  - Hunk 1 (HEAD side empty, incoming adds a 4-line comment): non-overlapping
    addition → **KEPT INCOMING** per 2c rule 1. Re-applied above
    `expect(binding.kb.description)`. This is the only net staged change.
  - Hunks 2–4 (`kbStatus` assertions): took HEAD. HEAD uses
    `withStore(paging(...))` + `toMatchObject` + a `tickets` count that
    postdates the commit; incoming's contribution to these hunks is the
    `projected: 0` assertion, which HEAD retains in all three.

- **`tests/test_UAT_FC_REQ-123_system_kb.test.ts`** — DU (deleted by us,
  modified by them), 2a + **BUG-1301 PRECEDENCE**. Accepted the deletion
  (`git rm`). Detail below.

## Incoming changes preserved

Verified in the resolved tree:

| Incoming contribution | Location in resolved tree |
|---|---|
| `kb-projection.ts` (whole feature) | identical to commit |
| `test_UAT_FC_REQ-165_projected_reference.test.ts` | identical to commit |
| `packages/framework/src/modules/index.ts` | identical to commit |
| `writeProjections` import + 2 call sites | `cli/index.ts:72,767,795` |
| `s.projected` in status output | `cli/index.ts:832` |
| `writeProjections()` definition | `cli/kb.ts:431` |
| projection `doc_kind` membership | `cli/kb.ts:527` |
| `projected: number` status field | `cli/kb.ts:1099` |
| `description`-not-`prompt` comment | `reconciliation-system-knowledge-base.test.ts:862-865` |

### Hunk dropped under BUG-1301 precedence

**File:** `tests/test_UAT_FC_REQ-123_system_kb.test.ts`

**HEAD-side commit that removed the target:** `671a09196f` — "test(kb): assert
the export command itself, and retire the duplicate suite" (2026-09-10).
Confirmed integrated: `git merge-base --is-ancestor 671a09196f HEAD` → true.

**Why this is a legitimate refactor, not a resolution shortcut:** the commit
message states the retirement explicitly and gives its reasoning — "Retires
tests/test_UAT_FC_REQ-123_system_kb.test.ts. All fifteen of its scenarios
verify AC-1291..AC-1306 in the same shape as the AC-traceable file — same
runner, same stub model, same real DocDirStore. Two files asserting one
property is where an upstream API change goes unnoticed, which is how the
`prompt` -> `description` rename and the indexes-by-source-name change both
survived here." It is a deliberate de-duplication that *strengthened* coverage
(both ACs now drive `1c kb export` for real via `withRepoCorpus`), decided
independently and earlier, not by me and not to make this conflict go away.

**Why no test coverage is lost:** the incoming hunk's entire payload for this
file is a single assertion fix — `binding.kb.prompt` → `binding.kb.description`
plus an explanatory comment. That is precisely the bug `671a09196f` names as
having hidden in the duplicate. The fix is live in HEAD at
`tests/reconciliation-system-knowledge-base.test.ts:866`, and this resolution
additionally restores incoming's explanatory comment immediately above it. No
test function present on either side of this conflict is lost: the retired
file's fifteen scenarios are covered by the AC-traceable suite, and the one
assertion the incoming commit touched is preserved verbatim in intent.

## Tree state at exit

`git status --porcelain` → `M  tests/reconciliation-system-knowledge-base.test.ts`

No UU/AA/DU/UD/AU/UA entries. `git ls-files -u` empty. No conflict markers in
any tracked file. `CHERRY_PICK_HEAD` left intact (`52fd6302cc92...`) — no
`--continue`/`--skip`/`--quit`/`--abort` was issued.

The four HEAD-resolved files show no net staged change because HEAD already
carried the evolved form of the commit's content; per STEP 4 this was staged
and left for Python's finalize step rather than skipped here.
