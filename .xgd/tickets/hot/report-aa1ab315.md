---
uid: report-aa1ab315
id: REPORT-5244
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T01:37:24.405837+00:00'
updated_at: '2026-09-28T01:37:24.405837+00:00'
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
  `e74606d80dba6cfadcf7a0d7277e55846162edae`.

  Out of the sparse-checkout cone and not materialized in the working tree
  (DOC-986 §2/§4.1 — index-only conflict, no markers on disk). Resolved through
  the index path: `git checkout --ours` (materializes but leaves the three stages
  and the `UU`), then `git add --sparse` to collapse them.

  **Third consecutive commit in the same incoming chain.** Stage 1 (base) here is
  `92fad09833`, which was the *incoming* blob of attempt 39; that attempt's base
  was in turn attempt 38's incoming blob. HEAD is unchanged at `8170d68306`
  throughout — attempt 39 resolved to a zero net diff and finalize skipped it, as
  designed. Each of these commits advances only the ticket's own lifecycle
  frontmatter; this one touches **frontmatter only** (no body hunks in
  `git diff <stage2> <stage3>`).

  Per-fact resolution:

  | fact | ours (HEAD `8170d68306`) | incoming (`e74606d80d`) | taken |
  |---|---|---|---|
  | `fields.commits` (`working_sha ea48502d0d90…`, `reconcile_sha: null`, `main_sha: null`) | present | newly added, **byte-identical** | **already present in ours — incoming's addition satisfied** |
  | `fields.version` | `0.2.10` | `0.2.10` (newly added) | **already identical — satisfied** |
  | `fields.story_points` | `3` | `3` | identical |
  | `last_field_updated` | `status` | `status` | identical |
  | `status` | `free_and_reconciled` | `free_coded` | ours (downstream) |
  | `completed_at` | `2026-08-31T19:19:38Z` | `null` | ours |
  | `updated_at` | `2026-08-31T19:19:38Z` | `2026-08-24T01:50:12Z` | ours (later) |
  | `fields.bundled_in` | `bundle-78f4e2fe` | absent | ours |
  | EOF newline | present | absent | ours |

  Everything this incoming commit *adds* — the `commits` entry and
  `version: 0.2.10` — is **already present in ours byte-identically**, so keeping
  ours discards nothing. What is not taken is only the regressive reading of the
  same lifecycle facts: `free_coded` is an earlier state than HEAD's
  `free_and_reconciled` (the chain across these three attempts runs
  `draft → free_coding → free_coded`, all upstream of HEAD), `completed_at: null`
  predates completion, and `updated_at` is a week earlier. HEAD additionally
  carries `bundled_in: bundle-78f4e2fe`, which incoming predates; taking incoming
  per those facts would have regressed the ticket and dropped the bundling record.

  Note the `commits` entry both sides agree on names
  `working_sha ea48502d0d90bb607ac528e34099e71eaab6df40` — the pre-remap sha of
  this very free-coded work, remapped to `ae82bdfe21e9…` in the anchor's
  `orphan_commits`. That is corroborating evidence that HEAD's
  `free_and_reconciled` state is the downstream continuation of exactly this
  ticket's work, not a competing edit.

  **EOF newline.** Incoming again lacks the terminating newline that ours has. This
  single byte has flip-flopped across consecutive commits in this chain (attempt
  38's incoming had it, attempt 39's and this one do not), so it carries no
  developer intent; kept ours, which has it and is POSIX-correct.

  **Net staged change is zero:** staged blob is `6d962ce5db`, byte-identical to
  `HEAD:.xgd/tickets/hot/bug-db356ff8.md`, and `git status --porcelain` is empty.
  Per STEP 4 I did **not** call `--skip`; finalize owns that decision.

## Incoming changes preserved

Confirmed. `git diff e74606d80d -- .xgd/tickets/hot/bug-db356ff8.md` against the
staged resolution shows **only** the lifecycle facts tabled above — the resolution
is a strict superset of the incoming blob. Every line incoming adds relative to its
base is present in the result (`commits`, `version: 0.2.10`); the sole divergences
are HEAD's downstream lifecycle metadata that incoming predates, plus the
flip-flopping EOF byte.

No hunk was dropped, so the BUG-1301 precedence exception was not invoked. No UAT
test function was touched: this conflict is confined to a single markdown ticket
file. The five UATs the ticket *narrates* live in
`tests/test_UAT_FC_BUG-36_tenant_bootstrap.workers.test.ts`, which is not part of
this conflict and was not modified.

The in-progress cherry-pick was left paused: `CHERRY_PICK_HEAD` is still
`e74606d80dba6cfadcf7a0d7277e55846162edae`, `git ls-files -u` is empty, and no
`--continue` / `--skip` / `--quit` / `--abort` was issued.
