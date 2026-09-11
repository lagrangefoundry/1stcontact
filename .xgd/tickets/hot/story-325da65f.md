---
uid: story-325da65f
id: STORY-145
type: story
title: 'Handing A File To The Platform: One Overlay, Two Entry Points, And The Only
  Question It Asks'
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:31:10.902566+00:00'
updated_at: '2026-09-11T05:42:20.700482+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-87be4669
  capability_uid: capability-e9324eb7
  story_kind: feature
  story_points: 3
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
must never publish — identical bytes, identical type, opposite rights. So the overlay offers two
areas: *put it on the site* and *just for you to read*, each stating in plain words what will
happen to the file, including that reference material will not appear on the site. That promise
is load-bearing: a client handing over their positioning document wants to know it stays private,
and the moment they are deciding where to put it is the moment to say so.

**Nothing is created without a person having chosen.** A file that lands on the overlay but not
in an area creates nothing: the overlay stays up, both answers are marked, and it says what is
missing. There is no safe default — falling back to *on the site* publishes what the client meant
to keep private, and falling back to *just to read* withholds the photograph they meant to
publish. Both are silent, both are wrong, so the only correct answer is to keep asking.

**The gesture is never required.** Every area is a control that can be activated directly and
opens the file chooser with the same role attached, because dragging is a gesture some people
cannot perform and some devices do not offer. A drag carrying no files — text dragged inside the
page — never raises the overlay over the builder.

**What the client is told afterwards depends on where they were.** A handover made in the
conversation appears there as the client's own turn, naming the file and reporting what actually
happened — including the parts that went wrong: a file that did not upload, a placement that did
not land, material stored but not yet searchable. A handover made in the Library does not put a
line into a conversation it was not part of; it reaches the assistant by the same path either
way. And the site currently open travels with the handover, so a *put it on the site* file is on
that site immediately rather than after some later step nobody has specified.

**In scope**: the overlay and its two role areas; the copy that states what each role means;
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
- The rights a role implies, and the refusal that keeps *just for you to read* material off a
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