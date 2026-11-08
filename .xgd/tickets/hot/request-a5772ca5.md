---
uid: request-a5772ca5
id: REQ-661
type: request
title: 'Paperwork tab: Email | Legal modes, three panes, editing, preview, Send to
  me'
created_by: EPIC-30
created_at: '2026-11-07T18:57:42.922166+00:00'
updated_at: '2026-11-07T21:03:52.231470+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-087800af
  story_points: 13
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-3a8e0dea
  commits:
  - working_sha: bd2469888da37fe84898d0522ded1d8909a8ab9c
    reconcile_sha: null
    main_sha: null
  - working_sha: dba8edfe45baa6f5e67de736183d4ce0e2eab8f5
    reconcile_sha: null
    main_sha: null
  version: 0.2.811
---

## What this is for

EPIC-30. The builder's **Messages** tab: a business's outgoing words — what it sends, and what it requires its people to accept. Two modes: **Email | Legal** (operator, 2026-11-07: "Two tabs for now"). Both are three panes — **Items · Detail · assistant** — from the start; the assistant pane is a drop-in that the assistant-wiring ticket fills (operator: "AI chat should just be a drop in - the tools and prompts for those screens can come in a second pass").

## Behaviour

1. **Paperwork tab** in the builder, with a mode switch **Email | Legal**. Each mode has Items, Detail and an assistant pane. Until an assistant is wired, its pane says it is not available yet; the pane takes the role it opens, so wiring needs no layout change.
2. **Email · Items** lists **Messages** (trigger, audience, on/off, subject) and **Templates** (name, default marker, how many messages use it).
3. **Email · Detail — a message:** edit subject, markdown text, SMS/push text, sender (dropdown of the business's senders), template, on/off. Required placeholders are shown and cannot be deleted; a refused save says why. A **mailbox preview** renders the message in its template with the trigger's fake values. A **Send to me** button sends a test to the signed-in person (routes from the records ticket). **Saving is live**, and the pane says so ("Saved — the next email uses this"). A history list shows earlier versions with **Revert**.
4. **Email · Detail — a template:** preview of the template with sample content in its slot, the messages that use it, **Set as default**, and history with Revert. Editing a template's look is the assistant's job (L1); this pane does not offer a raw editor.
5. **Legal · Items** lists the business's required documents (EPIC-29's mechanism, REQ-488): each with its current published version and any draft. For the 1st Contact business these are the platform's Terms, Privacy Notice and Beta Terms; for a client business, whatever EPIC-29 holds as its required set (empty until EPIC-29's client documents exist — the pane says so).
6. **Legal · Detail** shows the document (markdown, rendered safely), its versions, and the **acceptance count** (see EPIC-30: among the people who must accept it, how many accepted the current version, only an older one, none). Editing and publishing documents remain EPIC-29's.
7. **Selection is published** to the assistant pane: which message, template or document is open (consumed by the assistant-wiring ticket's "what the client is looking at" reminder).
8. **Edits made here are counted** for the assistant ("changes the client made") and the pane **refreshes on a `messages_changed` event** when the assistant saves — the same contract as Settings' `BUSINESS_CHANGED`.

## Constraints

- The pane is an ordinary caller of the records ticket's routes; it never drives the assistant and the assistant never drives it.
- Acceptance counts never name anyone.

## Why free-coded

UI over routes defined by its sibling; no new platform model.

## Test plan

UATs named `test_UAT_FC_REQ-661_*` (browser, real routes, Resend mocked):
- The tab opens with Email and Legal modes, each showing three panes.
- Editing a message's subject and saving changes the preview and the next send; Revert restores the earlier wording.
- Deleting a required placeholder is refused with the reason shown.
- Send to me records a test send to the signed-in address.
- Legal lists the 1st Contact business's three documents with their versions and acceptance counts.
- A `messages_changed` event refreshes the open message.

## Order and dependencies

- **Email mode needs REQ-660's routes.** The tab frame and **Legal mode** need only EPIC-29's existing mechanism (REQ-488), so they can start before REQ-660 lands.
- Runs **in parallel with REQ-662 and REQ-663** once REQ-660 is in. REQ-662 fills this ticket's assistant pane; REQ-663 adds the Senders list to Email mode and feeds the sender dropdown (until then the dropdown holds the one seeded sender).



## As implemented (REQ-661 session, 2026-11-07)

What landed, and the decisions taken while building it. Where this differs from an item above, this section describes the code as it now stands.

**The tab** (`builder/paperwork.js`, `config.js` `PAPERWORK_TAB`)
- A **Paperwork** tab, placed among the work tabs **just before Settings** (Settings stays the last product tab, Debug after it). Mode pill **Email | Legal** (the Shop's segmented control); the mode is remembered per browser.
- Each mode is a split: **Items · Detail** (a standard `webui-list-detail`) on the left, the **assistant pane** on the right. The pane carries `data-role` = `email` / `legal` and says "The Email assistant is not available yet." / "The Legal assistant is not available yet." REQ-662 puts its conversation in it with `setAssistant(mode, element)`; nothing in the layout changes.
- A business switch clears and re-reads the tab, like the Shop and Contacts.

**Email mode** (REQ-660's routes, unchanged in shape)
- Items: two groups — **Messages** (name, On/Off, audience, subject) and **Templates** (name, Default marker, "Used by N messages").
- A message's detail: Subject, Email text (markdown), SMS/push text (up to 320 characters), **Sender**, Template, On, the trigger's **placeholders** (required ones marked "must stay"), **Save**, **Preview changes**, **Send to me**, a status line, the **mailbox preview** (the rendered email in a sandboxed frame — scripts off, no same-origin — with the trigger's fake values), and **History** (every version, Revert on all but the current).
- **Sender is a dropdown with one entry** — who the message is from today (REQ-660 item 9: From is unchanged until REQ-663). It is there so REQ-663 fills it rather than adds it.
- Save is live: the status says "Saved — the next email uses this." A refused save shows the routes' reason ("Not saved: …"). Revert says "Reverted to version N — the next email uses it." Send to me says "Sent a test to <address>." (the route sends only to the signed-in person's verified address, and records it as a test send).
- A template's detail: a preview of the template with sample content in its slot (a message that uses it — else any message — previewed with `template` set to this one; no new route), the messages that use it, **Set as default** (or the Default marker), and History with Revert. No raw editor: "Changing how a template looks is the Email assistant's job."

**Legal mode** (`paperwork-legal.ts`, new route `GET /api/paperwork/legal`, owners and live delegates only)
- For the **1st Contact business** (the platform tenant) it lists the documents in force from EPIC-29's published bundle — Terms of Service, Privacy Notice, Beta Terms — each with every published version (newest first) rendered through the legal markdown sink, shown in a sandboxed frame, any version selectable. For **any other business** it answers no documents and the pane says "This business has no required documents yet."
- **Drafts are not listed** (a deviation from item 5): drafts are xgd doc tickets the build deliberately leaves out of the published bundle, so the Worker has none to show. Editing and publishing stay EPIC-29's.
- **Acceptance count:** the people who must accept are the business's people who have signed in (`users.first_seen_at` set, not synthetic). For each document, how many hold the current version, only an older one, and none (never, or withdrawn). Two bounded queries per business (Architecture Policy 35). The answer carries counts only — no ids, no addresses. The row reads "3 of 5 accepted this version"; the detail spells out current / older / none.

**For the assistant (items 7 and 8)**
- **Selection is published:** the open message, template or document is `selection()` (`{mode, kind, key}`), set on the mode's assistant pane as `data-selection` (`message:signin`, `document:terms`), and passed to an `onSelection` callback.
- **Edits are counted** by a new route, `GET /api/messages/changes?since=<ISO>`: every message and template version written after `since` (saves, reverts, a new default, a new template); seeds are not changes. REQ-662's reminder calls it with the assistant's last turn's end.
- **`messages_changed`:** the chat pane maps the event kind `messages_changed` to an `onMessagesChanged` callback (beside `business_changed`), and `host-core.ts` exports `MESSAGES_CHANGED` for REQ-662 to emit. The Paperwork pane's `messagesChanged()` re-reads the lists and the open message or template in place.

**Tests**
- `tests/test_UAT_FC_REQ-661_paperwork_tab.test.ts` (jsdom; the real builder with its webui components; the Paperwork transport answers in the routes' shapes): the tab and its two modes each show Items, Detail and the assistant pane, and the pane takes a conversation in place; Items rows show what item 2 lists; editing a subject changes the preview, says "saved", and Revert restores the earlier wording; deleting a required placeholder is refused with the reason; Send to me reports the signed-in address; a template shows its preview, users and Set as default; Legal lists the three documents with versions and counts and shows a chosen version; a business without documents says so; a `messages_changed` event from a real chat pane refreshes the open message; the selection is published.
- `tests/test_UAT_FC_REQ-661_paperwork_routes.workers.test.ts` (real router and D1, mail replaced at the provider): Legal lists the 1st Contact business's documents, versions and counts (current / older / none, excluding never-signed-in and synthetic people) and names nobody; a client business has none; edit → preview → test send → revert; a removed required placeholder is refused with its name; Send to me goes only to the signed-in address and is recorded as a test send; the changes route counts pane edits and not seeds.
- Adapted: REQ-631 (Shop is before Settings, no longer directly before) and REQ-353 (seven tabs).