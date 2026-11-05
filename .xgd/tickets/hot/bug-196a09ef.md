---
uid: bug-196a09ef
id: BUG-262
type: bug
title: 'Builder chat: client finishes a section and hears nothing back'
created_by: BUG-261
created_at: '2026-10-24T00:57:03.250442+00:00'
updated_at: '2026-10-24T14:56:04.743180+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-b85c90d2
  commits:
  - working_sha: 1c518962e0f6575f47c1188c2ca40ef4e29287f6
    reconcile_sha: null
    main_sha: null
  - working_sha: 70085badfb5dff7724915c52a700146221a9b269
    reconcile_sha: null
    main_sha: null
  version: 0.2.608
  story_points: 8
---

## Symptom

Dina's Diner (site `site_b314db907afa1d53d93f3c6af2b3b902`, chat `chat-e227e23b`), 2026-10-24 UTC:

- 00:40:28: the consultant opened the story board (`start_focus` kind `story`) and was told to say nothing more until the client finished.
- 00:44:07: the client finished reacting. The host's `finished` cue started a turn (the consultant was idle).
- In that turn the consultant pinned notes, listed the library, set two features and ran six web searches, then started `capture_site` on ikedas.com and later blackbeardiner.com. Its only text was an empty delta, so the chat recorded an **empty assistant bubble**. All the client saw was the slow-tool status line "The consultant is capturing https://www.ikedas.com/".
- 00:48:55: the client, unsure what to do, typed "Done". That message went to the talker (forked off the still-running worker), which answered properly ("You hearted 'We're the stop'… What's the stegosaurus?").

From the client's side: they did what they were asked, and got silence with nothing obvious to do next. That breaks the welcome's promises ("Before a long piece of work, I'll tell you…", "keep talking to me").

## Root causes

1. **A cue turn can be answered with no words.** The `finished-cue` priming ("Do what it asks, briefly, and then carry the conversation on") is advice only. Nothing stops the consultant going straight into slow work with nothing said.
2. **The poke waits instead of reaching the talker when the worker is busy.** `chat.cue` (`apps/control-app/src/builder/chat.js`) defers through `whenFree` and retries until the panel is idle. If a long piece of work is running when the client finishes, nobody acknowledges the finish until that work ends, while a typed message in the same situation goes to the talker at once.
3. **Only two things count as "finished."** The cue fires for a focus task (REQ-424) and the comparison board (BUG-245). **Answering every open question** on the Input board sends no poke.

## Fix

Three parts, one intent: *when the client completes a section, the consultant always acknowledges it promptly, in words.*

