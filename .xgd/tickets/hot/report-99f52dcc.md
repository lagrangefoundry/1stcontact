---
uid: report-99f52dcc
id: REPORT-5372
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T20:29:04.854155+00:00'
updated_at: '2026-09-28T20:29:04.854155+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

Incoming commit: 52fd6302cc `feat(kb): projected reference — the product's own facts, generated [FREE-CODED]`

All five conflicts share one shape: HEAD already carries a strictly later
evolution of the very feature this commit introduces. The projection feature
itself (`kb-projection.ts`, `writeProjections`, `projectedDocument`,
`isProjected`, `KbStatus.projected`, and `tests/test_UAT_FC_REQ-165_projected_reference.test.ts`)
is present in HEAD and merged without conflict. Only the hunks that predate
two subsequent, already-integrated changes conflicted:

- **REQ-164** renamed the membership predicate from `fields.system_kb: true`
  to `doc_kind: system_kb` (`optedIn`/`INCLUDE_FIELD` -> `inSystemKb`/
  `DOC_KIND_FIELD` + `MEMBER_KIND`), and made the shipped corpus unrestricted.
- A later change added the ticket-count comparison to `1c kb status`
  (`KbStatus.tickets`, `countMemberTickets()`), so the corpus line reads
  `N exported + M projected (of N ticket(s)…)` rather than a bare total.

## Files resolved

- **`package.json`** — UU, config (2g). Routine version-bump conflict; kept
  HEAD's `0.2.40` over incoming `0.2.21`. Not a semantic change.
- **`tools/generate/src/cli/index.ts`** — UU, code (2c). Two hunks, both the
  import list and the `kb status` output line. Kept HEAD's ticket-aware line
  and the `DOC_KIND_FIELD`/`MEMBER_KIND` imports it needs; incoming's
  `writeProjections` import and projected count are present in that form.
- **`tools/generate/src/cli/kb.ts`** — UU, code (2c). Five hunks. Kept
  `DOC_KIND_FIELD`/`MEMBER_KIND` and dropped incoming's `SYSTEM_KB_DOC_KIND`,
  which is a same-valued duplicate of `MEMBER_KIND` under the pre-REQ-164
  name; kept `KbStatus.tickets` and `countMemberTickets()`. Verified before
  dropping that `SYSTEM_KB_DOC_KIND` was referenced only inside the
  conflicted regions of this file itself.
- **`tests/reconciliation-system-knowledge-base.test.ts`** — UU, test (2c/2f).
  Three hunks. Kept HEAD's `toMatchObject` + `withStore(paging(...))`
  assertions, which include the `tickets` field incoming predates. No test
  function removed; incoming added no test function here.
- **`tests/test_UAT_FC_REQ-123_system_kb.test.ts`** — DU (deleted by us),
  resolved by `git rm` under the BUG-1301 precedence exception. Detailed below.

## Incoming changes preserved

Verified present in the resolved tree:

- `writeProjections` — `kb.ts:431` (definition), imported and invoked from
  `index.ts` (3 references).
- `projectedDocument` — `kb.ts:521`; emits `[DOC_KIND_FIELD]: MEMBER_KIND`,
  the post-REQ-164 spelling of incoming's `doc_kind: SYSTEM_KB_DOC_KIND`.
- `isProjected` / `projections` / `ProjectedDoc` — imported from
  `./kb-projection` at `kb.ts:57`; used at `kb.ts:392`, `:449`, `:1135`.
- `KbStatus.projected` — declared `kb.ts:1099`, populated `kb.ts:1135`.
- `tools/generate/src/cli/kb-projection.ts` and
  `tests/test_UAT_FC_REQ-165_projected_reference.test.ts` — both tracked,
  merged without conflict.
- The `prompt` -> `description` assertion fix — present at
  `tests/reconciliation-system-knowledge-base.test.ts:849`.

### Hunk dropped under BUG-1301 precedence

**File:** `tests/test_UAT_FC_REQ-123_system_kb.test.ts`
**HEAD-side commit that removed it:** `671a09196f`
`test(kb): assert the export command itself, and retire the duplicate suite`
(2026-09-10), which deleted the file in full (-503 lines) while adding 91
lines to `tests/reconciliation-system-knowledge-base.test.ts`.

**Why this is a legitimate refactor, not a resolution shortcut:** the commit
message states that all fifteen of the retired file's scenarios verify
AC-1291..AC-1306 "in the same shape as the AC-traceable file — same runner,
same stub model, same real DocDirStore," and that the duplication is itself
the defect being fixed: "Two files asserting one property is where an upstream
API change goes unnoticed, which is how the `prompt` -> `description` rename
and the indexes-by-source-name change both survived here." The deletion is
deliberate, documented, predates this resync, and was accompanied by a net
*increase* in assertion coverage in the surviving suite (which now drives
`1c kb export` for real rather than mirroring its body).

**Why the dropped hunk is a no-op:** incoming's only edit to this file is that
exact `prompt` -> `description` assertion fix — the very rename 671a09196f
cites as having slipped through *because* of the duplication. That fix is
already present in the surviving suite at
`tests/reconciliation-system-knowledge-base.test.ts:849`. No assertion is lost.
No test function that exists on either side of this conflict was deleted by my
choosing; the file's removal was decided earlier and independently.

## Staging state

`git status --porcelain` is empty: no UU/AA/DU/UD lines remain, and the
resolved tree is byte-identical to HEAD (`git diff HEAD` empty) — this
commit's content is entirely subsumed by what is already on the branch, so
the finalize step should see a clean staged diff and skip the commit.
`CHERRY_PICK_HEAD` (52fd6302cc) is left in place; no `--continue`/`--skip`/
`--quit`/`--abort` was issued.

That identity to HEAD is also the verification here: the staged state is
exactly the known-good HEAD, so there is no new code to typecheck or test.
