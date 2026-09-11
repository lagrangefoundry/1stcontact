---
uid: report-2e47c956
id: REPORT-4045
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T21:44:18.886610+00:00'
updated_at: '2026-09-11T21:44:18.886610+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` (REQ-149) — class **UU**, rule **2e**
  (intent/bookkeeping ticket: `request-*`). Both sides carry the same subject
  (`xgd(ticket): update request request-554ac441`), so the enrichment block's
  "intent unknown on one or both sides — take the more recent commit by
  timestamp" applies. Two hunks, both in the YAML frontmatter; both resolved to
  **HEAD**, which is the later side and a strict superset per 2e.

  - *Status hunk* — HEAD: `status: free_and_reconciled`, `completed_at` set,
    `updated_at: 2026-08-31T14:22:34`. Incoming (`7782255e4e`, authored
    `2026-08-23T03:22:54`): `status: free_coded`, `completed_at: null`. HEAD is
    ~8 days later on the same field; taking incoming would demote an
    operator-owned status backwards.
  - *`commits` / `version` hunk* — HEAD already contains both commit entries the
    incoming side adds (`932f362e`, `92fc26e7`), plus two the incoming side does
    not have (`ec144c85`, `02bd4437`), and carries `version: 0.2.9`,
    `bundled_in: bundle-b3b7c399`, `chat_comment: comment-98e86f10`. The
    incoming side is a strict subset at `version: 0.2.7`.

  No content was invented; no field outside the two conflict hunks was touched.

## Incoming changes preserved

Not a code file, but STEP 3's redundant-vs-discarded check was run explicitly
against `git show 7782255e4e -- <file>`. Every change in the incoming diff is
present in the staged resolution, via a later route:

- `working_sha_history: []` added under `working_sha: 0e390334` — **present** in
  HEAD verbatim.
- commits entry `932f362e4f60b8797557ba8f4cdd1fddeb1c9068` — **present** in HEAD
  (HEAD additionally carries `working_sha_history: []` on it).
- commits entry `92fc26e7bcc2a941999ba0e55292cda6b092bd26` — **present** in HEAD
  (likewise with `working_sha_history: []`).
- `version: 0.2.1` → `0.2.7` — **superseded forward**: HEAD is at `0.2.9`, having
  passed through 0.2.7.
- `status: free_coding` → `free_coded` — **superseded forward**: HEAD is at
  `free_and_reconciled`, the downstream state.

No hunk was dropped under the BUG-1301 precedence exception; none was needed.
Nothing from the incoming commit is absent — each item is either byte-identical
in HEAD or has been carried forward to a later value of the same field.

## Net result

The staged tree is identical to HEAD, so this cherry-pick is empty: the
post-watermark sync already landed this ticket state in refined form
(BUG-1109/BUG-1122). Per STEP 4 this is not a failure and `--skip` was not
called. Staging is clean (`git status --porcelain` empty, no UU/AA/DU/UD lines)
and `CHERRY_PICK_HEAD` remains `7782255e4e` for
`cherry_pick_finalize_resolution` to act on.
