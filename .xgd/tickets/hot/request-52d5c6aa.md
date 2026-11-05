---
uid: request-52d5c6aa
id: REQ-477
type: request
title: 'Stage guides: the host hands the consultant each guide once, when its step
  starts'
created_by: EPIC-19
created_at: '2026-10-27T20:48:10.775940+00:00'
updated_at: '2026-10-27T21:32:19.053736+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-e87cfec3
  commits:
  - working_sha: d44b4f1fda2fe4b4ac4218c64866e1af9ac3501c
    reconcile_sha: null
    main_sha: null
  - working_sha: d83da42097c607c18efda162b388cacd44399117
    reconcile_sha: null
    main_sha: null
  - working_sha: abaf757a8616aaa4c6c0137abd54cae0857f8f17
    reconcile_sha: null
    main_sha: null
  - working_sha: 0372a4e17121eebb41d9f0d974355fc9f79788ae
    reconcile_sha: null
    main_sha: null
  - working_sha: f32b398be9f61ea03b4b0a69bb6d4630f76e1470
    reconcile_sha: null
    main_sha: null
  version: 0.2.684
  story_points: 5
---

## Why

Since REQ-473, the consultant's detailed method lives in ten stage guides in the knowledge base (DOC-75). The only prompt to use them is one line in the per-turn reminder: "At a stage, read its guide: search your knowledge base for it."

On First-Draft-Test Dina's Diner 6 (2026-10-27), the consultant went from the finished comparison board to the design and the first build without ever searching for the first-draft guide. So it never talked the hero's signature effect through with the client, which that guide asks for. Its brief said "keep motion minimal".

A rule the model has to remember to look up is a rule it can skip. This was the trigger DOC-71 §9.2 set for building a lookup.

## What

**1. The host gives the consultant a stage's guide at the moment that step starts.** The guide text is included with that turn, as host guidance, not shown to the client. Each guide is tied to a moment the host can already detect, for example:
- **the opening:** a new conversation;
- **the comparison board:** the board is first filled;
- **the story board:** the first notes are pinned;
- **the design:** the visual direction is agreed and no design has been written;
- **the site plan:** the design is written and there is no page plan;
- **the first draft:** the first-draft stage starts;
- **checking your work:** the first builder result comes back;
- **refinement:** that stage starts;
- **finishing touches:** that stage starts;
- **publishing:** that stage starts;
- **focus tasks:** a focus task is set.

The implementing session settles the exact triggers against the plan and host events that exist, and lists them here.

