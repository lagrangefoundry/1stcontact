---
uid: report-982d00f0
id: REPORT-4635
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T04:54:04.778233+00:00'
updated_at: '2026-09-21T04:54:04.778233+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e**. Conflict was confined to the frontmatter status
  block; body, "What landed" and test-plan sections merged cleanly.

  Both sides changed the *same three facts* (`status`, `updated_at`,
  `last_field_updated`), so this is a genuine intent conflict, not disjoint
  edits — the per-fact later-positioned-intent rule applies:

  | fact | ours (HEAD) | theirs (`db39fce0f8`) | taken |
  |---|---|---|---|
  | `status` | `bundled` | `free_coding` | ours |
  | `updated_at` | `2026-09-09T21:32:49` | `2026-08-31T21:56:04` | ours |
  | `last_field_updated` | `status` | `status` | ours (identical) |

  HEAD is later by ~9 days, and `bundled` is *downstream* of `free_coding` in
  the same lifecycle — the unconflicted `fields` block on the HEAD side already
  carries the results of the work that `free_coding` opened
  (`bundled_in: bundle-87be4669`, `commits[].working_sha: 115f0d39ec`,
  `version: 0.2.23`). Taking `free_coding` would have rewound the ticket to a
  state it had already transited, while leaving it pointing at the bundle that
  consumed it.

## Incoming changes preserved

`git show db39fce0f8 -- .xgd/tickets/hot/request-119dd4af.md` is a 3-line
frontmatter-only change (`draft` → `free_coding`, `body` → `status`, and the
matching `updated_at` bump). It touches no other field, no body text, and no
code. Every fact it carries is one of the three conflicted facts resolved in
ours' favour above as a superseded lifecycle step — there is no disjoint
incoming content that could have been dropped.

Consequently the resolved file is byte-identical to HEAD and the staged diff is
empty. Per STEP 4 this is left for the finalize step to detect and skip;
`--skip` was **not** invoked here, and `CHERRY_PICK_HEAD` remains present.

No UAT or implementation files were involved, so the BUG-1301 precedence
exception was not needed.
