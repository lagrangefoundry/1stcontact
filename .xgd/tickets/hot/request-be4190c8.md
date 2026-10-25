---
uid: request-be4190c8
id: REQ-416
type: request
title: 'Worker and talker: adopt LF REQ-209/210 so discovery happens while the consultant
  builds'
created_by: EPIC-19
created_at: '2026-10-20T13:39:11.750473+00:00'
updated_at: '2026-10-20T14:24:25.243938+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 13
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-2e572211
  commits:
  - working_sha: 7b1dc19e9d407742a01f076e8f0a2f3cb873656d
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: e24e9abc3a69dba333a0ceeed655b3587a599514
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: bd33fbfc386dcd2512c2a5152d0e610a8fd722a4
    reconcile_sha: null
    main_sha: null
  - working_sha: f418045d5c3700b1254e208af165168168979539
    reconcile_sha: null
    main_sha: null
  version: 0.2.553
---

## Why

Today, a message the client sends while the consultant is building waits for the
build to finish (BUG-224 queues it). The builds are 5–20 minutes, so that is
dead time. lagrange-framework **REQ-210** (worker and talker) and **REQ-209**
(status widget, Stop building) are built and in the shared install; 1st Contact
uses neither. REQ-210 explicitly leaves the host's part to us: which tools the
talker is denied, and our priming.

Decisions (operator, 2026-10-20):
- Discovery should mostly happen **while the worker builds** — that is the
  efficient use of the client's time. **The first build starts sooner**, after a
  short opening, and the full story interview happens as a talker conversation.
- The talker **may** add notes to the story board even while a builder is writing
  the related text — the board is background material, never the site.
- The talker **may not** move the progress stages: "it is only talking; the stage
  is really determined by the work that is being done."
- The consultant **sets and reinforces expectations about where things are and
  what can be changed**.

## What changes

### 1. The talker setting on the consultant role
Declare REQ-210's `talker: {withhold: [...], refusal}` on the consultant.
- **Withheld (the worker's):** every site write (L1/page/section/style/asset
  writes, place_on_site, write_image), `Delegate`, making and choosing looks,
  image generation and editing, publish, and moving progress stages
  (`set_stage`). Enumerate from the consultant's actual granted tools; a UAT
  fails if any tool that can change the draft or the stage is not withheld.
- **Allowed:** story-board operations (pin notes, themes, headline options), panel
  questions and recording answers/facts/decisions, comps and comp notes, web
  search, read-only site tools (describe_page, list_changes, screenshot), and
  reporting progress from the worker's status.
- Refusal wording, in the client's terms: "That's part of the build that's
  running; I'll pick it up as soon as it's done."
- The settings assistant gets no talker setting.

### 2. Adopt REQ-209's status widget
Replace our own working line (REQ-390 / BUG-215 / BUG-234) with REQ-209's widget
and Stop building, keeping our wording rules: plain language, "The consultant is
…", no internal ids, step lines collapsed. Delete the replaced code rather than
keep both. The composer during a worker round is REQ-210's plain Send to the
talker.

