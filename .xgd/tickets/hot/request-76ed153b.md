---
uid: request-76ed153b
id: REQ-454
type: request
title: 'Builder replay (REQ-452 follow-up): record the design and finished copy with
  each case, run pre-design history under today''s rules, score craft checks / off-system
  / copy altered, record test businesses by default'
created_by: EPIC-19
created_at: '2026-10-24T23:42:27.338803+00:00'
updated_at: '2026-10-25T01:05:43.692998+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-0923bb64
  story_points: 5
  blocked_by:
  - request-2f9b6446
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-2c3cb935
  commits:
  - working_sha: 754da722e634fa7c5432d41bcc358f1eb4b941ca
    reconcile_sha: null
    main_sha: null
  - working_sha: 8f20c93c4ddd720d105435039d7e6d99a261821e
    reconcile_sha: null
    main_sha: null
  version: 0.2.629
---

## Why

Follow-up to **REQ-452** (builder replay evaluation). The operator chose options
1 and 2: replay the historical builds (Bob's Salon, Ariel's, Dina's Diner) and
record an exact snapshot at every delegation from now on.

Since REQ-452 was written, the system the briefs run in has changed:
- REQ-446: the principal writes the copy, and builders place it unchanged;
- REQ-447: `site.design` replaces `textStyles`;
- REQ-448: a first build is refused until the design is written;
- REQ-449: craft checks judge pages against the design.

REQ-452's scores and records don't yet reflect that, and historical cases need
care to run under the new rules. Builders already run on Haiku 5.5 (REQ-451), and
no 4.5 baseline is wanted: 5.5 is cheaper and considered better.

## What changes

### 1. Each recorded case carries what it was written for

- The snapshot recorded at each delegation (REQ-452 option 2) includes the
  site's **`site.design` as it stood** (its version or the object itself), and the
  exact `Delegate` input including the **finished copy** the principal gave
  (REQ-446).
- A case replays against the design it was written for, not today's.

### 2. Historical cases run under today's rules without false refusals

- Snapshots rebuilt from history (option 1) predate `site.design`. When a case is
  loaded, it gets REQ-447's migration (a design derived from what the site had),
  so the replay does not hit REQ-448's `design_first` refusal, and nothing renders
  differently from the original.
- Such a case is marked **pre-design** in the report, so its results are read as
  "old-style brief" and can be filtered out.
- A historical brief that asks the builder to write copy, or to touch fields
  REQ-447 removed, is kept and reported as such. It is not silently rewritten.

### 3. Scores for what we just built

Added to REQ-452's per-run scores and per-configuration aggregates:
- **Craft-check findings** (REQ-449) and **off-system counts** (REQ-447) per page,
  as a change from the snapshot, under "page health after the run".
- **Copy altered:** text the builder changed, reordered or removed relative to
  the brief's finished copy. REQ-446 forbids it. A shortening the builder reported
  as needed is counted separately from an unreported change.
- **Design writes refused:** a builder's attempt to write `site.design` (REQ-448
  refuses it) is counted.

### 4. Record test and dev businesses only, by default

- Snapshots and briefs contain client content. Recording (option 2) is on for
  REQ-450 first-draft test businesses and dev sites by default. For a real client
  business it is an explicit operator opt-in per business. This follows the
  platform's PII principle of collecting only what's needed.
- Recorded cases are kept where the tenant's data is kept, and deleted with the
  business.

## Test plan

`tests/test_UAT_FC_REQ-454_replay_scores_the_new_system.*`, using the scripted fake
model client:

- A delegation recorded after this lands carries the design and the brief's
  finished copy. Replaying it uses that design.
- A pre-design historical case loads with a migrated design and runs without a
  `design_first` refusal, and the report marks it pre-design.
- A scripted builder that rewrites a sentence of the brief's copy is reported
  under "copy altered". One that reports a needed shortening is counted
  separately.
- A scripted builder that tries to write `site.design` is counted as a refused
  design write.
- Page health includes craft-check findings and off-system counts.
- Recording is on for a REQ-450 test business, off for a real business without
  opt-in, and on after opt-in.
- Re-run REQ-452's UATs.


## Decisions (2026-10-24, implementation session)

REQ-452 landed first (`a2b1dafd2d`). It dropped the historical import (option 1) after measuring it. Each of the four parts above is built on what it shipped:

- **§1 is mostly already true.** A REQ-452 case keeps the draft's `site.json` raw, so it carries `site.design` as it stood. It also keeps the exact `Delegate` input, whose finished copy (REQ-446) lies in the brief and in its host-settled "contains the text '…'" checks. The case is materialised exactly, so a replay builds against the case's own design and never today's. This ticket adds a UAT that pins this.
- **§2 applies to any case whose recorded draft predates `site.design`**, since no history-rebuilt cases exist. The test is REQ-447's `isLegacyDesignBase` on the case's `site.json`, which matches a site still stored in the old shape when its delegation was recorded. When such a case is loaded for a run:
  - REQ-447's `migrateSiteToDesign` is applied to the in-memory draft. Nothing renders differently, and the stored case is not rewritten.
  - If the case's plan has neither `design_at` nor `first_pass_at`, the replay's copy of the plan gets `design_at` stamped, so `design_first` does not refuse it.
  - The run is marked `pre_design`. `--skip-pre-design` leaves such cases out.
  - The brief is flagged, never rewritten, when it asks the builder to write words (`asks_for_copy`) or names a field REQ-447 removed (`textStyles`, `textDefault`, `rhythm`).
