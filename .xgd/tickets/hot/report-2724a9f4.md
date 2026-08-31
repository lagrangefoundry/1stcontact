---
uid: report-2724a9f4
id: REPORT-2948
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T14:50:46.480472+00:00'
updated_at: '2026-08-31T14:50:46.480472+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **UU**, intent/bookkeeping ticket (rule 2e).
  Index-only conflict: `core.sparseCheckout=true` and `.xgd/tickets/` is outside the
  cone (DOC-986 §2/§4.1), so no markers were ever written to the working tree.
  Resolved with `git checkout --ours` + `git add --sparse`.

  **Rule applied — 2e "one side is a strict superset": ours (HEAD) is the superset,
  per fact:**

  | Fact | Incoming (`7782255e`, free_coded) | Ours (HEAD, superset) |
  |---|---|---|
  | `status` | `free_coded` | `bundled` — later lifecycle position |
  | `fields.version` | `0.2.7` | `0.2.9` — later |
  | `updated_at` | `2026-08-23T03:22:54` | `2026-08-24T02:10:41` — later |
  | `commits[]` | adds `932f362e`, `92fc26e7` | both present, **plus** `ec144c85`, `02bd4437` |
  | `working_sha_history: []` on `0e390334` | added | already present |
  | `bundled_in` / `chat_comment` | absent | `bundle-b3b7c399` / `comment-98e86f10` |
  | Body | base body + follow-ups through AC-12 | identical text **plus** the deploy-secret-guard follow-up (AC-13..16) |

  No fact is changed differently on the two sides, so the per-fact timeline rule was
  not needed: every incoming fact is either already in HEAD verbatim or is an earlier
  position on a monotonic sequence HEAD has since advanced. Nothing was invented; no
  `intent_uid` / `story_uid` / `capability_uid` field was touched.

## Incoming changes preserved

The incoming commit `7782255e4ebcea00a8d9590dfe4c846e3067c175`
(_xgd(ticket): update request request-554ac441_) touches this one file only. Verified
against `git show 7782255e -- <file>`: all four of its hunks' effects are present in
the resolved file, each having arrived through a later commit already integrated into
HEAD.

- `working_sha_history: []` appended to the `0e390334` commits entry — present (line 28).
- `working_sha: 932f362e…` entry — present (lines 29–32).
- `working_sha: 92fc26e7…` entry — present (lines 33–36).
- `version: 0.2.1` → `0.2.7` — superseded by `0.2.9`, which the ticket's own
  "Version bookkeeping" sections record as two further bumps on top of 0.2.7.
- `status: free_coding` → `free_coded` — superseded by `bundled`.

No hunk was dropped under the BUG-1301 precedence exception; no code or test file was
involved.

## Note for the finalize step

The resolution nets to **no diff vs HEAD** (`git diff --cached --stat HEAD` is empty).
This is BUG-1109/BUG-1122, not a discard: STEP 3's check confirms the incoming
commit's changes are *present* in HEAD via a later route, not *absent*. Per STEP 4 no
`--skip` was issued — `CHERRY_PICK_HEAD` is left intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the commit.

`git status --porcelain` shows no conflict classes. The remaining `??` entries are
pre-existing untracked comment/report tickets, unrelated to this conflict and left
untouched.
