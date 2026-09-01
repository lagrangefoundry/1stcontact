---
uid: report-47a0d19f
id: REPORT-3183
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T02:29:30.365270+00:00'
updated_at: '2026-09-01T02:29:30.365270+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, index-only conflict (path is outside
  the sparse-checkout cone on the reconcile branch, DOC-986 §2/§4.1: no
  working-tree file, no markers on disk, so the sides were read via
  `git show :1:/:2:/:3:`). Intent/bookkeeping ticket, rule **2e**, resolved
  **per-fact** — composed, not "pick a winner's whole file".

  Incoming commit `9255f773` (`xgd(ticket): update bug bug-6612c4b7`,
  2026-08-24T21:06:30, `free_coded`) is 1 insertion / 3 deletions:

  | fact | base (:1) | ours (:2, HEAD) | theirs (:3, incoming) | resolution | why |
  |---|---|---|---|---|---|
  | `fields.title` (duplicate of top-level `title`) | present | present, **unchanged from base** | **deleted** | **incoming — deleted** | only incoming made a decision here; its `last_field_updated: title` names this as the operation, while HEAD's write was a `status` operation that merely re-serialised the key. Non-competing → 2e "apply BOTH". |
  | `updated_at` | 21:06:24Z | **2026-08-26T17:36:27Z** | 2026-08-24T21:06:30Z | **HEAD** | genuinely competing — both sides moved it; later-positioned intent wins per-fact |
  | `status` / `last_field_updated` | draft / title | **bundled / status** | draft / title (unchanged vs base) | HEAD | incoming never touched |
  | `fields.{chat_comment,commits,version,bundled_in}` | absent | **present** | absent (unchanged vs base) | HEAD | incoming never touched |
  | body (Symptom → confirmed root cause, memoisation fix, observability, superseded hypothesis) | draft-era | **fully rewritten** | byte-identical to base | HEAD | incoming never touched |

  Result = HEAD's content with incoming's `fields.title` deletion applied.
  Verified: the staged diff vs HEAD is *exactly* that two-line deletion and
  nothing else; frontmatter still parses as YAML; top-level `title` intact;
  `fields` keys now `severity, priority, needs_review, auto_merge_back,
  chat_comment, commits, version, bundled_in`.

  Mechanics: `git checkout --ours --ignore-skip-worktree-bits` to materialise,
  edit, then `git add --sparse`. (Note for future runs: `git checkout` has no
  `--sparse` flag as STEP 4 states — it fails with exit 129; the equivalent is
  `--ignore-skip-worktree-bits`. `git add --sparse` is correct as written.)

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md`: incoming's substantive change — removal of
  the duplicated `fields.title` — **is present in the resolved file**, confirmed
  by `git diff --cached HEAD`, which shows precisely that hunk. Nothing from the
  developer's edit was discarded.

  Incoming's other line, the `updated_at` bump to 2026-08-24T21:06:30Z, is
  deliberately not taken: HEAD carries 2026-08-26T17:36:27Z from a strictly
  later operation (`status: draft → bundled`, which also added the `commits`,
  `version` and `bundled_in` bookkeeping). Regressing the timestamp to an
  earlier value would misdate the ticket and contradict the state that same
  HEAD write recorded. This is 2e's per-fact timeline rule applied to the one
  genuinely competing fact, not a discard of developer intent.

No code, UAT or config files were in conflict, so the BUG-1301 precedence
exception did not arise and no hunk was dropped under it.
