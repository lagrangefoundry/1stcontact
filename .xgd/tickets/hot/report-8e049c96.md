---
uid: report-8e049c96
id: REPORT-3237
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T22:27:08.929807+00:00'
updated_at: '2026-09-01T22:27:08.929807+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/doc-721a48c9.md` (DOC-17, "Design Lessons Log") — class **AA** (both added), sparse-excluded path so resolved via index stages. Rule applied: 2b/2e — incoming (`free_coded`, 5df65958) is the more recent side (updated_at 2026-08-31T19:43:00Z vs ours 2026-08-16T01:19:45Z) and is authoritative. Took theirs in full.

  The two sides differ in exactly three lines, all in the YAML frontmatter; the ~9KB markdown body is byte-identical on both sides. Delta:
  - `updated_at`: ours `2026-08-16T01:19:45.717597+00:00` → theirs `2026-08-31T19:43:00.505870+00:00`
  - `fields.system_kb: true` present on ours, removed on theirs

  This delta *is* the incoming commit's stated intent ("field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)"). Ours holds no field, section, or body content that theirs lacks, so taking theirs discards nothing — the only ours-side line dropped is the `system_kb` boolean the incoming commit deliberately retires. `fields.doc_kind: architecture` is present on both sides and is preserved, which is where DOC-39 §3.3 moves the membership signal.

  Resolved with `git checkout --theirs`, staged with `git add --sparse` (plain `git add` rejected the path as outside the sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

Verified: the staged blob is **byte-identical** to `5df65958:.xgd/tickets/hot/doc-721a48c9.md` (`git diff --no-index` between the staged content and the incoming commit's version returns empty). Every hunk of the incoming diff is present in the resolution. No hunks dropped; the BUG-1301 precedence exception was not invoked and no code or test files were involved in this conflict.

Staged diff vs HEAD is non-empty (1 insertion, 2 deletions), so this is a real commit, not a redundant one.
