---
uid: report-b5a12284
id: REPORT-4626
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T04:35:40.822475+00:00'
updated_at: '2026-09-21T04:35:40.822475+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` (REQ-162) — **UU**, intent/bookkeeping
  ticket (`request-*`), rule 2e. Resolved via `git checkout --ours` +
  `git add --sparse` (DOC-986 §2/§4.1).

  Incoming this attempt is `1e28c676bf` (2026-08-31T21:18:42Z), sixth distinct
  commit — 12 seconds after `76cd837f38` and carrying the *identical*
  `--commit-message` body: "correct the prerequisite — REQ-104 is on
  xgd-working; only the shared artifact store is stale, so bin/install is the
  whole fix".

  Unlike `76cd837f38` (attempt 115), which announced that edit but whose diff
  contained only metadata and a newline restore, **this commit carries the real
  content change** — 14 insertions, 21 deletions, rewriting the Prerequisite
  section from "## Prerequisite: the installed component predates REQ-104"
  (branch table, `a60537ee3c` stranded on `resync-577be0d7`, BUG-1303 caution,
  "land REQ-104/107/108 on xgd-working") to "## Prerequisite: refresh the
  installed component" (`fad535e8a4` on `xgd-working`, files present in the
  checkout, `bin/install` is the whole fix).

  **Only one hunk conflicted** — the frontmatter. The body did not conflict at
  all, because incoming's rewritten Prerequisite section and HEAD's existing one
  are the same text, so git saw both sides making an identical change and merged
  it silently. Verified by extracting the section from both stages and diffing:
  22 lines each, `diff` exit 0, no output.

  - **Hunk 1 (frontmatter)** — same fields, two lifecycle stages: incoming
    `free_coding` / `completed_at: null` / `last_field_updated: body`
    (2026-08-31T21:18:42) vs HEAD `free_and_reconciled` / completed
    2026-09-02T01:34 / `last_field_updated: result`. Genuine per-fact conflict
    under 2e; HEAD is later and downstream in the same lifecycle. HEAD wins.

## Incoming changes preserved

No code/implementation files were in conflict; the single conflicted file is a
bookkeeping ticket.

Incoming's content edit — the entire Prerequisite rewrite, which is this
commit's whole substantive contribution — **is present verbatim in the resolved
file**, confirmed both by the byte-identical section diff above and by grep
after staging:

- line 559: `## Prerequisite: refresh the installed component`
- line 567: `fad535e8a4 [FREE-CODED] REQ-104: ticket attachments — a BlobStore
  port with typed records`
- line 572: `bin/install --lang js --component ticketing --env /Users/martin/lagrangefoundry`

Nothing was dropped. The only incoming values not carried are the `free_coding`
status and `last_field_updated: body`, superseded by HEAD's later
`free_and_reconciled` / `result` on the same fields.

The BUG-1301 precedence exception was not invoked and is not needed. No UAT
test functions exist on either side.

## Confirms the attempt-113 resolution from the other direction

Attempt 113 (`6caee0c5d1`, REPORT-4623) resolved the Prerequisite section to
HEAD on the later-intent rule and flagged it for post-merge review, since the
two sides made mutually exclusive claims about where REQ-104 lives. Attempt 115
(`76cd837f38`, REPORT-4625) discharged that flag on the strength of a commit
*message*.

This attempt settles it on the diff itself: the correcting commit's actual
content is identical to what HEAD already carries, to the byte. The stale
"stranded on resync-577be0d7" text that attempt 113 declined to take was
superseded by this very edit, upstream, 6 minutes after it was written.

Net staged diff against HEAD is empty. Per this step's instructions `--skip`
was NOT called — staging is clean, `CHERRY_PICK_HEAD` remains at
`1e28c676bfaa8c27ff16560cb3d23e1926fd3685`, and the finalize step will detect
the clean staged diff and resolve the empty pick itself.
