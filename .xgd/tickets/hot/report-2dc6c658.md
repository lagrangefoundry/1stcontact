---
uid: report-2dc6c658
id: REPORT-5264
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T02:42:37.019913+00:00'
updated_at: '2026-09-28T02:42:37.019913+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, intent/bookkeeping ticket (STEP 2e).
  Resolved to the HEAD (ours) side in full.

  Incoming commit `1eb1dd1586d5db0eb5aaa6f904a51b72f3a665d5`
  ("xgd(ticket): update bug bug-6612c4b7", author date
  2026-08-24 14:42:43 -0700) records the free-code promotion. Against its
  base (blob `af15f9ef54`) it:

  - advances `status: free_coding` → `free_coded`
  - adds `fields.commits` with one entry,
    `working_sha: 2058a16449a8e783bdd655d22bade58fd6b8d0fc`
  - adds `fields.version: 0.2.11`
  - bumps `updated_at` to 2026-08-24T21:42:43Z

  The body is untouched.

  Per-fact comparison against ours (blob `f3b9d25bf1`):

  - `status` — incoming `free_coded`; ours `free_and_reconciled`, which is
    downstream of `free_coded` on the same lifecycle path and dated a week
    later (2026-08-31T19:19:36Z). Later-positioned intent wins (2e).
  - `commits` — incoming has one entry; ours has three, and the first is
    the same `working_sha: 2058a16449a8e783bdd655d22bade58fd6b8d0fc`
    incoming adds (ours additionally carries `working_sha_history: []` on
    it, plus `0fe586d1f6…` and `999579b3fb…`). Ours is a strict superset;
    keep the superset (2e). No incoming sha is lost.
  - `version` — incoming `0.2.11`, ours `0.2.13`. Ours is the higher and
    later free-code version; taking incoming would roll the recorded
    version backwards two patch releases.
  - `bundled_in: bundle-78f4e2fe` — ours only; incoming has no opinion.
  - `updated_at` — ours is strictly later.

  Ours is later or a superset on every fact incoming touches, so there is
  no fact for which incoming is the better source. Taking the incoming
  side would regress the lifecycle, shrink the `commits` ledger from three
  entries to one, roll `version` back, and drop `bundled_in` and
  `completed_at`.

  This is the seventh consecutive commit in this resync queue against this
  ticket (`fe97d3bc34`, `b0af50e157`, `9255f773b5`, `1975a6876b`,
  `2759e5b507`, `0909c3f158`, `1eb1dd1586`) whose effect the branch
  already carries, via the `seed_local_overlay` commit `501a0595d1`
  (ticket state of 2026-08-26, already at `status: bundled`) plus the
  replayed HEAD-side lineage.

  Net effect: the staged tree is identical to HEAD (no staged diff). Left
  for the finalize step to detect and skip — `--skip` was not invoked here.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md` — incoming carries no body content;
  its payload is the free-code promotion metadata. Verified in the
  resolved file:

  - `working_sha: 2058a16449a8e783bdd655d22bade58fd6b8d0fc` present at
    line 20, the first of three `commits` entries — the code linkage
    incoming asserts is intact.
  - `version: 0.2.13` at line 30 — at or ahead of incoming's `0.2.11`.
  - `status: free_and_reconciled` at line 12 — a later state on the same
    path as incoming's `free_coded`.

  Nothing incoming asserts is lost; each of its facts is present in an
  equal or later form.

No code files, no UAT test files, and no spec tickets were involved in this
conflict. No hunk was dropped under the BUG-1301 precedence exception.
