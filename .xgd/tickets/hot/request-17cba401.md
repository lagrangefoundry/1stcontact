---
uid: request-17cba401
id: REQ-438
type: request
title: 'Spend: meter the critic per request and tag the spend each review causes,
  so an AI session can weigh its cost against its findings'
created_by: EPIC-19
created_at: '2026-10-23T17:29:11.176871+00:00'
updated_at: '2026-10-23T18:38:16.959110+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 3
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-86e8b285
  commits:
  - working_sha: 8f0d18299a168611c1fdf1f5c96d864036067bb3
    reconcile_sha: null
    main_sha: null
  - working_sha: e0ea5cd5447aa40abbbbff7895fddffbce62c343
    reconcile_sha: null
    main_sha: null
  version: 0.2.600
---

## Why

The operator wants to judge the critic's (REQ-427) cost against its benefit.
Today that cannot be done from the data:

- **The critic has no per-request spend rows.** On Ariel's site since 2026-10-22,
  `request_spend` holds the consultant (86 requests, $14.55) and the builders
  (659, $10.59), and nothing for `role = critic` / `backend = claude_critic`. So
  the critic is missing from BUG-254's live meter and from per-message spend.
- **Its usage exists only inside the consultant's `turn_spend.attributed` JSON**,
  as an entry `{session: "critic_…", role: "critic", backend: "claude_critic",
  usage}`, with no `cost_micros`. It was found for 3 of 4 reviews. Whether it is
  in the turn's `cost_micros` total is unclear.
- **Nothing links spend to a review.** A review's real cost is mostly the
  consultant's answering work and the builder runs that fix its findings during
  the hold it creates. None of that is tagged with the review that caused it.

The operator: "the critic can roll up with everything else, so long as the data
is there for an AI session to do the analysis." So: no separate display and no
report screen. The critic's spend rolls up into the same totals as everything
else. What this ticket adds is complete, joinable data.

## What changes

### 1. The critic is metered like every other model call

- Every critic request writes a `request_spend` row with `role = critic`,
  `backend = claude_critic`, the model, tokens, `cost_micros` priced from
  `prices.json`, `delegated_by` = the consultant turn that ran the review, and
  `trigger` = the review id (`C1`, `C2`, …). It is written live, the same way
  BUG-254 records the others.
- The consultant turn's `turn_spend` total includes the critic's cost exactly
  once (not missing, not counted twice). Per-message spend (REQ-409) therefore
  includes it with no separate line.
- Any other session the host opens outside the metered path (check the talker
  and anything else opened like the critic) gets the same treatment. The ticket
  session lists what it found.

### 2. Spend caused by a review is tagged with the review

- From the moment a review is recorded until its hold ends (every finding
  answered), every request the hold causes carries that review id. That covers
  the consultant's own requests in the continuation turns and the builders it
  delegates there. The tag goes in an existing column (for example `trigger`), or
  a new nullable `review_id`, chosen so a query can sum "spend caused by `C2`".
- Spend that is not caused by a review is not tagged.

### 3. The review record is complete enough to join

- Each `plan.fields.critique.runs[]` entry already holds id, time, trigger,
  pages, verdict and findings with answers. It also records the consultant turn
  id that ran it, and when its hold ended. Then a session can join reviews to
  `request_spend`/`turn_spend` with no guessing.
- A short note in the ticket's "What landed" gives the joins for an AI analysis
  session: which tables, which keys, and how to get direct cost, induced cost,
  and findings by severity and answer per review.

## Test plan

`tests/test_UAT_FC_REQ-438_critic_spend_is_recorded.*`, workers harness with a
scripted critic and builder:

- A review writes `request_spend` rows with `role = critic`, a non-null
  `cost_micros`, `delegated_by` the consultant turn, and the review id.
- The consultant turn's `turn_spend.cost_micros` equals the sum of its requests
  including the critic's, counted once.
- Requests in the review's hold (consultant continuation and a delegated builder)
  carry the review id. A request after the hold ends does not.
- The review record carries its consultant turn id and hold end time.
- Re-run the BUG-254 spend, REQ-409 meter and REQ-427 critic UATs.


## What landed

### Metering (item 1)

- The critic's backend (`claude_critic`) now has a live request sink, like a
  builder's. Each critic request writes a `request_spend` row: `role = critic`,
  `backend = claude_critic`, `session_id` = the critic's session, `turn_id` =
  a turn minted for that review, `delegated_by` = the consultant turn in flight,
  `cost_micros` priced from `prices.json`, `review_id` = the review id.
