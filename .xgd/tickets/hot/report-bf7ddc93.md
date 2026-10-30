---
uid: report-bf7ddc93
id: REPORT-5353
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T19:34:34.866174+00:00'
updated_at: '2026-09-28T19:34:34.866174+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` (REQ-164) — **UU, intent/bookkeeping ticket (STEP 2e)**, outside the sparse-checkout cone so the conflict lived in the index only. Two frontmatter hunks, no body conflict. Resolved per-fact:
  - `status` / `updated_at`: HEAD's `bundled` @ `2026-09-09T21:32:49` kept over incoming's `free_coded` @ `2026-08-31T22:09:06`. `bundled` is downstream of `free_coded` in the lifecycle, and HEAD is later on both the ticket's own `updated_at` and the commit timestamp (HEAD-side `3bb3a8c547` `seed_local_overlay` @ 2026-09-11 vs incoming `f7493a90cd` @ 2026-08-31). This matches the enrichment metadata's rule for unknown-intent sides: take the more recent commit by timestamp.
  - `fields.bundled_in: bundle-87be4669`: HEAD-only fact, no incoming counterpart — kept. Dropping it would orphan the ticket from its bundle.
  - Staged with `git add --sparse`.

This ticket is not the resync anchor (anchor is `report-377b581e`), so it is incidental drift rather than the subject of the run.

## Incoming changes preserved

No code files were in conflict — the single conflicted path is a ticket. Incoming commit `f7493a90cd` made three frontmatter changes to this file:

- `fields.commits` (both `working_sha` entries, `858d63202f` and `c056002a52`) — **present** in the resolved index version.
- `fields.version: 0.2.22` — **present** in the resolved index version.
- `status: free_coding` → `free_coded` — **superseded, not discarded**. HEAD had already advanced the same field past `free_coded` to `bundled` nine days later. This is the 2e genuine-intent-conflict case (same field changed on both sides), resolved to the later-positioned intent. Replaying incoming's value would roll the lifecycle backwards.

No BUG-1301 precedence exception was invoked; no test function on either side was deleted. Net effect on the tree is a no-op relative to HEAD, since every incoming fact worth keeping was already present — the finalize step should detect a clean staged diff.

## Verification

- `git status --porcelain` — empty; no UU/AA/DU/UD lines remain.
- `CHERRY_PICK_HEAD` still present at `f7493a90cd9177f66e1d5cb55d645a0b267e3855`; no `--continue`/`--skip`/`--quit`/`--abort` was run.
- Index copy of the file re-read: valid YAML frontmatter, no conflict markers.
