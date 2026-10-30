---
uid: report-7aa714e2
id: REPORT-4604
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T01:03:05.084009+00:00'
updated_at: '2026-09-21T01:03:05.084009+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — **UU**, intent/bookkeeping ticket
  (`request-*`, §2e). Outside the sparse-checkout cone, so the conflict lived
  only in the index with no working-tree markers (DOC-986 §2/§4.1); resolved by
  materialising the stage-2 blob and staging with `git add --sparse`.

  Resolved **per fact**, not per file. Bodies of both sides are byte-identical
  apart from a trailing-newline strip on the incoming side; every contested
  fact is frontmatter:

  | Fact | Base (`:1`) | Incoming `6531a2d1f4` (Aug 30 20:37Z) | HEAD (Aug 31 05:05Z) | Winner |
  |---|---|---|---|---|
  | `status` | `free_coded` | `ready_to_reconcile` | `bundled` | HEAD |
  | `fields.bundled_in` | absent | absent | `bundle-8eef3846` | HEAD |
  | `updated_at` | Aug 28 16:40Z | Aug 30 20:37Z | Aug 31 05:05Z | HEAD |
  | `last_field_updated` | `story_points` | `status` | `status` | tie |
  | trailing newline | present | stripped | present | HEAD |

  The enrichment metadata flagged intent as unknown on both sides (identical
  subjects), so the stated rule is "take the more recent commit by timestamp
  and flag for post-merge review" — which selects HEAD (Aug 31 05:05Z >
  Aug 30 20:37Z). That is also the substantively correct answer: the incoming
  commit is a stale intermediate that moves the ticket
  `free_coded → ready_to_reconcile`, a transition HEAD has already passed
  through on its way to `bundled`. Taking it would regress the status *and*
  drop `bundled_in`, orphaning REQ-154 from `bundle-8eef3846`. Verified against
  the canonical record: `xgd ticket get request-b88b79fe` still reports
  `bundled_in: bundle-8eef3846`, matching HEAD and not the incoming side.

  **Flagged for post-merge review** per the enrichment rule, since intent was
  unknown on both sides.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>` verification of
developer code does not apply, and no BUG-1301 precedence exception was
invoked.

The incoming lifecycle transition (`→ ready_to_reconcile`) is deliberately not
present in the resolved file: it is strictly superseded by HEAD's
`bundled` + `bundled_in: bundle-8eef3846`, which is the state the live
ticketing system reports. Nothing was discarded that is not already
represented downstream.

The staged diff against HEAD is consequently **empty** — HEAD already carried
every line and won every contested fact. Per STEP 4, `--skip` was not called;
finalize will detect the clean staged diff and skip the commit. `CHERRY_PICK_HEAD`
(`6531a2d1f4cc9417b55a492df0554428618ffd6a`) is present and untouched;
`git status --porcelain` is empty and `git ls-files -u` shows no unmerged
entries.
