---
uid: report-6f0430e2
id: REPORT-4640
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T05:02:44.577157+00:00'
updated_at: '2026-09-21T05:02:44.577157+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/doc-721a48c9.md` — **UU**, intent/bookkeeping-style doc ticket (STEP 2e, per-fact timeline rule). Only the `updated_at` scalar conflicted. Both sides carried the same operation (`xgd(ticket): update doc doc-721a48c9`), and the intent metadata directed "take the more recent commit by timestamp". Kept HEAD's `updated_at: '2026-09-11T09:33:38.989973+00:00'` over incoming's `'2026-08-31T21:59:36.770191+00:00'`; every other field merged cleanly. Staged with `git add --sparse` (path is outside the sparse cone per DOC-986 §2/§4.1 — conflict existed in the index only).

## Incoming changes preserved

Incoming commit `23099c4b29` made three frontmatter edits:

- `fields.doc_kind: architecture → system_kb` — **present** in the resolved tree.
- `last_field_updated: system_kb → doc_kind` — **present** in the resolved tree.
- `updated_at: 2026-08-31T19:43:00 → 2026-08-31T21:59:36` — superseded.

The two substantive edits (the entire semantic point of the incoming commit) are already carried in HEAD, so nothing was discarded. Only the bookkeeping timestamp differs, and taking incoming's value there would have rolled the mtime backwards on a doc HEAD has since edited (HEAD's timestamp is 11 days later). No BUG-1301 precedence exception was invoked; no code or UAT files were involved.

Net effect: the resolved tree is byte-identical to HEAD, so this cherry-pick is now empty. Staged as instructed; `--skip`/`--continue` left to the finalize step.
