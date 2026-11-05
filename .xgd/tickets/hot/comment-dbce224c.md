---
uid: comment-dbce224c
id: COMMENT-3055
type: comment
title: Comment on bug BUG-114
created_by: xgd
created_at: '2026-09-18T03:35:12.862862+00:00'
updated_at: '2026-09-18T03:48:28.438460+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-ef327f84
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c31b3d53-55e4-482e-a683-3142ccb4eee8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d7e19ef4-f259-43d7-836f-3b9424ae202a-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T03:34:32.161231+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="d7e19ef4-f259-43d7-836f-3b9424ae202a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T03:48:28.237166+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

I have a clear picture of both parts. Let me record the implementation decisions on the ticket before coding.

Ticket updated and at `free_coding`. Now cutting the branch.

Now the implementation. Part 1 first — `ticket.ts`:

Now `ai.ts` (the outcome shape) and `page.ts` (rendering observations):

Now Part 2 — the wording, `noBaseline` on the round result, and the banner:

Now the BUG-114 UATs:

All 8 pass. Now the adjacent suites:

Now a broader regression sweep over the tools and test surfaces this touches:

Done. BUG-114 is at `free_coded` with both commits recorded.

## What changed

**Part 1 — the `ready_*` assertion no longer accuses the round of the operator's actions**

`readyStatusViolations` is gone, replaced by two functions in `tools/repro-console/src/ticket.ts`:

- `readyStatusArrivals(before, after)` — an arrival is still *found* by difference; the store records no process against a status change, so there is no other way to notice one.
- `readyStatusFindings(arrivals, attribution)` — an arrival is now *charged* by attribution. It is a **violation** only when `created_by` carries BUG-104's round marker, or the round named that uid/id in its own outcome (which is how a round *promoting* what it filed is still caught). Everything else is an **observation**, in language that states the coincidence and says plainly that nothing ties it to the round.

The console reads each arrival back individually (`xgd ticket get --json`) because the list output carries no `created_by`; that costs one call per arrival and the ordinary round has none. An arrival the console *cannot* read back is unattributed, so it is observed, never charged — the same rule BUG-104 set for the ticket read-back. Observations render under the violations in dim, uncoloured styling and don't trigger "See the violations under it".

Accepted residual, stated in the code: a round that promotes a ticket it neither filed nor named is indistinguishable from the operator doing it, and is reported as an observation.

**Part 2 — the empty rail**

BUG-109 had already landed the half that matters (`noBaseline`, no `REGRESSED`). This adds the wording and the prominence: "not yet recorded" replaces "not available" in the console, the round prompt and `repro-rail`'s terminal report (`NOT YET RECORDED`, still exit 1); `RailRoundResult` carries `noBaseline`; and while the **most recent** iteration's rail has no baseline, the console shows a standing notice above the iteration list naming `repro-rail record` and saying what it costs to leave it. It goes as soon as a baseline exists.

## Evidence

`tests/test_UAT_FC_BUG-114_two_checks_that_cry_wolf.test.ts` — 8 UATs, both directions of each claim: operator promotion → no violation; round-filed at `ready_*` → violation in its current language; round-named-and-promoted → violation; unreadable arrival → not charged; quiet round → neither list; rail with no baseline → "not yet recorded", no `REGRESSED`; console carries the notice; console with nothing to report renders none.

REQ-262's two ready-status UATs and BUG-109's wording assertions moved with the behaviour (noted on the ticket as explicit supersession). 65 tests pass across the six affected suites.

Two things to flag: `test_UAT_FC_REQ-254_reproduction_console.test.ts` has two failures (`a_step_is_a_fresh_1c_process`, `capture_list_reports_what_is_on_disk`) that reproduce on a clean stash — pre-existing, not from this change. And the version gate rejected 0.2.257 because BUG-111 claimed it concurrently, so the branch carries a second commit bumping to 0.2.258; both SHAs are on `fields.commits`.

<!-- xgd-chat-end -->