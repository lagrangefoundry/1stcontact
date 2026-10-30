---
uid: report-b60fc923
id: REPORT-4532
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T20:08:39.822351+00:00'
updated_at: '2026-09-20T20:08:39.822351+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — **UU**, intent/bookkeeping ticket
  (`bug-*`), STEP 2e. Incoming `1a64efde` (2026-08-23T23:03Z) is the third
  commit in the BUG-36 drafting chain, after `1524d150` (attempt 26/0) and
  `bcedebfb` (attempt 27/0). It appends the
  `# Approved scope addition — fix the publish credential (option A)`
  section and bumps `updated_at`.

  Two conflict hunks, both the familiar shape — HEAD holds later state,
  incoming holds earlier bookkeeping:

  1. Frontmatter status block — HEAD `updated_at`/`completed_at`
     2026-08-31T19:19Z, `last_field_updated: status`,
     `status: free_and_reconciled`; incoming 2026-08-23T23:03Z,
     `completed_at: null`, `last_field_updated: body`, `status: draft`.
  2. Trailing content (lines 233-381) — HEAD-only
     `## Implementation — landed and verified end to end (2026-08-23)`
     and `## Still open, and NOT this ticket` sections; incoming
     contributes nothing on its side of the hunk.

  Applied 2e's **strict-superset** clause for the body and 2e's
  **later-positioned-intent, per fact** clause for the one genuinely
  competing fact (the frontmatter status block). Both select HEAD.
  Resolved via `git checkout --ours` so the blob is byte-exact with
  HEAD; staged diff is empty and finalize will skip the commit.

  Two things merged CLEANLY and were never in conflict:

  - Incoming's entire substantive contribution — the ~66 lines of
    `# Approved scope addition` (the CF_Authorization / service-token /
    mTLS analysis, the `bin/access-token` design, the `push.ts`
    `redirect: 'manual'` bug note, and the revoked-token postscript) —
    appears as common context at lines ~150-232, because HEAD already
    contains it verbatim.
  - The `## Status` paragraph. Unlike attempts 26/0 and 27/0, this
    commit does not touch it, so the 3-way merge resolved it to HEAD's
    completion record on its own. Its absence from the result is git's
    clean auto-merge, not a choice I made.

## Incoming changes preserved

Verified by `git diff 1a64efde HEAD -- <path>`: HEAD adds 164 lines over
incoming and removes exactly five. The complete set of incoming lines not
present in the resolution:

    -updated_at: '2026-08-23T23:03:08.033794+00:00'
    -completed_at: null
    -last_field_updated: body
    -status: draft
    -Scope drafted, awaiting operator confirmation before coding.

All five are superseded bookkeeping facts overwritten by HEAD's later,
documented intent (the first four from conflict hunk 1, the fifth from
git's clean auto-merge as noted above). Every substantive line
`1a64efde` introduced is present verbatim in the resolved file. No
developer content was discarded.

No code files were in conflict. No UAT test functions were touched, so
neither 2f nor the BUG-1301 precedence exception was engaged.
