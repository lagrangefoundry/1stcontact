---
uid: report-8c2b68f4
id: REPORT-4197
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T01:15:48.804509+00:00'
updated_at: '2026-09-14T01:15:48.804509+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` — UU, intent/bookkeeping ticket
  (rule 2e). Sparse-excluded path, so the conflict existed only in the
  index (DOC-986 §2/§4.1): resolved with `git checkout --ours` +
  `git add --sparse`.

  Ours (`xgd(ticket): seed_local_overlay bug bug-93851fea`) is a strict
  superset of theirs (`xgd(ticket): update bug bug-93851fea`). The
  incoming commit `daaaeae` adds exactly one line —
  `chat_comment: comment-0948105e` under `fields:` — and the HEAD-side
  seeded overlay already carries that exact field, alongside the full
  bug writeup (title, status `bundled`, severity, commits, version,
  story_points, bundled_in, Symptom/Root cause/Fix/Test plan body).
  Taking theirs would have discarded all of that; taking ours discards
  nothing.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-93851fea.md`: incoming's sole change,
  `chat_comment: comment-0948105e`, is present in the resolved file
  (line 17, `fields.chat_comment`). Nothing from the incoming diff is
  absent.

No hunks were dropped; the BUG-1301 precedence exception was not needed.

Note: the resolution nets to no diff vs HEAD, because HEAD already
contained the incoming commit's entire effect via the seeded overlay.
This is the redundant-commit case (BUG-1109/BUG-1122), not a discard —
STEP 3's check confirms the incoming change is present in HEAD rather
than merely missing. Per STEP 4, `--skip` was NOT called; the staged
tree is left clean for `cherry_pick_finalize_resolution` to handle.
CHERRY_PICK_HEAD (`daaaeae`) is still present.
