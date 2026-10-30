---
uid: report-50965a0a
id: REPORT-5157
type: report
title: 'Resync resolve conflicts: d7587990b588ef6c03b752fe16afa93745aa9da3'
created_by: xgd
created_at: '2026-09-26T22:16:47.045182+00:00'
updated_at: '2026-09-26T22:16:47.045182+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-a03967f2.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), STEP 2e. Rule applied: **"one side a strict superset: keep the
  superset"** → resolved to **ours** (`git checkout --ours` + `git add --sparse`).

  Evidence (three-stage diff against merge base
  `b6f1c0d06ad1ac89b6286f4b59320eb0354cc559`):

  - **Theirs** (incoming `50fc10b7`, 2026-08-23) adds exactly one line:
    `chat_comment: comment-869ded75`.
  - **Ours** (HEAD `9dc8a4df`) adds that **same line verbatim**, plus
    `bundled_in: bundle-b3b7c399`, and advances the lifecycle:
    `status: ready_to_reconcile` → `free_and_reconciled`,
    `completed_at: null` → `'2026-08-31T14:22:29.127505+00:00'`.
  - A direct `theirs → ours` diff shows **no line present in theirs that is
    absent from ours**: ours ⊃ theirs. Bodies are byte-identical on both
    sides; the conflict was frontmatter-adjacency only (both sides appended
    to the same `fields:` block).

  Both sides therefore assert the *same* fact for the only field theirs
  touches — there is no competing fact, so 2e's per-fact timeline tiebreak
  never engages. Taking theirs would have been a pure regression: it would
  roll `status` back from `free_and_reconciled` to `ready_to_reconcile`,
  reset `completed_at` to null, and drop `bundled_in: bundle-b3b7c399`.

  Corroborated by the HEAD-side intent ledger (`xgd ticket history
  request-a03967f2`), which records the progression
  `ready_to_reconcile` → `bundled` → `free_and_reconciled` (completed
  `2026-08-31T14:22:29Z`, commit `6558127a`) — all of it strictly later than
  the incoming commit's 2026-08-23 state.

## Incoming changes preserved

- `.xgd/tickets/hot/request-a03967f2.md` — **fully preserved.** The incoming
  commit's entire diff for this file is the single added line
  `chat_comment: comment-869ded75`. Verified present in the staged result
  (`git show :.xgd/tickets/hot/request-a03967f2.md`) at line 24.

**No hunks dropped.** The BUG-1301 precedence exception was not invoked and
was not needed — nothing from the incoming side was discarded. No UAT test
files were involved in this conflict, so STEP 2f did not apply.

## Staging state

`git status --porcelain` is empty and `git ls-files -u` reports no unmerged
paths: all conflict stages are cleared. The staged tree carries no net change
relative to HEAD, which is the expected consequence of ours being a strict
superset — HEAD already contained the incoming commit's sole contribution.
Per STEP 4 this was left for the finalize step to detect and skip; no
`git cherry-pick --continue/--skip/--quit/--abort` was issued, and
`CHERRY_PICK_HEAD` (`50fc10b759dfe262320a64390f16b71fc285399a`) remains
present.
