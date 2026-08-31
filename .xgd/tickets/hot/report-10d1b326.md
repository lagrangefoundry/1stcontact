---
uid: report-10d1b326
id: REPORT-2833
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:08:01.024284+00:00'
updated_at: '2026-08-31T08:08:01.024284+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-55832d21.md` — **AA** (both added), intent/bookkeeping ticket
  (`bug-*`, rule 2e) resolved under rule 2b "one side is strictly a superset".
  Outside the sparse-checkout cone, so resolved via `git checkout --theirs` +
  `git add --sparse` (DOC-986 §2/§4.1).

  Both sides are byte-identical except for a single added frontmatter field on the
  incoming (free_coded) side: `fields.chat_comment: comment-65daa9ab`. Incoming is a
  strict superset — no field on the HEAD side is changed, removed, or contradicted,
  so no per-fact timeline lookup (`xgd working-timeline`) was required. The auto-enriched
  metadata's "intent unknown on one or both sides / take the more recent commit" fallback
  does not bite here: with a strict superset there is no competing fact to arbitrate.
  Taking incoming loses nothing from HEAD.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-55832d21.md` — the incoming commit
  `2ffb6046b6e8dd8f1f556003c91042fa1c39e44c` ("xgd(ticket): update bug bug-55832d21")
  adds the file with 152 lines; against the HEAD-side blob its only delta is the
  `chat_comment: comment-65daa9ab` field. That field is present in the resolved file at
  line 23, and `git diff --cached HEAD` for this path shows exactly that one-line
  addition and nothing else. Incoming changes fully preserved.

No code/implementation files were in conflict. No hunks were dropped, so the BUG-1301
precedence exception was not invoked. No test functions were touched.
