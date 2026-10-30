---
uid: report-c863c1e9
id: REPORT-4730
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:20:58.632496+00:00'
updated_at: '2026-09-21T14:20:58.632496+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e** applied. Single conflicted hunk, frontmatter only;
  the body merged cleanly.

  The two sides diverge from a common ancestor at
  `updated_at: 2026-08-31T19:48:24`, `last_field_updated: body`, `status: draft`:

  - **Incoming** (`b979083e48`, 2026-09-01T18:09:26) — the free-coding lifecycle
    running forward on xgd-working: `draft → free_coding → free_coded →
    (story_points) → ready_to_reconcile`.
  - **HEAD** (`c94654a355`, `seed_local_overlay`, 2026-09-09T21:35:22) —
    `draft → bundled`, also adding `bundled_in: bundle-87be4669` and the
    `commits: [{working_sha: 27450010586c…}]` record.

  Both sides changed the **same three facts** (`updated_at`,
  `last_field_updated`, `status`) differently, so this is a genuine per-fact
  intent conflict rather than two disjoint edits — the one case where 2e says the
  later-positioned intent wins. `xgd working-timeline` confirms the ordering
  positionally rather than by raw `updated_at` (BUG-1030):
  HEAD `2026-09-09T21:35:22` > incoming `2026-09-01T18:09:26`. **Resolved to HEAD.**

  Corroborating evidence beyond the timestamp: HEAD's *unconflicted* `fields`
  block already carries `bundled_in: bundle-87be4669` and a `commits` entry whose
  `working_sha: 27450010586c65b293b2ad5cc6243815133a17be` is the working-branch
  work that the incoming status bump was announcing. `bundled` is downstream of
  `ready_to_reconcile`, and the bundle already absorbed that work. Taking the
  incoming side would have rewound `status` to a state the same file's own
  `bundled_in` marker contradicts, leaving the ticket internally inconsistent.

## Incoming changes preserved

No code/implementation files were in this conflict — `git show --stat
b979083e48` is a single ticket file, 3 insertions / 3 deletions, entirely within
the YAML frontmatter. There is no developer source change to preserve or
discard, and no BUG-1301 precedence exception was invoked.

The incoming `status: ready_to_reconcile` is deliberately **not** carried
forward: it is the losing side of a genuine per-fact intent conflict under 2e,
superseded by HEAD's later `status: bundled`. That is the rule's intended
outcome, not a dropped developer change.

## Staging state

`git ls-files -u` is empty and the file contains zero conflict markers. Because
the resolution is byte-identical to HEAD, the staged diff against HEAD is empty
— this cherry-pick is a no-op, which is the correct result for a superseded
status bump. Left for the finalize step to skip; `--continue`/`--skip` were not
called, and `CHERRY_PICK_HEAD` (`b979083e48`) is still present.
