---
uid: report-952cb21c
id: REPORT-2986
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T16:08:00.732186+00:00'
updated_at: '2026-08-31T16:08:00.732186+00:00'
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
  Resolved per-fact to the HEAD-side content via
  `git checkout --ours` + `git add --sparse`.

  Incoming (`fe97d3bc`, 2026-08-24 14:06:15 -0700, `xgd(ticket): update bug
  bug-6612c4b7`) made exactly three changes: bumped `updated_at` to
  `2026-08-24T21:06:15`, set `last_field_updated: title`, and added a
  `fields.title` entry holding the reworded title ("Edit mode dies with
  Cloudflare 1102 …"), while leaving the canonical top-level `title:` at the old
  wording ("Edit mode 503s …"). It also dropped the trailing newline.

  HEAD (`seed_local_overlay`, ticket `updated_at 2026-08-26T17:36:27`) is later
  on the same lifecycle and already carries that same title fact — applied to the
  canonical `title:` field rather than parked in `fields.title` — plus the whole
  subsequent lifecycle: `status: bundled`, `bundled_in: bundle-78f4e2fe`,
  `version: 0.2.13`, `chat_comment`, the three `commits` entries, and the fully
  rewritten body (CONFIRMED root cause, the store-level memoisation fix, the
  superseded-hypothesis section, the observability section). HEAD also has no
  trailing newline.

  Per-fact resolution: `title` — same fact on both sides, HEAD is the later
  intent and holds it canonically, so HEAD wins; `updated_at` /
  `last_field_updated` — same fields, HEAD later, HEAD wins; `fields.title` — a
  transitional duplicate of a value HEAD already carries in `title:`, so not
  re-added (no value is lost); every other field/section — present only on the
  HEAD side and preserved. Nothing was invented; nothing present on only the
  incoming side was dropped except the duplicated title copy, whose value
  survives canonically.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md` — the incoming commit's only substantive
  change is the retitle to "control-app: Edit mode dies with Cloudflare 1102 —
  the preview render cache never hits in the Worker". That exact string is
  present in the resolved file at line 5 as the top-level `title:`. Verified with
  `git show fe97d3bc -- <path>` against the resolved worktree file
  (`git hash-object` = `54e03170f8615a3a40cd150fa569cca6d1e49ff9`, i.e. the
  ours-side blob).

This resolution nets to no diff versus HEAD (`git diff --cached HEAD` is empty).
That is the redundant-commit case, not a discard: STEP 3's check passes because
the incoming commit's key change is *present* in HEAD via a later, canonical
route, rather than absent. Per STEP 4 the commit was staged and left for
`cherry_pick_finalize_resolution` to skip; `--skip`/`--continue` were not called
and `CHERRY_PICK_HEAD` (`fe97d3bc344f6b637416ce69b5e6043fe3759e10`) is intact.

No code, UAT, or spec-ticket files were involved in this conflict, so no
BUG-1301 precedence exception was needed.
