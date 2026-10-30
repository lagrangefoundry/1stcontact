---
uid: report-2ea024c4
id: REPORT-5269
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T02:59:25.723674+00:00'
updated_at: '2026-09-28T02:59:25.723674+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (`bug-*`), STEP 2e "one side a strict superset: keep the superset". Resolved to the OURS side (`git checkout --ours` + `git add --sparse`).

  Three-way analysis (stage 1 = `fec72d60`, stage 2 ours = `1ee55f54`, stage 3 theirs = `e7910daa`):

  - **Base** is the creation stub: `title: Untitled`, `status: draft`, body `(new ticket)`.
  - **Incoming** (`1c5985f8`, "xgd(ticket): update bug bug-a98fb3b0", 2026-08-24) changes exactly **one line** against that base — it adds `chat_comment: comment-dd005f45`. `git show --stat` confirms: 1 file changed, 1 insertion, 0 deletions. Everything else on the incoming side is still the untouched stub.
  - **Ours** is the fully matured BUG-38 ticket: `status: free_and_reconciled`, real title, `severity: high`, `commits[]`, `version: 0.2.14`, `story_points: 2`, `bundled_in: bundle-78f4e2fe`, plus the full Symptom / Root cause / Fix / Test plan body — **and** it already carries `chat_comment: comment-dd005f45`.

  Ours is therefore a strict superset of theirs: the incoming side's sole contribution is already present verbatim. There is no per-fact disagreement to adjudicate — no field is set differently on the two sides, only present-vs-absent. Taking incoming wholesale would have regressed `free_and_reconciled` → `draft`, cleared `completed_at`, and deleted the entire ticket body; that is the older creation-era state, not a competing edit.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — the incoming commit's only change, `chat_comment: comment-dd005f45`, is present in the resolved blob (`1ee55f54`, line 17), alongside `title:` (line 5) and `status: free_and_reconciled` (line 12). Nothing from the incoming side was discarded.

No hunks were dropped under the BUG-1301 precedence exception; no code or UAT files were involved in this conflict.

Staging verified clean: `git status --porcelain` is empty and the index holds stage 0 = `1ee55f54`. The staged tree is identical to HEAD (expected — the incoming delta was already contained in HEAD), so the finalize step should detect an empty diff and skip the commit. `CHERRY_PICK_HEAD` was left intact; no `--continue`/`--skip`/`--quit`/`--abort` was issued.
