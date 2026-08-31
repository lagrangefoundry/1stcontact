---
uid: report-44d5cafe
id: REPORT-3070
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T20:55:47.716465+00:00'
updated_at: '2026-08-31T20:55:47.716465+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — UU, intent/bookkeeping ticket (rule 2e). HEAD side kept: it is a strict superset of the incoming side.

Details of the two conflict regions:

1. Frontmatter `updated_at` / `status`:
   - incoming (e74606d80d, 2026-08-24T01:50:12Z): `status: free_coded`
   - HEAD (2026-08-26T17:36:27Z): `status: bundled`
   Same fact changed on both sides → per-fact timeline rule. HEAD's edit is
   later-positioned (2026-08-26 > 2026-08-24) and `bundled` is the downstream
   lifecycle advance of `free_coded`, so HEAD wins for this fact.

2. `fields.bundled_in: bundle-78f4e2fe`:
   Added only on the HEAD side; incoming never touched this field. Kept
   (non-overlapping addition).

## Incoming changes preserved

The incoming commit made exactly three changes to this file:

- `fields.commits: [{working_sha: ea48502d0d90bb607ac528e34099e71eaab6df40,
  reconcile_sha: null, main_sha: null}]` — PRESENT in the resolved file,
  byte-identical (HEAD carries the same block; it merged cleanly outside the
  conflict regions).
- `fields.version: 0.2.10` — PRESENT in the resolved file, identical.
- `status: free_coding -> free_coded` — superseded on the HEAD side by the same
  status field advancing further to `bundled`, with a later `updated_at`. This
  is the incoming intent carried forward, not discarded: the ticket cannot be
  `bundled` without having passed through `free_coded`, and HEAD also records
  `bundled_in: bundle-78f4e2fe`.

No hunks were dropped under the BUG-1301 precedence exception; no code or test
files were involved in this conflict.

Note: because HEAD already contained the incoming commit's substantive effect
(the `commits` block and `version`) via a later route, the staged tree nets to
no diff vs HEAD. Per STEP 4 this is left for the finalize step to handle; no
`--skip` was issued and the cherry-pick sequencer state is untouched.
