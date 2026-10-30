---
uid: report-de26f382
id: REPORT-4544
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T20:43:53.242481+00:00'
updated_at: '2026-09-20T20:43:53.242481+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — **UU**, intent/bookkeeping ticket
  (STEP 2e). Incoming `c1d2a2ff872a6fcda07f1f2e7c8d1ec51fa87f1b`
  ("xgd(ticket): update bug bug-db356ff8", 2026-08-23 18:48:30 -0700)
  vs HEAD-side state (2026-08-31). The path is outside the
  sparse-checkout cone (DOC-986 §2/§4.1) — the conflict existed only in
  the index with no working-tree file — so it was resolved via
  `git checkout --ours` followed by `git add --sparse`.

  The incoming commit changes exactly three things. Resolved per fact:

  - **`fields.story_points: 3`** (the incoming commit's only substantive
    addition) — already present on the HEAD side, carried in by the
    preceding cherry-pick in this queue. **Preserved.**
  - **`last_field_updated: status`** — identical on both sides. No
    conflict.
  - **`status` / `updated_at` / `completed_at`** — genuine same-field
    conflict. Incoming: `free_coding`, `updated_at 2026-08-24T01:48:29`,
    `completed_at: null`. HEAD: `free_and_reconciled`, with
    `updated_at` and `completed_at` both `2026-08-31T19:19:38`.
    Later-positioned intent wins per fact → **HEAD**. Incoming's
    `free_coding` is an earlier lifecycle state that the 2026-08-31
    reconciliation already superseded; taking it would roll the ticket
    back out of its terminal state.
  - **HEAD-only `fields.commits`, `version: 0.2.10`,
    `bundled_in: bundle-78f4e2fe`** — non-overlapping, absent from the
    incoming side entirely. **Kept.**
  - **Trailing newline** — the incoming blob strips it (git reports "No
    newline at end of file"); HEAD has it. Kept HEAD's newline: a
    formatting artifact rather than an intent change, and the exact
    reverse of what the immediately preceding cherry-pick in this queue
    established.

  Net: the HEAD side is a strict superset of every fact the incoming
  commit asserts, so the resolution is HEAD's blob unchanged. A full
  diff of index stage 2 against stage 3 confirms the ONLY differences
  are the six frontmatter lines and the trailing newline enumerated
  above — the 367-line document body is byte-identical on both sides.

## Incoming changes preserved

No code files are involved in this conflict. For the one ticket file:

- `fields.story_points: 3` — the incoming commit's sole substantive
  content addition — is present in the staged blob (verified by reading
  `git show :.xgd/tickets/hot/bug-db356ff8.md`).
- `last_field_updated: status` — present, identical to the incoming side.
- The document body is byte-identical to the incoming side.

Nothing from the incoming commit was discarded except the stale
lifecycle triplet (`status: free_coding`, `updated_at 2026-08-24`,
`completed_at: null`), which is metadata governed by the per-fact
timeline rule in STEP 2e, not developer content. The BUG-1301
precedence exception was not invoked; no hunk was dropped on
refactor grounds.

## Staging state

`git status --porcelain` is empty. No UU/AA/DU/UD lines remain. The
staged tree is identical to HEAD, because the resolution IS HEAD's
blob — so the finalize step will legitimately detect a clean staged
diff and skip the commit. Per instruction, `--skip` was NOT called
here.

`CHERRY_PICK_HEAD` (`c1d2a2ff872a6fcda07f1f2e7c8d1ec51fa87f1b`) is
intact — no `--continue`, `--skip`, `--quit`, or `--abort` was run.
