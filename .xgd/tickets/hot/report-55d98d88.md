---
uid: report-55d98d88
id: REPORT-6081
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:51:29.982558+00:00'
updated_at: '2026-10-04T22:51:29.982558+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync conflict resolution — doc-721a48c9 / 23099c4b29

- Branch: resync-10bbd54c, HEAD d5678200bb (unmoved)
- Picked: 23099c4b29 (2026-08-31 14:59:36 -0700, "xgd(ticket): update doc doc-721a48c9")
- Apply target: 397daf02997f5670ac4ce7c26f12ed9050b0f66d
- Path: .xgd/tickets/hot/doc-721a48c9.md (UU, frontmatter only)
- prior_stage_failure: empty

## Three sides
- base `:1:` 078aeed6ab
- ours `:2:` 99ecfc4fe8 (== HEAD blob)
- theirs `:3:` f09448e627

Theirs changes base by `doc_kind` architecture→system_kb, `last_field_updated`→doc_kind, and `updated_at` 08-31T21:59:36.
Ours vs theirs differs on ONE line: `updated_at` (ours 09-11T09:33:38). `doc_kind: system_kb` and
`last_field_updated: doc_kind` are byte-identical on both sides.

## Decision: `--ours`, zero net change
Main's `e553346f62` (09-11) shows `index 078aeed6ab..99ecfc4fe8`. It rewrote the SAME parent blob
as this pick into ours' exact blob, so main's commit replays this xgd-working decision. It is not a
newer decision. No facts are lost: ours already carries the pick's output. The enrichment's
"more recent timestamp" rule agrees, but only by coincidence.

Resolution: `git checkout --ours` + `git add --sparse`. `git status --porcelain` is empty and
CHERRY_PICK_HEAD is intact.

## Forecast for the next pick on this path
`94e32fbab1` (2026-09-08 14:53:53 -0700) flips `doc_kind` back to `architecture` and appends the
"Session lessons — 2026-09-02" body section (D–G). Main never received it. **Incoming wins that pick**:
take `doc_kind: architecture`, its `updated_at`, and the appended body. Do NOT resolve it `--ours`.
