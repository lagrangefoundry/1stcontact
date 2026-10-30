---
uid: report-7f4d269e
id: REPORT-5339
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T19:00:07.228472+00:00'
updated_at: '2026-09-28T19:00:07.228472+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` — intent/bookkeeping ticket (`request-*`, STEP 2e). Conflict class `UU`, incoming commit `1bc13abacf` (`xgd(ticket): update request request-909e42f8`). **Rule applied: genuine same-fact conflict — later-positioned intent wins, per fact. Ours wins on every conflicting fact.**

  Unlike the preceding attempt on this same path (incoming `9a6417c0b0`, resolved as a strict superset), this is a real competing edit: both sides modify the **same three frontmatter fields**, and no other field or body content is touched by the incoming side.

  | field | merge base (`eac453fb`) | theirs (`6d821b79`) | ours (`3b6c6a92`) |
  |---|---|---|---|
  | `status` | `draft` | `free_coding` | `bundled` |
  | `updated_at` | `2026-08-31T20:33:32` | `2026-08-31T21:54:37` | `2026-09-09T21:32:49` |
  | `last_field_updated` | `created_at` | `status` | `status` |

  Ours is later on both available signals:

  - **Timestamp** — `2026-09-09T21:32:49` vs `2026-08-31T21:54:37`, nine days later. `xgd ticket history request-909e42f8` confirms the HEAD-side value arrives via commit `3bb3a8c547` (`seed_local_overlay`), authored Wed Sep 9 2026.
  - **Lifecycle position** — `bundled` is downstream of `free_coding` on the ticket status progression (`draft → free_coding → … → bundled`). Ours additionally carries the artefacts of having passed through and beyond that stage: `commits` (`858d63202f`, `c056002a52`), `version: 0.2.22`, `bundled_in: bundle-87be4669`, and the "What landed" implementation report.

  Taking theirs would have regressed a bundled ticket back to `free_coding` and rewound `updated_at` by nine days. Theirs contributes no field that ours does not already supersede, so the per-fact rule resolves uniformly to ours; no field was taken from the incoming side.

## Incoming changes preserved

- `.xgd/tickets/hot/request-909e42f8.md` — this is a bookkeeping ticket, not a code file, so STEP 3's "incoming changes must appear in the resolved version" check does not apply in its literal form. Recording the disposition explicitly for the audit trail: the incoming side's three field values (`status: free_coding`, `updated_at: 2026-08-31T21:54:37`, `last_field_updated: status`) are **deliberately not present** in the resolved file. That is the correct outcome of STEP 2e's later-positioned-intent rule on a genuine same-fact conflict — the ticket's own ledger has since advanced past `free_coding` — and not a discard of developer code. `git show 1bc13abacf -- <path>` touches nothing outside those three lines; no body prose, no other frontmatter key, no `fields` entry.

No hunks were dropped under the BUG-1301 precedence exception. No code files and no test functions were involved on either side.

## Resolution mechanics

Note for future attempts on this path: unlike the previous conflict on the same file, the working-tree copy **was** materialized here with live `<<<<<<<`/`>>>>>>>` markers despite the sparse-checkout rules (`/*`, `!/.xgd/tickets/`, `!/.xgd/tickets/**`) nominally excluding it. Resolution therefore required both halves:

1. `git update-index --add --cacheinfo 100644,3b6c6a92…,<path>` — collapse the three index stages onto the ours blob.
2. `git checkout -- <path>` — rewrite the worktree copy from that resolved index entry, clearing the markers.

Verified afterwards: `grep -c '<<<<<<<\|>>>>>>>'` returns `0`; `git status --porcelain` is empty; `git ls-files -u` reports no unmerged stages.

## Note for the finalize step

The staged tree is byte-identical to HEAD (`git diff --cached HEAD` is empty) — ours already sits downstream of the incoming status change, so this cherry-pick is now empty. `CHERRY_PICK_HEAD` is intact at `1bc13abacfcb0d4a4346d4960a0cc65fed8e8691`. Per instruction, `--continue`/`--skip`/`--quit`/`--abort` were NOT invoked; finalize should detect the clean staged diff and skip the commit.
