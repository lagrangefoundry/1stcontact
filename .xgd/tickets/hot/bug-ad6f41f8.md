---
uid: bug-ad6f41f8
id: BUG-285
type: bug
title: 'A reloaded chat shows the host''s layout-fault instruction as a client message:
  isHostCue is a hand-kept list that misses layout-continuation-cue'
created_by: EPIC-19
created_at: '2026-10-25T22:06:52.794867+00:00'
updated_at: '2026-10-25T22:08:28.205575+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  parent_uid: epic-95bc3b15
  severity: medium
  priority: medium
  story_points: 1
  auto_merge_back: true
  needs_review: false
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

Recognise host cues from the templates themselves, not from a list. Every
`*-cue` template in `priming.json` that the host records as a user turn is
hidden on replay. For a cue with fills, its fixed head is matched, as
`isStallContinuationCue` already does. The speak-first gate (BUG-278) keeps its own
judgement of which cues hold it (`cued`), and this doesn't change that.

## Test plan

`tests/test_UAT_FC_BUG-285_no_host_cue_reaches_a_reloaded_chat.test.ts`:
- For every user-turn `*-cue` template in `priming.json`, filled where it takes
  fills, `isHostCue` is true, and a stored transcript holding it replays without
  it. The test enumerates the templates, so a new cue is covered without anyone
  remembering it.
- The layout-continuation cue with real fault lines replays hidden.
- A client message that starts "[The host" (typed by the client) is kept.
- Re-run the REQ-403, REQ-409, BUG-245, BUG-262 and BUG-284 UATs.
