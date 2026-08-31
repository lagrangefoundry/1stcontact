---
uid: report-8551c64d
id: REPORT-3105
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T22:18:22.678541+00:00'
updated_at: '2026-08-31T22:18:22.678541+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, intent/bookkeeping ticket
  (`bug-*`), rule **2e**. Outside the sparse-checkout cone (DOC-986 §2/§4.1):
  the conflict existed only in the index, with no working-tree markers, so it
  was resolved via `git checkout --ours` + `git add --sparse`.

  Incoming commit: `148b2c20` — "Merge branch 'free-BUG-39' into xgd-working"
  (2026-08-25). Ours: "xgd(ticket): update bug bug-23d1ec27" (2026-08-31).

  The conflict enrichment declared intent unknown on one or both sides, so the
  fallback is the more recent commit by timestamp — which is the ours/HEAD
  side. Per-fact analysis confirms that is also the correct answer under 2e's
  superset rule; no whole-file coin-flip was needed.

  The three stages' Markdown bodies are **byte-identical**. Every difference is
  confined to the YAML frontmatter:

  | fact | base | incoming (theirs) | HEAD (ours) | resolution |
  |---|---|---|---|---|
  | `fields.commits[0].working_sha` | absent | `759cd87405a4b50f81995b2c9b510bf23be54fbd` | same as incoming | **identical — no conflict** |
  | `fields.version` | absent | `0.2.15` | `0.2.15` | **identical — no conflict** |
  | `fields.story_points` | absent | `3` | `3` | **identical — no conflict** |
  | `status` | `free_coding` | `free_coded` | `bundled` | same fact, differing → **HEAD** (later intent) |
  | `fields.bundled_in` | absent | untouched | `bundle-8eef3846` | **HEAD** (one-sided addition) |
  | `updated_at` / `last_field_updated` | — | `2026-08-25T23:28:10` / `story_points` | `2026-08-31T05:05:09` / `status` | **HEAD** (derived mirror of the kept write) |

  `status` is the only genuinely competing fact. Rule 2e's timeline rule
  resolves it per-fact toward HEAD: `bundled` is strictly downstream of
  `free_coded` in the ticket lifecycle, and it is the very advance that placed
  this ticket into `bundle-8eef3846` — the intent this reconcile run is
  processing. Taking incoming's `free_coded` would regress the lifecycle and
  either orphan or contradict `fields.bundled_in`, breaking the in-flight
  bundle.

  Net effect: the resolution equals HEAD's blob (`52bab41f`), so the staged
  diff vs HEAD is empty. Per STEP 4 this is **not** a failure and `--skip` was
  **not** called — the finalize step will detect the clean staged diff and skip
  the commit itself. No `git cherry-pick --continue/--skip/--quit/--abort`,
  `reset`, or `checkout <branch>` was run; `CHERRY_PICK_HEAD` (`148b2c20`) is
  still present for `cherry_pick_finalize_resolution`.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket.

STEP 3 verification for `.xgd/tickets/hot/bug-23d1ec27.md`: the incoming
commit's diff against the merge base adds exactly three facts —
`fields.commits[0].working_sha = 759cd874…`, `fields.version = 0.2.15`,
`fields.story_points = 3` — plus the `free_coding → free_coded` status
advance and its `updated_at`/`last_field_updated` mirrors.

All three added facts are **present, byte-identical, in the resolved file**.
They reached HEAD ahead of this cherry-pick through the normal ticket-update
route, and HEAD then carried the ticket one lifecycle step further to
`bundled`. This is the BUG-1109/BUG-1122 "already landed via a different
route" case, and it is exactly the distinction STEP 3 exists to draw: the
incoming commit's key changes are *present in HEAD*, not *absent*. Nothing
the developer wrote was discarded, so no `@fail` is warranted.

The `status` value itself is the one incoming fact not carried forward
verbatim, and that is the intended output of 2e's per-fact timeline rule
rather than a discard — HEAD's `bundled` supersedes it, and HEAD's is the
later intent by six days.

No BUG-1301 precedence exception was invoked; no UAT test function on either
side of this conflict was deleted, and no hunk was dropped.