**Settled triggers** (each a condition on the site's plan; `stage-guide-core.ts`):
- **the opening:** "Getting to know you" is not done and nothing is built yet;
- **the comparison board:** the board is raised (`ask_comps`), a site is on it, or "Looking at other sites" is in progress — and the client did not skip comparing;
- **the story board:** the first note is pinned, while "Getting to know you" is not done;
- **the design:** no design is written and a direction is on the card (or the comparison board was skipped or is done);
- **the site plan:** the design is written and `pages_navigation` is not recorded;
- **the first draft:** `pages_navigation` is recorded and nothing is built yet, or "First draft" is in progress;
- **checking your work:** the first builder result has come back (the plan's first pass);
- **refinement / finishing touches / publishing:** "Refining" / "Finishing touches" / "Ready to publish" is in progress;
- **focus tasks:** a focus task is set.

**How it is delivered:**
- **At a turn's start:** the guide follows the turn's own words in the recorded user turn, under one host line ("[The host, not your client, who does not see this: the guide for the step that starts now. Work from it.]"). It stays in the conversation history; a reloaded chat strips it, so the client never sees it, and a host cue carrying it is still recognised as a cue.
- **Mid-turn:** when a consultant tool call writes the plan (or a build returns) and that starts a step, the guide follows that call's result, so the consultant has it before its next move (e.g. recording the pages brings the first-draft guide before the build). A tool result is not in the recorded history, so the next turn carries that guide once more.
- **Recorded on the plan** as `guides_sent` (guide → when; `in_call` while it awaits that carry), so it is once per site across isolates. When a guide's stage is done its record is cleared, so reopening the stage hands it over again (comparison board ↔ "Looking at other sites", story board ↔ "Getting to know you", first draft, refinement, finishing touches, publishing).
- **Source:** DOC-75 as shipped in the system knowledge base bundle (the Worker reads `KB.docs['DOC-75.md']`). No built KB means no guides, as before.
- The cached priming's route paragraph now reads "When a stage starts, the host hands you its guide. To reconsider one, search your knowledge base for its guide".

**2. Only the context the consultant needs:**
- **One guide per step, sent once per site.** It is not sent again on later turns, and never all ten at once. The text stays in the conversation history, which is cached.
- **Sent again only if that stage is reopened.**
- **The always-on cost goes down:** the per-turn reminder line "At a stage, read its guide…" is removed, because the host now does it. The guides stay in the knowledge base for search.
- **Measured:** the turn that receives a guide grows by that guide's size (0.8–1.9K characters today), and the consultant's per-turn reminder tail shrinks by the line removed. Record both numbers here.
  - **Recorded:** a turn that receives a guide grows by that guide plus ~115 characters of host line: guides are 0.8–2.1K (opening 1,731; focus tasks 817; comparison board 1,965; story board 1,446; design 1,150; site plan 1,302; first draft 2,067 after the §3 edit; checking 1,136; refinement 1,267; finishing touches 1,145; publishing 1,899). The per-turn reminder tail shrinks by 64 characters (the 62-character line and its separator) on every turn.

**3. The first-draft guide must stand alone on the signature effect.** Today it says to talk the effect through "(see finishing touches)", sending the consultant to another guide and then to the motion reference (DOC-74). Bring the few lines needed for that conversation into the first-draft guide itself:
- what the effect is for;
- two or three options suited to the client's own photo;
- how the client can see motion ("Open in new tab", or "View on your phone").

DOC-74 stays the deep reference. This is a DOC-75 edit, made as part of this ticket.

Done: the first-draft guide's signature-effect bullet now says what the effect is for, offers options by kind of photo (a dish, a place, someone at work), says not to brief "keep motion minimal" without asking, and how to see motion ("Open in new tab", "View on your phone"); "(see finishing touches)" is gone.

**Out of scope, on purpose:** no host check that refuses the build until the signature effect is discussed. The operator decided on 2026-10-27 that this goes too far. If transcripts show the consultant still skips that conversation with the guide in front of it, revisit.

## Test plan

`tests/test_UAT_FC_REQ-477_stage_guides_handed_over.test.ts`, through the real host (`streamPrompt`, the real session manager and plan port semantics) with the shipped DOC-75 and a scripted model client:

- `test_UAT_FC_REQ-477_guide_arrives_when_its_step_starts`: when the first-draft stage starts, the consultant's request for that turn carries the first-draft guide's text. The next turn's request does not carry it again.
- `test_UAT_FC_REQ-477_one_guide_not_all`: on a step's start, exactly that step's guide is carried, and no other.
- `test_UAT_FC_REQ-477_reopened_stage_resends`: reopening a stage sends its guide once more.
- `test_UAT_FC_REQ-477_reminder_line_removed`: the consultant's per-turn reminders no longer say to search for the stage guide, and the reminder tail is shorter by that line.
- `test_UAT_FC_REQ-477_first_draft_guide_covers_the_signature_effect`: the first-draft guide names the signature-effect conversation, with options and how to view motion, without pointing at another guide for it.
Also: the reloaded chat shows the client's words only (in the first test); a mid-turn `set_decision` for `pages_navigation` carries the first-draft guide in its result (in the second). Tests that pinned the removed reminder line (BUG-65, REQ-171, REQ-182, REQ-473) now assert it is gone; BUG-289's result helper reads a tool's own first block, since a host note may now follow it.