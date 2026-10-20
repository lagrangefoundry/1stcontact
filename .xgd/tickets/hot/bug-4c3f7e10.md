---
uid: bug-4c3f7e10
id: BUG-232
type: bug
title: 'Spend meter: a turn that ends by throwing records its own spend as zero'
created_by: EPIC-20
created_at: '2026-10-20T00:10:31.544851+00:00'
updated_at: '2026-10-20T00:10:45.770263+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  severity: high
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  priority: medium
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

## Test plan

`tests/test_UAT_FC_BUG-232_*.test.ts`: drive a real host turn through the scripted-model harness where the tool loop throws after two billed requests. Assert the `turn_spend` row carries those two requests' counters and a non-null cost, `outcome: error`. Second case: a completed turn still reads its spend from the terminal event (row unchanged from today). Third: a throw before any request sent writes NULL cost, not zero.

Regression scope: REQ-292, BUG-145, REQ-295 spend UATs (note the delegation suites are red pre-existing on a clean tree).
