---
uid: report-e2ac1edf
id: REPORT-5266
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T02:50:28.225786+00:00'
updated_at: '2026-09-28T02:50:28.225786+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, intent/bookkeeping ticket (`bug-*`), STEP 2e
  "same field changed differently → later-positioned intent wins, per fact".

  Only the frontmatter conflicted; the body was byte-identical on both sides
  (`git diff` of index stage 2 vs stage 3 produced frontmatter hunks only).
  The two sides disagreed on the same lifecycle facts:

  | field | ours (HEAD) | incoming (a9248d6756) |
  |---|---|---|
  | `updated_at` | `2026-08-31T19:19:36` | `2026-08-24T21:55:26` |
  | `completed_at` | `2026-08-31T19:19:36` | `null` |
  | `status` | `free_and_reconciled` | `free_coded` |
  | `fields.version` | `0.2.13` | `0.2.11` |
  | `fields.bundled_in` | `bundle-78f4e2fe` | absent |
  | `fields.commits` | 3 entries | 1 entry (a prefix of ours) |

  HEAD is the later intent by the ticket's own ledger clock (`updated_at`
  2026-08-31 vs 2026-08-24) and is a strict superset on every field: it retains
  incoming's sole `commits` entry and adds two more, carries the higher version,
  and adds `bundled_in`. Incoming contributes no disjoint fact. Taking incoming
  would have regressed `free_and_reconciled` → `free_coded`, cleared
  `completed_at`, dropped `bundled_in`, demoted the version, and discarded two
  `commits` entries. Resolved to ours; result is byte-identical to HEAD, so the
  staged diff for this cherry-pick is empty (finalize will skip the commit).

## Incoming changes preserved

Incoming commit a9248d6756's actual content delta, measured against the merge
base (index stage 1), was a body rewrite plus the `updated_at` /
`last_field_updated: body` bump that accompanied it:

- `## Still outstanding (not in this ticket)` replaced by `## Observability — added here`
- new `## Deployment` section
- reference to `test_UAT_FC_BUG-37_the_production_route_survives_the_new_table`

All of it is present in the resolved file: `## Observability — added here` at
line 142, `## Deployment` at line 165, and the UAT name appears once. HEAD had
already absorbed that body edit, which is why the ours-vs-theirs diff reduced to
frontmatter alone. No incoming hunk was dropped; the BUG-1301 precedence
exception was not needed.

No code, test, or spec-matrix files were in conflict.
