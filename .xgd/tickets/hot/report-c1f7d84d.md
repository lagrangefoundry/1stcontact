---
uid: report-c1f7d84d
id: REPORT-3423
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:26:56.487683+00:00'
updated_at: '2026-09-04T00:26:56.487683+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` — **UU**, intent/bookkeeping ticket
  (rule **2e**, applied per-fact). Out of the sparse-checkout cone (DOC-986
  §2/§4.1): the conflict existed only in the index with no working-tree
  markers, so it was resolved with `git checkout --ours` followed by
  `git add --sparse`.

  Incoming commit: `72ef0ecea8c1f1d1142fad036df53879883bd41c`
  (`xgd(ticket): update request request-439cd0c8`, 2026-08-31 16:13 -0700).
  HEAD side: `31823f5b7c` (`xgd(ticket): seed_local_overlay request
  request-439cd0c8`, 2026-09-02).

  **Resolution: ours.** Under 2e's per-fact rule, HEAD is a strict superset
  on every contested fact, and on the one genuinely competing fact (`status`)
  it holds the later-positioned intent:

  | fact | ours (HEAD, 2026-09-02) | theirs (incoming, 2026-08-31) | kept |
  |---|---|---|---|
  | `status` | `bundled` | `free_coding` | ours — later lifecycle position |
  | `updated_at` | `2026-09-02T17:48:27` | `2026-08-31T23:13:20` | ours |
  | `last_field_updated` | `status` | `status` | identical |
  | `fields.commits` / `version: 0.2.24` / `bundled_in: bundle-203b1dc2` | present | absent | ours — superset |
  | body | + "What was built, and where it departs...", bundle measurement, Evidence, "Resolved after implementation (2026-08-31)" | older two-bullet "Open questions" | ours — superset |

  The body delta is **ambient timeline drift, not incoming intent**. The
  incoming commit's own diff is frontmatter-only (3 insertions, 3 deletions:
  `updated_at`, `last_field_updated: body → status`, `status: draft →
  free_coding`). Its parent (`72ef0ec^`) contains neither the "What was
  built" sections nor the bundling fields, confirming the incoming side is
  simply an earlier point on the working timeline that had not yet received
  them — not a side that deleted them.

  The two "Open questions" bullets unique to the incoming side were not
  discarded: HEAD's "Resolved after implementation (2026-08-31)" section is
  their deliberate successor, answering both and stating explicitly
  "Recorded here rather than by deleting them, so what made them questions
  stays legible."

  No `fields.intent_uid` / `story_uid` / `capability_uid` was touched, and no
  content absent from both sides was introduced.

## Incoming changes preserved

The incoming commit's sole change is the status transition
`draft → free_coding`. It is **present in HEAD via a different route**, not
discarded (STEP 4 / BUG-1109 / BUG-1122 — the redundant-commit case, which
STEP 3 distinguishes from a discard by asking whether the key change reached
HEAD at all):

- HEAD's `status: bundled` is *downstream* of `free_coding` in the ticket
  lifecycle — the free-coding phase completed and the ticket advanced past it.
- HEAD carries the positive evidence of that completion, which the incoming
  side does not yet have: `fields.commits[0].working_sha:
  d99c1f438572f2da868db0bc384c798858681cac`, `fields.version: 0.2.24`, and
  `fields.bundled_in: bundle-203b1dc2` — this very reconcile bundle.
- Taking the incoming side would have *reverted* an operator-owned status
  field backwards and dropped the bundling bookkeeping that the in-flight
  reconcile depends on.

No BUG-1301 precedence exception was invoked; no test file was involved.

Consequently the staged tree nets to no diff vs HEAD (`git diff --cached
--name-status HEAD` is empty, `git ls-files -u` reports no unmerged entries).
Per STEP 4 this is staged and exited normally rather than skipped here —
`cherry_pick_finalize_resolution` will detect the clean staged diff and skip
the commit. `CHERRY_PICK_HEAD` was left intact; no `--continue`, `--skip`,
`--quit`, `--abort`, `reset` or `checkout <branch>` was run.

## Post-merge review flag

Per the enrichment rule ("Intent unknown on one or both sides. Take the more
recent commit by timestamp and flag this file for post-merge review"), this
file is flagged: the more recent commit by timestamp was the HEAD side
(2026-09-02 vs 2026-08-31), which is the side kept.
