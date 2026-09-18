---
uid: report-b98fb050
id: REPORT-4326
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T06:38:18.280957+00:00'
updated_at: '2026-09-18T06:38:18.280957+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **UU**, intent/bookkeeping ticket (rule
  **2e**), resolved by **keeping HEAD (ours) as the strict superset**.

  Two conflict hunks, both frontmatter-only (the incoming commit
  `1eb1dd1586` touched no body text):

  1. **Lifecycle block.** Incoming: `status: free_coded`,
     `completed_at: null`, `updated_at: 2026-08-24T21:42:43Z`. Ours:
     `status: free_and_reconciled`, `completed_at` set,
     `updated_at: 2026-08-31T19:19:36Z`. `free_and_reconciled` is the
     lifecycle successor of `free_coded` for the same ticket — ours is the
     later position on the same fact, not a competing value.
  2. **`fields.commits` / `version`.** Incoming: one entry
     (`working_sha: 2058a164…`) and `version: 0.2.11`. Ours: that **same**
     entry (plus `working_sha_history: []`), two further entries
     (`0fe586d1…`, `999579b3…`), `version: 0.2.13`, and
     `bundled_in: bundle-78f4e2fe`. List-wise a superset; `version` is the
     higher scalar.

  No fact is changed differently on the two sides — every incoming fact is
  either present verbatim in ours or superseded by a later value of the same
  field — so `xgd working-timeline` was not needed (2e bullet 2, strict
  superset, governs). No `intent_uid` / `story_uid` / `capability_uid` edits;
  no content invented that is absent from both sides.

## Incoming changes preserved

No code/implementation files were in this conflict — the single conflicted
path is a bookkeeping ticket. STEP 3's check passes on it by the
"present via a different route" test, not by discard:

- `fields.commits[0].working_sha: 2058a16449a8e783bdd655d22bade58fd6b8d0fc`
  — the incoming commit's substantive addition — **is present** in the
  resolved file (it is the shared, unconflicted region of the hunk).
- `status: free_coded` — **present via a later route**: HEAD carries this
  ticket forward to `free_and_reconciled`, a state reachable only by having
  passed through `free_coded`.
- `version: 0.2.11` — **superseded** by `version: 0.2.13` on the HEAD side.

Consequently the resolution nets to **no staged diff vs HEAD**
(`git diff --cached HEAD` is empty): post-watermark sync had already landed
this commit's effect in refined form (BUG-1109/BUG-1122 redundant-commit
case). Per STEP 4 this is not a failure and `--skip` was not called;
`cherry_pick_finalize_resolution` will detect the clean staged diff and skip
the commit. `CHERRY_PICK_HEAD` (`1eb1dd1586…`) is intact.

No BUG-1301 precedence exception was invoked; no test function was deleted
or dropped.

## Post-merge review flag

The auto-enrichment rule for this file said "Intent unknown on one or both
sides — take the more recent commit by timestamp and flag this file for
post-merge review." Both sides are the same ticket's own bookkeeping
updates, the more recent is HEAD (2026-08-31 vs 2026-08-24), and that is
what was taken. Flagging as requested: **`.xgd/tickets/hot/bug-6612c4b7.md`
resolved to HEAD by timestamp + superset; worth a confirming glance that
BUG-37's `bundled_in: bundle-78f4e2fe` is the intended bundle given this
reconcile run is bundle-8e1807f6.**
