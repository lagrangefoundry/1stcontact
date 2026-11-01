---
uid: report-5cb9ba1e
id: REPORT-7647
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T14:44:48.020553+00:00'
updated_at: '2026-11-01T14:44:48.020553+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/bug-cb59cc4a.md` (BUG-48), an intent/bookkeeping ticket. Rule 2e, applied per fact. Cherry-pick 7a49f671c1.
  - **Body: took incoming.** It's a non-overlapping addition: the "## Scoped behaviour (agreed with the operator before coding)" section (S1–S6), appended after "### Scope". HEAD never had this section, and `git log -S` on HEAD finds no commit that added or removed it, so nothing on HEAD superseded it. Applied verbatim.
  - **Frontmatter: kept HEAD.** Same facts changed on both sides: `status`, `updated_at`, `completed_at`, `last_field_updated`. HEAD's values (2026-11-01, `free_and_reconciled`) are later than incoming's (2026-09-03, `free_coding`). Taking incoming would move the ticket's status back to an earlier stage.
  - **`fields.commits` (HEAD only): kept.** Incoming never touched it.
- Staged with `git add --sparse` (path is outside the sparse cone). Result vs HEAD: +96/-1. The -1 is only the old last line gaining a final newline.

## Incoming changes preserved

The incoming body addition is present verbatim: `diff theirs resolved` differs only in the frontmatter facts listed above. The only incoming changes not taken are the stale lifecycle stamps (`updated_at`, `last_field_updated: body`), which HEAD's later values supersede.

## Post-merge review flag

Flagged per enrichment ("intent unknown"). Please confirm the S1–S6 scoping section belongs on a ticket that is already `free_and_reconciled`. It is operator-agreed scope text that predates the coding, so keeping it looks right.
