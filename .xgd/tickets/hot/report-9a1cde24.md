---
uid: report-9a1cde24
id: REPORT-3071
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T20:59:05.019125+00:00'
updated_at: '2026-08-31T20:59:05.019125+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — class **AA** (both added), intent/bookkeeping
  ticket (rule **2e**). Resolved by taking the **HEAD (ours)** side in full, then
  `git add --sparse`.

  Sides:
  - **Incoming** (`830f0264ef71b7adf47997c74e7b02a3b2074b49`, 2026-08-23 19:10:41 -0700,
    _"xgd(ticket): create bundle bundle-b3b7c399"_) — a single-file add (2442 lines, no
    code) containing BUNDLE-20 at creation: `status: ready_to_reconcile`,
    `completed_at: null`, `last_field_updated: created_at`, and 24 `commits[]` entries
    each with a `working_sha` and null `reconcile_sha`/`main_sha`.
  - **Ours** (`8e07e6015dead83333d9ae23d1116e97a118a490`, 2026-08-31 07:23:04 -0700,
    _"xgd(ticket): update bundle bundle-b3b7c399"_) — the same ticket after its full
    lifecycle: `status: free_and_reconciled`, `completed_at` set, `result: pass`,
    `merged_at_commit: eef7a8b4…`, the `commits[]` list collapsed to the merged entry
    carrying `main_sha: eef7a8b4…`, plus a 140-entry `orphan_commits` remap table.

  Per-fact judgment (2e), not a whole-file coin flip:
  - **Body prose: byte-identical** on both sides (diff of the two bodies is empty apart
    from ours lacking a trailing newline). Nothing to compose.
  - **`uid`, `id`, `type`, `title`, `created_by`, `created_at`: identical.**
  - **Contested facts** — `updated_at`, `completed_at`, `last_field_updated`, `status`,
    and `commits[]` — are the *same* facts at two lifecycle positions, 8 days apart.
    Timeline rule applies per fact; ours (2026-08-31) is later on every one of them, and
    the relationship is semantically create → update on the same ticket.
  - **Ours-only fields** (`orphan_commits`, `merged_at_commit`, `result: pass`) are the
    recorded outcome of that lifecycle. Keeping the incoming side would have regressed a
    completed, merged bundle back to `ready_to_reconcile`-era state.
  - **Incoming-only key**: `working_sha_history`, present only as `[]` on every incoming
    `commits[]` entry — empty, carries no content, and belongs to entries ours has
    superseded. Nothing lost.

  This also matches the auto-enrichment rule for this file ("take the more recent commit
  by timestamp"). Flagging for post-merge review as that rule directs, though the
  divergence here is fully explained (creation snapshot vs. completed state), not murky.

## Incoming changes preserved

No code/implementation files were in conflict — the incoming commit touches exactly one
file, and it is a bookkeeping ticket.

The incoming commit's intent is *"bundle-b3b7c399 (BUNDLE-20) exists, with this title,
body, and creation metadata."* That intent is **present in HEAD**, not discarded:

- HEAD carries the same `uid: bundle-b3b7c399` / `id: BUNDLE-20` / `title` /
  `created_by` / `created_at: 2026-08-24T02:10:41.035843+00:00`.
- HEAD's body is byte-identical to the incoming body.
- HEAD additionally records the bundle's completion.

This is STEP 4's redundant-commit case (BUG-1109/BUG-1122), distinguished from a discard
by STEP 3's test: the incoming commit's key content is **present in HEAD via a different
route** (the sync that already carried this ticket onto the branch and advanced it),
rather than simply absent. The staged tree therefore nets to no diff vs HEAD
(`git diff --cached --stat` is empty). Per STEP 4, `--skip` was **not** called; the
resolution is staged and finalize will detect the empty staged diff.

The incoming side's 24 `commits[].working_sha` values do not appear verbatim in HEAD, and
are not in HEAD's `orphan_commits` old_sha column either. That is expected and not a
discard: those SHAs are BUNDLE-20's *pending* xgd-working commits as of bundle creation.
The reconcile that completed BUNDLE-20 replaced that pending list with the merged result
(`main_sha`/`merged_at_commit: eef7a8b4…`). Re-introducing them would assert stale
pending work on a bundle already merged to main.

No UAT test functions were involved. No BUG-1301 precedence exception was invoked.

## Verification

- `git status --porcelain` — no `UU`/`AA`/`DU`/`UD`/`AU`/`UA` lines remain.
- `git diff --name-only --diff-filter=U` — empty.
- `git rev-parse --verify CHERRY_PICK_HEAD` — `830f0264ef71b7adf47997c74e7b02a3b2074b49`,
  cherry-pick sequencer state left intact for `cherry_pick_finalize_resolution`.
