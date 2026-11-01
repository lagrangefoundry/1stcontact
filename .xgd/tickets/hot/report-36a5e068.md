---
uid: report-36a5e068
id: REPORT-7717
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:30:35.982844+00:00'
updated_at: '2026-11-01T15:30:35.982844+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-95dffc48.md` (REQ-184) — intent/bookkeeping ticket (2e), outside sparse cone. Same section changed on both sides; kept HEAD as the later state:
  - Incoming a6524df3 (2026-09-04 23:55, draft era) inserts a section "`memberships.account_id` has the same bug and is fixed in the same migration", including the REQ-185 ordering note. It also bumps updated_at and restores the trailing newline.
  - HEAD (2026-11-01, status free_and_reconciled) has fully rewritten that body after implementation. It already contains the later version of the same section, "`memberships.account_id` is renamed in the same migration" (line 99). That section also carries the identical REQ-185 ordering sentence (line 114).
  - The draft prose next to it, which incoming's hunk anchors on ("blast radius…", "The subject column can wait for a consumer"), no longer exists in HEAD. It was superseded by the shipped "subject column landed too" text.
  - Staged with `git checkout --ours` + `git add --sparse`. Index equals HEAD, so the commit is redundant (BUG-1109/1122 shape). Left for finalize to detect the empty diff; did not skip.

## Incoming changes preserved

No code files involved. The incoming commit's substantive intent (rename memberships.account_id in the same migration; REQ-185 runs after it) is present in HEAD in its later, post-implementation wording. Not taken: the stale draft-era updated_at timestamp, the trailing newline, and the superseded draft phrasing.
