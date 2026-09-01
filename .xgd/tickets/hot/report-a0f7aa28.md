---
uid: report-a0f7aa28
id: REPORT-3182
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T02:26:57.758602+00:00'
updated_at: '2026-09-01T02:26:57.758602+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, index-only conflict (path is outside
  the sparse-checkout cone on the reconcile branch, DOC-986 §2/§4.1, so there
  was no working-tree file and no markers on disk). Intent/bookkeeping ticket,
  rule 2e. Resolved per-fact to the HEAD (ours) content, staged with
  `git checkout --ours --ignore-skip-worktree-bits` + `git add --sparse`.

  Per-fact analysis of the three index stages:

  | fact | base (:1) | ours (:2, HEAD) | theirs (:3, incoming b0af50e) | resolution |
  |---|---|---|---|---|
  | `title` / `fields.title` | "Edit mode 503s with…" | "Edit mode **dies** with…" | "Edit mode **dies** with…" | both sides identical — no conflict; incoming's wording is what was kept |
  | `updated_at` | 2026-08-24T21:06:15Z | 2026-08-26T17:36:27Z | 2026-08-24T21:06:24Z | HEAD, later-positioned operation |
  | `last_field_updated` / `status` | title / draft | status / **bundled** | title / draft (untouched vs base) | HEAD (incoming never touched these) |
  | `fields.chat_comment`, `fields.commits`, `fields.version`, `fields.bundled_in` | absent | present | absent (untouched vs base) | HEAD (incoming never touched these) |
  | body (Symptom / root cause / fix narrative) | pre-investigation draft | fully rewritten: CONFIRMED root cause, the memoisation fix, observability block, superseded-hypothesis section | byte-identical to base | HEAD (incoming never touched the body) |

  No genuine competing fact existed, so the `xgd working-timeline` tiebreak was
  not needed. The incoming commit's diff is a single hunk — 2 insertions,
  2 deletions — touching only `title` and `updated_at`.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md`: the incoming commit's only substantive
  change is the title rewording `503s` → `dies`. That exact string is already
  present in HEAD, verbatim, in **both** places the ticket carries it
  (frontmatter `title:` and `fields.title:`) — verified with
  `git show HEAD:.xgd/tickets/hot/bug-6612c4b7.md`. The incoming `updated_at`
  (2026-08-24T21:06:24Z) is superseded by HEAD's later `2026-08-26T17:36:27Z`,
  written by the later `status: draft → bundled` operation.

  Nothing was discarded: this is the redundant-commit case (STEP 4 /
  BUG-1109/BUG-1122), not the discarded-commit case. STEP 3's discriminator is
  satisfied — the incoming commit's key change is *present in HEAD*, having
  landed through a different route, rather than merely absent from the
  resolution. The staged diff vs HEAD is consequently empty; per STEP 4 the
  resolution was staged and left for `cherry_pick_finalize_resolution` to skip.
  No `--skip`/`--continue`/`--abort` was issued; `CHERRY_PICK_HEAD`
  (b0af50e15776b86450ee3293be69c365779dd26e) is intact.

No code files were in conflict, so the BUG-1301 precedence exception did not
arise and no hunk was dropped under it.
