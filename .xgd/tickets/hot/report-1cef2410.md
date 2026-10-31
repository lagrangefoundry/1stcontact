---
uid: report-1cef2410
id: REPORT-7107
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T23:00:31.762204+00:00'
updated_at: '2026-10-31T23:00:31.762204+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-46140599.md` — intent/bookkeeping ticket (2e), UU, conflict only in front matter (updated_at / completed_at / last_field_updated / status). Rule: superset / later-fact wins → kept HEAD (ours) via `git checkout --ours` + `git add --sparse`.
  - HEAD: status `free_and_reconciled`, updated_at 2026-10-30T21:51:52, completed_at 2026-10-30T21:51:40.
  - Incoming (46d977cc55, 2026-09-02): status `draft`, updated_at 2026-09-02T23:29:53, completed_at null. Older; applying it would regress a completed ticket to draft.
  - Flagged for post-merge review per enrichment rule (intent unknown on both sides; more recent by timestamp = HEAD).

## Incoming changes preserved

Incoming commit 46d977cc55 ("BUG-49: widen criterion 5 ...") carries one substantive change: the body rewrite of acceptance criterion 5 (cover a discovery request that cannot complete, carry Cloudflare's reason, and not read `success: false`-under-200 as an empty list). That widened text is **already present in HEAD**, landed by later ticket updates (aca3db3543 / b1dfaa6e08), so nothing was lost. The commit is redundant (BUG-1109/BUG-1122 shape) and the staged diff vs HEAD is empty. Left for cherry_pick_finalize_resolution to detect the empty diff and skip. CHERRY_PICK_HEAD is still in place.

Unrelated working-tree changes (`.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json`, untracked `report-5afee8ec.md`) were left untouched.
