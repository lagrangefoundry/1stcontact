---
uid: request-d3825c8a
id: REQ-403
type: request
title: 'First entry: a placeholder preview, no false ''All done'', and a ''Click here
  to start'' that opens with the consultant''s stock introduction'
created_by: EPIC-19
created_at: '2026-10-17T15:30:00.060690+00:00'
updated_at: '2026-10-17T15:30:00.060690+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
---

## What changes

The first time a client opens the builder for a new business, everything they see should explain itself. Today the three panes each say something misleading or nothing at all. Decided with the operator on 2026-10-17.

## Requirements

### 1. The preview pane before anything has been built

**Today:** the pane shows the starter page seeded for every new business. Its heading is `STARTER_HEADING = 'Your 1stcontact site'` (`apps/control-app/src/identity.ts`), so the client sees a web page that isn't their site, spelled "1stcontact" rather than "1st Contact".

**Wanted:** until the consultant has built a first page, the preview pane shows a **plain grey panel** with centred text: **"Your site will appear here as it's created."** It must not look like a web page.
- As soon as a real page exists, the pane shows it as usual.
- The implementer chooses how to tell "nothing built yet" from a real page: not seeding the starter, or recognising it. Whichever is chosen, the client never sees the starter heading, and the starter page is never published.
- Wherever the product name still appears in client-facing text, it's written "1st Contact".

### 2. The question panel before any question exists

**Today:** with no questions at all, the panel shows `PLAN_ALL_ANSWERED`: *"All done — thanks, that's everything I need for now."* That's false, because nothing has been asked yet.

**Wanted:**
- **The "All done…" text is removed entirely,** in every state, not just at the start.
- The **OPEN QUESTIONS** and **WHAT YOU'VE TOLD US** sections (REQ-401) appear **only when they have something in them.** At the start there are none, so neither heading shows.
- The progress banner (REQ-398, BUG-209) is unchanged.

### 3. The chat before the session starts

**Today:** an empty conversation with a text box.

**Wanted:**
- **A brand-new conversation shows one button in the centre of the chat pane: "Click here to start".** There's no text box, no transcript and nothing else.
- **Clicking it makes the consultant's opening message appear,** typed out as if streamed. It's **stock text, not a model call**: no API request, no spend.
- **The opening message is recorded as a real assistant turn in the conversation's history**, so the model sees it as its own first message on every later turn, and it's shown again on reload like any other turn.
- **After the message has appeared, the text box appears** and the client replies as normal. The client's reply is the first message sent to the model.
- **It happens once per conversation.** A conversation that already has turns never shows the button. A reload after clicking shows the transcript, not the button.

**The stock opening message** covers three things, in the consultant's voice (DOC-66: no personal name, "I" and "you"):
- **(a) Who the consultant is and what it's for:** it designs and builds the site with the client, gives honest opinions, and the client always has the final say.
- **(b) The process,** following the stages in the progress banner: getting to know the business, looking at other sites, a first draft, refining, colours and fonts, finishing touches, ready to publish. It also says the client can move around freely.
- **(c) How working together goes:**
  - the questions panel above the chat collects simple facts, filled in whenever suits;
  - the preview shows the site as it's built, with "View on your phone";
  - the consultant tells the client before long pieces of work and roughly how long they'll take;
  - when there are several looks, the client tells the consultant which they prefer;
  - uploads (photos, logo, flyers) are welcome.

The message ends with the consultant's first question about the business. It's written once, in one place beside the other builder copy and the stage list it describes, and kept short enough to read in under a minute.

**This replaces REQ-399 §4** ("the consultant speaks first" via a host-run model turn). Its purpose stays: the consultant opens the conversation. Its mechanism changes from a model call to stock text the client releases with the button. Wherever REQ-399's code already implements §4, it's replaced, not kept alongside.

## Out of scope

- The wording of everything after the opening message.
- The features question (REQ-399 §1–3).

## Test plan

UATs `test_UAT_FC_<this ticket>_*`:

- **A new business with nothing built:**
  - the preview shows the grey placeholder with "Your site will appear here as it's created." and no starter-page heading;
  - after a page is built, the page is shown.
- **The question panel of a new plan:** no "All done" text, and no OPEN QUESTIONS or WHAT YOU'VE TOLD US heading. With one open question, only OPEN QUESTIONS shows.
- **A new conversation renders only the "Click here to start" button,** with no composer.
  - Clicking it appends exactly one assistant turn with the stock text, makes no model request, and records no spend.
  - The composer appears after the message has appeared.
  - On reload the transcript is shown with the opening message and there's no button.
  - A conversation that already has turns never shows the button.
- **The client's first message reaches the model with the opening message in its history** as the preceding assistant turn.
