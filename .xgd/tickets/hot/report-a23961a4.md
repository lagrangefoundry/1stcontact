---
uid: report-a23961a4
id: REPORT-2732
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:03:19.634980+00:00'
updated_at: '2026-08-31T06:03:19.634980+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-5d3bf630.md` — class **AA** (both added), intent/bookkeeping ticket → rule **2e** (strict-superset branch). Out of the sparse-checkout cone, so resolved with `git checkout --theirs --` + `git add --sparse --` (DOC-986 §2/§4.1).

  The two sides are byte-identical except for a single added frontmatter field on the incoming side:

  ```
  +  chat_comment: comment-624d5069
  ```

  Nothing was removed or altered on either side, so incoming (free_coded, `f005c86ab958dc0626f5326188c33b5471bd88c3`, 2026-08-23) is a strict superset of ours. Superset wins per 2e — no per-fact timeline lookup was needed, since no fact is changed differently on the two sides (the enrichment's "unknown intent → take later commit" fallback was not reached; the superset rule resolves it unambiguously and preserves both sides' content).

## Incoming changes preserved

- `.xgd/tickets/hot/request-5d3bf630.md`: the incoming commit's only change to this file is the `chat_comment: comment-624d5069` field addition. It is present in the resolved file at line 26, and the resolved file is 270 lines — identical to the incoming blob `e0e0a85b5ebcc5f7ed9a5dc4baf7a3031907f1a8`. Staged diff vs HEAD is exactly `1 insertion(+)`, matching the incoming diff.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code, test, or UAT files were involved in this conflict. Cherry-pick sequencer state (`CHERRY_PICK_HEAD`) left intact for `cherry_pick_finalize_resolution`.
