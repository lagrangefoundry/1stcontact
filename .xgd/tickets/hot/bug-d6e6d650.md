---
uid: bug-d6e6d650
id: BUG-298
type: bug
title: 'Speak-first: quick reads get refused, and the host''s stand-in line says nothing'
created_by: EPIC-19
created_at: '2026-10-26T03:44:10.392488+00:00'
updated_at: '2026-10-26T16:00:07.055394+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-8bcac127
  commits:
  - working_sha: 66541f0cb9395c17b767ad690cfc7e534620aa7a
    reconcile_sha: null
    main_sha: null
  - working_sha: 8027201fdedd03c6622bc3d7a8e1ffd87551caa6
    reconcile_sha: null
    main_sha: null
  version: 0.2.668
  story_points: 3
---

## Symptom

First-Draft-Test Dina's Diner 5 (site_7fe9bea6…), dev, 2026-10-26 03:33 UTC. The client hearted the
direction card. The host cued the consultant ("your client has just finished… the comparison board").
The consultant's first call, `list_changes`, was refused by the speak-first gate. It re-issued the
call without speaking, and the host wrote for it: *"I'm working on this now — it takes a few minutes,
and I'll tell you here when it's done."* The operator: "working on what? How long?" The calls it
unblocked were quick reads (`list_changes`, `list_pages`, `get_design`). The line also didn't
acknowledge the card the client had just hearted.

## Cause

- The speak-first gate (BUG-262/BUG-278, `SpeakFirstGate` in `tools/generate/src/cli/ai/cadence-core.ts`)
  refuses **any** tool on a held round, including sub-second reads. Its purpose is to keep the client
  from silence before slow work. Refusing reads costs a model round and protects no one.
- When the gate lets go unspoken (BUG-290/BUG-292), the host writes `OVERRIDE_LINE`, a fixed sentence
  that is deliberately vague so it claims nothing, and so tells the client nothing.

## Fix

1. **Speak-first gates only slow work.** Reads and other quick calls run on a held round without
   words. The gate refuses only calls that make the client wait: those that put up a working note
   (REQ-390), e.g. `Delegate`, `screenshot`, `capture_site`, `EditImage`, and the other slow tools.
2. **The host's stand-in line is specific.** If a slow call is re-issued unspoken, the line the host
   writes for the consultant is built from that call's own working note: what is being done and
   roughly how long ("Building the first draft of your home page and catering page now; about 15
   minutes."). When the held round was cued by something the client did (finishing the comparison
   board, a focus task, hearting a card), the line first acknowledges it in a short clause. A slow
   call with no note doesn't get a generic sentence; the host names the work from the tool's own
   status text. `OVERRIDE_LINE` as a fixed sentence goes.

## Test plan

UATs named `test_UAT_FC_BUG-298_*`:
- a held round whose model calls `list_changes`, `list_pages` and `get_design` without speaking: all
  three run, none is refused, no host line is written;
- a held round whose model re-issues a refused `Delegate` (note "Building the first draft of your home
  page and catering page now; about 15 minutes") without speaking: the client's line names that work
  and time, and the fixed "I'm working on this now…" sentence never appears;
- a held round cued by the finished comparison board: the host's line opens by acknowledging what the
  client finished.

Related: [[BUG-262]], [[BUG-278]], [[BUG-290]], [[BUG-292]], [[REQ-390]], [[EPIC-19]].


## What changed (as implemented)

- **The gate holds only slow work.** `speakFirst(gate, name)` (`cadence-core.ts`) refuses a call only
  while the gate is held *and* the call is slow (`slowCall`): `Delegate`, or a tool `slow-tools.json`
  lists (`capture_site`, `screenshot`, `compare`, `CreateImage`, `EditImage`, `AnimateImage`), which
  is exactly the set that puts up a working note (REQ-390). Reads and every other quick call on a
  held round run without words. They neither release the gate nor owe a line. The round still has
  to speak before its first slow call. The tool closure (`host-core.ts` `toolSet`) and the cadence
  wrapper both use the same check, so they always agree on what was refused.
- **The stand-in line is the call's own working note.** `OVERRIDE_LINE` is deleted. When a refused
  slow call is re-issued unspoken, the host writes `standInLine(note, acknowledgement)` before the
  call runs:
  - `Delegate`: the model's `note`, verbatim (e.g. "Building the first draft of your home page and
    catering page now; about 15 minutes.").
  - Slow tool: its `slow-tools.json` status with the estimate ("Taking a screenshot; about a minute.",
    "Capturing https://… ; about 5 minutes.").
  - The line is owed only by the slow call that runs unspoken. A read that runs after a refusal owes
    nothing.
- **The acknowledgement opens the line on a finish cue.** A new optional hook,
  `speakFirst.acknowledge(prompt)`, is answered in `host-core.ts` only when the round's prompt is
  the finished cue (`finishedCue()`). Other holds (continuations, stall/error/promise/critique,
  home-structure) follow nothing the client did, so they get no acknowledgement.
  `finishAcknowledgement(fields)` (`plan-core.ts`) reads the plan and picks the newest thing the
  client finished:
  - comparison board: "Thanks for going through the comparison board."
  - focus task: "Thanks for <focusWhat>."
  - all questions answered: "Thanks for answering the questions."
  - direction card, hearted: "Glad the direction works for you."; unhearted: "Noted — the direction
    isn't right yet."; reworded: "Thanks for putting the direction in your own words."
  - other settled items (headline, positioning, notes).

  On a tie the more specific wins (the board over the focus task that held it). A plan that can't
  be read gives a plainer line, never a lost turn.

## Design decisions

- "Slow" is defined once, as "puts up a working note", so the gate, the status widget and the
  stand-in line can't drift apart. A new slow tool added to `slow-tools.json` is gated automatically.
- This supersedes BUG-278's "any tool, not only a slow one" (the gate is back to BUG-262's slow-only
  scope). The BUG-278, BUG-284, BUG-290 and BUG-292 UATs that used a read (`read_plan`/`list_pages`)
  as the refused call now use `screenshot` with the shared browser double. BUG-278's first test is
  renamed `…_a_slow_call_before_any_words_is_refused_…`. BUG-292's refused-round test now asserts the
  screenshot's own line instead of the fixed sentence.
- A `Delegate` with no `note` still falls back to `FALLBACK_NOTE`. That is unreachable in practice
  because `note` is a required parameter.

## Tests

New: `tests/test_UAT_FC_BUG-298_speak_first_holds_only_slow_work.workers.test.ts`, covering the three
cases in the test plan above. The finished-board case uses `screenshot` and asserts the exact opening:
"Thanks for going through the comparison board. Taking a screenshot; about a minute."