- **Counted once.** `turn_spend.cost_micros` stays the consultant's own cost.
  Nothing else is folded into it, because the price key is per backend. A turn's
  total is `principalMicros + delegatedMicros` (`tenantTurnCosts`, which the
  console and per-message spend read). The delegated half already counts each
  delegated session once: its `attributed` entry if the turn's row lists it, or
  else its `request_spend` rows (`unattributed`, matched by session id). The
  critic's attributed entry and its new rows use the same session id, so the
  critic is counted in that total once whether or not the entry landed. That
  covers the "3 of 4 reviews" gap. The UAT checks that total = the sum of every
  `request_spend` row with `turn_id = T OR delegated_by = T`.
- **Other sessions outside the metered path:** the critic was the only one. The
  talker, the coordinator and the settings conversation open their turns through
  the turn function and are metered when the turn closes (off `turn_end`), not
  live. That already gives them rows. Making them live is not in scope here.

### Review tagging (item 2)

- New nullable column `request_spend.review_id` (migration
  `0031_request_spend_review.sql`, index `(tenant_id, review_id)`). `trigger`
  was not reused because it already holds REQ-218's verbatim request cause.
- The host keeps the review each site is in the hold of. It is set when a
  critique with at least one finding is recorded, and cleared when its last
  finding is answered (the plan's `critic.held` hook). It is also re-read from
  the plan at the start of every consultant turn, so continuations and a fresh
  isolate still tag correctly. While a review holds, every consultant request
  and every builder request carries its id. A request completes before its tool
  runs, so the request that calls `critique` is not tagged, the one that sends
  the last `answer_finding` is tagged, and the one after it is not.
- A review that finds nothing creates no hold. Only the critic's own rows carry
  its id.

### Review record (item 3)

`plan.fields.critique.runs[]` entries now also carry:
- `turn`: the consultant `turn_spend.turn_id` that ran the review. It equals the
  critic rows' `delegated_by`.
- `held_until`: when the hold ended. That is the last finding's `answer.at`, or
  the run's own `at` if it found nothing. It is absent while a finding is still
  unanswered.

### Joins for an analysis session

Everything is tenant-scoped (`tenant_id` = business id). The plan is the site's
plan ticket (`fields.critique.runs[]`).

- **Direct cost of review `Cn`:**
  `SELECT SUM(cost_micros) FROM request_spend WHERE tenant_id=? AND role='critic' AND review_id='Cn'`
  (one row per critic request, so this is also its tokens).
- **Induced cost of `Cn`** (consultant answering plus builder fixes in the hold):
  `SELECT role, SUM(cost_micros), COUNT(*) FROM request_spend WHERE tenant_id=? AND review_id='Cn' AND role<>'critic' GROUP BY role`.
- **The turn that ran it:** `run.turn` = `turn_spend.turn_id`. Its total (all
  roles, counted once) is `tenantTurnCosts` for that id, or the sum of
  `request_spend.cost_micros` with `turn_id = run.turn OR delegated_by = run.turn`.
- **Findings:** `run.findings[]`, each with `severity`, `lens` and
  `answer.kind` (`fixed` | `decision` | `dismissed`). Group them by those fields
  and set the totals above beside them. The hold's time span is `run.at` to
  `run.held_until`.
- Review ids are per site, not per tenant (`C1` restarts on every site), so join
  on the site's sessions too (`session_id` / `delegated_by` belonging to that
  site's consultant session) when a tenant has more than one site.
- Rows written before 2026-10-23 have `review_id` NULL, and their critic spend
  is only in `turn_spend.attributed`.

### Tests

`tests/test_UAT_FC_REQ-438_critic_spend_is_recorded.workers.test.ts`:
- `a_review_is_metered_counted_once_and_its_hold_tagged`: a critic row with a
  priced cost, `delegated_by` = the consultant turn, and `review_id = C1`. The
  turn total equals the sum of its request rows. Consultant review ids in order
  are `[null, null, C1, C1, null]`. The first builder is untagged and the
  builder in the hold is tagged `C1`. The run carries `turn` and `held_until`.
- `a_review_that_finds_nothing_holds_nothing`: only the critic row is tagged,
  and `held_until = at`.

Re-run with no regressions: BUG-145, BUG-166, BUG-232, BUG-254, BUG-258,
REQ-292, REQ-293, REQ-297, REQ-409, REQ-415, REQ-427, REQ-436, and every workers
suite that delegates or meters. Separately,
`REQ-292_a_host_with_no_meter_still_completes_a_turn` fails before and after
this change, on the upstream `logDir` → `junctions` rename.