1. **Talk before slow work on a cue turn.** On a turn started by a host cue (`finished`, and the other hidden cues), a tool listed in `slow-tools.json` is refused until the turn has produced client-visible text. The refusal tells the consultant, in the tool-result steering style `start_focus` uses, to first say one or two sentences to the client acknowledging what they did and what it is about to do, then call again. It is the same refusal in every case. After the consultant has spoken, slow tools behave as today.
2. **Poke the talker when the worker is busy.** If the client finishes a section while a worker turn is running, the finished notice goes to the talker (the host's existing talker-cue path, `queueTalkerCue` in `host-core.ts`), so the client gets a short acknowledgement straight away. The server's "already told" check (`finishedUntold`) still makes it fire at most once. When nothing is running, it starts a cue turn as today.
3. **Answering all open questions is a finish.** When the last open question on the Input board is answered, the host treats it like a finished focus task: it sends the `finished` cue (subject to part 2's routing), and the session-delta notice names the questions answered.
4. **No empty bubbles.** A consultant reply with no text is not recorded or drawn as an empty assistant message.

## Test plan

UATs, named `test_UAT_FC_<this ticket>_*`, through the real host with a scripted model:
- On a `finished` cue turn, a slow tool called before any text is refused with the speak-first steering, and succeeds after the consultant has written a line.
- On a client-initiated turn, the same slow tool is not gated by this rule.
- Finishing a focus task while a worker turn runs reaches the talker without waiting for the worker, and the talker's reply mentions the finish. A second finish signal is refused as already told.
- Answering the last open question fires the `finished` cue once, and the notice names the answered questions. Answering a question while others stay open fires nothing.
- A turn whose only output is an empty delta leaves no empty assistant message in the transcript or the chat pane.
## As built

**Part 1 — speak first on a cue turn.** The consultant's backend holds one speak-first gate (`SpeakFirstGate`, `cadence-core.ts`). `keepClientOriented` holds it at the start of a worker round whose prompt is a host cue (`isHostCue` in `host-core.ts`: the opening, continuation, finished, stall, promise and critique cues — the same set the replay hides). The round's first non-empty text releases it. While it is held, `toolSet` answers any tool in `slow-tools.json` with `SPEAK_FIRST_REFUSAL` instead of running it ("Not run yet: your client has heard nothing from you this turn… First write one or two sentences to them — acknowledge what they just did, and say what you are about to do and roughly how long it takes. Then make this call again."). A refused call puts up no working status and does not count as a dive (BUG-240) or as a failed attempt (REQ-386 retry wording). Talker rounds never touch the gate. `Delegate` is not in `slow-tools.json` and is not gated: its required `note` is already shown to the client as the consultant's words.

**Part 2 — a finish while the work runs reaches the talker.** This is not built on `queueTalkerCue`: that queue lives in the memory of the isolate running the work, and the finish arrives on a different request. It uses the same path a message sent mid-turn uses (BUG-224), the shared inbox:
- The panel (`chat.cue`) checks whether a work stream is open in the panel. If so, it calls `POST /api/ai/interpose` with `{sessionId, cue: 'finished'}` instead of waiting for the panel to be free. Otherwise it starts a cue turn as before.
- The route refuses with 409 unless a finish is untold. It calls `tellFinished` (`session-delta.ts`), which records the newest finish in the chat field `finished_told` and returns the plan notice. That notice is what the client did, as the worker's next notice would say it, read without moving the plan cursor, so the worker's own next turn still hears everything. The route then posts `finishedTalkerCue(notice)` (template `finished-talker-cue`) to the inbox.
- On its next poll, the talker desk in the work's isolate sees that the waiting message is the host's cue (`isFinishedTalkerCue`). It opens it with `manager.cueTalker`, not `startTurn`. The reply rides the work's stream as a cued talker round, which the panel already draws as the consultant's next message (BUG-240). The cue is recorded nowhere, and a reload never redraws it as a client message.
- `finishedUntold` now reads from the later of the plan cursor and `finished_told`, so a second signal by either route (`/api/ai/interpose` or `/api/ai/prompt` with the cue) is refused.
- A finish cue its talker never took (the work ended within the poll window) is dropped from the inbox when the next worker round starts. That round's notice still says what the client finished.

**Part 3 — answering every open question is a finish.** `clientAnswer` stamps the new plan field `asks_finished_at` (added to `PLAN_KEYS`) when the client's answer or skip closes the last open ask. It is stamped again each time the board goes from some open to none. The panel view carries `asks_finished_at`, and `app.js` (`followFocus`) cues on it the same way it cues on `focus_finished_at`, with part 2's routing. The notice gains `asksFinishedLine`: "Your client has now answered every open question on the Input board (ids…)… thank them in a line, say what their answers settle, and carry the work on from them." When a questions focus task finishes on the same answer, only the task's line is said.

**Part 4 — no empty bubbles.** The replayed transcript (`storedTranscript`) drops assistant turns whose text is empty. Live, `webui-chat` already removes a bubble that ends its turn empty (lagrange-framework REQ-106), so the chat pane's two sources (the live stream and a reload) both show no empty message.

## UAT coverage (as built)

`tests/test_UAT_FC_BUG-262_client_finishes_and_hears_back.workers.test.ts`, through the Worker's `route` with a scripted model. The browser is faked (an external boundary) so `screenshot`, a slow tool, is granted and really runs.
- `…on_a_finished_cue_a_slow_call_before_any_words_is_refused_and_runs_once_it_has_spoken`: also checks that the refused call put up no status.
- `…on_a_turn_the_client_started_a_slow_call_is_not_gated`
- `…finishing_while_a_worker_runs_cues_the_talker_whose_reply_names_the_finish_and_a_second_signal_is_refused`: the finish is the last open question answered while the worker is held. The talker's cue carries the notice naming the question, its reply arrives as a cued talker round on the work's stream, both routes refuse a second signal with 409, and the reload never shows the cue.
- `…the_last_open_question_answered_fires_the_finished_cue_once_and_names_the_questions`: one of two answered fires nothing (409); the last one stamps `asks_finished_at`, and the cue turn's notice names both ids, once.
- `…a_turn_whose_only_output_is_an_empty_delta_leaves_no_empty_assistant_message`: checked on the reload transcript the pane draws from.