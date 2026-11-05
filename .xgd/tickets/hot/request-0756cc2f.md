---
uid: request-0756cc2f
id: REQ-479
type: request
title: 'Builder chat: Feedback button with context, landing on the tester''s contact
  page'
created_by: EPIC-28
created_at: '2026-10-28T00:09:01.058208+00:00'
updated_at: '2026-10-28T01:00:40.873659+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  epic_parent: epic-7c85d456
  story_points: 8
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-b54989c2
  commits:
  - working_sha: ce4f6dbd7e48ac39ba806e4ca41104669d7d8062
    reconcile_sha: null
    main_sha: null
  - working_sha: 3970649e20e065ca7a0196c9ec83754dd4901f16
    reconcile_sha: null
    main_sha: null
  version: 0.2.689
---

Part of [[EPIC-28]] (beta test experience). Everyone signed in is a beta tester for now; there is
no tester flag.

## What the tester sees

- A **Feedback** control in **every** chat panel of the builder (Site consultant, Settings
  assistant and every other assistant panel). It can be pressed at any moment, including while a
  build or a reply is in progress.
- Pressing it opens a short form: a multi-select list of common problems, then a free-text box.
  Starting options:
  - Not sure what to do next
  - The assistant's message is confusing
  - This is taking too long
  - The site doesn't look the way I wanted
  - Something looks broken
  - I was asked something I can't answer
  - I like this
- Submitting needs at least one option ticked or some text.
- Submitting never interrupts the conversation or a running build. The panel acknowledges it
  inline. The tester sees only that acknowledgement; feedback is never shown to, or fed to, the
  consultant or any other assistant.

## What each submission records

- the chosen options and the free text;
- which assistant panel it was sent from;
- the conversation and the turn: the last message on screen in that panel;
- the site plan's current stage and phase ([[DOC-71]] stage names);
- the page and mode the preview shows, and a **screenshot of the preview** as the tester saw it;
- whether a build is running;
- the time, **minutes into the current session**, and **total time on this site so far**. A session
  is a run of tester activity ended by an idle gap of 30 minutes with no message from the tester;
  both figures come from timestamps already stored, not from new browser signals.

## Where the operator reads it

Each submission appears as an entry in the tester's history on their **contact page** in the
1st Contact business's **Contacts**, showing the recorded context and the screenshot. From the
entry the operator can open the exact point in the conversation it was sent from.

A tester is a contact in the 1st Contact business: they are invited from their contact record
and the signed-in session belongs to that contact. For a signed-in request `admit()` returns the
contact as `admission.user`, and contact history is already written with
`contactEventInsert({ contactId: admission.user.id, … })` (e.g. `terms.ts`), so feedback uses the
same path. No new linking is needed.

## Consent: the T&C clause

Testers are told once, in the terms they accept at sign-in (REQ-169, `terms.ts`), that during
the beta their sessions (conversations, feedback, screenshots of their preview and activity
timing) are reviewed by the operator to improve the product, including with AI tools. There is
no per-review prompt ([[DOC-5]] principle 26). Add the clause to the terms text and change
`TERMS_VERSION`, so existing users accept the new terms on their next request. The rest of the
terms text is still placeholder; that is a separate content dependency.

## Constraints

- Works in production (`app.1stcontact.io`), not only dev.
- Collects only what is listed above; nothing is collected from the browser beyond the preview
  screenshot.

## Test plan

UATs named `test_UAT_FC_<this ticket>_*`:
- the Feedback control is present in every assistant panel;
- a submission from the Site consultant panel and one from another panel each produce a contact
  history entry on the signed-in tester's contact, carrying options, text, panel, turn, stage,
  preview page/mode, screenshot, build-running flag and session times;
- submitting during a running turn doesn't interrupt the turn and isn't visible to the assistant;
- an empty submission is refused;
- after the `TERMS_VERSION` change a previously accepted user is asked to accept again, and the
  terms text contains the beta review clause.

-

-