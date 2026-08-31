---
uid: report-9de86f46
id: REPORT-2987
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T16:09:12.361833+00:00'
updated_at: '2026-08-31T16:09:12.361833+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, intent/bookkeeping ticket (rule 2e),
  out of the sparse-checkout cone (index-only conflict, no working-tree markers).
  Resolved per-fact to the HEAD-side content via `git checkout --ours` +
  `git add --sparse`.

  Incoming (`b0af50e1`, 2026-08-24 14:06:24 -0700, `xgd(ticket): update bug
  bug-6612c4b7`) is a two-line change: it applies the retitle to the canonical
  top-level `title:` field — "control-app: Edit mode **dies** with Cloudflare
  1102 — the preview render cache never hits in the Worker", replacing "Edit mode
  **503s** …" — and bumps `updated_at` to `2026-08-24T21:06:24.209053`. Nothing
  else. (Its merge base is `615faf7f`, the immediately preceding commit
  `fe97d3bc` from scope 182, which had parked the same string in `fields.title`;
  this commit is the follow-up that promotes it to `title:`.)

  HEAD (`seed_local_overlay`, ticket `updated_at 2026-08-26T17:36:27`) is the
  same ticket two days later and already carries that exact retitle in `title:`,
  plus the full downstream lifecycle: `status: bundled`, `bundled_in:
  bundle-78f4e2fe`, `version: 0.2.13`, `chat_comment`, three `commits` entries,
  and the rewritten body (confirmed root cause, the store-level memoisation fix,
  the superseded-hypothesis section, the observability section).

  Per-fact resolution: `title` — same fact on both sides, identical target
  string, HEAD is the later intent and already holds it, so HEAD wins with no
  loss; `updated_at` — same field, HEAD's `2026-08-26T17:36:27` is later, HEAD
  wins; every other field/section — present only on the HEAD side and preserved.
  Nothing was invented and no fact present only on the incoming side was
  dropped. (The transitional `fields.title` duplicate carried in the merge base
  is likewise absent from HEAD, but its value survives canonically in `title:` —
  same disposition as recorded for scope 182.)

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md` — the incoming commit's substantive change
  is the `title:` rename. That exact string is present in the resolved file at
  line 5. Verified with `git show b0af50e1 -- <path>` against the resolved
  worktree file (`git hash-object` = `54e03170f8615a3a40cd150fa569cca6d1e49ff9`,
  the ours-side blob).

This resolution nets to no diff versus HEAD (`git status --porcelain` reports no
tracked entries at all). That is the redundant-commit case, not a discard:
STEP 3's check passes because the incoming commit's key change is *present* in
HEAD via a later, canonical route, rather than absent. Per STEP 4 the file was
staged and left for `cherry_pick_finalize_resolution` to skip;
`--skip`/`--continue`/`--abort` were not called and `CHERRY_PICK_HEAD`
(`b0af50e15776b86450ee3293be69c365779dd26e`) is intact.

No code, UAT, or spec-ticket files were involved in this conflict, so no
BUG-1301 precedence exception was needed.
