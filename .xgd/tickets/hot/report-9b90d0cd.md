---
uid: report-9b90d0cd
id: REPORT-5341
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T19:05:18.698932+00:00'
updated_at: '2026-09-28T19:05:18.698932+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — **UU**, intent/bookkeeping
  ticket (`request-*`), rule **2e**. Conflict was confined to a single
  frontmatter fact (the `status` / `updated_at` / `last_field_updated`
  triple); every other field and the entire body merged cleanly with no
  markers. Both sides changed that same fact differently, so per 2e the
  later-positioned intent wins **for that fact only**:

  | side | commit | committed | status | updated_at |
  |---|---|---|---|---|
  | ours (HEAD) | `2cf37792fd` `xgd(ticket): seed_local_overlay` | 2026-09-11T02:58 | `bundled` | 2026-09-09T21:32 |
  | incoming (`048fba1a9d`) | `xgd(ticket): update` | 2026-08-31T14:57 | `free_coding` | 2026-08-31T21:57 |
  | base | — | — | `draft` | 2026-08-31T21:38 |

  Resolved to the HEAD fact (`status: bundled`, `last_field_updated: status`,
  `updated_at: 2026-09-09T21:32:49.857144+00:00`), staged with
  `git add --sparse` (path is outside the sparse-checkout cone on this
  resync branch, DOC-986 §2/§4.1).

## Incoming changes preserved

No code files were in conflict, so STEP 3's code-file verification does
not apply. For the one ticket file:

- The incoming commit's **only** change relative to its own parent was
  `draft` → `free_coding` on that single fact (verified by diffing index
  stage :1 against stage :3 — two hunks, `updated_at` and
  `last_field_updated`/`status`, nothing else). It carried no body text,
  no new fields, and no other frontmatter edits, so there was no disjoint
  incoming content to combine under 2e's "apply BOTH" branch.
- That fact is genuinely superseded, not merely older: HEAD's side already
  advances the same ticket past `free_coding` to `bundled`, and the
  unconflicted region of the file — which both sides share — already
  carries `fields.bundled_in: bundle-87be4669`, `fields.version: 0.2.31`,
  three `fields.commits` entries, and the full "What landed" /
  "Consequences that had to be decided" body. Reinstating `free_coding`
  would have left `status` inconsistent with bookkeeping that neither side
  disputes.
- No BUG-1301 precedence exception was invoked; no test function on either
  side was touched or deleted.

The resulting staged tree is byte-identical to HEAD for this path, so the
finalize step is expected to detect an empty staged diff and skip the
commit. `CHERRY_PICK_HEAD` (`048fba1a9d`) was left in place; no
`--continue` / `--skip` / `--quit` / `--abort` was run.
