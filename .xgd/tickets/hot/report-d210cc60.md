---
uid: report-d210cc60
id: REPORT-4743
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:43:12.283904+00:00'
updated_at: '2026-09-21T14:43:12.283904+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-01ea4eec.md` — **UU**, intent/bookkeeping ticket (STEP 2e).
  The only conflicted region was the frontmatter status block; both sides changed the
  SAME facts (`updated_at`, `completed_at`, `status`) differently, so this is a genuine
  intent conflict resolved per-fact by later-positioned intent:

  | Field | HEAD (kept) | Incoming `ffce0148a9` |
  |---|---|---|
  | `updated_at` | `2026-09-19T15:15:32` | `2026-09-01T18:36:24` |
  | `completed_at` | `2026-09-14T10:29:15` | `null` |
  | `status` | `free_and_reconciled` | `free_coding` |

  HEAD is later on both the timestamp and the lifecycle axis
  (`free_and_reconciled` is downstream of `free_coding`); the incoming commit is an
  older snapshot of the same ticket's status. Took HEAD for all three facts.
  Per the auto-enrichment note ("intent unknown on one or both sides — take the more
  recent commit by timestamp and flag for post-merge review"), this file is flagged
  for post-merge review.

  Staged with `git add --sparse` (ticket path is outside the sparse-checkout cone
  on resync branches, DOC-986 §2/§4.1).

## Incoming changes preserved

Every substantive body edit from `ffce0148a9` merged cleanly (no markers in the body)
and is present verbatim in the resolved file:

- "seventeen `mkdirSync` / `writeFileSync` call sites, not the fourteen first counted"
  (correcting the earlier "fourteen")
- The rewritten `## The shape of the port` section replacing
  `## What the port has to add that SiteStore did not`, including the
  `ReferenceBundle` / `ReferenceStore` / `ReferenceStoreRoot` three-level breakdown
- `## Design decisions taken here` (all five decisions), including
  `readLadderScreenshot(bundle, width)` and the `readLadderScreenshotPath` split
- `## Non-determinism, stated rather than discovered (AC3)`,
  `## Blast radius`, `## Deliberately not here`, and the revised
  acceptance criteria / test plan

No hunk was dropped; the BUG-1301 precedence exception was not invoked. No code
files and no UAT test files were involved in this conflict.
