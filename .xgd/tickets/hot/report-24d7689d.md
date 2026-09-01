---
uid: report-24d7689d
id: REPORT-3176
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T01:56:55.151237+00:00'
updated_at: '2026-09-01T01:56:55.151237+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — class **UU**, rule **2e (intent/bookkeeping ticket)**,
  resolved **per-fact**, not by picking a whole side.

  Incoming commit `e74606d80d` "xgd(ticket): update bug bug-db356ff8" (2026-08-23).
  HEAD-side commit `7a8d0abd29` "xgd(ticket): seed_local_overlay bug bug-db356ff8" (2026-08-31).

  Two conflict regions, plus one region that merged cleanly:

  1. `updated_at` + `status` (same fact, changed differently on both sides) —
     genuine conflict. HEAD: `status: bundled`, `updated_at: 2026-08-26T17:36:27`.
     Incoming: `status: free_coded`, `updated_at: 2026-08-24T01:50:12`.
     Neither side carries an `intent_uid`, so `xgd working-timeline` is not
     applicable; the enrichment metadata's fallback (later commit by timestamp)
     applies and both signals agree — HEAD is later by commit date (08-31 vs
     08-23) and by ticket `updated_at` (08-26 vs 08-24). **Took HEAD.**
     `bundled` is also downstream of `free_coded` on the same lifecycle, so this
     is a supersession, not a competing claim; reverting to `free_coded` would
     have rolled the ticket out of `bundle-78f4e2fe`.
  2. `fields.bundled_in: bundle-78f4e2fe` — HEAD-only addition, incoming never
     touched this field. Non-overlapping → **kept**.
  3. `fields.commits` + `fields.version` (git merged these cleanly, no markers) —
     incoming's own additions, retained verbatim.

  No field was invented; no `intent_uid` / `story_uid` / `capability_uid` was touched.

## Incoming changes preserved

Incoming diff for this file contained four changes; all are accounted for:

- `+ fields.commits: [{working_sha: ea48502d0d90bb607ac528e34099e71eaab6df40,
  reconcile_sha: null, main_sha: null}]` — **present** in the resolved file.
- `+ fields.version: 0.2.10` — **present** in the resolved file.
- `status: free_coding → free_coded` — **present via supersession**: HEAD already
  passed through `free_coded` and advanced to `bundled` on the same lifecycle
  path. The incoming state is not absent, it is superseded by a later one.
- `updated_at` bump — superseded by HEAD's later value, same fact.

No BUG-1301 precedence exception was invoked; no hunk was dropped. No code or
test files were involved in this conflict.

### Note: resolution nets to no diff vs HEAD

`git status --porcelain` after staging shows no tracked changes: HEAD already
carries this commit's full effect (the `commits` and `version` fields, and a
status at or beyond `free_coded`), landed through the seed_local_overlay route.
Per STEP 4 this is the BUG-1109/BUG-1122 redundant-commit case, distinguished
from a discard by the STEP 3 check above — the incoming commit's key changes are
present in HEAD rather than missing. `--skip` was NOT called; the finalize step
will detect the clean staged diff. `CHERRY_PICK_HEAD` (`e74606d80d`) is intact.
