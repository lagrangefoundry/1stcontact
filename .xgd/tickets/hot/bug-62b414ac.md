---
uid: bug-62b414ac
id: BUG-349
type: bug
title: 'Site chat: on reload, a builder''s Delegate result is shown as if the client
  wrote it'
created_by: EPIC-19
created_at: '2026-11-05T00:21:30.429973+00:00'
updated_at: '2026-11-05T15:33:37.759402+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d5e94ad8
  commits:
  - working_sha: 6f8c214537e61a046f0baf6c72aa8e4d0c78b116
    reconcile_sha: null
    main_sha: null
  - working_sha: b8553010b31903a42e9989ec04e6b12d11e0e34c
    reconcile_sha: null
    main_sha: null
  version: 0.2.779
  story_points: 2
---

## Symptom

Dev, 2026-11-04. Returning to the Site chat (reloading the builder), the conversation shows internal host-to-consultant messages in the client's own bubbles, among their real messages. Example, verbatim as shown:

> [The result of your Delegate call with handle worker-builder-14-5t6hmg — role 'builder', scope 'home.json#hero', goal: On page `home`, section `hero`, the video element with id `hero-video` … It is exactly what Delegate returns:] <<>> {"accepted":true,"account":{"changed":{"differences":[{"address":"0.0.0","before":"/assets/hero-light-loop.mp4","field":"loopSrc",…}]} … "decisions":["Did not add section compositions …","Did not build the light loop, the earring-wobble version …"], …}

The client sees raw JSON, internal ids, file paths and the builder's private notes, presented as if they had written it.

## Cause (likely)

Since REQ-627, when a builder pass ends the host starts the consultant's next round with the builder's result as that round's **user** message. The text is built by lagrange-framework's non-blocking Delegate (`delegation_toolbox.js`, "[The result of your Delegate call with handle …"). The round is recorded in the chat transcript as an ordinary `role="user"` turn (seen in the `chat_transcript` comment, e.g. 2026-11-04 21:31:23, 21:46:24, 21:55:02, 22:03:00, 22:04:26, 22:11:12). The live panel doesn't show it at the time, but on reload the transcript replay renders every user turn as the client's, so these appear.

Other host-originated user turns may have the same problem on reload, e.g. "[The host, not your client — guidance for you, not words for them: …" (lost-turn and stall cues, 2026-11-04 20:30:00 and 21:24:54). Check every kind.

## Fix

- **Every user turn the host writes is marked as host-originated** when it is recorded: builder results, carry-on and stall cues, finished-cue turns, review continuations, and any future kind. Use the same mechanism that hides `*-cue` template turns today, or one marker that covers all of them. Don't rely on matching the text.

- **The transcript replay and the live panel both skip host-originated turns.** The client only ever sees what they wrote and what the consultant said to them. The consultant's own context keeps the turns unchanged.

- **Existing transcripts** (like this site's) display correctly after the fix. Recognise the historic unmarked turns once, by their known opening brackets, on read, without rewriting the stored transcript.

## Test plan

`test_UAT_FC_<ID>_*`:

- After a builder pass ends and the host starts the consultant's next round, reloading the builder shows the client's messages and the consultant's replies, with no bubble containing "[The result of your Delegate call".

- The same holds for a carry-on or stall cue ("[The host, not your client …") after reload.

- A stored transcript that already contains unmarked builder-result and host-cue user turns renders without them.

- The consultant's next round still receives the builder's result. The model-side history is unchanged.