---
uid: report-e0c2dc74
id: REPORT-3422
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:24:27.036821+00:00'
updated_at: '2026-09-04T00:24:27.036821+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

Cherry-picking `52fd6302cc` — *feat(kb): projected reference — the product's own
facts, generated [FREE-CODED]* (2026-08-31 16:00). Both sides are `free_coded`;
the ours side is the pair *feat(kb): the project knowledge base* (`a3455307e5`,
15:16) and *fix(kb): corpus export selects by doc_kind, unrestricted, exhaustive*.
Every conflict was a non-overlapping addition or two independent useful changes to
one region, so all five resolved by rule 2c.2/2c.3b — combine, not pick a winner.

- **`package.json`** — UU, config scalar (2g). Version only: incoming bumps
  `0.2.20 → 0.2.21`, HEAD is already at `0.2.23`. Kept `0.2.23`. The incoming
  edit is release bookkeeping rather than the commit's code intent, and taking
  it would walk the version backwards. **Flagged for post-merge review** per the
  enrichment rule. This file now has no diff vs HEAD.
- **`tools/generate/src/cli/kb.ts`** — UU, implementation (2c). Three hunks, all
  combined:
  - HEAD replaced `INCLUDE_FIELD` with `DOC_KIND_FIELD`/`MEMBER_KIND`; incoming
    added `SYSTEM_KB_DOC_KIND`. Both kept. The incoming constant is defined as
    `= MEMBER_KIND` rather than a second `'system_kb'` literal — same value, and
    it serves the incoming's own stated intent (a projection must not silently
    drop out of the KB the day the predicate moves).
  - `KbStatus` — HEAD's `tickets: number | null` and incoming's `projected: number`
    both kept, with a line added to `tickets`' doc saying it counts the exported
    half (a projection has no ticket).
  - `kbStatus()` — both `tickets:` and `projected:` returned.
- **`tools/generate/src/cli/index.ts`** — UU, implementation (2c). Two hunks:
  - Import list: HEAD's `DOC_KIND_FIELD`/`MEMBER_KIND` plus incoming's
    `writeProjections`, all from `./kb`.
  - `kb status` output: HEAD's `${expected}` ticket-count suffix plus incoming's
    `(${s.projected} projected)`. Integrated rather than concatenated — the
    comparison now runs against `s.corpus - s.projected`, because projections have
    no ticket by construction and comparing the ticket count against a total that
    includes them would report every healthy corpus as stale and name an export
    that cannot fix it. Covered by `test_UAT_FC_REQ-164_*` (12/12 pass).
- **`tests/reconciliation-system-knowledge-base.test.ts`** — UU, test (2f). Two
  conflicts, both keep-both; no test function was deleted or renamed:
  - AC-1305: both sides had already converged on `binding.kb.description`; kept
    incoming's explanatory comment.
  - AC-1293: kept HEAD's `withStore([], …)` wrapper and `tickets: 0` and added
    incoming's `projected: 0` to the same exhaustive assertion.
  - Additionally repaired an escaped conversion: git auto-merged incoming's
    `projected: 0` into the two adjacent non-exhaustive `toMatchObject` blocks
    and left the exhaustive `toEqual` at the post-export assertion without it.
    That assertion would have failed against the merged `kbStatus`, so the
    incoming's addition was put on its intended target as well.
- **`tests/test_UAT_FC_REQ-123_system_kb.test.ts`** — UU, UAT test (2f). HEAD
  side empty, incoming added a comment above an assertion both sides already
  agreed on. Comment kept. No test function touched.

## Incoming changes preserved

Verified against `git show 52fd6302cc -- <file>` for each code file. Nothing was
dropped; the BUG-1301 precedence exception was not needed and was not used.

- `kb.ts` — `isProjected/projections/ProjectedDoc` import, `SYSTEM_KB_DOC_KIND`,
  the `!isProjected(name)` guard in `exportCorpus`'s sweep, `writeProjections`,
  `corpusMembership`, `projectedDocument`, the two-producers paragraph in
  `KB_USAGE`, `KbStatus.projected` and its count in `kbStatus` — all present.
- `index.ts` — `writeProjections` import, the export path's `ensureConfig()` →
  `writeProjections()` → `exportCorpus()` ordering and its `projected: …` log
  line, the build path's `ensureConfig()` + `writeProjections()` before
  `buildKb()`, the usage text, and `(N projected)` on the status line — all
  present.
- Both test files — every incoming assertion and comment present, plus the
  `projected: 0` the auto-merge misplaced.
- `package.json` — the incoming's only change is the version scalar, deliberately
  superseded by HEAD's higher `0.2.23` (see above). No code intent is involved.

## Verification run

- `tsc -p tools/generate/tsconfig.json --noEmit`: no errors in any `cli/` file
  (both `kb.ts` and `kb-projection.ts` confirmed in the program). The only errors
  are pre-existing missing `apps/control-app/src/generated/*` declarations, a
  worktree artefact unrelated to this commit.
- `tests/test_UAT_FC_REQ-164_corpus_export.test.ts` — 12/12 pass. This is the
  suite that exercises the merged `kb status` line and the ticket-count
  comparison.
- `tests/test_UAT_FC_REQ-165_projected_reference.test.ts` — 12/13 pass.
- `tests/reconciliation-system-knowledge-base.test.ts` — 4 fail;
  `tests/test_UAT_FC_REQ-123_system_kb.test.ts` — one `beforeAll` fails, 8 pass.

All of these failures are one pre-existing environment fault, not a resolution
defect: `KnowledgeConfigError: knowledge base 'system' reads from source
'shipped', which this host has no index for (available: none)`, raised from the
shared `@lagrangefoundry/knowledge` index store inside `buildKb → buildMap →
search`. Confirmed by re-running `test_UAT_AC1293` with HEAD's own pre-merge
`kb.ts`, `index.ts` and test file (`git show :2:`) in place — identical failure,
no incoming code involved. Three of the four failures are in tests this
resolution changed by a comment or not at all. The resolved files were restored
from backup afterwards and re-verified before staging.

Two ignored build artefacts were copied into the worktree from the main checkout
to get the suites past import — `apps/control-app/src/generated/` and
`kb/system/`. Neither is tracked and neither appears in `git status`.
