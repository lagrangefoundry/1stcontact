---
uid: report-ffee8e65
id: REPORT-5272
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T03:05:15.912658+00:00'
updated_at: '2026-09-28T03:05:15.912658+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (`bug-*`), STEP 2e: ours is a strict superset, and on the shared lifecycle fields ours is the later-positioned intent. Resolved to the OURS side (`git checkout --ours` + `git add --sparse`).

  Three-way analysis (stage 1 base = `1e195c59`, stage 2 ours = `1ee55f54`, stage 3 theirs = `602e5ae7`):

  - **Base** is the state left by the previous queue entry (`04957574`): `status: free_coded`, `updated_at` 2026-08-24T22:19:50, `commits[]` and `version: 0.2.14` present, no `story_points`.
  - **Incoming** (`2c208ef3`, "xgd(ticket): update bug bug-a98fb3b0", 2026-08-24T22:19:54 — four seconds after the base commit) is a single-field estimate: it adds `story_points: 2`, bumps `updated_at` to 22:19:54, and sets `last_field_updated: status` → `story_points`. No other change.
  - **Ours** is the same ticket further down its lifecycle: `status: free_and_reconciled`, `completed_at` and `updated_at` 2026-08-31T19:19, **`story_points: 2` already present**, plus `bundled_in: bundle-78f4e2fe`.

  `git diff <theirs> <ours>` reduces to four things, and ours is correct on all four:

  1. `updated_at` / `completed_at` — ours 2026-08-31 vs theirs 2026-08-24; ours is the later intent.
  2. `status` — ours `free_and_reconciled` vs theirs `free_coded`. Two points on one lifecycle; taking incoming would **regress** the ticket.
  3. `last_field_updated` — derived bookkeeping naming whichever field the most recent write touched. Ours says `status`, which is correct for ours' later `free_and_reconciled` transition; theirs says `story_points` because that was the last write *as of 08-24*. Not a competing opinion, just a stale echo of an earlier write.
  4. `bundled_in` present only in ours — did not exist yet on the incoming side; nothing is overwritten.

  The one substantive field this commit introduces, `story_points: 2`, is already present in ours verbatim (it appears as unchanged context in the theirs→ours diff). There is no fact the two sides set differently with incoming as the later word.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — the incoming commit's sole substantive addition, `story_points: 2`, is present in the resolved blob (`1ee55f54`, line 24), alongside the previously established `version: 0.2.14` (23) and `bundled_in` (25). The incoming values not carried over are `status: free_coded` and `last_field_updated: story_points`, both superseded by the strictly later 08-31 update (`status: free_and_reconciled`, line 12) — a lifecycle advance, not a discarded edit.

No hunks were dropped under the BUG-1301 precedence exception; no code or UAT files were involved in this conflict.

Staging verified clean: `git status --porcelain` is empty and the index holds stage 0 = `1ee55f54`. The staged tree is identical to HEAD (expected — every fact the incoming commit contributes was already in HEAD), so the finalize step should detect an empty diff and skip the commit. `CHERRY_PICK_HEAD` was left intact; no `--continue`/`--skip`/`--quit`/`--abort` was issued.
