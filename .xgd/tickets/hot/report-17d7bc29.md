---
uid: report-17d7bc29
id: REPORT-2991
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T16:14:23.158577+00:00'
updated_at: '2026-08-31T16:14:23.158577+00:00'
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

  Incoming (`0909c3f1`, 2026-08-24 14:32:02 -0700, `xgd(ticket): update bug
  bug-6612c4b7`) is a lifecycle advance, 14 seconds after the body rewrite of
  scope 199: `status: draft` → `free_coding`, `last_field_updated: body` →
  `status`, `updated_at` → `2026-08-24T21:32:02.284341`, and it drops the file's
  trailing newline. No body prose changes.

  HEAD (`seed_local_overlay`, ticket `updated_at 2026-08-26T17:36:27`) sits
  further along that same lifecycle at `status: bundled`, with the same
  `last_field_updated: status`, and already has no trailing newline. It also
  carries the bundle bookkeeping the incoming has not reached yet: `commits`
  (three `working_sha` entries), `version: 0.2.13`, `bundled_in:
  bundle-78f4e2fe`.

  I diffed the incoming blob directly against the ours blob
  (`git diff af15f9ef54 54e03170f8`) to confirm nothing else moved. The only
  differences are (a) that lifecycle frontmatter, and (b) the observability
  section already adjudicated in scope 199 — incoming's `## Still outstanding
  (not in this ticket)` versus HEAD's later `## Observability — added here` plus
  `## Deployment`. Every other line of the body is byte-identical.

  Per-fact resolution: `status` — same field, `draft → free_coding → … →
  bundled` is one ordered lifecycle and HEAD holds the later value, so HEAD wins;
  `updated_at` — HEAD later, HEAD wins; `last_field_updated` — both sides say
  `status`, no conflict; trailing newline — both sides agree it is absent;
  observability section — HEAD is the later intent (records the block as added
  rather than outstanding), consistent with the scope 199 resolution;
  `commits` / `version` / `bundled_in` — present only on the HEAD side and
  preserved. Nothing was invented, and no fact present only on the incoming side
  was dropped.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md` — the incoming commit's substantive change
  is the `status` advance out of `draft`. HEAD has advanced past it to
  `bundled`, so the incoming's intent (leave `draft`) is realised and then some;
  its trailing-newline removal is likewise already reflected. Verified by direct
  blob diff of incoming vs resolved (`git hash-object` =
  `54e03170f8615a3a40cd150fa569cca6d1e49ff9`, the ours-side blob).

This resolution nets to no diff versus HEAD (`git status --porcelain` reports no
tracked entries at all). That is the redundant-commit case, not a discard:
STEP 3's check passes because the incoming commit's key change is *superseded*
in HEAD by a later value of the same field, rather than absent. Per STEP 4 the
file was staged and left for `cherry_pick_finalize_resolution` to skip;
`--skip`/`--continue`/`--abort` were not called and `CHERRY_PICK_HEAD`
(`0909c3f158b9c5d06401fdca9b08d1314cb9905d`) is intact.

No code, UAT, or spec-ticket files were involved in this conflict, so no
BUG-1301 precedence exception was needed.
