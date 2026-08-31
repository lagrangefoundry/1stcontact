---
uid: report-7f2da244
id: REPORT-3103
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T22:14:30.375299+00:00'
updated_at: '2026-08-31T22:14:30.375299+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, class 2e (intent/bookkeeping
  ticket). Index-only conflict: the path is outside the sparse-checkout cone
  (DOC-986 §2/§4.1), so there were no working-tree markers. Resolved with
  `git checkout --ours` + `git add --sparse`.

  **Rule applied — 2e "one side is a strict superset", with the per-fact
  timeline rule for the single genuinely-conflicting fact:**

  Per-fact comparison of ours (HEAD) vs theirs (incoming `0941885b`):

  | fact | ours (HEAD) | theirs (incoming) | resolution |
  |---|---|---|---|
  | `fields.commits[].working_sha` | `759cd874…` | `759cd874…` | identical — incoming's contribution already present |
  | `fields.version` | `0.2.15` | `0.2.15` | identical — incoming's contribution already present |
  | `last_field_updated` | `status` | `status` | identical |
  | `status` | `bundled` | `free_coded` | **ours** — later timeline position |
  | `updated_at` | `2026-08-31T05:05:09` | `2026-08-25T23:28:09` | **ours** — later |
  | `fields.story_points` | `3` | *(absent)* | **ours** — fact only on our side |
  | `fields.bundled_in` | `bundle-8eef3846` | *(absent)* | **ours** — fact only on our side |
  | trailing newline | present | absent | **ours** — normalized form |

  `status` is the only fact both sides set differently. HEAD wins it on the
  timeline rule: HEAD's value is `bundled` with `bundled_in: bundle-8eef3846`
  — i.e. HEAD's edit *is* this reconcile bundle's own bundling operation, which
  by construction postdates the `free_coded` commit being cherry-picked. The
  `updated_at` stamps agree (08-31 vs 08-25). Taking theirs would regress the
  ticket from `bundled` back to `free_coded` and drop `story_points` /
  `bundled_in`.

  No fields.intent_uid / story_uid / capability_uid were touched. No content was
  invented that is not on one of the two sides.

## Incoming changes preserved

Verified against `git show 0941885b7b737d3fb116a27589ab86cd535d2dd3 --
.xgd/tickets/hot/bug-23d1ec27.md`. The incoming commit's substantive additions
are the `fields.commits` block and `fields.version`. Both are present verbatim
in the resolved file (`git show HEAD:.xgd/tickets/hot/bug-23d1ec27.md`):

```
20:  - working_sha: 759cd87405a4b50f81995b2c9b510bf23be54fbd
23:  version: 0.2.15
```

with `reconcile_sha: null` / `main_sha: null` unchanged. The incoming
`status: free_coded` transition is also preserved, superseded forward by the
later `bundled` transition on the same lifecycle — not discarded.

Nothing was dropped under the BUG-1301 precedence exception; no hunk needed it.

## Note for the finalize step

The staged diff nets to **no change vs HEAD** (`git diff --cached --stat HEAD`
is empty). This is the redundant-commit case (BUG-1109/BUG-1122): a
post-watermark sync already landed this commit's effect through a different
route, and HEAD then advanced the ticket further. This is *not* a STEP 3
discard — STEP 3's check passes, because the incoming commit's key changes are
demonstrably **present** in HEAD (quoted above), not absent.

Per STEP 4, `--skip` was NOT called and the cherry-pick sequencer state is
untouched: `CHERRY_PICK_HEAD` is still present at
`0941885b7b737d3fb116a27589ab86cd535d2dd3`. `cherry_pick_finalize_resolution`
should detect the clean staged diff and skip the commit itself.

`git status --porcelain` shows no conflict-class (UU/AA/DU/UD) lines remaining.
