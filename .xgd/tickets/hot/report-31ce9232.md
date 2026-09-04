---
uid: report-31ce9232
id: REPORT-3364
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T21:18:54.766600+00:00'
updated_at: '2026-09-02T21:18:54.766600+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` (BUG-39) — **UU**, intent/bookkeeping ticket
  (rule 2e, same-fact timeline rule). Incoming commit `93b031a3`
  ("xgd(ticket): update bug bug-23d1ec27", 2026-08-25 16:21 -0700).

  One conflict hunk, in the frontmatter, and it is a single fact — the ticket's
  lifecycle status and its accompanying stamp:

  | | `updated_at` | `last_field_updated` | `status` |
  |---|---|---|---|
  | ours (HEAD) | `2026-08-31T05:05:09` | `status` | `bundled` |
  | incoming | `2026-08-25T23:21:06` | `status` | `free_coding` |

  Both sides advanced the same field from the base's `draft`, so this is 2e's
  genuine same-field conflict, resolved per-fact toward the LATER-positioned
  side. HEAD is later on every available measure:

  - **Lifecycle position**: `bundled` is downstream of `free_coding`. HEAD has
    already passed through free-coding and out the other side.
  - **Content stamp**: 2026-08-31 vs 2026-08-25 — six days later.
  - **Commit position**: the newest bundle-branch commit touching this file is
    `6778773d` (2026-08-26 16:21), which post-dates the incoming commit
    (2026-08-25 16:21). The merge that carried the ours-side content in is
    `fe03200d` — `Merge branch 'free-BUG-39' into xgd-working`.

  Taking incoming would rewind the ticket from `bundled` back to `free_coding`
  while leaving the downstream bookkeeping that only exists BECAUSE it was
  bundled — `bundled_in: bundle-8eef3846`, `version: 0.2.15`,
  `commits[0].working_sha: 759cd874` — untouched beside it. That is an
  incoherent record, not a resolution.

  Resolved by `git checkout --ours`, then `git add --sparse`. Every other change
  in the file (body rewrite, `chat_comment`, `commits`, `version`,
  `story_points`, `bundled_in`) merged cleanly — the merge base for this pick is
  the previous pick's result `90cfbfc9`, so those are ours-only edits vs base.

  The auto-enrichment's fallback rule ("intent unknown on one or both sides;
  take the more recent commit by timestamp and flag for post-merge review")
  points the same way once the right commits are compared — the ours-side blob
  was written by `6778773d`/`fe03200d`, not by the branch tip `fefe9956` that
  last touched a different ticket. Flagging for post-merge review as that rule
  asks, though the per-fact evidence above is not ambiguous.

## Incoming changes preserved

No code or implementation files were in this conflict — the single conflicted
file is a bookkeeping ticket, so STEP 3's code-file verification does not apply.

On the ticket fact itself: the incoming commit's intent (record that BUG-39
entered `free_coding`) is **superseded, not discarded**. HEAD demonstrably
passed through that state and carries its product forward — the free-coding run
produced `commits[0].working_sha: 759cd87405a4b50f81995b2c9b510bf23be54fbd`,
which is present in the resolved file, alongside the `bundled` status that
follows it. Nothing the incoming commit recorded is lost; it is recorded at a
later point in the same lifecycle.

No hunk was dropped under the BUG-1301 precedence exception; it was not needed.

Note for the finalize step: the staged tree nets to **no diff vs HEAD**
(`git status --porcelain` reports no tracked-file entries). Per STEP 4 this is
the BUG-1109/BUG-1122 redundant-commit case — the incoming state is present in
HEAD via a later route, not absent — so `--skip` was NOT called and
CHERRY_PICK_HEAD (`93b031a3`) is left intact for
`cherry_pick_finalize_resolution`.
