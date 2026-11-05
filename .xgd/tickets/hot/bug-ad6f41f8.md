---
uid: bug-ad6f41f8
id: BUG-285
type: bug
title: 'A reloaded chat shows the host''s layout-fault instruction as a client message:
  isHostCue is a hand-kept list that misses layout-continuation-cue'
created_by: EPIC-19
created_at: '2026-10-25T22:06:52.794867+00:00'
updated_at: '2026-10-25T23:19:26.422594+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  severity: medium
  priority: medium
  story_points: 1
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-17ef09e8
  commits:
  - working_sha: c6ad5787d0c2e15b9b6ab59cc035ca239d8b5e9d
    reconcile_sha: null
    main_sha: null
  - working_sha: 85d3a2decf46a128f92d8ffdbc8ccd2771db42a6
    reconcile_sha: null
    main_sha: null
  version: 0.2.648
---

## Symptom

First-Draft-Test Dina's Diner 3, 2026-10-25. After a server restart, the client's
chat showed a "You" bubble holding the host's layout-fault instruction: "[The host,
not your client — guidance for you, not words for them: your reply ended while
pages the build you started wrote during this request still have layout
faults: …]", with 40 fault lines.

## Cause

The reload replays the stored transcript through `storedTranscript`
(`host-core.ts`). It hides a user turn only when `isHostCue` recognises it.
`isHostCue` is a hand-kept list (opening, continuation, held continuation,
finished, stall, error, promise and critique cues), and `layout-continuation-cue`
(REQ-436/BUG-256) isn't on it. The live stream never shows a cue, so this only
appears after a reload. Every new cue is one omission away from the same leak.

## Fix

Recognise host cues from the templates themselves, not from a list. `isCue`
(`roles.ts`) is true for any `*-cue` template in `priming.json`: matched whole when
the template takes no fills, and by its fixed head (the text before its first fill)
when it does, as `isStallContinuationCue` already did. `isHostCue` is `isCue`, so
every `*-cue` template is hidden on replay — including the talker cues the host
never records as a user turn; hiding those too is harmless (the client never says
them) and means no exclusion list to keep.

The speak-first gate (BUG-278) keeps its own judgement of which cues hold it:
the old list moved into `holdsSpeakFirst` (`host-core.ts`) unchanged — the held
continuation cue (BUG-284) and the layout cue still don't hold the gate.

## Test plan

`tests/test_UAT_FC_BUG-285_no_host_cue_reaches_a_reloaded_chat.test.ts`, through the
real host (`streamPrompt` records the turn, `openSession` replays it):
- For every `*-cue` template in `priming.json`, its fills given sample words,
  `isHostCue` is true, and a session holding it as a user turn replays without it.
  The test enumerates the templates, so a new cue is covered without anyone
  remembering it.
- The layout-continuation cue with real fault lines replays hidden.
- A client message that starts "[The host" (typed by the client) is kept.
- Re-ran the REQ-403, REQ-409, REQ-415, REQ-427, REQ-428, BUG-241, BUG-245,
  BUG-249, BUG-262, BUG-277, BUG-278 and BUG-284 UATs: all pass except three
  priming-text assertions (BUG-245 one-voice priming ×2, REQ-428 plan-entry due
  line) that fail identically on clean xgd-working.