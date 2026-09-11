---
uid: report-da12f71f
id: REPORT-3826
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-11T00:48:50.473878+00:00'
updated_at: '2026-09-11T00:48:50.473878+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bundle-8eef3846.md` — class **AA** (both added), intent/bookkeeping ticket → rule **2e** (with 2b superset check). Resolved by taking the **HEAD (ours)** side: `git checkout --ours` + `git add --sparse`.

  Both sides are the same bundle ticket at two lifecycle points:
  - incoming `c2efcb99` (2026-08-30 22:05:09 -0700) — `xgd(ticket): create bundle bundle-8eef3846`, 369 lines, `status: ready_to_reconcile`, `completed_at: null`, two unreconciled `commits[].working_sha` entries.
  - HEAD `2ca3de8c` (2026-08-31 17:00:08 -0700) — `xgd(ticket): update bundle bundle-8eef3846`, 692 lines, `status: free_and_reconciled`, `completed_at: 2026-08-31T23:59:50Z`, `commits` collapsed to a single reconciled entry with `main_sha: 90527353c0fa4b9fd3ae91ba6285c7d791a25c53`, plus an `orphan_commits` map of ~150 old_sha/new_sha pairs.

  HEAD is both the later commit (per the enrichment rule's "take the more recent commit by timestamp") and a strict content superset. A full `diff -u theirs ours` yields exactly two hunks: the frontmatter advance above (all additions plus the superseded scalars/list entries), and a trailing-newline-only difference on the final body line `Done, three UATs`. The markdown body is otherwise byte-identical between the two sides — there is no incoming-only prose, field, or section.

## Incoming changes preserved

- `.xgd/tickets/hot/bundle-8eef3846.md` — not a code file, but verified the same way. Every fact the incoming *create* commit introduced (title `BUG-39 + REQ-154`, `created_at`, `auto_merge_back`, `priority`, `version`, `story_points`, `chat_comment`, and the entire 369-line body) is present verbatim in the resolved version. The only incoming values absent are ones HEAD's own later lifecycle transition legitimately superseded: `status: ready_to_reconcile` → `free_and_reconciled`, `completed_at: null` → a timestamp, `last_field_updated: created_at` → `result`, and the two pre-reconcile `working_sha` entries replaced by the reconciled `main_sha` entry. That is normal bundle-ticket progression, not discarded developer content.

## Note on staged diff

The resolution nets to no diff vs HEAD (index entry `fb4a6e56` == `HEAD:.xgd/tickets/hot/bundle-8eef3846.md`). Per STEP 4 this is expected and is **not** a discard: STEP 3's test distinguishes them, and here the incoming commit's content is present in HEAD via the later update commit rather than absent. `--skip` was not invoked; the cherry-pick sequencer state (`CHERRY_PICK_HEAD` = `c2efcb99cb5d64cd96b21d45966ce25fa48d6e58`) is left intact for `cherry_pick_finalize_resolution`.

No code, test, UAT, or spec-ticket files were in conflict. No BUG-1301 precedence drops were needed.
