---
uid: report-a5f8fb1c
id: REPORT-4214
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T03:39:56.515420+00:00'
updated_at: '2026-09-14T03:39:56.515420+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` (REQ-172) — **UU**, intent/bookkeeping
  ticket (rule 2e; a `request-*` ticket, living in `hot/` rather than `open/`).
  Resolved by taking **ours**, per the auto-enrichment rule for this file
  ("Intent unknown on one or both sides. Take the more recent commit by
  timestamp") — ours is the later commit by a clear margin.

  The file is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the
  conflict existed only in the index with no working-tree markers. Both sides
  were read via `git show :1:/:2:/:3:` and resolved with
  `git checkout --ours --ignore-skip-worktree-bits` + `git add --sparse`, each
  issued as the sole content of its own call.

  The entire conflict was three frontmatter lines; the prose body is
  byte-identical across base, ours and theirs (`git diff :3: :2:` shows only the
  frontmatter hunk). Per-fact:

  | fact | base | theirs (incoming) | ours (kept) |
  |---|---|---|---|
  | `status` | `free_coded` | `ready_to_reconcile` | `bundled` |
  | `updated_at` | 09-01 21:34 | 09-01 21:43 | **09-11 18:53** |
  | `bundled_in` | — | — | `bundle-8e1807f6` |

  Ours is a strict superset: same lifecycle path, one stage further along, plus
  a field theirs never touched. No fact was changed in two genuinely competing
  directions, so no content was invented and nothing from theirs was dropped
  that ours does not already subsume.

## Incoming changes preserved

The incoming commit `fc7b846d79ac638ba19608d7214087b9d67b7839`
("xgd(ticket): update request request-8b33a146", Sep 1 14:43 -0700) touches
exactly one file and its whole diff is two frontmatter lines: bump `updated_at`
and advance `status: free_coded` -> `ready_to_reconcile`. No code, no prose.

That intent is **present in HEAD via a different route**, not discarded —
STEP 4's redundant-vs-discarded distinction, resolved on the redundant side:

- The only HEAD-side commit touching this file is
  `07434265b8652cda9b7ccb636ff581a3539dd56c`
  ("xgd(ticket): seed_local_overlay request request-8b33a146", Sep 11 14:08
  -0700), which created the overlay copy already at `status: bundled` with
  `bundled_in: bundle-8e1807f6`.
- `bundled` is downstream of `ready_to_reconcile` on the same lifecycle: a
  ticket reaches `bundled` by being gathered into a bundle *from*
  `ready_to_reconcile`. Taking theirs would have rewound the ticket a stage and
  dropped its bundle membership.
- Corroborated directly rather than assumed: `bundle-8e1807f6` is BUNDLE-27
  itself — the bundle this reconcile run is processing, status `reconciling` —
  and its `fields.commits` contains `eb6655c337e3b3644a59ee2c3daf6df6a423c810`,
  which is one of the two working SHAs listed on REQ-172's own `fields.commits`.
  REQ-172 is a member of this bundle, so `bundled` is its correct present state.

This is the seeded-overlay case: the overlay already carried the incoming
field, so the cherry-picked `update` is redundant. The staged diff against HEAD
is therefore empty, which is expected here and is not a @fail condition — the
finalize step will detect it and skip the commit. No BUG-1301 precedence
exception was invoked; no hunk was dropped.

No code or test files were involved in this conflict, so STEP 3's
code-preservation check has no other targets.

## Note for post-merge review

The enrichment rule asked that this file be flagged for post-merge review, so:
REQ-172 stays at `status: bundled` / `bundled_in: bundle-8e1807f6`, and the
`ready_to_reconcile` transition the developer recorded on Sep 1 is intentionally
not re-applied.

Incidental, non-blocking: `git checkout --ours --ignore-skip-worktree-bits`
cleared the skip-worktree bit on this path, so it is now materialized on disk
and tracked normally (`H`). That matches 336 other already-`H` entries under
`.xgd/tickets/hot/` (vs 4821 `S`), so it was left as-is rather than poking at
the ticket store. `git add --sparse` was used for staging regardless.
