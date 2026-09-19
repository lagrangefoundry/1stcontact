---
uid: report-fa9d8a07
id: REPORT-4433
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:54:11.637749+00:00'
updated_at: '2026-09-19T12:54:11.637749+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` — **UU** (index-only; path is outside
  the sparse-checkout cone, so there were no working-tree markers). Rule **2e**
  (intent/bookkeeping ticket, `request-*`): *one side is a strict superset* →
  kept ours. Resolved with `git checkout --ours` + `git add --sparse`.

  Merge stages: base `180dc00`, ours `c66d9bf`, theirs `09f46fb` (= incoming
  commit `8760eac` "xgd(ticket): update request request-8b33a146", authored
  2026-09-01). Base equals the incoming commit's pre-image, so base→theirs is
  exactly the incoming diff.

  The ours-vs-theirs diff is four facts in the frontmatter and nothing else —
  the body is byte-identical, with no hunks (so the usual `seed_local_overlay`
  body-rewrap churn does not arise for this ticket). On every one of the four,
  taking theirs would move the ticket backwards:

  | fact | ours (HEAD) | theirs (incoming) |
  |---|---|---|
  | `status` | `bundled` | `free_coded` — upstream of `bundled` on the same lifecycle path |
  | `completed_at` | `2026-09-14T10:29:05` | `null` |
  | `updated_at` | `2026-09-16T01:48:39` | `2026-09-01T21:34:31` |
  | `bundled_in` | `bundle-8e1807f6` | *absent* |

  `bundled_in` is the bundle currently being reconciled, so taking theirs would
  have orphaned the ticket from its own bundle, and would have reverted an
  operator-owned `status` from `bundled` to `free_coded`.

  Timeline agrees with the superset reading: the HEAD-side
  `seed_local_overlay` commit `ee0d0b9` is dated 2026-09-17, the incoming
  commit 2026-09-01. Both the 2e superset rule and the enrichment block's
  "take the more recent commit by timestamp" point to ours.

## Incoming changes preserved

Every substantive change the incoming commit makes is present in the resolved
file, byte-identically — it reached HEAD by a later route (the overlay carried
the `free_coded` state forward and then advanced it):

- `fields.commits` — both entries (`working_sha: eb6655c3…`, `working_sha:
  324b55bf…`, each with `reconcile_sha: null` / `main_sha: null`): present,
  identical.
- `fields.version: 0.2.37` — present, identical.
- `last_field_updated: status` — present, identical.
- trailing-newline removal at EOF — present, identical.
- `status` — the only field where the two sides hold different values. Incoming
  set `free_coding` → `free_coded`; HEAD advanced the same field further along
  the same path to `bundled`. The incoming transition is subsumed, not
  discarded.

Result: the staged tree nets to no diff vs HEAD (`git diff --cached --stat
HEAD` is empty). Per STEP 4 this is the redundant-commit case (BUG-1109/1122),
not a discard — STEP 3's test distinguishes them, and here the incoming
commit's key changes are *present* in HEAD rather than absent. Staged and
exited without touching the sequencer; `CHERRY_PICK_HEAD` still resolves to
`8760eac`, left for `cherry_pick_finalize_resolution` to skip.

No code, config, or UAT test files were involved. No hunk was dropped under the
BUG-1301 precedence exception.
