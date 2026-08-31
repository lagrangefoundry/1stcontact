---
uid: report-b7a76b5d
id: REPORT-2880
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T09:04:26.531988+00:00'
updated_at: '2026-08-31T09:04:26.531988+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-22aa8ea3.md` — class **AA** (both added, no merge
  base). Rule **2e** (intent/bookkeeping ticket, `request-*`): incoming is a
  **strict superset** — it adds one field, `chat_comment: comment-70b033ef`,
  under `fields:`, and touches nothing else. The HEAD side never touched that
  field, so there is no competing per-fact edit and no timeline tiebreak was
  needed. The enrichment's fallback rule (take the more recent commit by
  timestamp) points the same way: HEAD side is
  `03efd75cd43649081d03d927c4f40866861ddaf9` (2026-08-20 14:38:34 -0700),
  incoming is `d1147fdc1de6b901043f40e93006b805e73cc3e7` (2026-08-23 13:36:57
  -0700).

  Resolved as the true union of both sides: incoming's content, with the
  trailing newline retained from the HEAD side (incoming's blob ended with
  `\ No newline at end of file`). The newline is the only byte where the
  resolution differs from the incoming blob, and it is content present on the
  HEAD side — nothing was invented.

  The path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the
  conflict existed only in the index; the working tree held the `ours` blob
  with no conflict markers. Staged with `git add --sparse`.

## Incoming changes preserved

Confirmed. `git diff --no-index` between the incoming blob
(`06789d6222ce71c374fa6e8402cd9a2d9812c5c3`) and the resolved file reports
only the trailing-newline hunk described above — the resolution is otherwise
byte-identical to incoming, so `chat_comment: comment-70b033ef` is present.

`git diff --cached --stat HEAD` shows `1 file changed, 1 insertion(+)`, which
is exactly the incoming commit's substantive change.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No
code, test, or spec-ticket (2d) files were involved in this conflict.

Cherry-pick sequencer state left intact (`CHERRY_PICK_HEAD` =
`d1147fdc1de6b901043f40e93006b805e73cc3e7`) for
`cherry_pick_finalize_resolution`.
