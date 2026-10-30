---
uid: report-b6c3cebf
id: REPORT-5435
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T03:19:02.762399+00:00'
updated_at: '2026-09-29T03:19:02.762399+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` — **UU**, class **2e** (intent/bookkeeping ticket; `request-*` kind, resident in `hot/` because spec-adjacent request tickets do not demote). Resolved per-fact, taking the later-positioned intent for genuinely competing facts and keeping non-overlapping additions from both sides. Net result equals the HEAD-side blob.

  Both sides are `xgd(ticket): update request request-78370159` commits touching only YAML frontmatter; the ticket body was untouched by either side.

  | fact | ours (HEAD) | theirs (`0bba66b7fd`) | resolution |
  |---|---|---|---|
  | `updated_at` | 2026-09-09T21:32:50 | 2026-09-01T18:09:24 | ours (later) |
  | `last_field_updated` | `status` | `status` | identical, no conflict |
  | `status` | `bundled` | `ready_to_reconcile` | ours (later intent) |
  | `fields.bundled_in` | `bundle-87be4669` | absent | ours (non-overlapping addition, kept) |
  | trailing newline | present | missing | ours (kept) |

  Ordering signal: the ticket's own `updated_at`, not commit author date. Author dates invert here (HEAD-side `1095477c` is author-dated 2026-08-31, incoming `0bba66b7fd` is 2026-09-01) because resync replays commits onto a main-rooted branch while preserving original author dates; `1095477c`'s blob nonetheless carries the 2026-09-09 `bundled` content. The frontmatter timestamp is the intent-ledger position 2e asks for.

  Lifecycle corroboration, independent of timestamps: `free_coded → ready_to_reconcile → bundled`. HEAD is one stage downstream of the incoming side and carries the `bundled_in` back-reference to `bundle-87be4669`, which the incoming side has no knowledge of. Replaying `ready_to_reconcile` would have rewound the ticket and orphaned it from its bundle.

  `xgd working-timeline` was not consulted: it disambiguates two *distinct* uids, and both sides here are the same ticket.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>` code-hunk check does not apply, and the BUG-1301 precedence exception was not invoked.

Every fact asserted by the incoming commit is either identical to ours (`last_field_updated: status`) or strictly superseded by a later assertion of the same field on the HEAD side (`updated_at`, `status`). The incoming side contributes no field, section, or body text that HEAD lacks, so nothing was discarded: this is supersession under 2e's per-fact rule, not loss.

## Staging state

Resolved in-index via `update-index --cacheinfo` to the HEAD-side blob `9c6d321c8b13840940fd0f2800f0edab053050f4`, then materialized into the worktree with `checkout-index` (the file had not been written to disk by git despite being inside the sparse cone and carrying no `skip-worktree` bit).

`git status --porcelain` is empty; no `UU`/`AA`/`DU`/`UD` lines remain. `CHERRY_PICK_HEAD` (`0bba66b7fd65b62967797bd16733c4780052e586`) is intact and untouched.

Because the resolution equals HEAD, the staged diff against HEAD is empty and this pick is a no-op. Per STEP 4 this was left alone rather than skipped — the finalize step is expected to detect the clean staged diff and skip the commit.
