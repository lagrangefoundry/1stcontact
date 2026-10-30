---
uid: report-e8111f01
id: REPORT-5576
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T17:14:17.068215+00:00'
updated_at: '2026-09-29T17:14:17.068215+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/doc-721a48c9.md` — UU on an intent/bookkeeping `doc`
  ticket (rule 2e: per-fact timeline). Resolved to the INCOMING side in full
  (`git checkout --theirs` + `git add --sparse`; path is outside the sparse
  cone, so the conflict existed only in the index).

## Rule applied and why the enrichment's default was overridden

The auto-enrichment said "intent unknown on both sides — take the more recent
commit by timestamp". Taken literally that selects OURS (main's
`e553346f62`, 2026-09-11) over INCOMING (`94e32fbab1`, 2026-09-08). Replaying
the intent ledger on both sides shows that timestamp is stale-state catch-up,
not a later decision:

- Contested fact: `fields.doc_kind`.
- xgd-working: `architecture` (`5df6595814`, 08-31 12:43) → `system_kb`
  (`23099c4b29`, 08-31 14:59) → body-only edit (`c521175d72`, 09-02) →
  **`architecture` (`94e32fbab1`, 09-08)**.
- main: `architecture` (`d3dac85a03`, 08-31 12:43) → `system_kb`
  (`e553346f62`, 09-11).

main's 09-11 commit and xgd-working's 08-31 14:59 commit are the *same edit*:
both rewrite parent blob `078aeed6ab`, both flip `doc_kind: architecture →
system_kb` and `last_field_updated: system_kb → doc_kind`. main never received
`23099c4b29`, so on 09-11 it re-did that 08-31 decision three days after
xgd-working had already moved past it. `e553346f62` sits in a sibling cluster
(`1d4f51b394`, `75b8755bf7`, `61eb2db4c4`, all 09-11 02:33:3x, all `update doc`)
— the batch-catch-up signature.

The latest genuine decision on `doc_kind` is therefore INCOMING's `architecture`
(09-08), and OURS's only delta versus the cherry-pick base is the bookkeeping
residue of that stale re-do (`updated_at`, `last_field_updated`; the `doc_kind`
value itself was unchanged from base). There is no disjoint OURS-side content to
preserve, so taking THEIRS wholesale loses nothing.

## Incoming changes preserved

Not a code file, but verified equivalently: the staged blob is byte-identical to
`git show :3:` — `doc_kind: architecture`, `updated_at:
2026-09-08T21:53:52.939158+00:00`, `last_field_updated: doc_kind`, and the
incoming trailing-newline removal on the final body line. `git status
--porcelain` reports `M ` with no conflict class. `CHERRY_PICK_HEAD` is intact
at `94e32fbab1`; no `--continue`/`--skip`/`--abort` was issued.

## Post-merge review flag

`doc-721a48c9` (DOC-17 "Design Lessons Log") — `doc_kind` has oscillated
`architecture`/`system_kb` four times across the two branches. This resolution
reinstates the developer's most recent choice (`architecture`) but the field is
evidently unsettled; worth a deliberate decision outside resync.
