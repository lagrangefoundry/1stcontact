---
uid: report-54ee105c
id: REPORT-4834
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:07:22.144018+00:00'
updated_at: '2026-09-23T18:07:22.144018+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` — **UU**, intent/bookkeeping ticket
  (STEP 2e) with the enrichment's "intent unknown on both sides →
  take the more recent commit by timestamp" rule applied.

  Both sides carry the same generic subject (`xgd(ticket): update bug
  bug-93851fea`), so neither narrates its operation. Falling back to
  timestamp: OURS `updated_at: 2026-09-19T15:15:30Z`, THEIRS
  `updated_at: 2026-09-01T20:46:22Z`. OURS is ~18 days later and is a
  strict superset of THEIRS, so OURS was taken for all three
  conflicted regions.

  Three conflict regions, all resolved to OURS:

  1. **Status block** — kept `updated_at: 2026-09-19`,
     `completed_at: 2026-09-14`, `status: free_and_reconciled`.
     Dropped THEIRS' `updated_at: 2026-09-01`, `completed_at: null`,
     `status: free_coding`.
  2. **`fields:` block** — kept `commits` (working_sha `d019bab7`),
     `version: 0.2.35`, `story_points: 2`,
     `bundled_in: bundle-8e1807f6`. THEIRS has none of these keys.
  3. **Tail line** — kept OURS' `` `text/markdown`. `` with no
     trailing newline; THEIRS differs only by a trailing newline.
     No textual difference.

  Staged with `git add --sparse` (the file is outside the
  sparse-checkout cone on this resync branch, DOC-986 §2/§4.1).

  **Flagged for post-merge review** per the enrichment rule, since
  the winner was chosen on timestamp rather than stated intent.

## Incoming changes preserved

Incoming `dadea5a9b4` is the *original authoring* of this ticket: it
took `bug-93851fea` from `title: Untitled` / `status: draft` /
`(new ticket)` to the full Symptom / Root cause / Fix / Test plan
body with `status: free_coding` and `severity: medium`.

Every substantive incoming change is present verbatim in the resolved
file:

- Full body (Symptom, Root cause, Fix, Test plan sections, lines
  38–119) — byte-identical on both sides. Git surfaced only three
  conflict regions in this file; lines 36–114 were common context,
  which is direct evidence the two bodies agree.
- `title: 'Library: an uploaded .md is stored undescribed because the
  browser sends no content type'` — present.
- `severity: medium` — present.
- `last_field_updated: status` — present.
- Both `tests/test_UAT_FC_BUG-41_markdown_material.test.ts` and
  `tests/test_UAT_FC_BUG-41_markdown_upload.workers.test.ts` remain
  named in the Test plan. No test function was deleted on either
  side; the BUG-1301 precedence exception was not invoked and is not
  needed here.

The only incoming values *not* carried forward are the three
frontmatter fields listed above (`updated_at`, `completed_at`,
`status`). Taking them would have rewound a reconciled, bundled,
shipped ticket from `free_and_reconciled` back to `free_coding` and
discarded its `commits` / `version` / `story_points` / `bundled_in`
fields — state that only exists because the work completed *after*
`dadea5a9b4` was authored. That is a regression, not a preserved
developer change.

Net effect: the staged tree is byte-identical to HEAD for this file,
so this cherry-pick is now an empty commit. `git diff --cached HEAD`
is empty and `git diff --name-only --diff-filter=U` reports nothing.
Per STEP 4 this was left alone — no `--skip`, `--continue`, `--quit`
or `--abort` was run; `CHERRY_PICK_HEAD` is still present at
`dadea5a9b4` for the finalize step, which will detect the clean
staged diff and skip the commit.

The nine untracked `.xgd/tickets/cold/*.md` files predate this
conflict and were left untouched.
