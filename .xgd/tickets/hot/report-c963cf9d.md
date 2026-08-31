---
uid: report-c963cf9d
id: REPORT-2873
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:54:37.468587+00:00'
updated_at: '2026-08-31T08:54:37.468587+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-5970ab3b.md` — class **AA** (both added), intent/bookkeeping ticket (`request-*`).
  Rules applied: **2b** (AA, one side strictly a superset → keep the superset) and **2e**
  (intent ticket, incoming only added a field the other side never touched → keep the superset).
  Both rules converge on the incoming side.

  The two stages differed by exactly one line. `git diff :2: :3:`:

  ```
  @@ -25,6 +25,7 @@ fields:
       main_sha: null
     version: 0.0.46
     bundled_in: bundle-df065afc
  +  chat_comment: comment-7e1cac67
   ---
  ```

  Ours (stage 2) `8c660c007b46f9455534319e2cde9d79c548b74b`, theirs (stage 3)
  `8e6a39baa65d8c72fda1e8fb202f5359a9d1b71e`. No competing edit on any field: the incoming
  side is byte-identical to ours plus the new `fields.chat_comment` key. No timeline lookup
  was needed — there is no per-fact conflict to arbitrate.

  Resolution: `git checkout --theirs` + `git add --sparse`. This path is outside the
  sparse-checkout cone (DOC-986 §2/§4.1) — the conflict existed only in the index and the
  working-tree file carried no conflict markers, so `--sparse` was required to stage it.

## Incoming changes preserved

- `.xgd/tickets/hot/request-5970ab3b.md` — confirmed. The resolved working-tree file hashes to
  `8e6a39baa65d8c72fda1e8fb202f5359a9d1b71e`, i.e. it is bit-for-bit the incoming
  (`free_coded`) version from `5179f1ec82d5d242e96b39b60467fe27c583ba7e`
  ("xgd(ticket): update request request-5970ab3b", 2026-08-23). The incoming commit's only
  change to this file — `chat_comment: comment-7e1cac67` — is present at line 28 of the
  resolved file. `git diff --cached HEAD` shows exactly `1 file changed, 1 insertion(+)`,
  matching the incoming diff with nothing added and nothing dropped.

No code/implementation files were involved in this conflict, so no BUG-1301 precedence
exception was invoked and no hunk was dropped. No UAT test files were touched.
No spec tickets (story/acceptance_criterion/capability) were touched.

The enrichment metadata flagged this file for post-merge review under the "intent unknown on
one side" rule (ours = `sync_working_to_main`). That flag is noted, but in this instance the
sides are not in competition: the resolution is a pure superset take, not a
more-recent-commit-wins judgment call, so no content from the HEAD side was discarded.
