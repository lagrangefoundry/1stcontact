---
uid: report-c89072d0
id: REPORT-4501
type: report
title: 'Resync resolve conflicts: 18ffaec45665d29545db8bfd323ee4bf6d1f8678'
created_by: xgd
created_at: '2026-09-20T19:13:55.154341+00:00'
updated_at: '2026-09-20T19:13:55.154341+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-7ae3c2cc.md` — **AA** (both added), intent/bookkeeping
  ticket under `.xgd/tickets/` → STEP 2e (with 2b's superset rule). Resolved
  **ours** on every differing fact. Staged with `git add --sparse` (path is
  outside the sparse-checkout cone; markers had materialized on disk, so
  `git checkout --ours` + `--sparse` add was needed to clear the index stages).

A blob-level diff of stage 2 vs stage 3 confirms the **only** differences are two
frontmatter hunks — the entire markdown body is byte-identical — so taking ours
wholesale discards nothing outside those hunks.

### Per-fact resolution (2e: later-positioned intent wins, per fact)

| Fact | Ours (HEAD) | Incoming (773e169819) | Taken | Why |
|---|---|---|---|---|
| `status` | `free_and_reconciled` | `ready_to_reconcile` | ours | Ours is *downstream* of incoming in the request lifecycle. Incoming-wins would regress the ticket to an earlier state. |
| `updated_at` | `2026-08-31T14:22:36Z` | `2026-08-20T00:47:43Z` | ours | Ours is 11 days later-positioned. |
| `completed_at` | `2026-08-31T14:22:36Z` | `null` | ours | Travels with the `free_and_reconciled` transition above. |
| `fields.commits` | one entry, `working_sha a28d2f5`, history `[ade6457, 0553787, a6e92ca]` | same entry with history `[ade6457, a6e92ca]` **plus** a second entry `working_sha 0553787` with empty history | ours | Same four shas on both sides — ours is a later normalization that folds `0553787` into `working_sha_history` rather than carrying it as a standalone entry. No sha is lost. |
| `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* | ours | Present only on ours. Incoming-wins would silently drop the bundle association. |

`fields.version` (`0.1.60`) and `fields.chat_comment` (`comment-a4605dbc`) are
identical on both sides.

## Incoming changes preserved

No code, test, or spec-matrix files were in this conflict — the sole conflicted
path is an intent/bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>`
check on implementation files is vacuous here.

Nothing developer-authored is discarded. Every incoming-side value is an
*earlier* state of a fact that HEAD has already advanced past along the same
lifecycle (`ready_to_reconcile` → `free_and_reconciled`), and the one structural
difference — `0553787` as a standalone `commits` entry vs. folded into the first
entry's `working_sha_history` — preserves the identical set of four working shas
on the resolved side. No hunk was dropped under the BUG-1301 precedence
exception; none applied.

Because the resolution equals HEAD byte-for-byte, `git status --porcelain` is
empty and the staged diff for this pick is clean. Per STEP 4 this was **not**
skipped here — `--skip`/`--continue` were not invoked, `CHERRY_PICK_HEAD`
(`773e1698198c4066bd2dfad635bb963bde641a6b`) is intact, and the finalize step
owns the empty-diff decision.
