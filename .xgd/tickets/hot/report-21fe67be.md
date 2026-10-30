---
uid: report-21fe67be
id: REPORT-4714
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T11:08:00.034785+00:00'
updated_at: '2026-09-21T11:08:00.034785+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — **UU**, intent/bookkeeping ticket (`request-*`), rule **2e**. Frontmatter-only conflict; body and the rest of `fields:` were untouched by both sides. The four conflicting keys are all facets of a single fact (the ticket's lifecycle position), and both sides set it differently, so this is a genuine intent conflict resolved per-fact by later-positioned intent:

  | key | HEAD (ours) — kept | incoming (9331c1feb4) — dropped |
  |---|---|---|
  | `updated_at` | `2026-09-09T21:32:50.386750+00:00` | `2026-09-01T01:18:52.331847+00:00` |
  | `completed_at` | `null` | `null` (identical) |
  | `last_field_updated` | `status` | `status` (identical) |
  | `status` | `bundled` | `free_coding` |

  HEAD is the later intent by 8 days. Incoming `9331c1feb4` is the original `draft → free_coding` transition from 2026-09-01; HEAD has since advanced the same ticket through the lifecycle to `bundled` (corroborated by `fields.bundled_in: bundle-87be4669`, present and unconflicted on both sides). Replaying the older transition would regress the ticket's state, so HEAD wins on all four keys. This matches the auto-enriched resolution rule ("take the more recent commit by timestamp"); flagged for post-merge review as that rule directs.

  Staged with `git add --sparse` (path is outside the sparse-checkout cone on this resync branch, DOC-986 §2/§4.1 — index-only conflict).

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's per-file incoming-diff verification does not apply and no BUG-1301 precedence exception was invoked.

For the one conflicted file, `git show 9331c1feb4 -- .xgd/tickets/hot/request-3bc4b835.md` shows the incoming commit's *entire* content is the `draft → free_coding` status transition and its `updated_at`/`last_field_updated` stamps — there is no disjoint edit on the incoming side to preserve alongside HEAD's. The incoming intent is not discarded developer work: it is a superseded earlier point on the same lifecycle path that HEAD already traversed past. Per 2e this is the expected outcome for a same-fact conflict, not a dropped change.

Net effect: the resolution is byte-identical to HEAD, so this cherry-pick carries no staged diff. Left for the finalize step to detect and skip; `--continue`/`--skip` were not invoked and `CHERRY_PICK_HEAD` remains present.
