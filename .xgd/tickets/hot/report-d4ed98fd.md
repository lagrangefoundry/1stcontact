---
uid: report-d4ed98fd
id: REPORT-4398
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T11:16:15.829964+00:00'
updated_at: '2026-09-19T11:16:15.829964+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — **UU**, intent/bookkeeping ticket (rule 2e).
  Conflict existed in the index only; the path is outside the sparse-checkout
  cone on this reconcile branch, so there were no working-tree markers
  (DOC-986 §2/§4.1). Resolved with `git checkout --ours` + `git add --sparse`.

  Per-fact analysis of the three index stages:

  - **Incoming** (stage 3, `c0df1138`, commit `0170f868`, `xgd(ticket): update bug
    bug-3ade1af4`, 2026-09-01) is the merge base plus exactly one line:
    `fields.chat_comment: comment-94979ef7`. Everything else is still the
    freshly-seeded stub — `title: Untitled`, `status: draft`, `completed_at:
    null`, body `(new ticket)`.
  - **Ours** (stage 2, `1f50971c`, commit `af0186bf`, `xgd(ticket):
    seed_local_overlay bug bug-3ade1af4`, 2026-09-17) is the fully-developed
    BUG-40 ticket: real title, `status: bundled`, `completed_at`,
    `severity`/`story_points`/`commits`/`version 0.2.33`/`bundled_in
    bundle-8e1807f6`, and the full three-cause symptom body — **and it already
    carries `chat_comment: comment-94979ef7`**, byte-identical to the incoming
    value.

  So there is no competing fact. The incoming side's only change is present
  verbatim on the ours side, and every other field on the ours side is a later
  edit against fields the incoming side never touched. Ours is a strict superset
  of incoming, and it is also the later-positioned side by timestamp
  (2026-09-17 vs 2026-09-01) — both the 2e superset clause and the enrichment
  metadata's "take the more recent commit by timestamp" rule select the same
  resolution.

  Taking incoming here would have reverted a bundled, fully-written ticket to
  `Untitled`/`draft` with a `(new ticket)` body — a destructive revert, not an
  integration. No content was invented; the staged blob is exactly the ours
  blob `1f50971c`.

  Flagged for post-merge review as the enrichment rule directs, though the
  superset relationship makes this a low-risk resolution.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-3ade1af4.md` — **preserved.** `git show 0170f868 --
  <file>` is a single-hunk, one-line insertion adding
  `fields.chat_comment: comment-94979ef7`. That exact line is present in the
  staged resolution (verified: `git cat-file blob :<path>` → line 17,
  `  chat_comment: comment-94979ef7`). The incoming commit's full intent is in
  the staged tree.

No hunks were dropped, so the BUG-1301 precedence exception was not invoked.

## Note on net diff

The staged blob (`1f50971c`) is identical to HEAD's, so this resolution nets to
no diff vs HEAD — the incoming commit's effect had already reached this branch
through a later route (the ours-side ticket write that carries the same
`chat_comment` value). Per STEP 4 this is not a failure and `--skip` was not
called; the cherry-pick sequencer state is left intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit itself. STEP 3 distinguishes this from a discard: the incoming change is
present in HEAD, not absent.
