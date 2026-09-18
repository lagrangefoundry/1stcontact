---
uid: report-506e760a
id: REPORT-4350
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T08:15:41.035214+00:00'
updated_at: '2026-09-18T08:15:41.035214+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — class **UU**, rule **2e** (intent/bookkeeping ticket; bundle-*, not a matrix-defining spec ticket). Resolved per-fact by the timeline rule; result is byte-identical to the HEAD blob `bb444506b8dc2be46907b7105ce80916fd41ab72` (verified with `git hash-object`).

### Conflict shape

A single marker block covering exactly four frontmatter keys. The incoming commit `726b77db28` (2026-08-27 20:57 -0700) is a 2-line change and touches nothing else in the file:

- `updated_at`: `2026-08-26T17:36:45` → `2026-08-28T03:57:06`
- `status`: `reconciling` → `ready_to_reconcile`

The HEAD side (`8e07e6015d`, 2026-08-31 07:23 -0700, four days later) changes the same two facts plus three the incoming side never touched:

- `updated_at` → `2026-08-31T14:23:04`
- `status` → `free_and_reconciled`
- `completed_at` → `2026-08-31T14:22:24` (incoming: untouched, `null`)
- `last_field_updated` → `result` (incoming: untouched, `status`)
- `fields.commits` collapsed to a single entry carrying `main_sha: eef7a8b4…`, and `fields.orphan_commits` added (~190 lines; incoming: untouched)

Every fact the incoming side changed is also changed by HEAD — there are no disjoint incoming edits to combine. Both contested facts therefore go to the later-positioned side (HEAD), per 2e's per-fact timeline rule. The lifecycle ordering agrees with the timestamps: `ready_to_reconcile` precedes `reconciling`, which precedes the terminal `free_and_reconciled` already recorded on HEAD, so taking the incoming side would have regressed this bundle's status to a state it left on 2026-08-26 and dropped the completion record and the orphan-commit map with it.

No fields were invented, and `fields.intent_uid` / `story_uid` / `capability_uid` were not touched.

## Incoming changes preserved

No code/implementation files were involved — the cherry-picked commit `726b77db28` touches one file, this bookkeeping ticket.

STEP 3 check: the incoming commit's two edits are not present verbatim, and that is the *redundant*, not the *discarded*, case. The incoming intent was to advance `bundle-b3b7c399` one step along the reconcile lifecycle; HEAD already carries that bundle four days further along the same lifecycle, at its terminal `free_and_reconciled` state with `completed_at` set. The effect is subsumed by HEAD rather than absent from it, so per 2e the correct resolution keeps HEAD's value for each contested fact.

This nets to no diff vs HEAD — `git status --porcelain` is empty after staging. Per STEP 4 (BUG-1109/BUG-1122) that is expected and is not a failure: `--skip` was not called, and `CHERRY_PICK_HEAD` (`726b77db28`) is intact for `cherry_pick_finalize_resolution` to act on.

No UAT test functions were involved; the BUG-1301 precedence exception was not invoked.
