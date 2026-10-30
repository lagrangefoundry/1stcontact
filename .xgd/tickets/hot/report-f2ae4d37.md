---
uid: report-f2ae4d37
id: REPORT-4628
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T04:40:02.081862+00:00'
updated_at: '2026-09-21T04:40:02.081862+00:00'
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

  Incoming this attempt is `d86269421c` (2026-08-31T21:41:19Z), eighth distinct
  commit, empty commit-message body, 15 insertions / 5 deletions. Its
  contribution (base-vs-theirs diff):

  1. lifecycle transition — `status: free_coding` -> `free_coded`,
     `last_field_updated: body` -> `status`, `updated_at` bump
  2. **adds `fields.commits`** — three entries, each
     `working_sha: <sha> / reconcile_sha: null / main_sha: null`
     (`fc117f1d35`, `2284bf4bbd`, `bc36b2cce9`)
  3. `version: 0.2.20`
  4. removes the extra blank line before the title (added by `40765e3d6b`)
  5. strips the trailing newline

  Two hunks:

  - **Hunk 1 (frontmatter lifecycle)** — same fields, two stages: incoming
    `free_coded` / `completed_at: null` / `last_field_updated: status` vs HEAD
    `free_and_reconciled` / completed 2026-09-02T01:34 /
    `last_field_updated: result`. HEAD is downstream in the same lifecycle
    (`free_coding` -> `free_coded` -> ... -> `free_and_reconciled`) and ~28h
    later. Genuine per-fact conflict under 2e => later intent wins. HEAD.
  - **Hunk 2 (`fields.commits`)** — the `commits:` key itself is common
    context; the list contents differ. Incoming has the **pre-reconciliation**
    record: three working SHAs, every `main_sha: null`. HEAD has the
    **post-reconciliation** record of the same fact: a single entry
    `working_sha: null / main_sha: 4b43dd9a5c0fd50ed053a33ed3defcb63f7ed8cd`,
    plus an `orphan_commits` remap ledger, `merged_at_commit:
    4b43dd9a5c0fd50ed053a33ed3defcb63f7ed8cd`, and `result: pass` — none of
    which incoming has. Same field changed differently => 2e later-intent rule.
    HEAD.

    Taking incoming here would be actively wrong, not merely stale: it would
    represent a ticket that has completed, merged and reconciled
    (`merged_at_commit` set, `result: pass`, `status: free_and_reconciled`) as
    having three un-merged working commits and no main SHA. It would also pin
    working SHAs on `xgd-working` that this very resync run is in the middle of
    rewriting.

    Checked and worth recording: the three incoming working SHAs do **not**
    appear anywhere in HEAD's `orphan_commits` ledger. So HEAD did not arrive
    at its single entry by remapping them — it nulled `working_sha` and
    recorded `main_sha` instead, which is the normal post-merge form. The
    absence is expected, not a sign of lost history.

## Incoming changes preserved

No code/implementation files were in conflict; the single conflicted file is a
bookkeeping ticket, and this commit contains no prose at all — only frontmatter
bookkeeping plus two whitespace changes.

`git checkout --ours` takes HEAD's blob wholesale, so incoming's
non-conflicting content was verified rather than assumed: the body from the `#`
title onward was extracted from stage 2 (ours) and stage 3 (theirs) and diffed
— **294 lines each, diff exit 0, byte-identical**. Nothing outside the
frontmatter differs between the two sides.

Confirmed in the resolved file after staging:

- line 11 `status: free_and_reconciled`
- line 21 `main_sha: 4b43dd9a5c0fd50ed053a33ed3defcb63f7ed8cd`
- line 538 `merged_at_commit: 4b43dd9a5c0fd50ed053a33ed3defcb63f7ed8cd`
- line 539 `result: pass`

Not applied, and recorded rather than passed over silently:

- incoming's three `working_sha` entries and `free_coded` status — superseded
  by HEAD's later values on the same fields (reasoning above)
- the blank-line removal and trailing-newline strip — whitespace-only. As noted
  at attempt 117, this queue keeps oscillating on the trailing newline
  (`8b6541d4b1` stripped, `76cd837f38` restored, `40765e3d6b` added,
  this one strips again); it is churn, not intent, and HEAD's byte form is what
  `main` carries.

`version: 0.2.20` is identical on both sides and present in the result.

The BUG-1301 precedence exception was not invoked and is not needed. No UAT test
functions exist on either side.

Net staged diff against HEAD is empty. Per this step's instructions `--skip`
was NOT called — staging is clean, `CHERRY_PICK_HEAD` remains at
`d86269421c7bbe3bd85b00f2c3a636c5ba109459`, and the finalize step will detect
the clean staged diff and resolve the empty pick itself.
