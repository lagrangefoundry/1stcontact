---
uid: report-0b08a409
id: REPORT-4437
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T13:04:05.758212+00:00'
updated_at: '2026-09-19T13:04:05.758212+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` — **UU**, index-only (path is outside the
  sparse-checkout cone, so no working-tree markers existed). Rule **2e**
  (intent/bookkeeping ticket), "one side is a strict superset" branch →
  resolved with **ours** via `git checkout --ours` + `git add --sparse`.

  Enrichment named the sides as `seed_local_overlay` (ours) vs
  `update request` (incoming, 02673c14). The rule text offered the
  timeline fallback only for facts that genuinely differ; none do here.

## Incoming changes preserved

Verified by extracting both index stages and diffing their post-frontmatter
bodies (base 6cdf2fb0, ours efd42480, theirs 57c47475):

- **Body — fully present.** All 69 lines the incoming commit appended
  ("What the codec must do, precisely", "Sequencing, revisited: AC5 is not
  deliverable yet", "A finding AC4 turned up") are in ours verbatim; the
  body diff between the two sides has zero deletions. Ours additionally
  carries a section incoming never had ("One honest caveat about 'the last
  native dependency'"), which is why ours is the superset.

- **Frontmatter — ours strictly ahead.** Incoming's only frontmatter change
  is `updated_at: 2026-09-01T21:38:14 → 2026-09-01T21:53:59`. Ours carries
  `updated_at: 2026-09-16T01:48:38` (later), plus `status: draft → bundled`,
  `completed_at`, `last_field_updated: status`, `fields.version: 0.2.39`,
  `fields.bundled_in: bundle-8e1807f6`, and a three-entry `fields.commits`
  list. Taking incoming here would have regressed the ticket's status and
  dropped `bundled_in` — a bookkeeping regression, not a preserved intent.

No BUG-1301 precedence exception was invoked; no hunk was dropped.

## Net effect

The resolution equals HEAD, so the staged tree shows no diff vs HEAD
(`git status --porcelain` is empty, `git ls-files -u` is empty). Per STEP 4
this is the redundant-commit case, not the discarded case: STEP 3's check
passes because the incoming commit's key content is present in HEAD via the
overlay commit that already carried it forward. CHERRY_PICK_HEAD is left
intact for `cherry_pick_finalize_resolution`; no `--continue`/`--skip` was
issued.
