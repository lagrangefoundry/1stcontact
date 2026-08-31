---
uid: report-4ce2b953
id: REPORT-2847
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:25:08.122035+00:00'
updated_at: '2026-08-31T08:25:08.122035+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-e922244a.md` — AA (both added), intent/bookkeeping ticket (rule 2e).
  Outside the sparse-checkout cone, so resolved via `git checkout --theirs` +
  `git add --sparse` (DOC-986 §2/§4.1).
  Rule applied: **strict superset**. Diffing the two index stages
  (ours `26b6873f`, theirs `cbe7a7ff`) shows the files are byte-identical
  except that the incoming side adds one key under `fields:`:
  `chat_comment: comment-9b30f4cd`. No field, section, or paragraph is
  changed differently on the two sides, so there is no per-fact conflict
  and no timeline lookup was needed. Kept the incoming (superset) version.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-e922244a.md` — the incoming commit
  `3aec7cd13f51d4b9a7809f894b181b91b05f24b7`
  ("xgd(ticket): update bug bug-e922244a", 2026-08-23) contributes exactly
  one change: `fields.chat_comment: comment-9b30f4cd`. It is present in the
  resolved file. The staged blob hash equals the incoming stage-3 blob
  (`cbe7a7ff531053e63f1fcc791b64292be2a2be23`), and `git diff --cached HEAD`
  for this path shows a single `+  chat_comment: comment-9b30f4cd` line —
  nothing from the HEAD side was dropped.

No code/implementation files were in conflict. No hunks were dropped, so the
BUG-1301 precedence exception did not apply. `git status --porcelain` reports
no remaining UU/AA/DU/UD lines; the cherry-pick sequencer state
(CHERRY_PICK_HEAD) is untouched and left in place for
cherry_pick_finalize_resolution.
