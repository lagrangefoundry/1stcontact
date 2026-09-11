---
uid: report-f735ef4d
id: REPORT-3541
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T22:19:54.955972+00:00'
updated_at: '2026-09-09T22:19:54.955972+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-b474390f.md` — class **AA** (both added), intent/bookkeeping ticket → rule **2e** (with 2b superset check). Resolved to the HEAD-side content via `git checkout --ours` + `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

  The two sides differ ONLY in frontmatter; the entire body (296-line request narrative) is byte-identical. The three differing facts:

  | fact | ours (HEAD) | theirs (incoming `9ef799f9`) |
  |---|---|---|
  | `updated_at` / `completed_at` | `2026-08-31T14:22:40` / same | `2026-08-20T21:15:50` / `null` |
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* |

  Per-fact resolution, not whole-file coin-flip:
  - **Same fact changed differently** (`status`, `updated_at`, `completed_at`) → timeline rule. HEAD's latest commit for this path is `811a0911` (2026-08-31 07:22:40 -0700); the incoming commit is `9ef799f9` (2026-08-23 12:48:34 -0700) and its payload mirrors the state written by `5c064c9b` (2026-08-20 14:15:50 -0700, matching its own `updated_at`). HEAD is later on every contested fact, so HEAD wins each one.
  - **Fact present on one side only** (`fields.bundled_in`) → superset kept. Dropping it would revert reconcile-owned bookkeeping (bundle membership + `free_and_reconciled`) that the incoming side simply predates.

  No content was invented; `fields.intent_uid` / `story_uid` / `capability_uid` were not touched.

## Incoming changes preserved

Confirmed. The incoming commit is an add of the full ticket file (296 insertions). Every line of its content is present in the resolved file except the three frontmatter scalars above, where HEAD holds strictly later values for the same facts — that is supersession by the timeline rule, not discard.

`git diff --cached HEAD` is therefore empty: this cherry-pick is **redundant**, not discarded (BUG-1109/BUG-1122). STEP 3's discriminator confirms redundancy — the incoming commit's substance (the ticket body and all fields it authored) is already in HEAD via `5c064c9b` → `8a09ff92` → `811a0911`, rather than merely absent. Per STEP 4 no `--skip` was issued; the resolution is staged and `CHERRY_PICK_HEAD` is left intact for `cherry_pick_finalize_resolution` to detect the empty staged diff and skip the commit itself.

No code/implementation files were involved, and no test functions were touched, so the BUG-1301 precedence exception did not arise.

## Flag for post-merge review

The auto-enrichment reported intent unknown on one or both sides. Resolution here rested on commit timestamps and field-level supersession rather than an intent-ledger position, so a reviewer may wish to confirm that `request-b474390f` should remain `free_and_reconciled` in `bundle-b3b7c399`.
