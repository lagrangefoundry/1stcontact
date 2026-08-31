---
uid: report-11a5657a
id: REPORT-2695
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:24:29.845525+00:00'
updated_at: '2026-08-31T05:24:29.845525+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/chat-06d47a5c.md` — class **AA** (both added, no merge base; stage 1 absent). Rule **2b** applied: the incoming (free_coded) side is a strict superset of HEAD's. Both sides are byte-identical except for the `fields` mapping: HEAD has `fields: {}`, incoming has `fields:\n  chat_comment: comment-c74424ff`. Kept the incoming superset via `git checkout --theirs`, staged with `git add --sparse` (path is under `.xgd/tickets/`, outside the sparse-checkout cone on reconcile branches — DOC-986 §2/§4.1).

The auto-enrichment noted "intent unknown on one or both sides / take the more recent commit by timestamp." That tie-break was not needed here: the two sides are not competing over any fact. HEAD asserts no `chat_comment` link, incoming adds one, and every other field (uid, id, type, title, created_by, created_at, updated_at, completed_at, last_field_updated, status) and the body (`<!-- xgd-chat-end -->`) are identical. Superset-wins under 2b resolves it without discarding anything from either side.

## Incoming changes preserved

- `.xgd/tickets/hot/chat-06d47a5c.md` — confirmed. The incoming commit `9b136add3c8feb1cd26bd45b35c1adde5aa508e4` ("xgd(ticket): update chat chat-06d47a5c") shows the file as a 16-line addition on its side; its distinguishing content is the `fields.chat_comment: comment-c74424ff` link. The staged blob is `e8d59b1e3f23824cb7f329a0cd761b8b9e1149a5` — identical to the incoming (stage 3) blob, so 100% of the incoming content is present. Nothing from HEAD was lost: HEAD's blob `880049903b05036670e4a22c0026e4be6dd5a73d` contains no fact absent from the resolution.

No hunks were dropped, so the BUG-1301 precedence exception does not apply here. No code, test, or config files were in conflict.

Post-resolution `git status --porcelain` shows `M  .xgd/tickets/hot/chat-06d47a5c.md` with no remaining UU/AA/DU/UD entries. CHERRY_PICK_HEAD is intact for `cherry_pick_finalize_resolution`. The `??` entries in status are pre-existing untracked hot tickets, not part of this conflict.
