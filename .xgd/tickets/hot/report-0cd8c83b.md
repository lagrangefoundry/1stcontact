---
uid: report-0cd8c83b
id: REPORT-5288
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T04:08:22.962934+00:00'
updated_at: '2026-09-28T04:08:22.962934+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — **UU**, intent/bookkeeping ticket (bug, not a
  matrix-defining spec ticket) → **rule 2e**: non-overlapping facts combined; for facts
  changed differently on both sides, take the later-positioned intent **per fact**.

  The only delta between the two sides was a single logical fact — the status transition
  and its two coupled timestamps. The document body was byte-identical, and
  `bundled_in: bundle-78f4e2fe` was added *independently by both sides*, so it was never
  in conflict.

  Per-fact resolution:

  | fact | HEAD (ours) | incoming (theirs) | taken | why |
  |---|---|---|---|---|
  | `status` | `free_and_reconciled` | `bundled` | HEAD | later intent; `free_and_reconciled` is the lifecycle state *downstream of* `bundled` — taking incoming would regress a ticket already reconciled |
  | `updated_at` | `2026-08-31T19:19:34` | `2026-08-26T17:36:27` | HEAD | later by 5 days |
  | `completed_at` | `2026-08-31T19:19:34` | `null` | HEAD | coupled to `status: free_and_reconciled` |
  | `bundled_in` | `bundle-78f4e2fe` | `bundle-78f4e2fe` | both (identical) | not a conflict |
  | body / all other frontmatter | — | — | unchanged | byte-identical on both sides |

  Timeline evidence: incoming commit `98a3f46f` is dated 2026-08-26, the HEAD-side commit
  `01492336` is dated 2026-08-31; the in-file `updated_at` values agree with their
  respective commit dates. `xgd working-timeline` was not applicable here — both sides are
  the *same* ticket uid, so it has no two operands to order.

  Because every conflicting fact resolved to the HEAD value, the resolved content equals
  the ours stage verbatim; it was selected with `git checkout --ours` (not hand-edited, so
  no stale frontmatter was reintroduced) and staged with `git add --sparse`.

## Incoming changes preserved

The incoming commit `98a3f46f` made exactly two changes to this file, both accounted for:

1. **`+ bundled_in: bundle-78f4e2fe`** — **preserved verbatim** in the staged result
   (frontmatter line 25). Verified with
   `git show ":.xgd/tickets/hot/bug-a98fb3b0.md" | grep bundled_in`.
2. **`status: ready_to_reconcile` → `bundled`** (plus its `updated_at` bump) — **superseded,
   not discarded.** HEAD carries the *same ticket further along the same lifecycle path*
   to `free_and_reconciled`, five days later. The incoming intent ("this bug is now bundled
   into bundle-78f4e2fe") is fully recorded in the resolved file via the preserved
   `bundled_in` field; only the transient status label it set on the way there has since
   advanced. Writing `bundled` back would have regressed the ticket and dropped
   `completed_at`.

No BUG-1301 precedence exception was invoked — no hunk was dropped on the grounds of a
prior HEAD-side refactor. No test files were involved, so rule 2f was not engaged.

Note for the finalize step: the resolved tree is byte-identical to HEAD, so
`git status --porcelain` is empty and the staged diff is clean. This is expected — an
earlier commit in this resync queue already carried the `bundled_in` fact plus the
downstream status. `--skip` was deliberately **not** called; the cherry-pick remains
paused with `CHERRY_PICK_HEAD` = `98a3f46f0686f7938da5bfd7a986db0aae91be97` intact for
Python to finalize.
