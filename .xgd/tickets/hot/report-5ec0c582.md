---
uid: report-5ec0c582
id: REPORT-5980
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T21:54:40.100623+00:00'
updated_at: '2026-10-04T21:54:40.100623+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync conflict resolution — request-51514090 / a342dac6d0

**Pick:** `a342dac6d0` (2026-08-23 16:40:38 -0700, `xgd(ticket): update request request-51514090`)
**Conflict:** `AA` on `.xgd/tickets/hot/request-51514090.md` (artifact of the BUG-904 ticket-tree strip; no base).
**Resolution:** `--ours` — zero net change from HEAD `d5678200bb`.

## Evidence

- `:3:` (theirs) blob `892df63295` is byte-identical to `e704298e92:<path>` — HEAD's own
  replay of this pick (same subject, same author date 08-23 16:40:38), an ancestor of HEAD.
  The pick is already in HEAD's lineage.
- `:2:` (ours) blob `efd42480e9` == `HEAD:<path>`, the later state reached via HEAD's
  `55ee705229` (09-13 update) and the `369fc254e8` / `771b085711` seed_local_overlay commits:
  `bundled`, `completed_at` 09-14, `commits` (3 working_shas), `version 0.2.39`,
  `bundled_in: bundle-8e1807f6`, and the revised body (codec decision, formats, AC
  refinements, "What the codec must do", sequencing/caveat sections).
- `git diff :3: :2:` removes only the draft lifecycle lines, two draft paragraphs that ours
  rewrote ("Candidates to weigh…", "Pin it with a fixture corpus…"), and the EOF newline —
  ours is the later revision of the same text, nothing of theirs is lost.
- `git diff :2: xgd-working:<path>` (tip blob `5593b133d4`) is two lines: `updated_at`
  09-16 → 09-19T15:15:39 and `status` `bundled` → `free_and_reconciled`. Body identical.

## Forecast

Remaining picks on this path should resolve `--ours`, except the xgd-working tip pick
(09-19, `updated_at` + `status: free_and_reconciled`), which is the exception — incoming wins
those two facts.
