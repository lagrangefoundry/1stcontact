---
uid: report-0c9be726
id: REPORT-4614
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T04:08:38.340000+00:00'
updated_at: '2026-09-21T04:08:38.340000+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/doc-721a48c9.md` (DOC-17, *Design Lessons Log*) — class **AA** (both added; index-only, outside the sparse-checkout cone per DOC-986 §2/§4.1, so no working-tree markers). Resolved by **keeping OURS** via `git checkout --ours --` + `git add --sparse --`.
  - Rule applied: §2b (AA) combined with the enrichment directive for this file ("intent unknown on one or both sides — take the more recent commit by timestamp"). Ours is the more recent state (`updated_at: 2026-09-11T09:33:38`) vs theirs (`2026-08-31T19:43:00`).
  - Bodies were **byte-identical**; the only divergence was three frontmatter facts:
    | field | ours (kept) | theirs |
    |---|---|---|
    | `updated_at` | `2026-09-11T09:33:38.989973+00:00` | `2026-08-31T19:43:00.505870+00:00` |
    | `last_field_updated` | `doc_kind` | `system_kb` |
    | `fields.doc_kind` | `system_kb` | `architecture` |
  - Ours also carries the semantically correct `last_field_updated` (a field *name*, `doc_kind`, rather than the value `system_kb`).

## Incoming changes preserved

Not a code/implementation file, and no incoming content was discarded — the incoming commit's effect is **already integrated into HEAD and then superseded there**:

- Incoming `CHERRY_PICK_HEAD` = `5df65958148b361559c04a5ac078730227d3e583`, *"xgd(ticket): update doc doc-721a48c9 — field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)"*.
- `d3dac85a0360844a4c56e9138eeab2c86ebdc939` is already in HEAD's ancestry (`git merge-base --is-ancestor` → true) with the **same subject, same commit body, same author and same author timestamp** (2026-08-31 12:43:00 -0700). That is the same logical intent ledger entry, already landed on this main-rooted line via reconciliation.
- `e553346f62` (also in HEAD, 2026-09-11) then moved the same facts forward: `doc_kind: architecture` → `system_kb`, `last_field_updated` → `doc_kind`, `updated_at` → 2026-09-11.

Taking theirs would have rolled `doc_kind` back to `architecture` and rewound `updated_at` by 11 days — i.e. reverting a later, already-reconciled ledger entry. `5df6595814` itself is **not** in HEAD (`git merge-base --is-ancestor` → false), which is why it was queued for replay; its content contribution is nonetheless fully represented.

Resulting staged tree for this path equals HEAD, so the replayed commit is empty. Per STEP 4 this was left for the finalize step: no `--continue`/`--skip`/`--quit`/`--abort` and no `git commit` was issued, and `CHERRY_PICK_HEAD` is still present.

## Flagged for post-merge review

Per the enrichment directive (intent unknown on one or both sides), `.xgd/tickets/hot/doc-721a48c9.md` is flagged — though the ancestry evidence above makes the duplicate-and-superseded reading concrete rather than speculative.
