---
uid: report-a86b3bf8
id: REPORT-2988
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T16:10:18.843469+00:00'
updated_at: '2026-08-31T16:10:18.843469+00:00'
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

  Incoming (`9255f773`, 2026-08-24 14:06:30 -0700, `xgd(ticket): update bug
  bug-6612c4b7`) makes two changes: it **removes** the transitional
  `fields.title` duplicate — the copy of the retitled string that `fe97d3bc`
  (scope 182) had parked there and `b0af50e1` (scope 183) had already promoted to
  the canonical top-level `title:` — and bumps `updated_at` to
  `2026-08-24T21:06:30.064106`. This is the third and final commit of that
  three-step retitle sequence: park in `fields.title`, promote to `title:`, drop
  the parked copy.

  HEAD (`seed_local_overlay`, ticket `updated_at 2026-08-26T17:36:27`) is the
  same ticket two days later and already reflects both changes: its `fields`
  block contains `severity`, `priority`, `needs_review`, `auto_merge_back`,
  `chat_comment`, `commits`, `version`, `bundled_in` and **no `title` key**, and
  its `updated_at` is later than the incoming's. HEAD additionally carries the
  full downstream lifecycle (`status: bundled`, `bundled_in: bundle-78f4e2fe`,
  `version: 0.2.13`, the three `commits` entries, and the rewritten body).

  Per-fact resolution: `fields.title` — the incoming deletes it, HEAD does not
  have it, so the two sides agree and HEAD already satisfies the incoming's
  intent; `updated_at` — same field, HEAD's `2026-08-26T17:36:27` is the later
  intent, HEAD wins; every other field/section — present only on the HEAD side
  and preserved. Nothing was invented, and no fact present only on the incoming
  side was dropped.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md` — the incoming commit's substantive change
  is the removal of `fields.title`. Verified absent from the resolved file's
  `fields` block (lines 13-31), i.e. the incoming's intent is satisfied. The
  retitled string it was a duplicate of remains canonically at line 5 as
  `title:`. Verified with `git show 9255f773 -- <path>` against the resolved
  worktree file (`git hash-object` =
  `54e03170f8615a3a40cd150fa569cca6d1e49ff9`, the ours-side blob).

This resolution nets to no diff versus HEAD (`git status --porcelain` reports no
tracked entries at all). That is the redundant-commit case, not a discard:
STEP 3's check passes because the incoming commit's key change is already
*realised* in HEAD via a later, canonical route, rather than absent. Per STEP 4
the file was staged and left for `cherry_pick_finalize_resolution` to skip;
`--skip`/`--continue`/`--abort` were not called and `CHERRY_PICK_HEAD`
(`9255f773b5e1635c06628775eddbff1535bade50`) is intact.

No code, UAT, or spec-ticket files were involved in this conflict, so no
BUG-1301 precedence exception was needed.
