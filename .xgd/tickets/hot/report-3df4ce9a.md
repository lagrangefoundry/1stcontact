---
uid: report-3df4ce9a
id: REPORT-4054
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T22:02:05.797380+00:00'
updated_at: '2026-09-11T22:02:05.797380+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-b474390f.md` (REQ-145) — class **AA** (both added), intent/bookkeeping ticket → **rule 2e**, superset branch. Resolved to the HEAD side in full.

Single conflict in this pick; no code, spec-ticket (2d), UAT (2f), or config (2g) files were involved.

### Why the HEAD side

Both 2e's superset test and the enrichment block's timestamp rule select HEAD, independently:

1. **Strict superset.** Full-file `diff` of incoming vs HEAD is four frontmatter lines, all additive on the HEAD side. The 295-line body is byte-identical; `chat_comment: comment-c73091bc` — the only field the incoming commit itself introduced — is present on HEAD too.

   | field | incoming (`9ef799f917`) | HEAD | kept |
   |---|---|---|---|
   | `status` | `ready_to_reconcile` | `free_and_reconciled` | HEAD |
   | `completed_at` | `null` | `2026-08-31T14:22:40Z` | HEAD |
   | `updated_at` | `2026-08-20T21:15:50Z` | `2026-08-31T14:22:40Z` | HEAD |
   | `bundled_in` | *(absent)* | `bundle-b3b7c399` | HEAD |

   No field is set to competing values on the two sides, so there is no per-fact conflict to arbitrate and no `working-timeline` lookup was needed. Taking HEAD discards nothing.

2. **Timestamp.** Incoming `9ef799f917` is authored/committed 2026-08-23. The HEAD-side tip for this path, `811a091164`, is authored 2026-08-31 and committed 2026-09-01, behind `8a09ff9218` (`seed_local_overlay`, 2026-08-30). HEAD is later on both clocks.

Replaying the incoming frontmatter would have reverted REQ-145 from `free_and_reconciled` to `ready_to_reconcile`, cleared `completed_at`, and dropped `bundled_in` — i.e. undone operator-owned lifecycle state that landed after the incoming commit was written.

## Incoming changes preserved

Preserved in full — this pick is **redundant, not discarded** (STEP 4 / BUG-1109 case, distinguished per STEP 3).

`git show 9ef799f917 --stat` is a pure add: `1 file changed, 296 insertions(+)`. That content is already in HEAD's own history. Diffing the incoming blob against HEAD's `5c064c9b35` (2026-08-20, the commit whose date matches the incoming file's own `updated_at`) yields exactly one added line — `chat_comment: comment-c73091bc` — and that line is present in HEAD today. So every line the incoming commit contributes is reachable in the resolved file; none is merely absent.

The staged result is therefore byte-identical to HEAD (`git diff --cached HEAD -- <path>` is empty). Per STEP 4 this is not a failure and `--skip` was **not** called; `cherry_pick_finalize_resolution` will detect the clean staged diff and skip the commit itself.

No hunk was dropped under the BUG-1301 precedence exception.

## Flagged for post-merge review

The enrichment block classified both sides' intent as unknown and asked for a post-merge flag, so recording one observation rather than acting on it:

- HEAD's `bundled_in` reads `bundle-b3b7c399`, while this reconcile run's intent is `bundle-8e1807f6`. The incoming side carries no `bundled_in` at all, so keeping HEAD's value was the only option that does not invent content, and changing it would have been a prohibited edit under 2e. Worth confirming downstream whether REQ-145's bundle membership should have been re-pointed at `bundle-8e1807f6`.

## Cherry-pick state

Staged with `git add --sparse` — `.xgd/tickets/` is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict existed in the index only, with no working-tree markers. `git status --porcelain` is empty: no `UU`/`AA`/`DU`/`UD` lines remain. `CHERRY_PICK_HEAD` is intact at `9ef799f917`; no `--continue`, `--skip`, `--quit`, `--abort`, `reset`, or `checkout <branch>` was run.
