---
uid: report-71275cae
id: REPORT-3855
type: report
title: 'Fix Site Control Surface: Declared, Granted, Validated & Audited (uat) — attempt
  3'
created_by: xgd
created_at: '2026-09-11T01:39:14.637145+00:00'
updated_at: '2026-09-11T01:39:14.637145+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-00e77e55
  level: uat
  fixes_applied: 10
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Site Control Surface: Declared, Granted, Validated & Audited (uat)

**Attempt**: 3
**Fixes applied this call**: 10
**Violations remaining**: 0
**Needs more work**: false

Both findings in REPORT-84199eb5 are closed. The violation (finding 1, AC-1411
coverage) is closed by a new AC-named workerd suite whose four tests cover all
four of the criterion's clauses and **all four pass**. The warning (finding 2,
AC-1073 disjointness + the stale `publish` comment) is closed in the same call,
including the four copy-pasted copies of the stale sentence in sibling suites.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-1411 | New suite `tests/reconciliation-assistant-control-surface-audit.workers.test.ts` — the workerd companion to the AC-named node suite, because AC-1411 is the one criterion in this capability that cannot be established off workerd |
| 2 | uat-add | AC-1411 clause 1 | `test_UAT_AC1411_the_trail_survives_the_host_that_wrote_it` — a real turn that **changes** the site (`add_page`, not a read), then `resetAiHost()`/`resetChatHost()`, then the record read back out of R2 and asserted in full: surface, effect `write`, `params.page`, `policy.decision: allow`, `outcome.ok`, `session` |
| 3 | uat-add | AC-1411 clause 2 | `test_UAT_AC1411_two_turns_at_once_lose_none_of_each_others_records` — **two real turns driven concurrently through the route** (not two direct `flushAudit` calls), each changing a different site. Asserts the stored delta is exactly the sum (2) and that every record from each is present (`params.page` set `['alpha','beta']`), so a fold shows fewer and fails |
| 4 | uat-add | AC-1411 clause 3 | `test_UAT_AC1411_a_turn_that_dies_part_way_still_records_what_it_managed_to_do` — the tool call runs, then the model stream throws. Asserts the failure arrived as a *frame* (status 200, the message in the SSE text, a final `done`) and that the `add_page` record is in R2 anyway. This is `router.ts:700-709`'s `finally` placement made executable |
| 5 | uat-add | AC-1411 clause 4 | `test_UAT_AC1411_a_failed_durable_write_does_not_also_fail_the_turn` — R2 made to refuse writes **under the `audit/` prefix only**, so the injected failure is exactly the one the criterion names. Asserts the turn's own answer still reached the caller in full, and that the trail is empty — the declared cost, not a silent one. This forces the bare `catch` at `router.ts:704-708` |
| 6 | uat-edit | AC-1073 | `test_UAT_AC1073_…` now captures the two halves separately (`core`, `host`), asserts `core.filter((op) => host.includes(op))` is `[]` **before** composing them, and builds `callable` from the two captured lists instead of a spread merge. The spread silently collapsed any overlap, so the union was identical whether the halves were disjoint or not |
| 7 | uat-edit | `tests/reconciliation-assistant-control-surface.test.ts` | Corrected the stale sentence: `nodeOperations` supplies **one** disk-bound operation (`add_asset`), not two — `publish` graduated to the portable core in REQ-149 |
| 8 | uat-edit | `tests/test_UAT_FC_REQ-126_l1_surface.test.ts:171` | Same correction (copy 2 of 5) |
| 9 | uat-edit | `tests/test_UAT_FC_REQ-129_l1_authoring.test.ts:437` | Same correction (copy 3 of 5) |
| 10 | uat-edit | `tests/reconciliation-page-composition-surface.test.ts:618` and `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:600` | Same correction (copies 4 and 5 of 5) |

## Evidence — tests actually executed this call

| Command | Result |
|---|---|
| `npm test -- tests/reconciliation-assistant-control-surface-audit.workers.test.ts tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts` | **13 passed / 13** (2 files), incl. all four `test_UAT_AC1411_*`, each tagged `\|workers\|` — i.e. inside workerd |
| `npm test -- tests/reconciliation-assistant-control-surface.test.ts` | **13 passed / 13**, 446ms — the new disjointness assertion passes, so the two halves are in fact disjoint today |
| `npm test -- tests/test_UAT_FC_REQ-126_l1_surface.test.ts tests/test_UAT_FC_REQ-129_l1_authoring.test.ts tests/reconciliation-page-composition-surface.test.ts` | **39 passed / 39** |
| `npm test -- tests/test_UAT_FC_REQ-130_beyond_l1.test.ts` | **18 passed / 18** |

**The report's sandbox caveat did not hold, and that is worth recording.**
REPORT-84199eb5 stated the workerd project "cannot run in this sandbox — it dies
at `Error: listen EPERM … 127.0.0.1` before any test executes", and advised
asserting clause 4 against `flushAudit` with a rejecting `R2Bucket` double
instead of driving the real route. That was not necessary: the only EPERM this
run is wrangler failing to write its own debug log
(`~/Library/Preferences/.wrangler/logs/…`), which is non-fatal — miniflare boots
and the suite runs. So **all four clauses are asserted against the real route**,
including clauses 3 and 4, and none of them is carried by a double standing in
for internal code.

**Non-vacuity.** Each case fails for its own reason if the behaviour regresses,
and each was observed doing real work: clause 3's assertion on the SSE text
(`toContain('mid-turn')`) only passes because the throw genuinely escaped
`streamPrompt` into the router's catch; clause 4's `toHaveLength(0)` on the audit
prefix only passes because the injected R2 refusal genuinely fired, while the
assistant's own words still reached the caller in the same turn.

## Doubles used, and why each is at an external boundary

| Double | Boundary | Why it is allowed |
|---|---|---|
| `scripted-model-client` (shared, BUG-39) | the Anthropic network client | The seam the AI library's backend is written to have injected; every suite in this area uses the same transcription |
| `perTurnClient` (new, in-file) | same boundary | The shared script advances one index, so two concurrent turns consume each other's steps. This one reads the request it was handed and answers per turn. Its events still come from the shared `calls`/`says` transcription — it is a dispatch change, not a second protocol |
| `auditWritesRefused` (new, in-file) | R2 | Prefix-scoped to `audit/` on purpose: a bucket refusing every write would break the transcript (`chat/`) and the store (`draft/`) and the case would pass proving nothing. Clause 4 has no other way to observe a failed durable write |

## Code Edits (if any)

None this call. No production file was touched; `apps/control-app/src/router.ts`
and `apps/control-app/src/ai.ts` were read only. The two behaviours the report
called "carried by prose alone" turned out to be implemented correctly — the new
tests pass against unmodified code, which is the outcome a coverage gap (rather
than a defect) should produce.

## Deliberately not done

- **`uat_coverage` on AC-1411 was NOT set.** That field is owned by
  check/fix_uat_coverage. REPORT-3835 and REPORT-3845 both made this call; this
  is the fourth cycle to reach it and the note in REPORT-84199eb5 asked that it
  not be re-derived again. The tests now exist and pass, so the owning cycle has
  something real to record.
- **AC-1411's `status: pending` left alone.** The report states it is not drift
  and is not why the level failed.
- **Finding 4's FC↔AC clone pair left in place.** The report raised it as `info`
  with resolution `none` and explained why deleting either side would cost
  regression coverage. Its one real cost — the stale `publish` sentence in five
  files — is what items 7-10 above fix.

## needs_review Items Forwarded

None. No finding in REPORT-84199eb5 was categorised `needs_review`.
