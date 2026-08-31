---
uid: report-f840abf4
id: REPORT-2857
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:36:04.869027+00:00'
updated_at: '2026-08-31T08:36:04.869027+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-b1300473.md` — class **AA** (both added), intent/bookkeeping ticket (`request-*`) → rule **2b / 2e (strict superset)**. Both sides added the same 181-line request ticket. Diffing the two index blobs (ours `ff1835a1`, theirs `53cfaa95`) showed a single difference: the incoming side adds one frontmatter field, `chat_comment: comment-214c3fa5`, under `fields:`. Incoming is a strict superset of HEAD — no field or section is changed differently on the two sides, so no per-fact timeline arbitration was needed. Resolved with `git checkout --theirs`, staged with `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-b1300473.md`: confirmed. The incoming commit `e4fa6506` touches only this file. The resolved working-tree file hashes to `53cfaa95ad275b02312e504a47f46d4b3deb24f8` — byte-identical to the incoming (stage-3) blob — so 100% of the incoming content is present, including the added `chat_comment: comment-214c3fa5` line (now at line 24). Nothing from the HEAD side was lost, since HEAD's version is a subset of incoming's.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code, test, or config files were involved in this conflict.
