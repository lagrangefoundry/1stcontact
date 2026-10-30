---
uid: report-95e42fbf
id: REPORT-5285
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T03:57:39.838915+00:00'
updated_at: '2026-09-28T03:57:39.838915+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-78f4e2fe.md` — **AA** (both added), intent/bookkeeping
  ticket (STEP 2b + §2e). Resolved to **ours (HEAD)**.

  The incoming commit is `efdc5802 xgd(ticket): create bundle bundle-78f4e2fe`
  (2026-08-26 10:36 -0700). Its frontmatter is the ticket's **creation snapshot**:
  `updated_at` equals `created_at` exactly (`2026-08-26T17:36:26.915596+00:00`),
  `completed_at: null`, `last_field_updated: created_at`,
  `status: ready_to_reconcile`, and `fields.commits` holds five pre-reconcile
  `working_sha` entries with `main_sha: null`.

  HEAD already carries the fully-advanced state of the **same** ticket
  (`updated_at: 2026-08-31T19:19:50`, `completed_at` set,
  `status: free_and_reconciled`, `result: pass`,
  `merged_at_commit: 96a76934e010d272feb2d2bfc2b5d9645db10fe8`, a 21-entry
  `orphan_commits` list, and `fields.commits` collapsed to the single reconciled
  entry carrying that `main_sha`).

  Every field that differs is the **same fact** at two points in one lifecycle,
  with HEAD strictly later on each. There are no disjoint additions on the
  incoming side: its only incoming-exclusive content is the pre-reconcile
  `working_sha` / `working_sha_history` list, which is the earlier value of
  `fields.commits` that HEAD deliberately collapsed once the bundle reconciled
  into main. Restoring it would regress `free_and_reconciled` → `ready_to_reconcile`
  and drop `result`, `completed_at` and `merged_at_commit`. Per §2e (later-positioned
  intent wins per fact) HEAD wins on every one, so the whole-file take of ours is
  the per-fact answer, not a shortcut.

## Incoming changes preserved

No incoming content was discarded.

The markdown body below the frontmatter is **byte-identical** on both sides
(`git diff` between the two blobs reports no body hunk other than a
trailing-newline difference on the final line): the full BUG-36 / BUG-37 / BUG-38
bundle narrative — diagnosis, approved scope addition, tenant-fix implementation,
CPU-limit measurements, and the chat isolate-churn root cause — is present in the
resolved file exactly as the incoming commit wrote it.

The only incoming values not carried forward are the four lifecycle scalars and
the `fields.commits` list enumerated above, each of which HEAD supersedes with a
later value for the identical field. That is lifecycle advance, not a dropped
developer change — the BUG-1301 precedence exception was not needed and no test
function was touched.

Result after staging: the resolved blob is `d51c00436b22170bdf8332ac597ca5bbca18bebf`
(HEAD's), `git status --porcelain` is empty, and no unmerged index stages remain.
The staged diff against HEAD is consequently empty — the cherry-pick is a no-op
for this branch, which finalize is expected to detect and skip. `CHERRY_PICK_HEAD`
(`efdc5802dbeffa2254dcc3fc00ec12a873e64560`) is untouched.
