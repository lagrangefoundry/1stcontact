---
uid: report-1e0ee2a0
id: REPORT-2727
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:57:58.579620+00:00'
updated_at: '2026-08-31T05:57:58.579620+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-7ae3c2cc.md` — class **AA** (both added), intent/bookkeeping ticket (rule 2e, with 2b's superset test). Path is outside the sparse-checkout cone, so the conflict existed only in the index (no working-tree markers); resolved with `git checkout --ours --ignore-skip-worktree-bits` + `git add --sparse`.

  Incoming commit: `773e1698` "xgd(ticket): update request request-7ae3c2cc" (2026-08-23), which adds the file whole (303 insertions). HEAD side: `ce11ecb0` "xgd(ticket): seed_local_overlay request request-7ae3c2cc" (2026-08-30).

  The two versions are byte-identical except for one frontmatter region. Per-fact comparison:

  | fact | ours (HEAD) | theirs (incoming) | kept |
  |---|---|---|---|
  | `updated_at` | 2026-08-24T02:10:41 | 2026-08-20T00:47:43 | ours (later) |
  | `status` | `bundled` | `ready_to_reconcile` | ours (later position; this bundle already bundled it) |
  | `fields.bundled_in` | `bundle-b3b7c399` | absent | ours (only side that has it) |
  | working sha `055378794f49f1dc...` | folded into first implementation entry's `working_sha_history` | separate implementation entry with empty history | ours (same sha, normalized form) |

  Ours is the strictly later and information-superset side on every differing fact: it retains the incoming side's only substantive datum (working sha `055378794f49f1dc`), advances `status` past `ready_to_reconcile`, and carries `bundled_in: bundle-b3b7c399` — the very bundle being reconciled. Taking theirs would have reverted this request's status and dropped its bundle linkage, corrupting in-flight bundle bookkeeping. The enrichment rule for this file ("intent unknown on one or both sides; take the more recent commit by timestamp") points the same way: HEAD-side commit 2026-08-30 > incoming 2026-08-23. No content was invented; no field on either side was dropped.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a bookkeeping request ticket, so the "incoming free_coded is authoritative for code" rule does not govern; 2e's per-fact timeline rule does.

The incoming commit's entire file content is present in HEAD: the 300-line narrative body is byte-for-byte identical on both sides, and the one datum unique to the incoming frontmatter (working sha `055378794f49f1dc39b20fdcf54aa7fa0b1190e3`) is present in HEAD inside the first implementation entry's `working_sha_history`. The incoming values that are *not* in the resolution (`status: ready_to_reconcile`, `updated_at: 2026-08-20`) are older states of the same facts, superseded by HEAD's later bookkeeping — superseded, not discarded developer code.

No hunk was dropped under the BUG-1301 precedence exception; no test function was touched.

The resolution therefore nets to no diff vs HEAD. Per STEP 4 this is the redundant-commit case, not the discarded-commit case: STEP 3's discriminator holds — the incoming commit's key changes are present in HEAD via a later route, not absent. Staged and left for `cherry_pick_finalize_resolution` to skip; `CHERRY_PICK_HEAD` was not disturbed.
