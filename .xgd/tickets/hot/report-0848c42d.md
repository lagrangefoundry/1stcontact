---
uid: report-0848c42d
id: REPORT-2730
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:01:55.069218+00:00'
updated_at: '2026-08-31T06:01:55.069218+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-b18d2056.md` — **AA** (both added, no merge base; sparse-excluded path, index-only conflict with no working-tree markers). Intent/bookkeeping ticket (`request-*`), so **rule 2e** applies. Both sides' commits carry the same subject (`xgd(ticket): update request request-b18d2056`) and the enrichment flagged intent as unknown, but the timeline rule was not needed: the two sides are not in conflict on any fact.

  Diffing the two index blobs (`4e10775` ours vs `6c2c6aa` theirs) shows a **single-line delta** — incoming adds `fields.chat_comment: comment-10763fb1` at line 35. Every other byte of the 200-line ticket is identical on both sides: same frontmatter (status `free_and_reconciled`, version `0.1.49`, `bundled_in: bundle-77b28def`, identical `commits`/`working_sha_history`), same body through the "What landed" section, the pool-pin correction, and the test plan.

  Incoming is therefore a **strict superset** — it adds one field the ours side never touched — so 2e's superset clause governs: keep the superset. Resolved with `git checkout --theirs`, staged with `git add --sparse`. No content was invented and no field was modified beyond what the incoming side itself declares.

## Incoming changes preserved

Confirmed, and stronger than the usual "key changes present" check: `git diff --cached 4f30479 -- <path>` is **empty**, i.e. the staged resolution is byte-identical to the incoming commit's version of the file. Nothing from the incoming side was dropped.

The incoming commit (`4f30479`, 2026-08-23) records the file as a 200-line add on its side; HEAD already carried 199 of those lines from its own add, so the net staged diff vs HEAD is `1 file changed, 1 insertion(+)` — the `chat_comment` field. That small net diff reflects a near-duplicate add/add, not a discard.

No BUG-1301 precedence exception was invoked. No code files, no UAT test files, and no spec tickets (2d) were involved in this conflict — the sole conflicted path is a bookkeeping request ticket. No test functions were deleted or affected.

Cherry-pick sequencer state (`CHERRY_PICK_HEAD` = `4f304793d34e29f2018a5ffb71d14ea87402441e`) left intact for `cherry_pick_finalize_resolution`; no `--continue`/`--skip`/`--abort`/`reset` was issued. `git status --porcelain` reports no remaining conflict-class entries.
