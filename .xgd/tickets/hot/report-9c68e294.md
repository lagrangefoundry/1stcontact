---
uid: report-9c68e294
id: REPORT-2976
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:44:55.859361+00:00'
updated_at: '2026-08-31T15:44:55.859361+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-18a48d63.md` — **UU**, intent/bookkeeping ticket (rule **2e**),
  out of the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict existed only in the index
  with no working-tree markers. Resolved per-fact; staged with `git add --sparse`.

  Per-fact analysis (base = `:1`, ours = `:2`, incoming = `:3`):

  | Fact | Base | Ours (HEAD) | Incoming (`6788b084`) | Resolution |
  |---|---|---|---|---|
  | `fields.commits` | two entries: `96118c32` + orphaned `7ebc721b` | merged: `7ebc721b` folded into `96118c32`'s `working_sha_history` | **identical to ours** | no conflict — both sides agree byte-for-byte |
  | `status` | `ready_to_reconcile` | `bundled` | unchanged from base | ours (only side that changed it) |
  | `fields.bundled_in` | absent | `bundle-b3b7c399` | absent | ours (non-overlapping addition) |
  | `updated_at` / `last_field_updated` | `2026-08-17T20:06:08` / `status` | `2026-08-24T02:10:41` / `status` | `2026-08-24T01:14:03` / `commits` | ours — derived metadata of the retained later write |

  No field was changed differently on the two sides, so the timeline rule (2e's genuine-conflict
  branch) never engaged. Ours is a strict superset of incoming: it carries incoming's entire
  payload plus the bundling advance. Body text below the frontmatter is identical on both sides.
  Nothing was invented that was not on one side.

## Incoming changes preserved

Incoming commit `6788b08404d93eafcf2e329be79f1152162cd779` ("xgd(ticket): update request
request-18a48d63") is a BUG-1265 data fix with **no code change**: it merges the orphaned
`working_sha 7ebc721b83ab6202fdec600cd0493b69964bac39` (version-bump-only chore, dropped as
empty by a later resync rebase) into the surviving entry's `working_sha_history`, removing the
standalone orphan entry.

That change **is present in the resolved file**, verified against `git show $CPHEAD -- <file>`:
`working_sha_history` reads `b71a8641…`, `7ebc721b…`, `761b7fbd…` in that order, and the
standalone `working_sha: 7ebc721b…` entry is gone. It arrived via HEAD rather than via this
cherry-pick — HEAD had already landed the identical fix before additionally setting
`status: bundled`.

This is therefore the **redundant** case, not the discarded case (STEP 3's distinction, and the
BUG-1109/BUG-1122 note in STEP 4): the incoming commit's key change is present in HEAD, not
merely absent. Consequently the staged tree nets to no diff vs HEAD (`git ls-files -u` → 0,
`git status --porcelain` shows no tracked changes). Per STEP 4 no `--skip` was issued; the
cherry-pick sequencer state (`CHERRY_PICK_HEAD`) is intact for
`cherry_pick_finalize_resolution` to detect the empty staged diff and skip the commit.

No code/implementation files were involved, so no BUG-1301 precedence exception was invoked and
no test function was touched.
