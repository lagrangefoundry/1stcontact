---
uid: report-b6a64965
id: REPORT-4291
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T04:44:51.835478+00:00'
updated_at: '2026-09-18T04:44:51.835478+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-34dd9049.md` — class **AA** (both added), intent/bookkeeping
  ticket (`request-*`), so **rule 2e** governs (with 2b's superset test). Resolved toward
  **ours (HEAD)** via `git checkout --ours` + `git add --sparse` (path is outside the
  sparse-checkout cone on this reconcile branch, DOC-986 §2/§4.1, so the conflict existed
  only in the index with no working-tree markers).

  I diffed the two index stages in full (`:2:` vs `:3:`) rather than reading only the
  conflict hunks. The 225-line ticket body is **byte-identical** on both sides. The entire
  difference is three bookkeeping scalars plus one field, and the incoming side is the
  **older** of the two (2026-08-22 vs 2026-08-31):

  | field | ours (HEAD, Aug 31) | incoming (`3e9239d68a`, Aug 22) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `completed_at` | `2026-08-31T14:22:33` | `null` |
  | `updated_at` | `2026-08-31T14:22:33` | `2026-08-22T21:54:23` |
  | `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* |

  HEAD is a **strict superset** per 2e: it advances `status`, sets `completed_at`, and adds
  `bundled_in`, a field the incoming side never carried. The incoming side contributes no
  fact that HEAD lacks. This also matches the enrichment block's stated rule — take the more
  recent commit by timestamp — which selects HEAD here. Taking the incoming side would have
  walked an operator-owned `status` backwards from `free_and_reconciled` to
  `ready_to_reconcile` and dropped the `bundled_in` link to `bundle-b3b7c399`.

  No timeline lookup was needed: this never reached 2e's "same field changed differently"
  branch, because it is not a competing-intent conflict at all — it is stale frontmatter
  from before this ticket was reconciled and bundled.

## Incoming changes preserved

Confirmed. Every substantive change the incoming commit authored is present verbatim in the
resolved file. `3e9239d68a` is a whole-file add (225 insertions); I checked its content
against the resolution field by field:

- Full request body (`# 1c CLI: boot a plain Vite SSR server, not Astro's`, `## Why`, and
  all following sections) — identical, no drift.
- `fields.commits` — all three entries present with matching `working_sha` values
  (`258381e2…`, `aa64b3e1…`, `c36373c1…`) and their `reconcile_sha`/`main_sha` nulls.
- `fields.version: 0.2.2`, `fields.chat_comment: comment-c6092b70`,
  `fields.depends_on: [REQ-148]`, `priority: low`, `story_points: 5`,
  `auto_merge_back: true`, `needs_review: false` — all present.
- `uid`, `id: REQ-150`, `type`, `title`, `created_by`, `created_at` — all present.

The only incoming lines absent are the three superseded bookkeeping scalars in the table
above. Those are not developer code; they are ticket state that HEAD already advanced past.
No BUG-1301 precedence exception was invoked — nothing was dropped on refactor grounds.

## Note for the finalize step

The staged tree nets to **no diff vs HEAD** (`git diff --cached HEAD` is empty), because
HEAD's version of this ticket already contains this commit's content — it arrived earlier
via post-watermark sync. Per STEP 4 this is a **redundant** commit, not a discarded one, and
STEP 3 above is the evidence: the incoming commit's key changes are present in HEAD rather
than merely absent. I did not call `--skip`, `--continue`, `--quit`, or `--abort`;
`CHERRY_PICK_HEAD` is intact at `3e9239d68af7e90b87307b951a529ed4df328c20` for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the commit.

No post-merge review flag is warranted despite the enrichment block's default suggestion:
the two sides' intents were not actually unknown or competing once the stages were diffed in
full — the bodies match and the delta is pure timeline drift.
