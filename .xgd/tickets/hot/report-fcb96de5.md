---
uid: report-fcb96de5
id: REPORT-3372
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T21:39:14.683887+00:00'
updated_at: '2026-09-02T21:39:14.683887+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — UU, intent/bookkeeping ticket (STEP 2 rule **2e**, `bundle-*`). Resolved to the HEAD (ours) side via `git checkout --ours` + `git add --sparse` (file is outside the sparse-checkout cone on this reconcile branch, DOC-986 §2/§4.1). No hand-editing of the ticket file.

### Why ours, per fact

Both sides touched the **same** three frontmatter facts — `updated_at`, `status`, `last_field_updated` — so this is a genuine per-fact conflict, and 2e's timeline rule applies:

| fact | base | incoming (`eb58654`, 2026-08-26 10:36:45 -0700) | ours (`8e07e60`, 2026-08-31 07:23:04 -0700) |
|---|---|---|---|
| `updated_at` | 2026-08-25T23:30:45Z | 2026-08-26T17:36:45Z | **2026-08-31T14:23:04Z** |
| `status` | `ready_to_reconcile` | `reconciling` | **`free_and_reconciled`** |
| `last_field_updated` | `status` | `status` | **`result`** |

HEAD is later-positioned on every contested fact, and is additionally a strict content superset: it carries the same bundle past `reconciling` to completion — `completed_at: 2026-08-31T14:22:24Z`, `result: pass`, `merged_at_commit: eef7a8b48bfa15c54b64db9541a0e781a016ba9e`, plus a 140-entry `orphan_commits` remap table and the collapsed `commits` list. Taking the incoming side would have regressed a completed, merged-back bundle to an intermediate in-flight status and dropped all of that.

No fields were invented; nothing was taken that is not present on one of the two sides.

## Incoming changes preserved

The incoming commit is a bookkeeping-only ticket update — its entire diff is the two lines in the table above (`updated_at` bump, `status: ready_to_reconcile` → `reconciling`). There is no code file in this commit.

Its key change **is present in HEAD via a later route**, not discarded: HEAD's own history advanced this exact ticket through `reconciling` and onward to `free_and_reconciled` five days later (`5ba3b19` 2026-08-31 02:06, `a0b52c9` 2026-08-31 07:22, `8e07e60` 2026-08-31 07:23). The status transition the incoming commit records has therefore already happened and been superseded on the HEAD timeline. This is the redundant case described in STEP 4 (BUG-1109/BUG-1122), distinguished from a discard by STEP 3's test — not a @fail condition.

Consequently the resolution nets to **no staged diff vs HEAD**. Per STEP 4 this is expected and not a failure; `--skip` was NOT called, and `CHERRY_PICK_HEAD` (`eb58654345c1afcca4372c3d62e2b324278ff1d9`) is left intact for `cherry_pick_finalize_resolution` to handle.

No BUG-1301 precedence exception was invoked; no test functions were involved.

## Post-merge review flag

The auto-enrichment classified this file as "intent unknown on one or both sides — take the more recent commit by timestamp and flag for post-merge review." The timestamp rule and the per-fact 2e analysis agree on the same outcome (ours). Flagging as instructed, though the supersession chain above is unambiguous.

## Verification

- `grep -c '^<<<<<<<|^=======|^>>>>>>>'` on the resolved file → `0`
- `git status --porcelain` (excluding untracked) → empty; no `UU`/`AA`/`DU`/`UD` lines remain
- `git rev-parse CHERRY_PICK_HEAD` → still resolves; cherry-pick sequencer state untouched
