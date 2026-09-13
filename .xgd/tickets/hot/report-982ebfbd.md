---
uid: report-982ebfbd
id: REPORT-4177
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T23:44:37.706459+00:00'
updated_at: '2026-09-13T23:44:37.706459+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — **AA** (both added; `git ls-files -u` shows
  stages 2 and 3 only, no stage 1 / merge base). Rule **2b**, superset branch:
  kept the superset side (ours). Path is outside the sparse-checkout cone
  (DOC-986 §2/§4.1) — no worktree copy existed, so resolved via
  `git checkout --ours --` + `git add --sparse --`.

  Seeded-overlay artifact, not a genuine divergence:
  - Incoming commit `3fc6491` is `xgd(ticket): create bug bug-3ade1af4`
    (2026-09-01), an 18-line stub: `title: Untitled`, `status: draft`,
    `updated_at == created_at`, `last_field_updated: created_at`, body
    `(new ticket)`.
  - Ours is the ticket's final state imported by `35bff14` (`seed_local_overlay`),
    which is the only commit touching this path on the HEAD side — the absence of
    a `create` commit in `git log -- <path>` is why git saw no merge base and
    reported AA rather than UU.
  - `git diff <stage3> <stage2>` is purely additive apart from those five stub
    values: identical `uid`, `id`, `type`, `created_by`, `created_at`,
    `auto_merge_back`, `needs_review`, `priority`; ours adds `status: bundled`,
    `bundled_in: bundle-8e1807f6`, `commits[]`, `chat_comment`, `severity`,
    `story_points`, `version` and the full ~165-line body.

## Incoming changes preserved

No code/implementation files were conflicted — the sole conflict is an
intent/bookkeeping ticket.

The incoming `create` commit's intent (ticket `bug-3ade1af4` / BUG-40 exists,
with its immutable identity fields) is fully present in the resolved version:
ours is the lineal descendant of the very create being applied, so the stub
values it set were superseded by that ticket's own later lifecycle, already
carried by the seed. Nothing from the incoming side was discarded.

`git diff --cached HEAD` is therefore empty — this cherry-pick is **redundant,
not discarded** (BUG-1109/BUG-1122). Per STEP 4 no `--skip` was called; the
finalize step detects the clean staged diff. Staged blob confirmed as
`963294b5` at stage 0; `git status --porcelain` is empty, CHERRY_PICK_HEAD
left intact.
