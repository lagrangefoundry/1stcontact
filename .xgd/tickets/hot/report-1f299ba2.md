---
uid: report-1f299ba2
id: REPORT-3244
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T22:41:08.303276+00:00'
updated_at: '2026-09-01T22:41:08.303276+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/doc-ca48ad08.md` — class **AA** (both added), doc ticket
  under `.xgd/tickets/hot/`. Rule applied: **2b** (both added; one side a
  strict superset/authoritative variant) reinforced by the intent-metadata
  rule "take the more recent commit by timestamp".

  The two stages were byte-identical apart from a single 2-line delta:
  ```
  -updated_at: '2026-08-16T01:20:51.189699+00:00'   (ours)
  +updated_at: '2026-08-31T19:43:10.192287+00:00'   (theirs)
   fields:
     doc_kind: architecture
  -  system_kb: true                                 (removed by theirs)
  ```
  No other line in the 4.2 KB file differed, so there is no disjoint
  ours-side edit to compose — the sides are not competing on separate
  facts, they are competing on exactly one fact (`fields.system_kb`).

  Incoming (`5f54a902`, free_coded, `xgd(ticket): update doc doc-ca48ad08`,
  commit body: "field: retire system_kb boolean; membership moves to
  doc_kind (DOC-39 3.3)") is both the authoritative side and the
  later-timestamped one (2026-08-31 vs ours 2026-08-16). Resolved by
  `git checkout --theirs`, then `git add --sparse`.

  Note: `last_field_updated: system_kb` is present on *both* sides and is
  retained — it is the incoming commit's own record of which field it
  retired, not stale ours-side state.

## Incoming changes preserved

Verified by blob identity rather than by eyeballing hunks:

- `git rev-parse 5f54a902:...doc-ca48ad08.md` → `6532ecdc5019ef31...`
- merge stage 3 (theirs)                      → `6532ecdc5019ef31...`
- `git hash-object` of the resolved worktree file → `6532ecdc5019ef31...`

All three match, so the resolved file is byte-for-byte the incoming
commit's version of this file. Every incoming change is present by
construction; nothing from the developer's commit was discarded.

No conflict markers remain in the file (`grep` for `<<<<<<<`/`=======`/
`>>>>>>>` returns nothing). No hunks were dropped, so the BUG-1301
precedence exception was not invoked and does not apply here.

No code/implementation files were involved in this conflict — the sole
conflicted path is ticket metadata — so no test spot-check was warranted.
