---
uid: report-b1ea741d
id: REPORT-4545
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T20:44:56.075826+00:00'
updated_at: '2026-09-20T20:44:56.075826+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — **UU**, intent/bookkeeping ticket
  (STEP 2e). Incoming `e74606d80dba6cfadcf7a0d7277e55846162edae`
  ("xgd(ticket): update bug bug-db356ff8", 2026-08-23 18:50:12 -0700,
  no free-text commit body) vs HEAD-side state (2026-08-31). The path is
  outside the sparse-checkout cone (DOC-986 §2/§4.1) — the conflict
  existed only in the index — so it was resolved via
  `git checkout --ours` followed by `git add --sparse`.

  The incoming commit touches the frontmatter only; the document body is
  untouched on both sides. Resolved per fact:

  - **`fields.commits`** (one entry:
    `working_sha: ea48502d0d90bb607ac528e34099e71eaab6df40`,
    `reconcile_sha: null`, `main_sha: null`) — an incoming addition, and
    **already present byte-identically on the HEAD side**, carried in by
    an earlier cherry-pick in this queue. **Preserved.**
  - **`fields.version: 0.2.10`** — the incoming commit's other addition,
    likewise **already present identically on HEAD**. **Preserved.**
  - **`status` / `updated_at` / `completed_at`** — genuine same-field
    conflict. Incoming: `free_coded`, `updated_at 2026-08-24T01:50:12`,
    `completed_at: null`. HEAD: `free_and_reconciled`, with `updated_at`
    and `completed_at` both `2026-08-31T19:19:38`. Later-positioned
    intent wins per fact → **HEAD**. Incoming's `free_coded` is an
    earlier point on the same lifecycle path that the 2026-08-31
    reconciliation already advanced past; adopting it would roll the
    ticket back out of its terminal state.
  - **`last_field_updated: status`** — identical on both sides. No
    conflict.
  - **HEAD-only `fields.bundled_in: bundle-78f4e2fe`** —
    non-overlapping, absent from the incoming side entirely. **Kept.**
  - **Trailing newline** — the incoming blob strips it (git reports "No
    newline at end of file"); HEAD has it. Kept HEAD's newline: a
    formatting artifact, not an intent change.

  Net: HEAD is a strict superset of every fact the incoming commit
  asserts, so the resolution is HEAD's blob unchanged. A full diff of
  index stage 2 against stage 3 confirms the ONLY differences are the
  four frontmatter lines and the trailing newline enumerated above —
  the 372-line document body is byte-identical on both sides, and the
  `commits` / `version` additions do not appear in that diff precisely
  because they already match.

## Incoming changes preserved

No code files are involved in this conflict. For the one ticket file,
both of the incoming commit's substantive additions are present in the
staged blob, verified by reading
`git show :.xgd/tickets/hot/bug-db356ff8.md`:

- `fields.commits` with `working_sha: ea48502d0d90bb607ac528e34099e71eaab6df40` — present.
- `fields.version: 0.2.10` — present.
- `last_field_updated: status` — present, identical to the incoming side.
- The document body is byte-identical to the incoming side.

Nothing from the incoming commit was discarded except the stale
lifecycle triplet (`status: free_coded`, `updated_at 2026-08-24`,
`completed_at: null`), which is metadata governed by the per-fact
timeline rule in STEP 2e, not developer content. The BUG-1301
precedence exception was not invoked; no hunk was dropped on refactor
grounds.

## Staging state

`git status --porcelain` is empty. No UU/AA/DU/UD lines remain. The
staged tree is identical to HEAD, because the resolution IS HEAD's
blob — so the finalize step will legitimately detect a clean staged
diff and skip the commit. Per instruction, `--skip` was NOT called
here.

`CHERRY_PICK_HEAD` (`e74606d80dba6cfadcf7a0d7277e55846162edae`) is
intact — no `--continue`, `--skip`, `--quit`, or `--abort` was run.
