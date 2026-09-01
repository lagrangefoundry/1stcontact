---
uid: report-12402ac7
id: REPORT-3233
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T22:19:21.361399+00:00'
updated_at: '2026-09-01T22:19:21.361399+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/doc-95b1b7f1.md` — **AA** (both added), doc ticket (DOC-12 "Site Storage, Versioning & Rendering Model"). Rules 2b / 2e, per-fact. Resolved to **theirs** (incoming `20b0e0a2` from xgd-working, `free_coded`).

  Both sides carried an identical 200-line body; the entire ours-vs-theirs delta was two frontmatter facts, matching the two conflict blocks in the worktree (6 marker lines = 2 blocks, both inside the `---` frontmatter):

  1. `updated_at` — ours `2026-08-16T01:20:12`, incoming `2026-08-31T19:42:54`. Incoming is the later-positioned edit.
  2. `fields.system_kb: true` — present on ours, removed by incoming. This removal *is* the incoming commit's declared intent: "field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)".

  Neither fact is a case of two sides changing the same fact in independently-meaningful ways: the ours side is simply the older state of the same two fields, with no disjoint edit to compose (BUG-1030's compose-both case does not arise — there is nothing on the ours side to preserve). Both facts therefore resolve the same way, and the enrichment rule ("take the more recent commit by timestamp") agrees.

  `last_field_updated: system_kb` is byte-identical on both sides and was left untouched — changing it would be inventing content not present on either side.

## Incoming changes preserved

- `.xgd/tickets/hot/doc-95b1b7f1.md` — **fully preserved.** Verified byte-for-byte: `git diff --no-index` between the resolved worktree file and the incoming blob (`:3:`) returns empty, and the file contains zero conflict markers. The staged diff vs HEAD is `1 insertion(+), 2 deletions(-)` — precisely the `updated_at` bump plus the `system_kb: true` removal, i.e. the incoming commit's change applied in full and nothing else.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code, test, or UAT files were involved in this conflict. This resolution is a real (non-empty) diff vs HEAD, so it is not a redundant-commit case.
