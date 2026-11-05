---
uid: bug-81a31dab
id: BUG-320
type: bug
title: 'Lost turns: parallel builders exhaust one isolate''s memory, and the automatic
  carry-on is refused after quick replies'
created_by: EPIC-19
created_at: '2026-10-31T20:34:41.006806+00:00'
updated_at: '2026-10-31T21:08:10.033997+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-a82f9e3a
  commits:
  - working_sha: c9f68bf6dddea9206e9134617bd4bc71c656637d
    reconcile_sha: null
    main_sha: null
  - working_sha: 06c217e2e13be64291e96213d070b3db8562d7f5
    reconcile_sha: null
    main_sha: null
  - working_sha: b64055d5eca8e02506c391e7259153fe734efe25
    reconcile_sha: null
    main_sha: null
  version: 0.2.715
  story_points: 3
---

## Symptom

Production, 2026-10-31, Ariel's Arc Welding (`biz_9a2c6a616640babca1c1e13c13095817`, session `site-site_be615746320df3268946af454ff075e2`). Turn `turn_f61c47b38abae76d6527b48c5779cb17` started 20:00:18Z ("Fixing the home page and building Art and Classes"). A first Delegate ran 20:08–20:16 and returned. At 20:18:25 a second Delegate started three builders in parallel (`worker-builder-2-44m0ef`, `-3-zcqopo`, `-4-zbcq0z`). All three and the consultant stopped in the same second, 20:20:52.

The client saw BUG-294's notice: "The work stopped before it finished. Where it had got to: 'The consultant is building your Classes page. It takes about 20 minutes'. Press Carry on to pick it up from there." — and had to press Carry on (20:24:10).

## Root cause (from Workers Logs)

1. **Memory, not CPU.** Workers Logs: `POST /api/ai/prompt` outcome `exceededMemory` ("Worker exceeded memory limit") at 20:20:53Z, wall 1,235 s, CPU 53 s. A concurrent `GET /api/changes` in the same isolate died with it (`exceededMemory`). The consultant turn and every builder it delegates run inside one request in one isolate, sharing its 128 MB; three parallel builders plus the consultant exceeded it. The single builder of the first Delegate had run eight minutes in the same turn without trouble; three at once died within two and a half. REQ-483's per-round hand-off splits CPU between model rounds; a Delegate is one tool call, so it does not help here, and memory is per isolate in any case.
2. **The automatic carry-on was refused because the `lost` close never became durable.** (The first hypothesis, that talker rounds' `turn_start` records hid the lost turn from `carryOnOwed`, was wrong: talker rounds carry `fork_of`, which `carryOnOwed` already skips.) Workers Logs, 20:21:26–28: the panel's rejoined stream (`/api/ai/reattach`) ran its BUG-294 lost-check at 26.950, found the turn dead and closed it; the flush of that `turn_end lost` to the `SessionJunction` object (`jsrpc` at 26.963) ended **`canceled`**. `tailSession` yielded the `lost` end to the panel before awaiting `closeLostTurn`'s flush; the stream then closed (27.044), the request ended, and the pending write died with it. The panel's `lost` cue at 28.020 read the junction fresh, found the turn still open rather than closed `lost`, and `carryOnOwed` answered false → **409** in 52 ms. The turn-log row had its detail because the route awaits that D1 write before sending the frame.

## What changed

1. **The automatic carry-on is accepted.** A rejoined stream now ends `lost` only after the close's flush to the session junction has completed (`tailSession` awaits the `closeLostTurn` promise before yielding the end). A cue sent the moment the panel is told — from any isolate — finds the turn closed `lost` and is owed its one carry-on. BUG-312's rules are otherwise unchanged: still once per original turn, never after a stop, refusal, error or spending cap.
2. **A site's builders run one at a time.** The shipped `delegation.json` sets `max_concurrent: 1` (superseding REQ-397's shipped `3`). `max_concurrent` is the consultant backend's `max_concurrent_tools` for Delegate closures (REQ-411; every other tool was already serial), so several Delegate calls in one reply now run one after another, and the consultant's priming already says "Builders run one at a time." when the cap is 1. This bounds a turn's memory to the consultant plus one builder — the shape that ran eight minutes without trouble in this incident — at the cost of a multi-page Delegate taking roughly the sum of its builders' times. The rationale is recorded in `delegation.json`'s `about` so the cap is not raised again before builders run where their memory is their own.

## Design decisions

- **Serialise by the existing switch, not new machinery.** A host-side gate in the `claim` hook was considered; `max_concurrent` already does exactly this, is enforced by the framework's tool loop, and keeps the consultant's priming consistent with what happens. One mechanism, configuration only.
- **"Chosen by measurement".** Per-request memory is not observable from inside a Worker and Workers Logs report only the outcome, so the choice rests on this incident's production evidence: one builder plus the consultant survived eight minutes; three plus the consultant died in two and a half.

## Not done in this ticket

- **Fix 3 — a turn's memory isolated from other users' requests.** Finding, from Cloudflare's docs (Durable Objects metrics page, Workers limits): *"A single isolate can host multiple Durable Objects of the same class, along with the surrounding Worker code, and they all share that isolate's memory"*; the 128 MB limit is per isolate, and an isolate over it is replaced. So moving turns into a Durable Object alone does **not** give a turn memory of its own, and not even reliably separation from the front Worker's code. Isolation from other users' front requests would need turns to run in a separate Worker script (e.g. behind a service binding), and turns there would still share isolates with each other. That is an architectural move (turn hosting, the panel stream, REQ-483 held rounds, stop and reattach) well beyond a free-coded change; fix 2 reduces the blast radius meanwhile.
- **Fix 4 — the platform outcome in the turn log.** Not cheap: the Worker would need a Cloudflare API token as a secret and a delayed query to the Workers Observability API (logs arrive late). BUG-312's pointer ("see Workers Logs around …") stays.

## Test plan

- `tests/test_UAT_FC_BUG-320_lost_cue_after_reattach.workers.test.ts` — `test_UAT_FC_BUG-320_carry_on_owed_once_reattach_reports_lost`: a turn dying under a rejoined stream, with the junction's write of the `lost` close made slow (the production cancellation, as a delay). When the stream's `lost` end reaches the panel the close is already on the junction; the cue sent at once from a fresh isolate is accepted (200, the quiet recovering line first, the carry-on runs); a second cue is refused 409. Red before the fix with exactly the production 409.
- `tests/test_UAT_FC_BUG-320_builders_run_one_at_a_time.workers.test.ts` — `test_UAT_FC_BUG-320_parallel_builders_not_in_one_request`: with the shipped delegation document (no cap passed), a reply with two Delegate calls opens the second builder only after the first has finished, both still write their sections and release their leases, and the consultant is told "Builders run one at a time." Red before the change (both builders open together).
- `tests/test_UAT_FC_REQ-397_draft_file_leases.test.ts` — the shipped-cap assertion now pins `1`.
- Regression: BUG-294, BUG-312, REQ-397, REQ-410, REQ-411 suites green. 14 workers and 17 node failures in delegation/priming-adjacent suites (REQ-295, REQ-342, REQ-416, REQ-426, REQ-428, REQ-436, REQ-458, REQ-466, REQ-473; REQ-340, BUG-219, BUG-252, BUG-39, REQ-122, REQ-358, REQ-361, AC1058) fail identically on the base without these changes.