---
uid: report-1f193f09
id: REPORT-5268
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T02:56:24.109904+00:00'
updated_at: '2026-09-28T02:56:24.109904+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — **AA** (both added), intent/bookkeeping
  ticket (STEP 2b + 2e). Resolved to **ours (HEAD)** as a strict superset.

  Incoming (`4e5a8b2b72 xgd(ticket): create bug bug-a98fb3b0`, 2026-08-24, 18
  lines added) is the ticket's **creation state**: `title: Untitled`,
  `status: draft`, `completed_at: null`, `updated_at == created_at`, body
  `(new ticket)`, fields limited to `auto_merge_back` / `needs_review` /
  `priority`.

  HEAD carries the fully-evolved ticket (`cbdfed2e2d seed_local_overlay` then
  `01492336ad update`): real title, `status: free_and_reconciled`,
  `updated_at 2026-08-31`, plus `chat_comment`, `severity`, `commits`,
  `version: 0.2.14`, `story_points`, `bundled_in: bundle-78f4e2fe`, and the
  full Symptom / Root cause / Fix / Test plan body.

  Every field present on the incoming side is present on the HEAD side with an
  identical value (`uid`, `id`, `type`, `created_by`, `created_at`,
  `auto_merge_back`, `needs_review`, `priority`). The only incoming-unique
  content is placeholder state that HEAD's later lifecycle supersedes — taking
  incoming would regress `free_and_reconciled` → `draft` and drop
  `bundled_in`. No genuine per-fact conflict exists, so 2e's
  later-intent-per-fact tiebreak never engages: the superset rule decides.

  Mechanics: the conflict materialized on disk despite `.xgd/tickets` being
  outside the sparse cone, so `git checkout --ours` + `git add --sparse` were
  used. Post-resolution the working file hashes to
  `1ee55f547b18b0c12df82291f51b4ba7eb9c4168`, byte-identical to index stage 2.

## Incoming changes preserved

No code/implementation files were in conflict — the incoming commit touches
exactly one path, the ticket above, and adds no source, test, or config
changes.

For that ticket, no developer content was discarded: the incoming side is the
earlier creation snapshot of the same ticket whose later states HEAD already
carries. Its identity fields survive verbatim in the resolved version; its
placeholder title/status/body are superseded rather than lost. No BUG-1301
precedence exception was invoked and no test function was deleted.

Resulting staged diff against HEAD is empty — the incoming creation stub adds
nothing HEAD does not already hold. Staged as-is per instructions; `--skip`
was not called, and `CHERRY_PICK_HEAD` (`4e5a8b2b72`) remains present for the
next workflow step.
