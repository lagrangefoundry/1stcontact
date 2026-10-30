---
uid: report-d62fd1aa
id: REPORT-5243
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T01:34:59.317192+00:00'
updated_at: '2026-09-28T01:34:59.317192+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` (BUG-36) — **UU**, intent/bookkeeping ticket
  (`bug-*`), so STEP 2e per-fact rules. Incoming commit
  `c1d2a2ff872a6fcda07f1f2e7c8d1ec51fa87f1b`.

  Out of the sparse-checkout cone and **not materialized in the working tree** at
  all this time (DOC-986 §2/§4.1 — the conflict existed only in the index, with no
  markers on disk; `grep` reported "No such file or directory"). Resolved through
  the index path: `git checkout --ours` (which writes the file but, per prior
  observation, leaves all three stages and the `UU` intact), then
  `git add --sparse` to collapse them.

  This is the **next commit in the same incoming chain** as the previous attempt:
  stage 1 (base) here is `8f92f71286`, which was the *incoming* blob of the
  preceding attempt. The new commit advances the ticket's own lifecycle one notch.
  It touches **frontmatter only** — `git diff <stage2> <stage3>` shows no body
  hunks whatsoever. Per-fact resolution:

  | fact | ours (HEAD `8170d68306`) | incoming (`c1d2a2ff87`) | taken |
  |---|---|---|---|
  | `fields.story_points` | `3` | `3` (newly added) | **already present in ours — incoming's addition is satisfied** |
  | `last_field_updated` | `status` | `status` (changed from `body`) | **already agrees — satisfied** |
  | `status` | `free_and_reconciled` | `free_coding` | ours (downstream) |
  | `completed_at` | `2026-08-31T19:19:38Z` | `null` | ours |
  | `updated_at` | `2026-08-31T19:19:38Z` | `2026-08-24T01:48:29Z` | ours (later) |
  | `fields.commits` / `version: 0.2.10` / `bundled_in: bundle-78f4e2fe` | present | absent | ours |
  | EOF newline | present | removed | ours (see below) |

  The two substantive things this incoming commit contributes — `story_points: 3`
  and `last_field_updated: status` — are **already present in ours verbatim**, so
  nothing is lost by keeping ours. What is not taken is only the *regressive*
  reading of the same lifecycle facts: `free_coding` is an earlier state than
  HEAD's `free_and_reconciled`, `completed_at: null` predates completion, and
  `updated_at` is a week earlier. HEAD additionally carries `commits`
  (`working_sha ea48502d0d90bb607ac528e34099e71eaab6df40` — the pre-remap sha of
  this very free-coded work, remapped to `ae82bdfe21e9…` in the anchor's
  `orphan_commits`), `version`, and `bundled_in`, which incoming simply predates.
  Taking incoming per those facts would have regressed the ticket and dropped the
  bundling record.

  **EOF newline.** Incoming *removes* the terminating newline that its own
  immediate predecessor in this chain had added (base `8f92f71286` has it;
  incoming `92fad09833` does not). The chain flip-flops on this single byte across
  consecutive commits, so it carries no developer intent; kept ours, which has it
  and is POSIX-correct.

  **Net staged change is zero:** the staged blob is `6d962ce5db`, byte-identical
  to `HEAD:.xgd/tickets/hot/bug-db356ff8.md`, and `git status --porcelain` is
  empty. Per STEP 4 I did **not** call `--skip`; finalize owns that decision.

## Incoming changes preserved

Confirmed. `git diff c1d2a2ff87 -- .xgd/tickets/hot/bug-db356ff8.md` against the
staged resolution shows **only** the frontmatter lifecycle facts tabled above —
the resolution is a strict superset of the incoming blob. Every line incoming adds
relative to its base is present in the result (`story_points: 3`,
`last_field_updated: status`); the sole divergences are HEAD's downstream
lifecycle metadata that incoming predates, plus the flip-flopping EOF byte.

No hunk was dropped, so the BUG-1301 precedence exception was not invoked. No UAT
test function was touched: this conflict is confined to a single markdown ticket
file. The five UATs the ticket *narrates* live in
`tests/test_UAT_FC_BUG-36_tenant_bootstrap.workers.test.ts`, which is not part of
this conflict and was not modified.

The in-progress cherry-pick was left paused: `CHERRY_PICK_HEAD` is still
`c1d2a2ff872a6fcda07f1f2e7c8d1ec51fa87f1b`, `git ls-files -u` is empty, and no
`--continue` / `--skip` / `--quit` / `--abort` was issued.
