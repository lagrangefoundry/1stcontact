---
uid: bug-4c3f7e10
id: BUG-232
type: bug
title: 'Spend meter: a turn that ends by throwing records its own spend as zero'
created_by: EPIC-20
created_at: '2026-10-20T00:10:31.544851+00:00'
updated_at: '2026-10-20T02:12:59.828724+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  severity: high
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-93ef3f50
---

## Symptom

A consultant turn that ends by throwing records its own spend as zero. Its `turn_spend` row has four zero counters, `requests 0` and `cost_micros NULL`, even though it ran for minutes and made real API requests.

Observed on Bob's Salon 2 (local dev D1, tenant `biz_1fa3e4ce5d6cead69027d7f879113188`), 2026-10-18, 15:07–16:29 PDT. Five turns failed with `Unexpected token 'g', "guWid6rN1D"... is not valid JSON` after running 1.3–8.6 minutes each. All five rows read zero for the consultant. Their seven delegated workers ($2.36 at Haiku rates) were recorded, through the BUG-145 attribution path. The consultant's own Opus spend on those turns is recorded nowhere. At this session's ~$0.10 per consultant request, that's probably $2–5.

The JSON error itself is believed fixed. This bug is about the meter: whatever ends a turn by throwing, its spend must not be lost.

## Root cause

The tokens aren't lost upstream any more. Framework BUG-73 (`f1207de2`, installed) made the tool loop emit its spend before rethrowing (`api_tools.js` ~1505–1511). The manager takes that spend off the adapter's terminal event and writes it onto the junction's `turn_end` record (`manager.js` ~1326–1350, and the `finally` that appends `turn_end`). On a throw it then rethrows **without** emitting its own terminal `done` event.

This host only reads a turn's spend from that terminal event (`spendMeta = event.meta` in `host-core.ts`, in both streaming paths, ~3847 and ~4136). On a throw it never arrives, so `spendMeta` is `undefined`, and `writeTurnSpend` writes the zero row. The comment in that `finally` says this gap is upstream's ("the adapter's own per-segment ledger has them and the manager's `turn_end` does not"). That stopped being true when BUG-73 landed.

The host already reads `turn_end` for exactly this kind of exit: `turnAttributions()` reads `attributed` off it because that survives exits the terminal event doesn't (BUG-145). The turn's own spend now sits on the same record.

## Fix

When a turn ends without a terminal event carrying spend, take the turn's own spend (`usage`, `requests` and the rest of the `turnSpend` vocabulary) from the junction's `turn_end` record for that turn, in the same read that recovers `attributed`. Apply it in both streaming paths.

Required behaviour:

1. A consultant (or coordinator) turn that ends by throwing writes a `turn_spend` row with the counters and settled `cost_micros` of every request it actually sent, and `outcome: error`.
2. The terminal event stays the first source. `turn_end` is read only when the terminal event didn't arrive or carried no spend, so a completed turn costs no extra read.
3. A turn whose `turn_end` truly holds no measured spend still writes no counters and a NULL cost. Unknown is not zero, as before. If `turn_end` carries `spend_unknown: true`, the row must keep distinguishing "not observed" from "free".
4. A consumer walking away mid-turn (abort without throw) gets the same recovery, since it also reaches the `finally` without a terminal event.
5. The stale comment in the `finally` is rewritten to describe the new source, not deleted.

## What changed

`tools/generate/src/cli/ai/host-core.ts`, both streaming paths (site/coordinator and settings):

- **`turnCursor()`** records the junction's byte `size()` just before the turn starts. That's a byte count, not a log read.
- **`closedTurn()`** returns the `turn_end` record appended past that cursor, or `null`. It replaces `turnAttributions()`, which read the whole log from 0 and took the last `turn_end`.
- **`turnSpendSource()`** picks the spend to meter. It uses the terminal event's meta when that carries measured `usage`, and otherwise this turn's `turn_end`, which holds `usage`, `requests` and `cost_usd` folded by the manager. The junction is read only when the terminal event carried no measured spend, or when the consultant composes delegation and needs `attributed` anyway. One read answers both questions. `attributed` now comes off the same record.
- The stale comment in the site path's `finally` ("the manager's `turn_end` does not [have them]") is rewritten to describe the new source. The settings path points to it.
- Occupancy (`writeOccupancy`, REQ-296) is unchanged and still reads only the terminal event.

Resulting behaviour:

1. A turn that throws after sending billed requests writes a `turn_spend` row with those requests' counters, `requests` count, settled `cost_micros`, and `outcome: error`.
2. A completed turn still reads its spend from the terminal event. Its row is unchanged, and it makes no junction read unless delegation is composed.
3. A turn whose `turn_end` measured nothing (`spend_unknown: true`, no `usage`) still claims nothing. With no attribution it writes no row. With an attribution (BUG-145) it writes four zero counters and a NULL cost. Unknown is never zero.
4. A consumer walking away mid-turn goes through the same recovery. With today's framework that recovers nothing: an abandoned adapter generator doesn't reach its `done`, so its `turn_end` carries `spend_unknown`. The host side is in place for when upstream measures that exit too.
5. A turn's `turn_end` is only ever its own. A turn refused before the manager runs (REQ-296 budget refusal), or one that throws before the manager appends anything, can no longer pick up the previous turn's `turn_end`. Before, that would have billed the previous turn's spend and re-attributed its delegations a second time.

## Design decisions

- **A cursor, not "the last `turn_end`".** Once `turn_end` is a spend source, reading the whole log and taking the last record would double-bill whenever the current turn appends none. `SessionLog.size()` is the same byte cursor `readFrom` takes, and the junction is only rewritten (`seed`/`delete`) by resume, repair, attach and close, never mid-turn. So a cursor taken just before the turn is stable.
- **"Carried spend" means measured `usage`** (`measured(countersOf(meta.usage))` from spend-core). That is the same rule `turnSpendRecord` uses to decide a row exists, so the fallback and the row rule can't disagree.
- **Occupancy is out of scope.** The ticket only asks for the meter.

## Test plan

`tests/test_UAT_FC_BUG-232_thrown_turn_spend.workers.test.ts` drives the real `POST /api/ai/prompt` route in workerd through the scripted-model harness, with a real D1:

- `a_turn_that_throws_after_billed_requests_records_them`: two metered tool-call requests, then a third request that throws. Asserts one row with `outcome: error`, `requests: 2`, summed counters (all four), and a non-null positive cost. Fails on the unfixed host (no row at all).
- `a_completed_turn_still_reads_its_terminal_event`: a completed two-request turn gives an unchanged row (`complete`, 2 requests, summed counters, priced).
- `a_throw_before_any_request_claims_nothing`: a metered completed turn, then a turn whose first request throws. Asserts exactly one row (the first turn's). The failed turn writes no row and doesn't fall back to the previous turn's `turn_end`.

Regression scope run: BUG-121 (workers), BUG-145 (both), BUG-229, REQ-292 (both), REQ-293 report, REQ-295 delegation, REQ-296, REQ-297 tenant cost, REQ-357 group chat, REQ-362. 70/73 pass. The 3 failures are pre-existing and identical without this change: REQ-292 `a_host_with_no_meter_still_completes_a_turn` (upstream `logDir` → `junctions` rename), and REQ-295 `the_caller_gets_a_result…` and `a_worker_that_never_reported…` (delegation result-shape drift).
