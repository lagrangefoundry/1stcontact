---
uid: report-10e4d1ec
id: REPORT-3308
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T18:29:51.472786+00:00'
updated_at: '2026-09-02T18:29:51.472786+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-a03967f2.md` — **AA** (both added), intent/bookkeeping ticket
  (REQ-152, a `request`). Rule **2e** (intent/bookkeeping ticket), superset branch.
  Path is outside the sparse-checkout cone (`!/.xgd/tickets/**`, DOC-986 §2/§4.1), so the
  conflict existed only in the index with no working-tree markers; resolved with
  `git checkout --ours --ignore-skip-worktree-bits` + `git add --sparse`
  (`--sparse` is not a valid `git checkout` option in this git version).

  Both sides carry a **byte-identical 164-line body** — the entire diff between the two
  blobs is frontmatter:

  | field | ours (HEAD, stage 2 `8cd96480`) | theirs (incoming, stage 3 `b6f1c0d0`) |
  |---|---|---|
  | `updated_at` | `2026-08-31T14:22:29` | `2026-08-23T03:29:49` |
  | `completed_at` | `2026-08-31T14:22:29` | `null` |
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `fields.chat_comment` | `comment-869ded75` | absent |
  | `fields.bundled_in` | `bundle-b3b7c399` | absent |

  HEAD is a **strict superset** per fact: every fact the incoming side asserts, HEAD also
  asserts at a later lifecycle position (`ready_to_reconcile` → `free_and_reconciled`,
  `completed_at` filled in), plus two fields the incoming side never touched. The incoming
  side contributes no fact HEAD lacks, so no timeline lookup was needed — this is 2e's
  "one side is a strict superset, keep the superset" case, not a competing-fact case.
  Taking theirs would have reverted an operator-set status and dropped the
  `chat_comment`/`bundled_in` links.

## Incoming changes preserved

The incoming commit `c5752ee5cc91b01c14e40da43c6e14cd233931bf`
(*xgd(ticket): update request request-a03967f2*, 2026-08-22) is a whole-file add of
164 lines and touches no code file — its only content is this ticket.

Verified via `git show c5752ee5 -- .xgd/tickets/hot/request-a03967f2.md` and a direct
blob-to-blob diff: the complete narrative body the incoming commit introduces (§Why,
§What changed 1–5, §Design decisions, §Test plan, §Why free-coded, §Origin) is present
**verbatim, byte-identical** in the resolved file. Nothing was discarded.

No BUG-1301 precedence exception was invoked; no hunk was dropped; no test function on
either side was removed.

This resolution nets to **no diff vs HEAD**. Per STEP 4 that is expected and is not a
failure: STEP 3's discriminator says the incoming commit's content is *present in HEAD*
(identical body, superseded frontmatter) rather than *absent* — a genuinely redundant
commit, already landed through the post-watermark sync route, not a discarded one.
`--skip` was not called; the finalize step will detect the clean staged diff.
CHERRY_PICK_HEAD was left intact.
