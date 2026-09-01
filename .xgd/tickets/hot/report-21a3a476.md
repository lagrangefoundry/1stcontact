---
uid: report-21a3a476
id: REPORT-3255
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T23:05:01.041125+00:00'
updated_at: '2026-09-01T23:05:01.041125+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/doc-edba99c9.md` (DOC-35) — class **AA** (both added), doc ticket under
  `.xgd/tickets/hot/`. Rule applied: enrichment rule for unknown-intent AA — take the more
  recent commit by timestamp — reinforced by the reconcile hard rule that the incoming
  `free_coded` side is authoritative.
  - Ours (HEAD): `xgd(ticket): create doc doc-edba99c9` @ 2026-08-20 17:36:50 -0700 (09ddfce955)
  - Theirs (incoming): `xgd(ticket): update doc doc-edba99c9` @ 2026-08-31 12:43:25 -0700 (23ac1e1a5c),
    commit body: _"field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)"_
  - Resolution: `git checkout --theirs`, then `git add --sparse`.

Document bodies on the two sides were byte-identical (all 490 prose lines). The entire
substantive delta was three frontmatter lines plus a trailing-newline difference, so there
was no disjoint content on the HEAD side to compose in — taking the incoming side whole
discards nothing the HEAD side uniquely contributed.

## Incoming changes preserved

All three of the incoming commit's frontmatter changes are present verbatim in the resolved file:

- `fields.system_kb: true` removed — this is the commit's stated intent (retire the `system_kb`
  boolean; doc-set membership now carried by `doc_kind`, per DOC-39 §3.3). `doc_kind: architecture`
  is retained, so membership survives on the new carrier.
- `updated_at` advanced `2026-08-21T00:36:49.913725+00:00` → `2026-08-31T19:43:25.548931+00:00`.
- `last_field_updated` changed `created_at` → `system_kb`.

The only content taken from neither side's intent is the trailing newline: the incoming blob ends
without one ("\ No newline at end of file") and the resolved file matches incoming exactly, as
authored. Cosmetic, and consistent with applying the incoming change unmodified.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. Staged diff vs HEAD is
3 insertions / 4 deletions in the single file. CHERRY_PICK_HEAD left intact for
cherry_pick_finalize_resolution.
