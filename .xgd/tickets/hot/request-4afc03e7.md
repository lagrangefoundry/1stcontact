---
uid: request-4afc03e7
id: REQ-662
type: request
title: 'Paperwork tab: wire the Email assistant and the Legal assistant'
created_by: EPIC-30
created_at: '2026-11-07T18:57:44.771099+00:00'
updated_at: '2026-11-07T21:21:00.919687+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-087800af
  story_points: 13
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6ed4ac0a
  commits:
  - working_sha: 7dcdb17b434a52f3568b644a6c067c70aebc733d
    reconcile_sha: null
    main_sha: null
  - working_sha: 9d80b3d4ff374e2e43310485937ca615b9d7cb58
    reconcile_sha: null
    main_sha: null
  - working_sha: 0bfc107d0acc35faf674eb4bf961507f7a48eaee
    reconcile_sha: null
    main_sha: null
  - working_sha: 87a3230be742bb53cb44e43845dc9680cd612bbc
    reconcile_sha: null
    main_sha: null
  - working_sha: 22b7486274acc14f0da727dfb40695697c319073
    reconcile_sha: null
    main_sha: null
  - working_sha: dd42c828b079c573a6d639a90b0288b3f4e6c4cc
    reconcile_sha: null
    main_sha: null
  version: 0.2.813
---

## What this is for

EPIC-30. The **Email assistant** (Email mode) and the **Legal assistant** (Legal mode) — the chat panes in the Paperwork tab. An assistant is required before launch (operator, 2026-11-07: "We can build in stages but an assistant is needed before launch"). Patterned on the Settings assistant (REQ-239): its own role, a tool declaration whose prose sits beside each operation (the manual is projected, never hand-written), and one API with two callers.

## Behaviour

