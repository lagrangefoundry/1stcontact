---
uid: report-ef3be942
id: REPORT-4486
type: report
title: 'Resync resolve conflicts: 18ffaec45665d29545db8bfd323ee4bf6d1f8678'
created_by: xgd
created_at: '2026-09-20T18:59:05.843638+00:00'
updated_at: '2026-09-20T18:59:05.843638+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **AA** (both added), intent/bookkeeping
  ticket (`request-*`), resolved under STEP 2e. Out of the sparse-checkout cone but
  materialized on disk with 3 conflict-marker blocks; resolved with
  `git checkout --ours` + `git add --sparse`.

  **Rule applied: "one side a strict superset — keep the superset."** Verified by
  diffing the two stage blobs directly (ours `85e97c8`, theirs `7359952`). The
  complete set of lines present on the incoming side and absent from ours is:

  ```
  updated_at: '2026-08-22T23:55:22.575466+00:00'
  completed_at: null
  status: free_coding
    version: 0.2.1
  ```

  plus one trailing-line artifact (theirs ends the file at AC-11; ours continues,
  so the shared final line reads as removed context).

  Those four are the only *facts* both sides state differently, and on each one the
  later-positioned intent is ours:

  | Fact | Incoming (`9e5327cf`) | HEAD | Kept |
  |---|---|---|---|
  | `updated_at` | 2026-08-22T23:55 | 2026-08-31T14:22 | HEAD (later) |
  | `status` | `free_coding` | `free_and_reconciled` | HEAD (advanced past incoming) |
  | `completed_at` | `null` | 2026-08-31T14:22 | HEAD |
  | `version` | 0.2.1 | 0.2.9 | HEAD |

  Everything else on the incoming side is contained verbatim in ours. Specifically
  ours additionally carries: `bundled_in: bundle-b3b7c399`, `chat_comment:
  comment-98e86f10`, four further `commits[]` entries (6 vs 2, and the shared
  second entry carries `working_sha_history: []` only on our side), and two body
  sections the incoming version does not have — "Follow-up: `bin/build` failed on a
  type-only reach into node" (AC-12) and "Follow-up: the deploy secret guard asked
  the wrong question" (AC-13 … AC-16). Taking the incoming side would have
  regressed the status, dropped `bundled_in`/`chat_comment`, and deleted AC-12
  through AC-16.

  Resolved file verified byte-exact against the ours blob:
  `git hash-object` → `85e97c817e51665776f361c1ef7de2a4e8735753`; zero conflict
  markers remain.

## Incoming changes preserved

No code/implementation files were in conflict — the picked commit
`9e5327cff07685365d160f79e3878e0a28e83f8e` ("xgd(ticket): update request
request-554ac441") touches exactly one path, the bookkeeping ticket above, and
nothing under `xgd_source/**`, `tests/**` or `bin/**`. No UAT test function on
either side was deleted, and the BUG-1301 precedence exception was not invoked.

The incoming ticket content is preserved in full: every section, acceptance
criterion and `commits[]` entry present on the incoming side appears verbatim in
the resolved file. The only incoming values not carried forward are the four
lifecycle scalars listed above, each superseded by a strictly later revision of the
same ticket already on HEAD — which is precisely what STEP 2e's per-fact
later-intent rule prescribes, not a discard of developer content.

Because HEAD already holds that later revision, the resolution leaves no net diff
from HEAD (`git status --porcelain` and `git ls-files -u` both empty). Per STEP 4
this was left for the finalize step to detect and skip; `--skip`/`--continue` were
not called and `CHERRY_PICK_HEAD` (`9e5327cf`) is intact.
