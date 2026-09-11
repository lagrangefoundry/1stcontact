---
uid: report-d764de3d
id: REPORT-3599
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T00:08:27.528949+00:00'
updated_at: '2026-09-10T00:08:27.528949+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — class **AA** (both added), intent/bookkeeping
  ticket (rule 2b + 2e). Resolved by keeping the **ours (HEAD)** side, staged with
  `git checkout --ours` + `git add --sparse` (path is outside the sparse-checkout
  cone on reconcile branches, DOC-986 §2/§4.1).

  Rationale — this is a superset case, not a competing-fact case:
  - **Theirs (incoming, `4e5a8b2b`, `xgd(ticket): create bug bug-a98fb3b0`,
    2026-08-24 15:12:54 -0700)** is the bare creation stub: `title: Untitled`,
    `status: draft`, `last_field_updated: created_at`, `completed_at: null`,
    body `(new ticket)`, and only the three default fields
    (`auto_merge_back`, `needs_review`, `priority`).
  - **Ours (HEAD, `01492336`, `xgd(ticket): update bug bug-a98fb3b0`,
    2026-09-01 15:09:20 -0700)** is that same ticket after it was filled in:
    identical `uid`/`id`/`type`/`created_by`/`created_at`, plus the real title
    ("Builder chat: every turn fails in the cloud with \"conversation is no longer
    open\""), `status: free_and_reconciled`, `completed_at`, the full
    Symptom / Root cause / Fix / Test plan body, and the added fields
    `chat_comment`, `severity`, `commits`, `version`, `story_points`, `bundled_in`.

  Ours is a strict superset of theirs on every field theirs sets, and carries the
  later timeline position (updated_at 2026-08-31, commit 2026-09-01, vs incoming's
  2026-08-24). No field is set differently on the two sides, so there is no
  per-fact conflict requiring a `working-timeline` tiebreak, and nothing disjoint
  on the incoming side to compose in. The enrichment's "flag for post-merge review"
  note applies only in the ambiguous case; here the two sides are the same ticket
  at two points in its own lifecycle.

## Incoming changes preserved

The incoming commit `4e5a8b2b` touches exactly one file (18 insertions, the ticket
creation) and no code files. Its entire effect — the existence of `bug-a98fb3b0`
(BUG-38) with `created_at: 2026-08-24T22:12:54.350656+00:00`, `created_by: xgd`,
and the default field set — is already present in HEAD, reached by a different
route: the same ticket was created and then updated on the ours-side timeline.
Nothing from the incoming side was discarded.

Consequently the staged tree nets to no diff vs HEAD. Per STEP 4 (BUG-1109/1122)
this is the genuinely-redundant case, not a discard: STEP 3's discriminator is
satisfied because the incoming commit's key change is *present in HEAD*, not
merely absent from the resolution. No `--skip` was issued; the cherry-pick
sequencer state (`CHERRY_PICK_HEAD` = `4e5a8b2b`) is intact for
`cherry_pick_finalize_resolution`.

No BUG-1301 precedence exception was invoked. No test files were involved.
