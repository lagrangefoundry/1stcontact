---
uid: bug-a6fc1ddc
id: BUG-290
type: bug
title: 'Speak-first gate: refuses rounds after the consultant has already spoken,
  with no limit, so it loops and burns the turn''s budget'
created_by: EPIC-20
created_at: '2026-10-26T00:46:11.303463+00:00'
updated_at: '2026-10-26T01:03:51.429002+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: critical
  priority: high
  parent_uid: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-21a7c1b3
  commits:
  - working_sha: f74db7ddae2aae9bbfddb3976c3fb1de5762507a
    reconcile_sha: null
    main_sha: null
  - working_sha: 84cf5d4df7936736c84c94a0cd5a8590018525ad
    reconcile_sha: null
    main_sha: null
  version: 0.2.655
  story_points: 2
---

## Symptom

First-Draft-Test Dina's Diner 4 (local dev, 2026-10-26, snapshot `12dcfc55d7` deployed 23:53Z, so BUG-278 and BUG-284 are both included):

- **00:36:33–00:39:24, holder turn `turn_538cfc91…`:** a new round began seven seconds after the consultant had spoken to the client (its first-draft summary, delivered 00:36:26). BUG-278's speak-first gate refused **28 requests in a row**. Each one was the same `set_decision` (pages_navigation) + `describe_page {page: home}`, refused with *"Not run yet: your client has heard nothing from you this turn…"*. The client *had* heard from the consultant, in that same turn. The model kept re-issuing the identical calls, about every 6 s. When the calls finally ran, the round's `Delegate` failed with `spend_ceiling`, so the fixes the consultant had just promised the client were never commissioned.
- **23:54:43–23:55:34, the first round of the first-draft cue turn:** 7 refused requests (`list_pages`, `list_changes`, `read_plan`/`read_design`) before the consultant spoke.
- Cost: **$1.96 of the run's $10.14** went on refused rounds. FDT 3 lost $0.14 the same way. Each refused request costs ~$0.055 on Opus 5.5.

## Root cause (to confirm)

1. **The gate's "has spoken" state is per round, but its message says "this turn".** A round that follows the consultant's own client-visible reply in the same turn is treated as silent. The model reads the refusal as false (it can see its reply just above) and retries the call rather than speaking again.
2. **There is no limit.** Nothing stops the same refusal being returned indefinitely, so a model that won't comply spins until the turn's spend ceiling. That ceiling then also blocks the legitimate work.
3. Find which round type started the 00:36:33 round (a host hold such as layout or review, or BUG-284's carry-on) and whether that round needs speak-first at all.

## Fix

- **Spoken means this turn.** If client-visible text has been delivered anywhere in the current turn, the gate doesn't refuse. The refusal text must be true whenever it is shown.
- **Refuse at most once per round.** If the model re-issues a refused call without speaking, the call runs, and the override is recorded (a `tool_issue`/log entry naming the gate). One wasted request is the most the gate can cost.
- Rounds the host starts after the consultant has already replied in this turn (holds, carry-on) don't need the gate.
- Keep BUG-278's purpose: a cue turn that has said nothing yet still speaks before slow work.

## Test plan

- UAT: in a turn where the consultant has already delivered a reply, a later round's tool call runs without a speak-first refusal.
- UAT: on a cue turn with nothing said yet, the first call is refused once. The identical call re-issued without speech then runs, and the override is recorded.
- UAT: a cue turn that speaks after the refusal runs the refused call as today (BUG-278 and BUG-284 behaviour kept).
- Evidence: the next first-draft test shows no run of more than one refusal per round.


## What landed

Root cause confirmed. The host runs several rounds per client message (`continuedTurn`). Every round whose prompt is in `holdsSpeakFirst` re-armed the gate, including a review hold (REQ-427 critique continuation) that started right after the consultant's own reply. That is the 00:36:33 case. Once armed, the gate refused every call until the round wrote text, with no limit.

- **Spoken means this message** (`host-core.ts`): `spokenTurns` is cleared when a message starts and set when a round yields non-blank text to the client. The gate's `cued` hook is now `holdsSpeakFirst(prompt) && !spokenTurns.has(key)`, so any host round after words the client has already heard in this message (holds, carry-ons, stall/error recovery) is not gated. A message that is a host cue and has said nothing yet still holds its first round (BUG-278 kept).
- **Refused once a round** (`cadence-core.ts`, `keepClientOriented`): after a refused call's result comes back, the gate releases for the rest of the round. A call issued later in the round without words runs, and the Worker logs `[BUG-290] speak-first gate overridden: <tool> ran after a refusal, with nothing said to the client` (once a round). Calls issued in the same request as the refused one, before its result returns (concurrent `Delegate`s), are refused with it. A sequential call later in that same response already runs. So at most one request is wasted.
- BUG-284's stranded carry-on is unchanged: a call that ran after an override counts as "ran after", so the round is not stranded.

## UATs

`tests/test_UAT_FC_BUG-290_speak_first_refuses_once.workers.test.ts`:
- `…a_review_hold_after_the_consultant_has_spoken_in_the_message_runs_its_call_unrefused`: Delegate, then "The prices page is done.", then the host's review hold calls `critique` with no words first. It runs, and no refusal appears anywhere. This test fails without the host-side change.
- `…on_a_silent_cue_turn_a_refused_call_reissued_without_words_runs_and_the_override_is_logged`: on a finished cue, `read_plan` is refused once. The identical re-issue and a later call both run, and one override line naming `read_plan` is logged.
- `…a_cue_turn_that_speaks_after_the_refusal_runs_the_call_with_no_override`: BUG-278 behaviour kept, and no override is logged.

Regression scope green: BUG-240/241/262/264/272/278/279/284/287, REQ-379/386/390/427/428/449.