- **§3 scores:**
  - **Page health** gains per-page **off-system counts**, from the census the critic already uses (`l1OffSystemValues`, now one shared function), and **craft-check findings**: the layout-check kinds REQ-449 judges against the design (`loose_heading`, `block_gap`, `edges`, `row_tops`, `row_heights`, `cropped_subject`, `off_system`). Both are shown before and after the run, with aggregate deltas. Craft findings need a browser, as layout findings do, and are `null` when none could look.
  - **Copy altered:** each passage of finished copy is one of the brief's "contains the text '…'" checks. It is settled against the page after the run with the host's own `settleText`, and one that no longer holds counts as altered. Words reordered or shortened inside a passage fall out of the match and so count. The order of passages relative to each other is not judged. A change counts as **reported** when the builder's report (summary, decisions or failed reasons) quotes the passage, or its first eight words; otherwise it is unreported.
  - **Design writes refused:** counted from the builder's audit lines, a `NOT_YOURS` refusal on a design setting (REQ-448).
- **§4 recording policy.** On the Worker, a delegation is saved as a case only when one of these holds:
  - the deployment sets `RECORD_BUILDER_CASES = "1"` (top-level and `env.dev` vars; absent from production);
  - the site's plan carries REQ-450's `first_draft_copy` marker;
  - the operator has opted the business in. The opt-in is the plan ticket field `record_builder_cases: true`, set with `POST /api/admin/businesses/record-cases {business, record}` on the same admin gate as provisioning.

  The local Node host always records: it is the operator's own machine. Cases stay under `cases/<tenant>/` in R2, the tenant's own prefix. No business-deletion path exists yet, so nothing deletes them yet; when deletion is built, it clears that prefix.
- REQ-452's Worker UAT now sets `RECORD_BUILDER_CASES`, since recording is no longer unconditional.


## As landed

- **§1.** Unchanged code: the case's raw `site.json` (with `design`) and its exact `Delegate` input carry what the brief was written for. A UAT changes the live site's design after recording and shows that the replay's checks are judged against the case's design.
- **§2.** `loadCase` in `tools/generate/src/cli/eval-builder.ts` is applied in `runCase` and by `evaluate`'s `--skip-pre-design` filter. The run fields `pre_design` and `brief_flags` appear in the report, in the per-run "brief" column and the `pre-design runs` row.
- **§3.**
  - `RunScores.copy` holds `passages`, `altered_reported` and `altered_unreported`.
  - `RunScores.design_writes_refused` is new.
  - `PageHealth` gains `off_system` and `craft`, both per page slug; `craft` is `null` without a browser.
  - The summary and table gain rows for each: `craft-check findings Δ`, `off-system values Δ`, `copy passages in briefs`, `copy altered, reported` / `unreported`, `design writes refused` and `pre-design runs`.
  - `RunOptions.layoutChecker` lets a caller supply the checker; it is a browser at the edge.
  - `l1PageOffSystemCount` (site-schema) is the per-page census, now shared by the critic path in `host-core.ts`.
- **§4.**
  - `HostDeps.cases.record(site)` decides whether a delegation is recorded at all; absent means all are (the Node host).
  - The Worker's rule is `RECORD_BUILDER_CASES === "1"` (top-level and `env.dev` vars `"1"`; `[env.production.vars]` repeats it **empty**, as the var-repetition pins require), or `recordsBuilderCases(tickets, site)` in `apps/control-app/src/first-draft.ts`: the plan ticket carries `first_draft_copy` or `record_builder_cases: true`.
  - The opt-in is `POST /api/admin/businesses/record-cases {business, record}`, which goes through `setRecordsBuilderCases` and answers `{business, record, recorded}`. It uses the provisioning admin gate and gives a 404 to anyone else.
  - There is no UI toggle yet; the operator calls the route.
- **Tests:**
  - `tests/test_UAT_FC_REQ-454_replay_scores_the_new_system.test.ts` covers the design and copy a case carries, pre-design loading, flags and skip, copy altered (reported and unreported), refused design writes, and craft and off-system page health.
  - `tests/test_UAT_FC_REQ-454_replay_scores_the_new_system.workers.test.ts` covers a real business recorded only after opt-in (and not after opt-out; non-operators get 404), a first-draft test business recorded by default, and a dev deployment recording a real business.
  - REQ-452's UATs were re-run and pass. Its Worker UAT now sets `RECORD_BUILDER_CASES: '1'`.