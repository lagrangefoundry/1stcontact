---
uid: report-2c5ea298
id: REPORT-4543
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T20:42:09.189977+00:00'
updated_at: '2026-09-20T20:42:09.189977+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — **UU**, intent/bookkeeping ticket
  (STEP 2e). Incoming commit `5af1ff949d` ("xgd(ticket): update bug
  bug-db356ff8", 2026-08-23) vs HEAD-side state (2026-08-31). Two
  conflict hunks, both metadata-level; the 112-line body addition the
  incoming commit carries auto-merged cleanly and needed no decision.
  - **Frontmatter status block** — genuine same-field conflict on
    `status` / `completed_at` / `updated_at` / `last_field_updated`.
    Per-fact later-positioned intent wins: kept HEAD's
    `status: free_and_reconciled`, `completed_at: 2026-08-31T19:19:38`,
    `last_field_updated: status`. Incoming carried the older
    `draft` / `completed_at: null` / `updated_at: 2026-08-24T01:48:23`
    state, which predates reconciliation — taking it would have
    reverted a completed lifecycle transition.
  - **Final body line** — trailing-newline artifact only. Both sides
    carry byte-identical text (`…it needs its own ticket.`); HEAD's blob
    simply lacked the terminating newline. Kept one copy, with the
    newline (matching the incoming blob).

  Staged with `git add --sparse` — the path is outside the
  sparse-checkout cone on this resync branch (DOC-986 §2/§4.1); a plain
  `git add` refused it.

## Incoming changes preserved

Confirmed. The incoming commit's substantive contribution is a 112-line
body addition (`## Second finding — bin/publish --production cannot
authenticate`, `# Approved scope addition — fix the publish credential
(option A)`, `## Implementation — landed and verified end to end`,
`# Implementation — the tenant fix`, `## Supersession — one REQ-149
assertion`, `## Verified`, `## Still open, and NOT this ticket`).

Verification: `git show :.xgd/tickets/hot/bug-db356ff8.md` diffed
against `git show 5af1ff949d:.xgd/tickets/hot/bug-db356ff8.md` over the
body region is **byte-identical** — every incoming line is present in
the resolved blob. Spot-check of distinctive incoming markers
(`Approved scope addition`, `Implementation — the tenant fix`,
`Supersession — one REQ-149 assertion`, `bin/access-token`,
`reason: 'unknown'`) returns 8 matches in the staged blob.

No hunk was dropped; the BUG-1301 precedence exception was not invoked.
The only content not taken from the incoming side is the stale
frontmatter lifecycle state described above, which is metadata, not
developer code, and is governed by the per-fact timeline rule.

## Staging state

`git status --porcelain` → `M  .xgd/tickets/hot/bug-db356ff8.md`.
No UU/AA/DU/UD lines remain. `CHERRY_PICK_HEAD` (`5af1ff949d`) is
intact — no `--continue`/`--skip`/`--quit`/`--abort` was run.

Note: the resolved tree differs from HEAD only by the added trailing
newline, so the finalize step may legitimately detect a near-empty
staged diff for this commit.
