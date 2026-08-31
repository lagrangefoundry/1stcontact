---
uid: report-2d21f707
id: REPORT-2845
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:22:17.591275+00:00'
updated_at: '2026-08-31T08:22:17.591275+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-015e42ac.md` — class **AA** (both added), intent/bookkeeping ticket (rule 2b + 2e: incoming is a strict superset → keep the superset). Resolved via `git checkout --theirs` + `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

No code/implementation files were conflicted; the sole conflict was a request ticket.

- `.xgd/tickets/hot/request-015e42ac.md`: the two sides differ by exactly one line — incoming adds `fields.chat_comment: comment-b0d6de61`. Every other byte (frontmatter, commits list, version `0.0.166`, `bundled_in`, and the full narrative body) is identical between HEAD and incoming, so the superset rule applies cleanly with no per-fact timeline arbitration needed and nothing from the HEAD side lost.
- Verified: `git diff --cached <CHERRY_PICK_HEAD> -- .xgd/tickets/hot/request-015e42ac.md` is empty, i.e. the staged resolution matches the incoming commit's version exactly. No incoming content discarded.
- No hunks dropped; the BUG-1301 precedence exception was not invoked.

Cherry-pick sequencer state (`CHERRY_PICK_HEAD` = `644a171c986e3df3e701658d6565139648ab4fe6`) left intact for `cherry_pick_finalize_resolution`.
