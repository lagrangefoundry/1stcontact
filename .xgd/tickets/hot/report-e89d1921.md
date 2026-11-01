---
uid: report-e89d1921
id: REPORT-7333
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T05:59:39.385000+00:00'
updated_at: '2026-11-01T05:59:39.385000+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/bug-46140599.md` (BUG-49): intent/bookkeeping ticket (2e), index-only conflict outside the sparse cone. Took HEAD's version (`checkout --ours` + `add --sparse`). Rule: for each conflicting fact, keep the more recent side by timestamp, as the enrichment's resolution rule says.
  - Front matter: HEAD has `updated_at 2026-10-30T21:51:52`, `status: free_and_reconciled`, and `completed_at` set. Incoming (50646ff35f, authored 2026-09-02) has `status: draft`, `completed_at: null`, and `last_field_updated: title`. HEAD is about two months newer, and two later HEAD commits (b1dfaa6e08, aca3db3543, both 2026-10-30) advanced the status after this edit.
  - Criterion 5 body: HEAD's text is a strict superset of incoming's. It adds the "discovery request cannot complete" case, "carrying the reason Cloudflare gave", and the `success: false`-under-200 rule that must not be read as an empty list. Kept HEAD's text.
  - Scope paragraph final line: same text on both sides (trailing-newline difference only). Kept HEAD's line.
  - Flagged for post-merge review as the enrichment requires, though no review action is expected.

## Incoming changes preserved

There are no code files. The incoming commit was an early scoping edit of BUG-49 (the ticket body plus draft status). Its body content is already in HEAD in a later, expanded form, and its front matter is superseded by later HEAD commits. This commit is redundant, not discarded: the resolution stages to no diff against HEAD, so finalize should detect the clean diff and skip it.

Other working-tree changes (`.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json`, and the untracked `report-abf88994.md`) are not part of the conflict and were left untouched.