### 3. Priming: the talker's job is discovery
The framework adds the shared fork explanation for roles with a talker setting.
Our part:
- **Talker reminder (per exchange):** you are the talker; your standing job is
  discovery. Work through the story areas still missing (the reminder lists them
  — from the story board's coverage), one question at a time, following each
  answer up on a specific detail; pin what the client says; point them at open
  panel questions when the story is covered; answer "how's it going?" from the
  worker's status only.
- **New story goes into the next pass, not the running build**, unless it
  contradicts something being built. The talker says so ("That's going into the
  copy on the next pass") and never promises a change to the site.
- **The worker's hand-over ends with a story question, not silence.** The
  announcement before a build ("Building the first draft — about 15 minutes")
  is followed by the first discovery question ("While I build, tell me how the
  salon started."), because a talker only speaks when the client does.
- **The worker's result picks up what the talker gathered**: name it, and say
  which pass it goes into.

### 4. Method: build sooner, story later
In the consultant's priming and the plan seed:
- **A short opening** — what the business is, who it's for, the main action, one
  or two story details — then start the first build.
- **Structure and look first, story-heavy copy last.** The first draft uses only
  what is known, with copy plainly a first version; the headline, about section
  and proof are written after the talker's interview.
- **Each pass ends with something whole the client can react to**, and the next
  pass is shaped by their reaction plus what the talker gathered.
- **Expectations, set and reinforced:** at every hand-over the consultant says
  where things are (which pass, what's placeholder, what's coming) and what the
  client can change now versus in the next pass. The "Getting to know you" finish
  line (REQ-405/REQ-408) is unchanged; it is now usually met during the first
  build rather than before it.

## Test plan
- Talker grant: with a worker round open, a client message opens a talker round;
  every draft- or stage-changing tool is refused with the client-worded refusal
  and its executor is not called; a story-board pin and a panel question succeed.
- The talker's reminder carries the missing story areas and the worker's latest
  status; the settings assistant has no talker.
- The composer sends to the talker during a build; Stop building stops only the
  worker; the old working line is gone and the widget uses "The consultant is …".
- Priming carries the hand-over-with-a-question rule, next-pass rule,
  build-sooner method and expectation-setting rule.


## Implementation (as built)

### Talker setting
- `tools/generate/src/cli/ai/talker.json` declares the consultant's talker: `refusal`
  ("That's part of the build that's running; I'll pick it up as soon as it's done."),
  `withhold` (Delegate, set_stage, choose_look, place_on_site, set_upload_role,
  delete_library_item, edit_image, CreateImage, EditImage and every L1 write incl.
  write_image and publish) and `allow` (everything else the consultant can be
  granted). Every granted tool must be in exactly one list; a UAT composes the real
  grant with the consultant's own writes off and on and fails on an unclassified tool.
- `roles.ts` `consultantRole` passes `talker: {withhold, refusal}`; the settings role
  has none. The consultant's backend declares `fork` and `interrupt` (the latter so
  Stop building really ends the round).

### Where the talker runs (Cloudflare constraint)
- The framework keeps the fork in the manager running the worker, and our Worker
  builds a manager per request, so the talker has to run in the isolate that runs the
  build. The client's message still goes to `/api/ai/interpose` (BUG-224's inbox on
  the chat ticket). The build's own request polls the inbox (every 2 s, riding the
  existing junction poll in `progress-core.ts`'s `withProgress`), and for each
  waiting message calls `manager.startTurn` — which opens the talker — and retires
  the message only once the talker opened. A message the build ended before taking
  stays waiting and the panel runs it as the next prompt, naming its id.
- The talker's records are read off the same junction and put on the BUILD'S stream
  as `talker` frames (`meta.event` start/text/done, `turn_id`, `message_id`); the
  panel routes them into the bubble under the client's message. A reattach after a
  reload (`tailSession`) routes them the same way and no longer ends at a talker's
  `turn_end`.
- For a room member's round (group chat) nothing changes: mid-turn messages are still
  interposed.

### Status widget and Stop building (REQ-209)
- The working line (REQ-390 / BUG-215 / BUG-234: `withWorkingLine`, step lines, the
  `working` event kind, `WORKING_*`/`STEP_REPEATED` constants and CSS) is deleted.
  The consultant's working notes are recorded as model-sourced `progress` records
  ("The consultant is building …", estimate as `eta_s`), which `webui-chat`'s status
  widget draws with its clock and Stop building; the host heartbeat stays wordless.
  Step lines are collapsed into the one widget line. `onBusy` (the plan panel's stage
  spinner) is driven by whether a stream of work is open.
- The session reports `talker: true`; the panel then sets `turnModes: {talk: true}`
  and wires `onStop`. Stop goes to `/api/ai/stop` with an optional `turnId`, kept on
  the chat ticket (`client_stops`) for the build's isolate, which calls
  `manager.requestStop` (no id → the build; a talker's id → that reply). Stops
  pressed before the turn began are ignored.
- The talker's story-board writes refresh the plan panel while the build runs (plan
  changes are reported on every event, not only after the worker's own tool calls).

### Priming
- Talker reminder (`talker.discovery` provider, `talker-*` templates): rendered only
  on a talker round; lists the story areas with no note on the board, the open panel
  questions, the next-pass rule and "answer how it's going from the worker's status".
- Story areas are data: `plan-seed.json` `story_areas` (how it started, craft, people,
  customers, community, refusals, proud moment). `pin_notes` takes an optional `area`
  per note; `missingStoryAreas` computes coverage.
- Consultant priming (both corpus variants): new sections "Build sooner, story
  later", "While you build" (hand-over ends with a story question; result names what
  the talker gathered and which pass it goes into) and "Where things are"
  (expectations at every hand-over). The announce-long-work reminder and the
  delegation `note` paragraph say to end the hand-over with a story question. The
  opening message tells the client to keep talking while the consultant builds.

### Superseded evidence
- BUG-224's "a message sent mid-turn is in the next model call" is replaced, for the
  consultant, by the talker. BUG-215's working-line panel suite is deleted. BUG-205,
  BUG-234, REQ-360, REQ-386 and REQ-390 assertions now read the status as
  model-sourced `progress` frames (heartbeats are `source: host`).

## Test plan (as built)
- `tests/test_UAT_FC_REQ-416_worker_and_talker.workers.test.ts`: a message posted
  mid-build is answered by a talker on the build's own stream; the talker is told its
  job, the missing story areas and the worker's status; `set_stage` is refused with
  the client-worded refusal and the stage does not move; `pin_notes` succeeds with its
  area; the worker is told the exchange at its next call; every granted tool is
  classified and the draft/stage-changing ones are withheld (writes off and on); Stop
  building from another request stops the build and is consumed; the settings
  assistant has no talker; the priming carries the method, hand-over question,
  next-pass and expectations rules.
- `tests/test_UAT_FC_REQ-416_talking_while_it_builds.test.ts`: the composer is in
  talk mode; the status widget shows "The consultant is …" with Stop building and no
  working line; a message mid-build is interposed and its talker reply drawn under
  it; Stop building sends a stop naming no turn; a message the build ended before
  answering runs next naming its id; a conversation without a talker still interposes.


### Accounting (operator, 2026-10-20: full accounting is required)
- Every talker round is metered on a spend row of its own ([[REQ-292]] `turn_spend`),
  written by the build's isolate once the round closes, from the round's own
  `turn_end` (which carries its spend however it ended): turn id = the talker round's
  id, role `consultant`, the project backend. The talker runs on a conversation forked
  from the worker's, so the worker's row never included these requests; every request
  made for a client message is now on exactly one row.
- UAT: `test_UAT_FC_REQ-416_a_talker_rounds_requests_are_metered_on_a_spend_row_of_their_own`
  — a metered talker's two requests appear on its own row (requests, input and output
  tokens), and the worker's row carries only the worker's.