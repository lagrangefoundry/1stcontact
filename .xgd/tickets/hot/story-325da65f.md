---
uid: story-325da65f
id: STORY-145
type: story
title: 'Handing A File To The Platform: One Overlay, Two Entry Points, And The Only
  Question It Asks'
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:31:10.902566+00:00'
updated_at: '2026-10-26T01:40:27.576768+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-87be4669
  capability_uid: capability-e9324eb7
  story_kind: upgrade
  story_points: 3
  updated_by:
  - bundle-5607a08d
---

## Story

**As a** small-business client working in the builder,
**I want** to hand a file to the platform by dropping it wherever I happen to be — the
conversation or my Library — and be asked the one question only I can answer, what the file is
*for*,
**so that** a photograph I want on my site goes onto my site, something I only want my assistant
to read stays private, and nothing I hand over is quietly filed as the wrong one.

## Description

The way a byte gets into the platform from a browser at all, and the single question it asks.

**Two entry points, one interaction.** Dragging files onto the conversation (the assistant asks
*"do you have a logo?"* and the answer is to drop one in) and dragging them onto the Library (the
deliberate path, for material that is not part of the current conversation) raise the same
full-screen overlay. Two moments, one decision, one surface — not one surface per moment.

**The areas are roles, not file types.** Sorting by file type would ask the client to tell the
platform something it already reads off the file itself, while leaving unasked the one thing it
cannot infer: what the file is for. The case that settles it is a JPEG that may be a hero
photograph destined for the site or a screenshot of a competitor the assistant should look at and
must never publish — identical bytes, identical type, opposite rights. So the overlay asks for the
file's **Purpose** and offers two areas: **Site asset** (it is for the site) and **Background
information** (it is only for the platform to read), each with a sub-line stating in plain words
what will happen to the file, including that background material will not appear on the site.
That promise is load-bearing: a client handing over their positioning document wants to know it
stays private, and the moment they are deciding where to put it is the moment to say so — the
shorter *Background information* label makes the sub-line carry more of that reassurance, not
less, so the sub-lines are unchanged by the relabel.

**One set of words for an area, wherever it is named.** The two areas' labels are defined once.
The overlay shows them, the Library's role pill and role filter show them (STORY-144), and the
assistant's own manual quotes the *Site asset* label when it tells the assistant to ask the
client to drop a file on the conversation — so a client told "choose Site asset" finds a button
by that name, and no relabel can reach one surface and miss another. The labels are copy; the
role values a handover sends (`site`, `reference`) are wire vocabulary and do not change with
them.

**Nothing is created without a person having chosen.** A file that lands on the overlay but not
in an area creates nothing: the overlay stays up, both answers are marked, and it says what is
missing. There is no safe default — falling back to *Site asset* publishes what the client meant
to keep private, and falling back to *Background information* withholds the photograph they meant
to publish. Both are silent, both are wrong, so the only correct answer is to keep asking.

**The gesture is never required.** Every area is a control that can be activated directly and
opens the file chooser with the same role attached, because dragging is a gesture some people
cannot perform and some devices do not offer. A drag carrying no files — text dragged inside the
page — never raises the overlay over the builder.

**What the client is told afterwards depends on where they were.** A handover made in the
conversation appears there as the client's own turn, naming the file and reporting what actually
happened — including the parts that went wrong: a file that did not upload, a placement that did
not land, material stored but not yet searchable. A handover made in the Library does not put a
line into a conversation it was not part of; it reaches the assistant by the same path either
way. And the site currently open travels with the handover, so a *Site asset* file is on
that site immediately rather than after some later step nobody has specified.

**In scope**: the overlay and its two role areas; the copy that states what each role means,
and its being the one definition every surface naming an area reads;
raising it from either entry point; committing a role by dropping or by activating an area;
refusing to create anything from an ambiguous drop; what the conversation is told afterwards;
and the site the handover is made against travelling with it.

**Out of scope**: the pipeline that stores, classifies, describes and indexes the file; the
promotion gate that decides whether material may become a site asset and picks a free name; the
declared `role` field and the rights it narrows; and the Library tab itself.

## Technical Context

- Depends on the Library (STORY-144, CAP-113): the overlay is raised from the Library as well as
  the conversation, and a handover made from either is reflected in the Library's list
  afterwards.
- The rights a role implies, and the refusal that keeps *Background information* material off a
  published site, belong to the ingestion pipeline (STORY-140) and the promotion gate
  (STORY-143). This story asserts which role is sent and what the client is told; it does not
  restate what the origin then does with it.
- The declared `role` value, its validation and the narrowing of inferred rights are the material
  vocabulary's, under its own plan item. What is this story's is that the overlay has no drop
  target which is not one of the two areas — so *a human chose* is mechanically true here rather
  than a rule the receiving surface is asked to assert on the client's behalf.
- The workspace chrome that hosts the conversation and the Library belongs to STORY-99; the
  tab-counting criteria the second tab falsified are restated under their own plan item, not
  here.
- REQ-176 relabelled the prompt (*What's this for?* → *Purpose*) and the areas (*Put it on the
  site* → *Site asset*, *Just for you to read* → *Background information*). The assistant
  manual's absence note is a declared surface that quotes the label rather than computing it, so
  its agreement with the definition is held by AC-2021's verification (asserted against the
  definition, not a literal) — the relabel had already let two older suites drift onto the old
  word. Sibling criteria that refer to the roles by their meaning (*put it on the site*, *just
  for you to read*) describe the role, not the button text, and assert role values; they are
  unaffected by the relabel.

## Reconciliation Decisions

- **Dismissing the overlay creates nothing, and the next raise starts clean** (decided at
  reconciliation, 2026-09-10): the intent settles what an *ambiguous* drop does and is silent on
  the client changing their mind. The landed overlay can be dismissed outright, creates nothing
  when it is, and clears the "say what is missing" state before it is raised again. Formalized,
  because a surface whose whole claim is "nothing is created without a choice" must also honour
  the choice to make none, and a stale *you missed* message on a fresh drag would accuse the
  client of a mistake they have not yet made. Formalized as AC-1734.

- **Several files in one handover are reported one by one** (decided at reconciliation,
  2026-09-10): the intent speaks throughout of *a* file and is silent on a multi-file drop. The
  landed surface accepts them, hands them over one at a time, and reports each on its own.
  Formalized, because a client dropping four photographs needs to know which of the four
  arrived — a single aggregate confirmation makes one failure among four indistinguishable from
  four successes. Formalized as AC-1735.

- **The Library reflects the new material after a handover from either route** (decided at
  reconciliation, 2026-09-10): the intent states that both routes reach the assistant the same
  way and is silent on what the client sees. The landed surface re-reads the list from the
  platform after a handover, including one made in the conversation. Formalized, because the
  facts that decide how a row reads — whether the file could be described, whether it reached the
  site — are settled after the bytes leave the browser, so a list redrawn from what the handover
  returned would show a different state than the one that exists. Formalized as AC-1735.

## Dependencies

- Plan item 11 — The Library tab (STORY-144). The overlay watches the Library as one of its two
  entry points and refreshes its list after a handover.

## Story Points

3