---
uid: story-f775289b
id: STORY-134
type: story
title: 'The Library: everything I have given you, shown as itself, with the one thing
  I may correct'
created_by: xgd
created_at: '2026-09-04T04:26:00.412868+00:00'
updated_at: '2026-09-04T04:28:47.005003+00:00'
completed_at: null
last_field_updated: body
status: unplanned
fields:
  intent_uid: bundle-203b1dc2
  capability_uid: capability-54651ef2
  story_kind: feature
  story_points: 3
---

## Story

**As a** business owner working on my site in the builder,
**I want** one place that shows me everything I have given the platform — the file itself, what the
system understands it to be, and where it came from — and lets me correct that understanding,
**so that** I can see what you actually hold on my behalf, and fix it when you have read my file
wrong, rather than trusting a description I can neither see nor change.

## Description

The client's photographs, fonts, brand guidelines and positioning papers all become records with a
written description of what they say ([[CAP-108]], [[CAP-106]]). Before this the builder could see
none of them: the image picker lists what one site's assets already hold and is reached by clicking
an image — it is a field editor, not a library.

**In scope**

- A Library surface in the builder workspace, beside the site surface: a list of the client's
  material on one side, the selected item in full on the other.
- **The list is the whole account's material** — including material bound to the client's *other*
  sites and material bound to no site at all. [[DOC-38]] §7.7 lets one file back two sites and
  [[DOC-10]] §4.1 makes shared knowledge across a client's sites deliberate: their second site
  should not start as cold as their first. "Used on this site" is therefore a **badge and a
  filter, never a boundary**.
- Narrowing the list by what the material is for, by what kind of thing it is, and by whether it is
  used on the site currently open.
- The selected item shown as **itself** — the picture, not its filename — beside the record of what
  it is, where it came from and what may be done with it.
- **The rights record is read-only, and the description is the one editable thing.** A correction
  reaches retrieval, not merely the screen, and is attributed to the client so nothing later
  overwrites their words.

**Out of scope**

- Putting a byte in from the browser — the drop overlay, the role question and promotion into a
  site's asset library are the sibling story in this capability.
- The ingestion pipeline itself ([[CAP-108]] / STORY-132) and what a description is made of
  (STORY-133). This surface is a read view over what ingestion creates.
- The asset **picker** ([[CAP-88]]): the picker chooses a value for a field, the Library manages the
  material. Neither replaces the other.
- Capture and fetch-on-the-client's-behalf. Both create records that appear in this list; neither is
  operated from here.

## Technical Context

- The surface is built by **configuring the shared split and list-detail components**, not by
  growing a second set of them, and its detail pane is built from the **existing field-editing
  vocabulary** — the intent's acceptance is explicit that no new editing components appear.
- The bytes are served **through the builder origin from the private material store**, never from
  the public site origin: the public Worker deliberately has no binding on the material bucket
  ([[DOC-38]] §7.1), and giving it one to save a hop is exactly the disclosure that boundary exists
  to prevent. Depends on this bundle's blob-addressing correction — the bytes are reached through the
  record that owns them.
- **The rights record is inferred, never asserted.** [[DOC-38]] §10.1 derives rights,
  republishability and exportability from provenance precisely so the client is never put in front of
  a legal question; a republishable flag they could tick by hand would be that question with a
  checkbox on it.
- **Not an existence oracle.** A uid that names something other than the client's material is
  answered as *not found* rather than *forbidden*, identically across every route here, so the
  surface cannot be used to enumerate which records exist in the account.
- The correction must reach the index. [[DOC-39]] §4 is explicit that retrieval sees the index and
  not the stored text: a corrected description that was never re-embedded would leave the Library
  showing the client's words while search kept answering with ours.
- The workspace chrome criteria this second surface makes false as written — the ones that counted
  panels and dropdowns while the builder had exactly one of each — are restated by this bundle's
  workspace-chrome upgrade item against [[CAP-85]] and [[CAP-91]], not here.

## Reconciliation Decisions

- **Free-text narrowing of the list** (decided at reconciliation, 2026-09-03): REQ-161 asks for
  "a filter at the top" and its acceptance names only role, kind and "used on this site". The
  landed surface also narrows by typed text against the material's name, conjunctively with the
  other three. Intent is silent rather than contradictory — a generic "filter" is what it asked
  for — and a library of a client's own files is unusable at any real size without name search.
  Formalized as part of AC-1560 rather than left as undocumented behaviour.
- **Material nothing has read yet says so on this surface** (decided at reconciliation,
  2026-09-03): STORY-133 promises material with no usable description is *stored whole and honestly
  described as unfindable by its contents*; REQ-161 does not say what that looks like in the
  Library. The landed pane says it in the client's own terms and invites the correction. This is
  the visible half of a promise the matrix already carries, so it is formalized here rather than
  left to the pipeline story, which has no surface to show it on. Formalized as AC-1567.
- **Every kind of material is reachable as a file, not only images** (decided at reconciliation,
  2026-09-03): the intent says the detail shows "the blob itself, not just its name" and names the
  preview; it does not say what a font or a PDF looks like. The landed pane renders images and
  offers everything else by its own name to open. Formalized as part of AC-1561 so that "shown as
  itself" is not read as "images only".

No contradiction between intent and the landed code was found for this plan item: every behaviour
above is either what REQ-161's acceptance states or a case it did not reach.

## Dependencies

- **STORY-132** (Ingestion: bytes to a kept, understood, findable record) — this surface is a read
  view over what ingestion creates: cheap after it, impossible before it.
- The blob-addressing correction carried by this bundle's material-storage upgrade item: reading a
  file back was addressed by content hash and found nothing every time, which is the defect this
  surface is the first to exercise.

## Story Points

3
