---
uid: report-8bcb0897
id: REPORT-2754
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:27:49.477671+00:00'
updated_at: '2026-08-31T06:27:49.477671+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-2ea36591.md` — class **AA** (both added), intent/bookkeeping ticket (2e; also matches 2b superset rule). The two sides are byte-identical except that the incoming (free_coded, commit `2c18b6b`, "xgd(ticket): update request request-2ea36591") side adds one frontmatter field under `fields:`:

      chat_comment: comment-34e04d9c

  Incoming is a strict superset of HEAD — no field, section, or paragraph differs otherwise — so the superset was kept (`git checkout --theirs`, `git add --sparse`; the path is outside the sparse-checkout cone per DOC-986 §2/§4.1). No timeline lookup was needed: there is no competing fact, so `xgd working-timeline` would not change the outcome. No `intent_uid` / `story_uid` / `capability_uid` was touched, and no content absent from either side was invented.

## Incoming changes preserved

- `.xgd/tickets/hot/request-2ea36591.md` — verified before staging by diffing the resolved working-tree file against stage 3 (`git show :3:`): identical, zero differences. The incoming commit's only change to this file (163 insertions, the whole file as added on that side) is present, including the `chat_comment: comment-34e04d9c` field that is unique to the incoming side (confirmed at line 23 of the resolved file). Staged diff vs HEAD is exactly `1 insertion(+)`, matching the one-field delta.

No hunks were dropped; the BUG-1301 precedence exception did not apply. No code, test, or UAT files were involved in this conflict — the only conflicted path was this bookkeeping ticket.
