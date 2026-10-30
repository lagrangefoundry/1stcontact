---
uid: report-b38aef4b
id: REPORT-4600
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T00:50:38.121555+00:00'
updated_at: '2026-09-21T00:50:38.121555+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — **UU**, intent/bookkeeping ticket (`request-*`), rule **2e**. Resolved per-fact, not by picking a winning side. Two conflict hunks, both confined to YAML frontmatter; the document body was identical on both sides and never conflicted.

  Per-fact resolution:
  - `commits:` block (`working_sha: 29c0e86d…`, `reconcile_sha: null`, `main_sha: null`) and `version: 0.2.16` — added by the incoming commit; **already present verbatim in HEAD**. Non-overlapping, kept.
  - `bundled_in: bundle-8eef3846` — HEAD-only addition, absent from incoming. Non-overlapping, kept.
  - `status` — the only genuinely contested fact. HEAD `bundled` vs incoming `free_coded`. Later-positioned intent wins: HEAD.
  - `updated_at` — carried with the winning `status` fact: `2026-08-31T05:05:09.416379+00:00`.

  Staged via `git add --sparse` (path is outside the sparse-checkout cone on this resync branch, DOC-986 §2/§4.1 — the conflict existed in the index only).

## Incoming changes preserved

Verified against `git show 04d4a9841d21e747bc4da7a56798d12115ce8f8c -- .xgd/tickets/hot/request-b88b79fe.md`.

The incoming commit contributes exactly two changes. Both survive:

1. **`commits:` block + `version: 0.2.16`** — present byte-identical in the resolved file (lines 21–25). Preserved.
2. **`status: free_coding` → `free_coded`** — superseded, not discarded. HEAD-side commit `afd199743a83e4644f8058597f487b7edf98347b` (Mon Aug 31 12:21:41 2026, `updated_at 2026-08-31T05:05:09`) advanced the ticket to `bundled` and attached `bundled_in: bundle-8eef3846`. Incoming's `updated_at` is `2026-08-28T16:38:43` — nearly three days earlier. `free_coded → bundled` is forward lifecycle motion, so taking HEAD here preserves the incoming transition's effect and adds the later one on top; taking incoming would have rewound the ticket and orphaned its bundle linkage.

No hunk was dropped under the BUG-1301 precedence exception — it does not apply here. No code, test, or UAT file was involved in this conflict.

Net effect: the staged resolution is byte-identical to HEAD (`git diff --cached HEAD` empty), because HEAD already contained every fact the incoming commit carried. The cherry-pick is a no-op, not a discard. `CHERRY_PICK_HEAD` left intact for the finalize step.
