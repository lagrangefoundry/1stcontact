---
uid: report-04cb454f
id: REPORT-5270
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T03:01:36.703025+00:00'
updated_at: '2026-09-28T03:01:36.703025+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (`bug-*`), STEP 2e: ours is a strict superset, and on the handful of genuinely shared facts ours is the later-positioned intent. Resolved to the OURS side (`git checkout --ours` + `git add --sparse`).

  Three-way analysis (stage 1 base = `e7910daa`, stage 2 ours = `1ee55f54`, stage 3 theirs = `4ca0044c`):

  - **Base** is the near-stub state: `title: Untitled`, `status: draft`, body `(new ticket)`, with `chat_comment` already set. (This is the blob the previous queue entry, `1c5985f8`, produced.)
  - **Incoming** (`82518d60`, "xgd(ticket): update bug bug-a98fb3b0", 2026-08-24T22:16) fleshes the ticket out: real title, `severity: high`, `status: draft` → `free_coding`, `updated_at` 22:16:14, and the full Symptom / Root cause / Fix / Test plan body.
  - **Ours** is the same ticket carried further down its lifecycle: identical title, identical `severity: high`, identical body text, plus `status: free_and_reconciled`, `completed_at` set, `updated_at` 2026-08-31T19:19, `commits[]` (`working_sha 63df97c9`), `version: 0.2.14`, `story_points: 2`, `bundled_in: bundle-78f4e2fe`.

  `git diff <theirs> <ours>` reduces to exactly four things, and ours is correct on all four:

  1. `updated_at` / `completed_at` — ours 2026-08-31 vs theirs 2026-08-24; ours is the later intent.
  2. `status` — ours `free_and_reconciled` vs theirs `free_coding`. These are two points on one lifecycle, not two competing opinions; taking incoming would **regress** the ticket to an earlier state.
  3. Fields present only in ours (`commits`, `version`, `story_points`, `bundled_in`) — these did not exist yet on the incoming side; nothing is being overwritten.
  4. A trailing-newline difference at end of body. Body content is otherwise byte-identical.

  There is no fact that the two sides set *differently* in a way where incoming is the later word. Ours contains every fact incoming introduces.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — every substantive change the incoming commit makes is present in the resolved blob (`1ee55f54`): `title:` (line 5), `chat_comment: comment-dd005f45` (17), `severity: high` (18), and the full body including `## Root cause` (37) and `## Test plan` (79). The only incoming value not carried over is `status: free_coding`, superseded by the strictly later `free_and_reconciled` (line 12) — a lifecycle advance, not a discarded edit.

No hunks were dropped under the BUG-1301 precedence exception; no code or UAT files were involved in this conflict.

Staging verified clean: `git status --porcelain` is empty and the index holds stage 0 = `1ee55f54`. The staged tree is identical to HEAD (expected — every fact the incoming commit contributes was already in HEAD), so the finalize step should detect an empty diff and skip the commit. `CHERRY_PICK_HEAD` was left intact; no `--continue`/`--skip`/`--quit`/`--abort` was issued.
