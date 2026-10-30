---
uid: report-3e89ba30
id: REPORT-5317
type: report
title: 'Resync resolve conflicts: 5504e14f00'
created_by: xgd
created_at: '2026-09-28T07:25:34.943727+00:00'
updated_at: '2026-09-28T07:25:34.943727+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/doc-58cf04a4.md` (DOC-33, `type: doc`) — **AA (both added)**, outside the
  sparse cone, resolved with `git checkout --ours` + `git add --sparse`. Rule applied: **2b/2e**
  (intent/bookkeeping ticket, same fact changed on both sides → later-positioned intent wins).

  The two sides differ **only** in four frontmatter lines; the 744-line body is byte-identical
  (verified by diffing blob `27dcb8dc` (ours) against `ec08968f` (incoming) — the whole diff is
  that one hunk):

  | field | ours (HEAD) | incoming (f86a1ee873) |
  |---|---|---|
  | `updated_at` | `2026-09-11T09:33:30` | `2026-08-31T19:43:22` |
  | `last_field_updated` | `doc_kind` | `system_kb` |
  | `fields.doc_kind` | `system_kb` | `architecture` |

## Incoming changes preserved

No incoming content was discarded — the incoming commit is **already integrated into HEAD**.

- `f86a1ee873` ("field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)",
  author date `Mon Aug 31 12:43:22 2026 -0700`) is present in HEAD's ancestry as
  **`840d98c4a2`** — identical subject, identical author date, and the frontmatter it writes
  (`updated_at: 2026-08-31T19:43:22`, `last_field_updated: system_kb`,
  `fields.doc_kind: architecture`) is byte-identical to the incoming side. Same logical commit
  under a different sha, i.e. remapped history.
- HEAD then carries **`61eb2db4c4`** (`Fri Sep 11 02:33:30 2026`), a later refinement that
  advances `fields.doc_kind` from `architecture` to `system_kb` — a value only expressible
  *because* the incoming migration already landed. Ours is a descendant of the incoming change,
  not a competitor to it.
- On the incoming side the file appears as a whole-file **add** against `f86a1ee873^` (the
  ticket's earlier history was stripped on that branch), which is why git saw AA rather than UU
  and had no merge base to work from.
- Taking incoming would have regressed `fields.doc_kind` `system_kb` → `architecture` (dropping
  DOC-33 out of the system knowledge base) and rolled `updated_at` back ten days, while adding
  nothing: every line unique to incoming is already on HEAD.

## Staging state

`git ls-files -u` is empty; `git status --porcelain` is clean. Because the resolution is ours and
ours *is* HEAD for an AA, the staged diff against HEAD is empty — expected, since `840d98c4a2`
already landed this commit's effect. Per STEP 4 this session did **not** call `--skip`;
`resync_cherry_pick_finalize_resolution` will detect the clean staged diff and skip the commit.
`CHERRY_PICK_HEAD` (`f86a1ee87392af952f4aa5b6488b1670ca0449da`) is intact.
