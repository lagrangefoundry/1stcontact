---
uid: report-30f2416e
id: REPORT-2839
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:14:41.712517+00:00'
updated_at: '2026-08-31T08:14:41.712517+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-87f0aefa.md` — class **AA** (both added), intent/bookkeeping ticket.
  Rules applied: **2b** (AA, one side strictly a superset → keep the superset, incoming wins)
  reinforced by **2e** (incoming only added a field the other side never touched → keep the
  superset). Resolved via `git checkout --theirs` + `git add --sparse` (path is outside the
  sparse-checkout cone, DOC-986 §2/§4.1 — the conflict existed only in the index, with no
  working-tree markers).

  Both sides were byte-identical apart from a single added frontmatter field on the incoming
  side:

  ```
   fields:
     version: 0.1.9
     story_points: 2
     bundled_in: bundle-e0143ffa
  +  chat_comment: comment-02316013
   ---
  ```

  No competing facts: no field, section, or paragraph was changed differently on the two sides,
  so no per-fact `working-timeline` adjudication was required. The enrichment note's fallback
  rule ("intent unknown on one or both sides — take the more recent commit by timestamp and flag
  for post-merge review") was not needed, because the two sides do not actually compete; taking
  the superset preserves everything from both. Nothing was invented that was not present on one
  of the two sides.

## Incoming changes preserved

Confirmed. The incoming commit is `af476950ee5b3c760d713170407ff8bb78bd7c89`
(*xgd(ticket): update bug bug-87f0aefa*, 1 file, 113 insertions — it registers as a whole-file
add because the AA conflict has no merge base).

The staged blob is `4196d67d7f8bb63f4fd0dae2fb6e721c22ae7c19` — byte-identical to the incoming
side's blob (index stage 3). Every incoming change is therefore present in the resolution, and
nothing from the HEAD side was dropped either, the HEAD version being a strict subset.

Staged diff vs HEAD is exactly the one-line `chat_comment: comment-02316013` addition, i.e. the
incoming commit's entire net effect relative to this branch.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code or test files
were involved in this conflict.
