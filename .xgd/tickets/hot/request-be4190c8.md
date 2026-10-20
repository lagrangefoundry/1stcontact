---
uid: request-be4190c8
id: REQ-416
type: request
title: 'Worker and talker: adopt LF REQ-209/210 so discovery happens while the consultant
  builds'
created_by: EPIC-19
created_at: '2026-10-20T13:39:11.750473+00:00'
updated_at: '2026-10-20T13:44:48.494369+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  story_points: 13
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-2e572211
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