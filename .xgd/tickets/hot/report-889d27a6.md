---
uid: report-889d27a6
id: REPORT-4121
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T20:01:24.356685+00:00'
updated_at: '2026-09-12T20:01:24.356685+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — UU, intent/bookkeeping ticket (rule 2e).
  Incoming commit 93b031a37e is a pure status advance:
  `status: draft -> free_coding`, `last_field_updated: created_at -> status`,
  `updated_at -> 2026-08-25T23:21:06`. HEAD carries a LATER transition of the
  SAME facts: `status: bundled`, `updated_at: 2026-08-31T05:05:09`.

  One conflict region, and it is a genuine same-field conflict (not disjoint
  edits), so 2e's per-fact timeline rule applies. HEAD is later on every
  available measure:
  - HEAD-side commit touching this file: 6e8b3d5666, 2026-08-26 16:21:08 -0700,
    vs incoming's 2026-08-25 16:21:06 -0700.
  - In-file `updated_at`: 2026-08-31 (HEAD) vs 2026-08-25 (incoming).
  - Lifecycle order: `bundled` is downstream of `free_coding`
    (draft -> free_coding -> ... -> bundled).

  Kept HEAD's four lines. Taking incoming here would have rewound the ticket
  to an earlier lifecycle state while the same frontmatter still carries the
  bundling bookkeeping HEAD added afterwards (`bundled_in: bundle-8eef3846`,
  `commits`, `version: 0.2.15`, `story_points: 3`), leaving the ticket
  internally inconsistent.

  Resolved by hand-editing the markers out (not `git checkout --ours`);
  staged with `git add --sparse` — `.xgd/tickets/**` is outside the
  sparse-checkout cone on reconcile branches (DOC-986 §2/§4.1). Nothing
  outside the conflict region was touched; no field was invented.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole file is a
bookkeeping ticket, so STEP 3's code-discard guard does not apply.

The incoming commit's only change is the status transition above, and its
intent — advance this ticket past `draft` — is present in HEAD via a later
transition on the same field, not absent. This is supersession under 2e's
timeline rule, not a discard: `bundled` already implies `free_coding`
happened. No hunk was dropped under the BUG-1301 precedence exception.

Net result: the staged tree is byte-identical to HEAD
(`git status --porcelain` empty, `git diff --cached` empty) — the
redundant/superseded-commit case of STEP 4 (BUG-1109/BUG-1122). `--skip` was
NOT called; CHERRY_PICK_HEAD is still present (93b031a37e) for
cherry_pick_finalize_resolution.
