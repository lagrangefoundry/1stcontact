---
uid: report-1da942b4
id: REPORT-3210
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T04:56:18.224360+00:00'
updated_at: '2026-09-01T04:56:18.224360+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bundle-78f4e2fe.md` — **AA** (both added), intent/bookkeeping
  ticket. Rules 2b (AA, one side strictly a superset) + 2e (bookkeeping ticket,
  keep the superset). Resolved by taking **ours** (HEAD).

  Incoming `efdc5802db` is the *original* `create` of this bundle ticket
  (`status: ready_to_reconcile`, `updated_at == created_at`, five unresolved
  `working_sha` entries). HEAD carries the same ticket seeded via the reconcile
  overlay and then advanced through 24 `update bundle bundle-78f4e2fe` commits
  to its terminal state: `status: free_and_reconciled`, `completed_at` set,
  `result: pass`, 21-entry `orphan_commits` old→new mapping, and
  `merged_at_commit: 96a76934e0`. No `create bundle` commit exists in HEAD's
  history for this path — the seeded-overlay signature that makes a `create`
  cherry-pick redundant.

  Ours is a strict superset per fact: every field the incoming create sets is
  present in ours at a later value. Re-applying incoming would have rewound this
  bundle's own status to `ready_to_reconcile` — the very bundle currently being
  reconciled.

## Incoming changes preserved

Verified lossless before staging, on three checks:

1. The ours-stage blob and the HEAD blob are the same object
   (`d51c00436b22170bdf8332ac597ca5bbca18bebf`), so `checkout --ours` could not
   move the file away from HEAD.
2. The worktree-vs-ours-stage diff was **marker-only**: the entire incoming
   delta was confined to the two conflict regions, with no auto-merged incoming
   content sitting outside them that `--ours` would silently drop.
3. `git show efdc5802db -- <file>` against the resolution: the incoming commit's
   sole content is the 622-line ticket body, which is byte-identical to ours
   apart from a trailing newline. The only other divergence is the frontmatter
   block, where ours holds the strictly later lifecycle values.

No hunks were dropped under the BUG-1301 precedence exception; none applied.
No code, test, or spec-ticket files were involved in this conflict.

Staged diff vs HEAD is **empty**. This is the redundant-commit case of STEP 4
(BUG-1109/BUG-1122), not a discard: STEP 3's discriminator is satisfied because
the incoming commit's key change — the bundle ticket's existence and body — is
already present in HEAD via the overlay seed, rather than merely absent.
`--skip` was not called; the finalize step will detect the clean staged diff.
CHERRY_PICK_HEAD (`efdc5802db`) left intact.
