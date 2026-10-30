---
uid: report-1741ce82
id: REPORT-6052
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:35:44.086641+00:00'
updated_at: '2026-10-04T22:35:44.086641+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` (REQ-162). Intent/bookkeeping ticket (rule 2e). Resolved `--ours`, zero net change from HEAD.
  - Pick: `6caee0c5d1` (2026-08-31 14:12:57).
  - Blobs: base `e795ee7ef4` (the previous pick's theirs blob) / ours `e909dcbb97` (== HEAD blob, unchanged) / theirs `03909332c4`.
  - Theirs adds a large body revision. All of the following are already in ours: the `0003_ticket_store.sql` / tenants `ALTER` section, the `1stcontact-material` bucket and `wrangler r2 bucket create` note, "Enforcement lives at our wiring layer", the "No HTTP routes" acceptance criterion, "Both open questions are now settled" (the `reference` type and `brief` with `fields.site_slug`), and the implementation notes (`src/generated/ticketing.js`, `d1-site-factory.ts`).
  - The one block ours lacks is theirs' "Prerequisite: the installed component predates REQ-104" section (resync-577be0d7 / `a60537ee3c` / BUG-1303). xgd-working itself replaced that section six minutes later in `1e28c676bf` (14:18:42), whose commit message reads "content edit: correct the prerequisite — REQ-104 is on xgd-working; only the shared artifact store is stale, so bin/install is the whole fix". Ours carries that corrected section ("Prerequisite: refresh the installed component", `fad535e8a4`, `bin/install …`). The dropped text is superseded, not lost.
  - Frontmatter: ours leads (`free_and_reconciled`, `updated_at` 09-02, versus theirs `draft`, 08-31).

## Incoming changes preserved

No code files were involved. Every fact in the incoming change is present in ours, either verbatim or in the later corrected form.

## Forecast

The next pick, `8b6541d4b1`, is expected to resolve `--ours`, and so is `1e28c676bf` (ours already has its corrected prerequisite). Check each later pick with `git diff :2: <pick>:<path>`.
