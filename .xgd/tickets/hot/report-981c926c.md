---
uid: report-981c926c
id: REPORT-6015
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:13:49.005516+00:00'
updated_at: '2026-10-04T22:13:49.005516+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — intent/bookkeeping ticket (§2e), UU. Pick `163924e9fd` (2026-08-25 16:27:28 -0700).
  Blobs: base 593d49b2f5 (= previous pick 93b031a37e's theirs) / ours 385c6b124d (== HEAD, unchanged) / theirs 5db68a017b.
  Theirs rewrites the body (hard-wrapped, real markdown table; `last_field_updated: body`, `updated_at` 08-25).
  Ours carries the same body content in a later, unwrapped form plus later frontmatter (`status: bundled`,
  `updated_at` 08-31, commits/version/story_points/bundled_in).
  Decisive check: incoming's OWN tip (`xgd-working`, `ad0224db44`, 2026-08-31) has a body byte-identical to ours
  (only diff is ours' trailing newline); its frontmatter differs only in `updated_at`/`completed_at`/
  `status: free_and_reconciled`, which belong to later picks. So xgd-working itself superseded this pick's body form.
  → `git checkout --ours` + `git add --sparse`. Zero net change from HEAD.

## Incoming changes preserved

No code files. This pick's body text is superseded by incoming's own later revision, which equals ours;
no incoming content is lost. `git status --porcelain` empty, CHERRY_PICK_HEAD intact.
Forecast: remaining picks on this ticket should resolve the same way until the xgd-working tip, whose
`completed_at`/`status: free_and_reconciled`/`updated_at` (08-31 23:59) are genuinely later than ours and should win.
