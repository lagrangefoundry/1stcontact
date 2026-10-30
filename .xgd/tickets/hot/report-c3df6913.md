---
uid: report-c3df6913
id: REPORT-4522
type: report
title: 'Resync resolve conflicts: 18ffaec45665d29545db8bfd323ee4bf6d1f8678'
created_by: xgd
created_at: '2026-09-20T19:31:27.544733+00:00'
updated_at: '2026-09-20T19:31:27.544733+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-4fcbd354.md` — **AA** (both added), intent/bookkeeping ticket
  (`request-*`), rule **2e**. Two frontmatter hunks; body byte-identical on both sides.
  Resolved **to ours (HEAD)** on every conflicting fact via `git checkout --ours` +
  `git add --sparse`.

  - Hunk 1 (`updated_at` / `completed_at` / `status`):
    - ours: `2026-08-31T14:22:31Z`, `completed_at` set, `status: free_and_reconciled`
    - theirs: `2026-08-22T21:55:22Z`, `completed_at: null`, `status: ready_to_reconcile`
  - Hunk 2 (`fields.bundled_in`):
    - ours: `bundled_in: bundle-b3b7c399`
    - theirs: absent

## Incoming changes preserved

No incoming change was discarded. The incoming side is an **older state that HEAD already
contains and has advanced past** — not a competing edit.

`git log HEAD -- .xgd/tickets/hot/request-4fcbd354.md` shows:

    dffe9ecb6d 2026-08-31T07:22:31-07:00 xgd(ticket): update request request-4fcbd354
    a546588a7d 2026-08-30T22:06:21-07:00 xgd(ticket): seed_local_overlay request request-4fcbd354
    793d0ed6c6 2026-08-22T14:55:23-07:00 xgd(ticket): update request request-4fcbd354

`793d0ed6c6` (2026-08-22T14:55:23-07:00) is exactly the incoming commit's timestamp
(`updated_at: 2026-08-22T21:55:22.806967+00:00`). The incoming content is therefore already
an ancestor state on HEAD; `a546588a7d` and `dffe9ecb6d` then carried the ticket forward.

Taking incoming would have **regressed** the lifecycle (`free_and_reconciled` →
`ready_to_reconcile`), cleared `completed_at`, and dropped the `bundled_in: bundle-b3b7c399`
bookkeeping link — a strict loss with no compensating gain. Per rule 2e (later-positioned
intent wins per fact), ours is correct on all three facts.

No BUG-1301 precedence exception was invoked; no test function was touched. Only
`.xgd/tickets/` was in conflict — no code or UAT files were involved, so STEP 3's
per-code-file incoming-change verification has no applicable targets.

## Staging state

`git status --porcelain` is empty and `git ls-files -u` reports no unmerged stages: the
resolution equals HEAD, so this cherry-pick has a clean staged diff. Per STEP 4 this was
staged and left as-is — `--skip` was **not** called. `CHERRY_PICK_HEAD` remains at
`61d15c3fc6ae0c9bc1e2e2ecfe6dd410863e99f8` for the finalize step.
