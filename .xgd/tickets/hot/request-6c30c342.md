---
uid: request-6c30c342
id: REQ-233
type: request
title: Contacts pane shows contacts as they arrive, without a reload
created_by: BUG-87
created_at: '2026-09-12T21:39:16.088815+00:00'
updated_at: '2026-09-12T21:46:18.069554+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-f2d1aa6d
---

# The Contacts pane shows leads as they arrive

## What happens today

`createPeoplePanel` (`apps/control-app/src/builder/people.js:639`) fetches the
whole business once, into `all`, and re-fetches only when the **operator** does
something: add, invite, fulfil, rename, stage change (`refresh()` at
`people.js:1536`, called from `:870`, `:1007`, `:1180`, `:1289`, `:1351`). The
search box and the pipeline/access facets filter `all` in the browser and
deliberately never re-fetch (`people.js:666`).

Nothing else moves the list. A lead captured by a `contact-form` submission —
`captureLead` → `addContact` (`apps/control-app/src/lead.ts:455`) — writes a
`users` row and a `contact.created` event, and an operator sitting on the
Contacts pane sees no change. The row appears only after a reload or a tab
switch.

Observed 2026-09-12: `1c-beta-test-1@westhead.me` was captured at
`20:47:00.057Z` into `biz_51a6746495c8057e886ff98d4208e6b9` with both
`contact.created` and `form.submitted` events written correctly, and was absent
from an already-open Contacts pane until it was re-entered.

## Why it matters

This is the CRM's live surface. The moment a lead is worth acting on is the
moment it arrives, and the pane's answer to "did that signup land?" is
currently "reload and find out". Worse, the pane is the tool an operator uses
to *verify* a form works — so a working capture path reads as a broken one, and
the operator's next move is to go looking for a bug that isn't there.

## Required behaviour

1. **A contact created while the Contacts pane is open appears in the pane
   without operator action.** This covers every creation route, not just form
   capture: `addContact` from a lead, an operator in another tab or another
   browser, a second operator in the same business.

2. **A contact changed while the pane is open reflects the change.** Stage
   moves, invites and renames from elsewhere land the same way a creation does.
   The pane must not hold a stale `pipelineStage` for a row somebody else moved.

3. **The arriving row obeys the filter that is currently set.** An operator
   narrowed to *Leads* sees an arriving lead; an operator narrowed to *Invited*
   does not see it appear and then vanish. `matches` decides, exactly as it does
   for the rows already on screen.

4. **A tick survives an arrival.** `selected` is keyed by person id and an
   arriving or updated row must not clear it — an operator who has ticked four
   people and is reaching for *Invite* does not lose the selection because a
   fifth person signed up. The existing drop-the-absent rule at
   `people.js:1546` still applies to people who genuinely left the list.

5. **Ordering stays stable under arrival.** The list is `created_at ASC`
   (`peopleOf`, `apps/control-app/src/people.ts:338`) so a new contact joins at
   the end. Rows already on screen do not reorder around it.

6. **A browser with no live channel still works.** No `EventSource` degrades to
   today's behaviour — a correct list on entry and on every operator action —
   and does not error. This is the rule `library.js:393` already follows.

## Approach

The house pattern exists: `subscribeMaterial` (`apps/control-app/src/builder/api.js:534`)
opens an `EventSource` on `GET /api/material/changes?since=<cursor>` and is
consumed by the library tab (`library.js:393`), including the
no-`EventSource`-returns-an-inert-closer contract in point 6. Contacts should
follow it rather than invent a second mechanism, and should not poll.

`contact_events` already records every mutation with `recorded_at`, so it can
serve as the cursor source the same way material changes do.

## Out of scope

- The `created_at ASC` ordering itself. Putting the newest contact at the bottom
  of the list is arguably wrong for a CRM, but it is a separate argument with a
  separate answer and changing it here would hide the behaviour this ticket is
  about.
- The discarded `LeadOutcome` in `apps/public-site/src/lead.ts:462`, which makes
  `unknown_site` and `no_email` acknowledge the visitor while writing nothing.
  Related — it is the *other* reason a capture can look like it worked — but it
  is a public-site bug, not a pane one.