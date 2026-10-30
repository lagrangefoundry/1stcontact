---
uid: report-c02708ca
id: REPORT-5271
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T03:03:25.382335+00:00'
updated_at: '2026-09-28T03:03:25.382335+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (`bug-*`), STEP 2e: ours is a strict superset, and on the shared lifecycle fields ours is the later-positioned intent. Resolved to the OURS side (`git checkout --ours` + `git add --sparse`).

  Three-way analysis (stage 1 base = `4ca0044c`, stage 2 ours = `1ee55f54`, stage 3 theirs = `1e195c59`):

  - **Base** is the state left by the previous queue entry (`82518d60`): `status: free_coding`, `updated_at` 2026-08-24T22:16, title/body/`severity` present, no `commits`/`version`.
  - **Incoming** (`04957574`, "xgd(ticket): update bug bug-a98fb3b0", 2026-08-24T22:19) is the free-coding completion step: `status: free_coding` → `free_coded`, `updated_at` 22:19:50, and it adds `commits[] { working_sha: 63df97c9..., reconcile_sha: null, main_sha: null }` and `version: 0.2.14`.
  - **Ours** is the same ticket further down its lifecycle: `status: free_and_reconciled`, `completed_at` and `updated_at` 2026-08-31T19:19, **the identical `commits[]` entry and the identical `version: 0.2.14`**, plus `story_points: 2` and `bundled_in: bundle-78f4e2fe`.

  `git diff <theirs> <ours>` reduces to exactly three things, and ours is correct on all three:

  1. `updated_at` / `completed_at` — ours 2026-08-31 vs theirs 2026-08-24; ours is the later intent.
  2. `status` — ours `free_and_reconciled` vs theirs `free_coded`. Two points on one lifecycle (`free_coded` is upstream of `free_and_reconciled`), not competing opinions; taking incoming would **regress** the ticket.
  3. Fields present only in ours (`story_points`, `bundled_in`) — these did not exist yet on the incoming side; nothing is overwritten.

  Notably the two substantive fields this commit introduces — `commits[]` and `version` — are already present in ours byte-for-byte, including the same `working_sha 63df97c93542321a3d57d21e2e31a763ed3e4411`. There is no fact the two sides set differently with incoming as the later word.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — the incoming commit's substantive additions are present in the resolved blob (`1ee55f54`): `commits[].working_sha: 63df97c9...` (line 20) and `version: 0.2.14` (line 23), alongside the earlier-established `severity: high` (18). The only incoming value not carried over is `status: free_coded`, superseded by the strictly later `free_and_reconciled` (line 12) — a lifecycle advance, not a discarded edit.

No hunks were dropped under the BUG-1301 precedence exception; no code or UAT files were involved in this conflict.

Staging verified clean: `git status --porcelain` is empty and the index holds stage 0 = `1ee55f54`. The staged tree is identical to HEAD (expected — every fact the incoming commit contributes was already in HEAD), so the finalize step should detect an empty diff and skip the commit. `CHERRY_PICK_HEAD` was left intact; no `--continue`/`--skip`/`--quit`/`--abort` was issued.
