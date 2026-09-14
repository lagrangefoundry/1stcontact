---
uid: report-ecc015c7
id: REPORT-4193
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T00:51:05.041890+00:00'
updated_at: '2026-09-14T00:51:05.041890+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-bbff35c7.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), STEP 2e. Resolved **to OURS** under 2e's "one side is a strict
  superset of the other: keep the superset" clause.

  Path is sparse-excluded (worktree sparse-checkout spec is `/*`,
  `!/.xgd/tickets/`, `!/.xgd/tickets/**`), so the conflict existed only in the
  index — no working-tree file, no textual conflict markers. Resolved in-index by
  setting stage 0 to the ours blob (`9129eee4`) via `git update-index --cacheinfo`
  and restoring the `skip-worktree` bit to match every other `.xgd/tickets/**`
  entry (`S` in `git ls-files -v`). No `cherry-pick --continue/--skip/--quit/
  --abort`, no `reset`, no branch checkout: `CHERRY_PICK_HEAD` is still present at
  `9081f1b091c6fd0e0e57863295e4eaf0d6b59f9a`.

  Stage blobs:
  - base (`:1:`) `0dd8738e54`
  - ours (`:2:`) `9129eee477` — identical to `HEAD:.xgd/tickets/hot/request-bbff35c7.md`
  - theirs (`:3:`) `64d8cce688`

## Incoming changes preserved

Incoming commit `9081f1b091` *xgd(ticket): update request request-bbff35c7*
(45 insertions, 3 deletions). **Every hunk it authored is already present in the
resolved (ours/HEAD) blob** — verified by diffing base against ours, which
reproduces the incoming diff verbatim:

- Requirements bullet — "The cursor must not re-report the document it stopped on"
  (inclusive `updated_at >= cursor` predicate, boundary travels with tied uids).
- Requirements bullet — "A corrupt cursor costs a sweep and never a turn"
  (cites `[[REQ-159]]`).
- Requirements bullet — "A conversation is never reported to itself"
  (chat tickets excluded from the delta only; cites `[[REQ-171]]`).
- Replacement of the two-line "Until they land… search remains single-index"
  paragraph with the two-paragraph co-ranked fan-out narrative ("Two independent
  indexes, co-ranked for presentation", tie breaks project-first, scores
  comparable by construction, REQ-112 deletes the fan-out).
- Acceptance bullet — "A search reaching both knowledge bases returns one list
  ordered by the component's own scores…".
- Decided bullet — "A single oversized title is clipped, not dropped".

Diffing theirs against ours shows the **only** remaining differences are
frontmatter/bookkeeping, where ours is strictly newer and richer:

- `updated_at`: theirs `2026-09-01T19:54:48Z` → ours `2026-09-11T18:53:54Z` (later)
- `last_field_updated`: `body` → `status`
- `status`: `draft` → `bundled`
- `fields`: ours adds `commits` (working_sha `e9bd703b…`, `751b0706…`),
  `version: 0.2.34`, `bundled_in: bundle-8e1807f6` — fields theirs never touched.

No prose, acceptance criterion, or decision from the incoming side is absent from
the resolution, and no content was invented. This is the seeded-overlay case: the
bundle branch's `seed_local_overlay` commit already carried this ticket update, so
the cherry-pick is genuinely **redundant, not discarded** — STEP 3's distinguishing
check passes (the incoming commit's key changes are present in HEAD via a different
route). Per STEP 4 the staged diff vs HEAD is therefore empty; `--skip` was NOT
called — the finalize step will detect the clean staged diff and skip the commit.

No BUG-1301 precedence exception was invoked; no hunk was dropped.

`git status --porcelain` is empty: no UU/AA/DU/UD lines remain.
