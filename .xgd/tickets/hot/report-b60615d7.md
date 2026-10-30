---
uid: report-b60615d7
id: REPORT-5562
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T15:17:08.260364+00:00'
updated_at: '2026-09-29T15:17:08.260364+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/goal-490e0290.md` — class AA (both added), intent/bookkeeping
  ticket (`type: goal`, not a spec ticket). Rule 2b + 2e: bodies are byte-identical
  on both sides; the only differing facts are `status`, `last_field_updated` and
  `updated_at`. Same fact (`status`) changed differently on both sides → genuine
  intent conflict → later-positioned side wins per fact. Incoming (CHERRY_PICK_HEAD
  3b3afeac) carries `updated_at: 2026-09-07T18:33:12Z / status: underway`; HEAD
  carries `updated_at: 2026-08-06T21:22:42Z / status: in_progress`. Incoming is
  later on every differing fact and identical elsewhere, so it is a per-fact
  superset — resolved with `git checkout --theirs`, staged with `git add --sparse`
  (file is outside the sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

- No code/implementation files were in conflict; the single conflicting path is a
  ticket. Incoming's three changed fields (`updated_at`, `last_field_updated: status`,
  `status: underway`) are all present verbatim in the staged result. No HEAD-side
  content was disjoint from incoming (identical frontmatter otherwise, identical
  `fields.children`, identical body), so nothing was discarded.
- No hunks dropped under the BUG-1301 precedence exception.

Staging verified clean: `git status --porcelain` reports `M  .xgd/tickets/hot/goal-490e0290.md`
with no conflict-class entries. CHERRY_PICK_HEAD (3b3afeac) left intact for
resync_cherry_pick_finalize_resolution.