1. **Two roles, two conversations** per business: `email` and `legal`. Their grants differ (change vs view only); neither is told about a capability it was not granted. Each reuses the host's per-business manager, budget, spend metering and interrupted-turn handling.
2. **Email tools** (surface `messages`, over the records ticket's routes). Reads: `list_messages`, `read_message` (all fields, placeholders, which are required, fake values), `list_templates`, `read_template`, `list_triggers`, `list_senders`, `preview` (the rendered email with fake values, returned as a picture the model sees), `list_changes(since)`. Changes: `update_message`, `create_template`, `update_template` (L1 email document), `set_default_template`, `revert_message`, `revert_template`, `send_test` (only to the signed-in person, same rate limit — operator: "Yes - nice feature"). Refusals are the host's, re-coded with the declaration's codes.
3. **Legal tools** (surface `legal`, view only): `list_documents`, `read_document(version)`, `list_versions`, `acceptance_summary` (counts only, never names — current / older only / none, among the people who must accept), `list_changes(since)`.
4. **Neither assistant reads sent mail, contacts or acceptance rows by person** (DOC-5 rule 26). Nothing sends to anyone but the signed-in person.
5. **Priming** (`email_priming`, `legal_priming`): a written role entry, the projected manual, the business line (read per turn).
   - Email: a business writes to its own people or its contacts; messages are words, templates are the look; HTML is derived so a template change restyles every message using it; triggers are fixed; required placeholders stay; transactional only, not marketing; changes are **live on save** and reach the next real email, so offer a test send; it never sees customer data.
   - Legal: the required sets (level 1 / level 2); publishing a new version makes everyone accept again; the Privacy Notice is "I have read", not "I agree"; it explains what a document says, is not a lawyer and says so when asked for advice; the client edits in the pane, it cannot.
6. **Reminders** (per turn, short pointers):
   - **Changes the client made:** if the pane changed messages/templates (Legal: a draft edited or a version published) since the assistant's last turn — "call `list_changes` with since: … before you touch anything, and never write over a change you have not read." (the `site.changes` pattern).
   - **What the client is looking at:** the item open in Detail.
   - **Must not forget:** Messages — "After a change, say which messages it affects (a template affects all that use it) and offer a test send." "Say what a change does to real emails before making it." Legal — "You cannot change documents and do not give legal advice." "Before the client publishes, say that publishing makes everyone accept again."
   - Shared session-budget and interrupted-turn signals.
7. **Assistant → pane:** each completed write emits `messages_changed` (shape of `BUSINESS_CHANGED`) so the pane refreshes.

## Constraints

- Assistant names by mode: "Email assistant", "Legal assistant" (the tab is Paperwork).
- Reminder tail stays within its budget; substance lives in priming.

## Why free-coded

Follows an established pattern (Settings assistant); cohesive.

## Test plan

UATs named `test_UAT_FC_REQ-662_*`, scripted model at the backend boundary:
- The Email assistant changes a subject through `update_message`; the next send uses it and the pane receives `messages_changed`.
- `send_test` reaches only the signed-in address.
- The Legal assistant's grant has no write; `acceptance_summary` returns counts and no names.
- A pane edit between turns produces the change reminder naming `list_changes`; no pane edit, no reminder.
- The selection reminder names the open item.
- Neither manual mentions a tool outside its grant; neither surface can read sent mail or contacts.

## Order and dependencies

- **Messages tools need REQ-660's routes.** The Legal assistant needs only EPIC-29's mechanism.
- Runs **in parallel with REQ-661** (host side: surfaces, roles, priming, reminders); its last step is hooking the roles into REQ-661's assistant pane, selection and change count, so it **lands after REQ-661**.
- `list_senders` reads whatever senders exist: one per business until REQ-663.
## What landed

- **Two roles, two conversations per business** — `email` (Email assistant) and `legal` (Legal assistant), beside `settings`. Session ids `email-<businessId>` / `legal-<businessId>`, backends `claude+email:` / `claude+legal:`, a manager each (`buildPaperwork` in `host-core.ts`), with the settings host's budget, guard, memory block, spend metering (role column) and interrupted-turn handling. `POST /api/ai/session {scope: 'business', role}` opens one; settings stays the default. `aiStatus` lists a role only where this host holds its records.
- **Email tools** — `messages-surface.json` + `messages-core.ts` (surface `messages`; groups ReadMessages, ChangeMessages, SendTest). Every call is answered by `handleMessageRoute`, the same function the Paperwork pane's routes use (`paperwork-assistant.ts`), so refusals are the host's. A thrown `MessageRefusedError`/`MessageRenderRefusedError`/`MessageNotFoundError`, or a route status (400/403/404/409/429), is re-coded as the declaration's `MESSAGE_REFUSED`/`TEMPLATE_REFUSED`/`NOT_FOUND`/`NO_SIGNED_IN_PERSON`/`ADDRESS_NOT_VERIFIED`/`TEST_LIMIT`. `list_templates`/`read_template`/`update_template`/`revert_template` also say which messages use the template; writes answer `{saved, affects}`. `preview` returns the rendered email as a picture the model sees where the deployment has a browser (a data: URL shot at mobile width); without one, the subject and SMS text only — never the HTML. `list_changes(since)` reads REQ-661's `GET /api/messages/changes`. `list_senders` reads REQ-663's `GET /api/senders` (each sender's id, From line, default and warning, plus the platform fallback) and is read only — adding, changing or removing a sender is the client's, in the pane. `update_message` also takes `sender` (an id from `list_senders`, or `platform` for the default), through the same `PUT /api/messages/<key> {sender}` the pane's Sender select uses.
- **`send_test` takes only `key`.** It goes to the verified address of the person signed in to this conversation (the prompt route adds their address to the turn's person), under the route's own rate limit; with nobody signed in it is refused.
- **Legal tools** — `legal-surface.json` + `legal-core.ts` (surface `legal`, one read group, no write operation in the declaration). The Worker port reads REQ-661's `legalOverview` (the pane's Legal-mode read, so the counts are that read's, never recomputed), with each version's text from the published LEGAL bundle. `acceptance_summary` answers required/current/older/none per document; nothing on the surface can name a person.
- **Neither surface reads sent mail, contacts or acceptance rows by person.**
- **Priming** — `email_priming` / `legal_priming` in `priming.json`: a written role entry, the manual projected from each role's own box (`messages.manual`, `legal.manual`), the business line read per turn. Legal level wording follows EPIC-29: level 1 is 1st Contact's own set (Terms, Privacy Notice, Beta Terms) for its clients; level 2 is each client business's own Terms and Privacy Notice for its customers.
- **Reminders** — `email_reminders` / `legal_reminders`: the business line; **what the client is looking at** (`paperwork.selection`: `Your client has the message "Sign-in link" (signin) open beside this conversation.`); **changes the client made** (`paperwork.changes`: Email counts message/template versions saved since the end of this conversation's previous turn and says `call list_changes with since: <ISO>`; Legal counts document versions that were not there at its previous turn); the two must-not-forget lines per role; session budget; interrupted turn (role-specific wording naming that role's own reads).
- **Assistant → pane** — each completed Email write emits `messages_changed` (`{at, changes}`, the shape of `business_changed`); a refused write emits nothing.
- **Pane hook-up (REQ-661's drop-in)** — `app.js` mounts an Email and a Legal chat in each mode's assistant pane (`paperwork.setAssistant`), opens both per business with `showSettings`'s generation and failure shapes, and sends each prompt with what that mode's Detail has open (`paperworkChatTransport(role, selection)` in `api.js`); `onMessagesChanged` calls `paperwork.messagesChanged()`. The pane's selection now carries its label.

## Design decisions made during implementation

- **One API, two callers, literally.** The Email port calls `handleMessageRoute` with internal requests rather than the record functions, so the assistant cannot be allowed something the pane is refused.
- **REQ-661 overlap.** REQ-661 shipped the changes route, `legalOverview` and the `messages_changed` constant; this ticket consumes them and does not duplicate them.
- **"Changes the client made" is measured in isolate memory**, like the site's change counter, keyed by session id: a cold isolate has no previous turn to measure from and says nothing. Legal versions are published at build time, so in practice a publish is a deploy and the Legal reminder rarely fires. Drafts are xgd doc tickets the Worker never sees, so a draft edit is not counted (only published versions).
- **REQ-661's tab UATs adjusted** (implicit supersession): the assistant pane now holds a conversation instead of "not available yet", and `selection()` carries a `label` (asserted with `toMatchObject`).
- **`RouterDeps.paperworkLegal`** is a narrow seam for the Legal port; absent, the Worker uses `legalOverview`.

## UATs (as built)

`tests/test_UAT_FC_REQ-662_paperwork_assistants.workers.test.ts` (real router, D1, scripted model, mail provider replaced):
- `update_message` changes the next real invite's subject, and the stream carries `messages_changed`.
- A refused save comes back as the host's refusal re-coded `MESSAGE_REFUSED`; nothing changes and no `messages_changed` is sent.
- `list_senders` reads the business's senders (the platform default for a new business), and no operation adds, changes or removes one.
- `send_test` sends exactly one message, to the signed-in owner's address, subject marked `[Test]`; the operation takes no address.
- The selection reminder names the open item, and is absent with no selection.
- A pane edit between turns produces the change reminder naming `list_changes` with an ISO time; the assistant's own save does not.
- The Email tools and manual are its grant only (no settings or legal op), and no tool reads sent mail or contacts.
- The Legal grant is read-only, and its tools and manual name nothing outside it.
- `acceptance_summary` returns counts and no names; `read_document` returns a version's published text.
- With no seam, the Legal assistant reads `legalOverview` (a client business: no documents).

`tests/test_UAT_FC_REQ-661_paperwork_tab.test.ts` (jsdom), `REQ-662` block:
- Each mode opens its own assistant by role.
- A prompt carries what Detail has open (kind, key, label), and an assistant save refreshes the open message.