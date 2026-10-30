---
uid: report-c8a9bcfc
id: REPORT-5508
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T07:58:08.612584+00:00'
updated_at: '2026-09-29T07:58:08.612584+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` (BUG-41) — **UU**, intent/bookkeeping
  ticket (STEP 2e). Outside the sparse-checkout cone, so staged with
  `git add --sparse`. The conflict was confined to the frontmatter
  lifecycle block; the body merged cleanly.

  Both sides changed the SAME fact (`status`, with its dependent
  `updated_at`/`completed_at`), so this is a genuine intent conflict and the
  2e rule applies per-fact: take the later-positioned intent.

  | fact | HEAD (kept) | incoming `3cebec8702` (dropped) |
  |---|---|---|
  | `updated_at` | 2026-09-19T15:15:30 | 2026-09-01T23:10:29 |
  | `completed_at` | 2026-09-14T10:29:09 | null |
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |

  Resolution: HEAD, for all three facts.

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's
incoming-must-appear check has no code target.

For the one ticket file, the incoming side's sole change is **deliberately
not preserved**, under 2e's per-fact later-intent rule rather than under the
BUG-1301 precedence exception:

- `git show 3cebec8702 -- .xgd/tickets/hot/bug-93851fea.md` is a 3-line
  frontmatter edit and nothing else: `free_coded` → `ready_to_reconcile`,
  dated 2026-09-01T23:10:29.
- `.xgd/_changes/log.ndjson` seq 2408 records this ticket moving
  `bundled` → `free_and_reconciled` at 2026-09-19T15:15:30 — 18 days after
  the incoming edit, and downstream of it in the lifecycle
  (`ready_to_reconcile` … `bundled` → `free_and_reconciled`).

Replaying the incoming value would regress a completed, reconciled ticket to
an earlier lifecycle state, so the later fact wins on every field. No
non-overlapping incoming content was discarded — the incoming commit touched
no other field, section, or line.

Because the resolution matches HEAD exactly, `git diff --cached HEAD` is
empty and this cherry-pick is now a no-op; per STEP 4 that is left for the
finalize step to detect, and no `--continue`/`--skip`/`--quit`/`--abort` was
issued here. `CHERRY_PICK_HEAD` (`3cebec8702`) is still present.
