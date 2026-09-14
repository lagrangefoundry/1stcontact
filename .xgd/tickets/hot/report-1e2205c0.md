---
uid: report-1e2205c0
id: REPORT-4204
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T03:07:06.835241+00:00'
updated_at: '2026-09-14T03:07:06.835241+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` (BUG-42) — **UU**, intent/bookkeeping
  ticket (rule **2e**), sparse-excluded so the conflict existed only in the
  index. Resolved by `git checkout --ours` + `git add --sparse`.

  Ours is `xgd(ticket): seed_local_overlay bug bug-034bf955`; theirs is the
  incoming free-coded `xgd(ticket): update bug bug-034bf955` (24b0c044bc).
  A full `diff` of stage :3: against stage :2: shows ours is a **strict
  superset** — 2e's "keep the superset" branch — so no per-fact timeline
  lookup was needed:

  - Identical on both sides: `title` ("Builder: markdown shows as source on
    first load, and never renders in the Library"), `fields.severity: medium`,
    `last_field_updated: status`, and the entire Symptom / Root cause / Fix /
    Test plan body (byte-for-byte identical; the diff produced no hunks in
    the body at all).
  - Ours-only, ours strictly later: `status` advanced `free_coding` →
    `bundled`; `fields.commits[0].working_sha bd7612f977e3…`;
    `fields.version 0.2.36`; `fields.story_points 3`;
    `fields.bundled_in bundle-8e1807f6`; `updated_at` 2026-09-11T18:53:54Z
    vs the incoming 2026-09-01T21:10:09Z.
  - Theirs-only: a trailing newline at EOF. Ours matches the ticket store's
    on-disk no-trailing-newline form, which is what the seeded overlay wrote.

  The enrichment's fallback rule ("take the more recent commit by timestamp")
  selects the same side: ours is ten days later. No fields were invented, and
  no `intent_uid` / `story_uid` / `capability_uid` was touched.

## Incoming changes preserved

Confirmed. This ticket carries no code — the incoming commit's entire payload
is ticket content, and every key change it makes is **present in HEAD**, not
absent:

- `title` filled in from `Untitled` → present in ours, identical string.
- `fields.severity: medium` added → present in ours.
- `status: draft` → `free_coding` → present in ours *and superseded* by the
  later legitimate lifecycle advance to `bundled` (this bundle,
  bundle-8e1807f6, is the one the ticket is bundled into).
- The ~100-line Symptom/Root cause/Fix/Test plan body → present in ours
  byte-for-byte.

This is STEP 4's redundant-commit case, not STEP 3's discarded case: the
incoming intent already reached HEAD through the seeded local overlay, so the
staged diff against HEAD is empty. No BUG-1301 precedence exception was
invoked; no hunk was dropped.

## State

`git status --porcelain` is empty (no UU/AA/DU/UD remaining).
`CHERRY_PICK_HEAD` = 24b0c044bca108845a37cb3ea6f6f20e6ba27283 is intact for
cherry_pick_finalize_resolution. No `--continue` / `--skip` / `--abort` /
`reset` was run.
