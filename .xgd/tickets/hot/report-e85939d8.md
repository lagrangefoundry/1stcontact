---
uid: report-e85939d8
id: REPORT-3143
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T00:31:40.871795+00:00'
updated_at: '2026-09-01T00:31:40.871795+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — class **AA** (both added; no stage-1
  base). Intent/bookkeeping ticket (§2e), outside the sparse-checkout cone, so
  resolved via `git checkout --ours` + `git add --sparse`.

  Rule applied: **§2e "one side is a strict superset of the other — keep the
  superset."** Verified at blob level, not by inspection: diffing stage 3
  (incoming, `9e5327c` "xgd(ticket): update request request-554ac441",
  2026-08-22) against stage 2 (HEAD, `b6ac2fa` "xgd(ticket): seed_local_overlay
  request request-554ac441", 2026-08-30) yields exactly four lines present in
  incoming and absent from HEAD, all of them superseded scalars or an EOF
  artifact:

    - `updated_at: '2026-08-22T23:55:22...'`  → HEAD has `2026-08-24T02:10:41...`
    - `status: free_coding`                   → HEAD has `status: bundled`
    - `version: 0.2.1`                        → HEAD has `version: 0.2.9`
    - `    missing tenant and for a missing asset alike.` — the file's last line
      on the incoming side; identical on the HEAD side, differing only because
      HEAD continues past it (no-newline-at-EOF artifact), not a deletion.

  Every other line of the incoming 384-line file is byte-identical in HEAD, which
  additionally appends ~137 lines of later follow-up sections (`bin/build`
  type-only node reach, deploy secret guard, ACs 12–16, version bookkeeping) plus
  four further `working_sha` entries, `bundled_in: bundle-b3b7c399` and
  `chat_comment: comment-98e86f10`.

  Both applicable tiebreakers agree with the superset rule: the enrichment
  metadata's stated rule for this file ("take the more recent commit by
  timestamp") selects HEAD (2026-08-30 vs 2026-08-22), and the ticket's own
  lifecycle is monotonic here — HEAD is a strictly later state of the same
  ticket (`free_coding` → `bundled`, `0.2.1` → `0.2.9`). This is a bookkeeping
  ticket, not a code file, so §2c's "incoming free_coded is authoritative" does
  not apply.

  Note per the enrichment rule's second clause: this file is **flagged for
  post-merge review**, since intent was unknown on one side. The flag is
  precautionary — the superset relation above is exact, so no content from
  either side was dropped.

## Incoming changes preserved

Confirmed. No code/implementation files were in conflict — the incoming commit
`9e5327c` touched exactly one file (`.xgd/tickets/hot/request-554ac441.md`,
+384/-0), and all 384 of its lines are present in the resolved version except
the three scalars its own later revisions superseded. Nothing was dropped under
the BUG-1301 precedence exception; no UAT test functions were involved.

The staged tree consequently shows **no diff vs HEAD** (`git diff --cached HEAD`
is empty). Per STEP 4 this is the redundant-commit case, not the discarded-code
case, and STEP 3's test distinguishes them: the incoming commit's key changes
are *present* in HEAD (verified line-by-line above), not merely absent. Left for
`cherry_pick_finalize_resolution` to skip; `--skip`/`--continue` not called.

`git status --porcelain` shows no remaining conflict-class lines. The 14
untracked `comment-*`/`report-*` files under `.xgd/tickets/hot/` predate this
step and are unrelated to the conflict. `CHERRY_PICK_HEAD` (`9e5327c`) is still
present for the next step.
