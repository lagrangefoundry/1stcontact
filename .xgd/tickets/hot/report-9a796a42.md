---
uid: report-9a796a42
id: REPORT-3313
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T18:41:28.173210+00:00'
updated_at: '2026-09-02T18:41:28.173210+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-b474390f.md` — class **AA** (both added); intent/bookkeeping ticket, rule **2e** (with the enrichment's "more recent commit by timestamp" tiebreak, since intent was unknown on both sides).

  Both sides added the same 296-line request ticket. The bodies are byte-identical; the only divergence is in frontmatter, two hunks:

  | field | ours (HEAD, `811a0911` — Aug 31 07:22:40 2026) | theirs (incoming, `9ef799f9` — Aug 23 12:48:34 2026) |
  |---|---|---|
  | `updated_at` | `2026-08-31T14:22:40Z` | `2026-08-20T21:15:50Z` |
  | `completed_at` | `2026-08-31T14:22:40Z` | `null` |
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* |

  Resolved to **ours** via `git checkout --ours` + `git add --sparse`. Two independent signals agree:
  - **Timestamp** (the enrichment's stated rule): the HEAD-side commit is 8 days later than the incoming commit, and its own `updated_at` is 11 days later.
  - **Superset** (2e): HEAD carries every fact the incoming side has plus `fields.bundled_in`, and advances the lifecycle (`ready_to_reconcile` → `free_and_reconciled`, `completed_at` set). Taking the incoming side would have reverted an operator-owned status field backwards and dropped `bundled_in` outright.

  No hand-editing of the ticket file; resolution was a git-level side selection only.

## Incoming changes preserved

- `.xgd/tickets/hot/request-b474390f.md`: the incoming commit is a whole-file add whose entire content — title, description, all `fields.*` entries, `preserved_commits`, `version: 0.1.59`, `chat_comment`, and the full body — is present verbatim in the resolved file. The only lines from the incoming blob that do not appear are the three stale frontmatter scalars listed above, each superseded by a later value of the *same* field on the HEAD side. Nothing authored by the developer was discarded.

No code/implementation files were in this conflict set, so no BUG-1301 precedence exception was invoked and no test function was touched.

## Note on the staged diff

The resolution nets to no diff vs HEAD (`git diff --cached HEAD` is empty): the incoming commit's ticket state had already landed on this branch through a later update of the same ticket. Per STEP 4 this was staged and left for `cherry_pick_finalize_resolution` to skip — `--skip` was not called here, and CHERRY_PICK_HEAD is left intact. This is the redundant-commit case, not a discard: STEP 3's check confirms the incoming content is present in HEAD rather than absent.
