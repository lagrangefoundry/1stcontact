---
uid: report-b3cdad35
id: REPORT-3092
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T21:47:19.201303+00:00'
updated_at: '2026-08-31T21:47:19.201303+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/goal-7ccc9c18.md` — AA (both added), intent/bookkeeping ticket (goal). Rule 2b / 2e "one side is a strict superset — keep the superset". Resolved by `git checkout --theirs` + `git add --sparse`.

Incoming commit: `7a01a4f4304d1a1e1dc00d1132ab0552f9bc4f7b` — "xgd(ticket): update goal goal-7ccc9c18" (free_coded, xgd-working, 2026-08-24).

## Why superset, not timeline

The two sides differ in exactly two places and are otherwise byte-identical (same body prose, same `uid`/`id`/`type`/`title`/`created_by`/`created_at`/`status`/`provenance`):

- `updated_at`: ours `2026-08-06T00:35:34` → incoming `2026-08-24T22:40:43`.
- `fields.children`: ours has 6 entries; incoming has the same 6 in the same order **plus** `goal-f7ce1efe`, `goal-ee20e74e`, `goal-d8df6a0f`.

No fact is asserted differently on the two sides — incoming only appends. So there is no competing-fact case requiring a `working-timeline` lookup (the auto-enrichment's "intent unknown, take the more recent by timestamp" fallback points the same way: incoming is the later commit). Taking incoming loses nothing from HEAD.

## Incoming changes preserved

Verified: staged blob is `3ab328666affe0effa23501571085b9f37950219`, byte-identical to the incoming commit's version of the file. The staged diff vs HEAD is precisely the incoming commit's two changes — the `updated_at` bump and the three appended children. No hunks dropped; the BUG-1301 precedence exception was not invoked.

No code/implementation files were involved in this conflict; no UAT test functions were touched or deleted.

## Staging state

`git status --porcelain` shows no conflict-class lines. The file is staged as `M`. The in-progress cherry-pick (`CHERRY_PICK_HEAD` = `7a01a4f4304d1a1e1dc00d1132ab0552f9bc4f7b`) was left untouched for `cherry_pick_finalize_resolution`.
