---
uid: bug-e2fe84cf
id: BUG-278
type: bug
title: 'Cue turns: after the client settles something (hearting the direction), the
  consultant works for minutes in silence — a cue turn must speak before any tool,
  not only slow ones'
created_by: EPIC-19
created_at: '2026-10-25T17:54:37.173277+00:00'
updated_at: '2026-10-25T19:27:09.868151+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  parent_uid: epic-95bc3b15
  story_points: 2
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-96112ae1
  commits:
  - working_sha: 0cc74b4db8aa0e7bd79b336253fb494930468473
    reconcile_sha: null
    main_sha: null
  - working_sha: 470b393c0ad99261852bd5ceaac32578995c4533
    reconcile_sha: null
    main_sha: null
  version: 0.2.639
---

## Symptom

First-Draft-Test Dina's Diner 2, 2026-10-25 UTC. The client hearted the visual
direction card. That correctly closed "Looking at other sites" (REQ-432) and cued
the consultant (BUG-262/264), which began the first draft. But the client was told
nothing. The operator: "it didn't tell me what it was doing, I had to ask."

Turn `32281d03` (host "client finished" cue), from 17:35:33:
- 17:35:37–17:36:21: `list_pages`, `list_changes`, `read_work_log` ×2,
  `describe_page`, `get_design`, `read_design`, `list_assets`, `list_library`,
  `place_on_site` ×7, `get_library_item` ×2, `read_plan`. **No text.**
- 17:36:14: the client asks "What's happening now?", and the talker answers.
- 17:36:38 and 17:36:58: `set_design` (refused, then accepted). **No text.**
- 17:37:48: the first thing the client could see, the `Delegate` progress line
  "building your home page first draft… about 15 minutes". That was **2 min 15 s
  after the heart**.

## Cause

BUG-262's "talk before slow work" refuses only tools listed in `slow-tools.json`
on a cue turn until the turn has produced client-visible text. Reads, placing
photos and `set_design` are not slow tools, so a cue turn can work through many
of them for minutes in silence. The speak-first rule fires only at the first slow
tool, here the `Delegate`, and by then the client has already waited.

## Fix

**A cue turn speaks before it does anything.** On a turn started by a host cue
(`finished`, a settling action under BUG-264, or the other hidden cues), the first
tool call of **any** kind is refused until the turn has produced client-visible
text. The refusal uses the steering style `start_focus` uses: "first say in one or
two sentences what the client just did and what you are about to do, then carry
on". After the turn has spoken once, tools behave as today. A client-initiated
turn is not affected (the client is already in conversation), and BUG-262's
slow-tool rule stays as it is.

For a settling action like this one, the opening line acknowledges the action and
names the next step: "Thanks, that's the look agreed. I'm starting on your first
draft now. I'll check your photos and set up the design first, then build. It
takes about 15 minutes."

## What changed

- `tools/generate/src/cli/ai/cadence-core.ts`: `speakFirst(gate)` now refuses **any**
  tool while the gate is held (was: only `slow-tools.json` tools). The gate is still
  held only on a worker round whose prompt is a host cue (`isHostCue`: opening,
  continuation, finished, stall/promise/critique continuations) and released by the
  round's first non-blank client-visible text. Talker rounds are never gated.
  `SPEAK_FIRST_REFUSAL` reworded for any call: "everything you do before you speak
  keeps them waiting … Then carry on, starting with this call again."
- `host-core.ts`: the tool wrapper calls `speakFirst(gate)` for every tool.
- BUG-262's slow-tool rule is subsumed (a slow tool is a tool), not kept as a second path.

## Design decisions

- **All host cues, including continuations.** Critique, promise and stall
  continuations carry a held hand-back on without a client message in front of
  them, so they also speak first ("Before I show you, I am giving it a careful
  look."; "Starting on the bigger buttons now."). One rule, not a per-cue mode.
  The REQ-427, REQ-428 and REQ-449 UAT scripts had continuation rounds that
  called a tool before writing anything; their scripted model now speaks first
  (no assertion changed). The line avoids "critic"/"critique" (REQ-427: that word
  never reaches the client).
- `saysThenCalls` (prose then a tool call in one response) moved into
  `tests/support/scripted-model-client.ts` as the shared helper.

## Test plan

`tests/test_UAT_FC_BUG-278_a_cue_turn_speaks_first.workers.test.ts` (scripted-model
host harness, real router/session manager/junction/D1):

- A `finished` cue turn (the client has just answered the last open question) whose
  model calls `read_plan` before writing anything: the call is refused with
  `SPEAK_FIRST_REFUSAL`; after the model writes a line, `read_plan` runs; on the SSE
  stream the only tool activity ahead of the line is the refused one.
- A client-initiated turn calling `read_plan` first is not refused.
- A cue turn that speaks first then calls `read_plan`, `list_pages`, `read_plan`:
  none are refused.
- Regression: full workers suite and the node suites touching the AI host; BUG-262,
  BUG-264, REQ-432, REQ-427, REQ-428, REQ-449 green. Failures that remain were
  baselined red on the unchanged code (BUG-249, BUG-275, REQ-143/148/180/204/208/
  219/295/342/416/424/431 workers; AC1058, builder-workspace-origin, REQ-146 node).