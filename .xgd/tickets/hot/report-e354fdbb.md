---
uid: report-e354fdbb
id: REPORT-5989
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T21:59:36.322656+00:00'
updated_at: '2026-10-04T21:59:36.322656+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts: request-23fd6e61 @ 95ffc177ff

**Path:** `.xgd/tickets/hot/request-23fd6e61.md` (UU, ticket path)
**Pick:** `95ffc177ff` (2026-08-23 18:15:24 -0700) — "xgd(ticket): update request request-23fd6e61"
**HEAD:** `d5678200bb` · **Apply target:** `397daf02997f5670ac4ce7c26f12ed9050b0f66d`

## Three sides
- Base `8c50ebfb79`: `status: reconciling`, `updated_at` 08-20, `completed_at: null`
- Theirs `3c988c82b1`: `status` → `ready_to_reconcile`, `updated_at` → 08-24T01:15:24
- Ours `2a61089c0d` (== `HEAD:<path>`): `status: free_and_reconciled`, `completed_at`/`updated_at` 08-31T14:22:44, `bundled_in: bundle-b3b7c399`

Both sides changed only frontmatter; the bodies are identical.

## Adjudication
`git diff :2: xgd-working:<path>` is **empty**. Ours is byte-identical to the xgd-working tip
(`b25c481f5a`, 2026-08-31 07:22:44 -0700). The incoming ledger after this pick (`9099dbbd88` 08-23,
then `b25c481f5a` 08-31) carries the ticket forward to exactly ours' state. So theirs'
`ready_to_reconcile` write is an intermediate step that incoming itself superseded. The enrichment's
"more recent timestamp" rule agrees: ours' 08-31 is later than theirs' 08-24.

## Resolution
`git checkout --ours` + `git add --sparse`. The resolution leaves zero net change from HEAD:
`git status --porcelain` is empty and CHERRY_PICK_HEAD is still intact.

## Forecast
Remaining picks on this path: `9099dbbd88` (08-23) should be `--ours`. `b25c481f5a` has the same blob as
ours, so it should auto-merge or resolve to `--ours`. Neither pick is an exception, because ours == the tip.
