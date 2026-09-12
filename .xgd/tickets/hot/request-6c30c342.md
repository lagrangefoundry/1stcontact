---
uid: request-6c30c342
id: REQ-233
type: request
title: Contacts pane shows contacts as they arrive, without a reload
created_by: BUG-87
created_at: '2026-09-12T21:39:16.088815+00:00'
updated_at: '2026-09-12T22:01:27.982659+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-f2d1aa6d
  commits:
  - working_sha: b0ad859b02229f78980ec5dc5113ea7402c8fcaf
    reconcile_sha: null
    main_sha: null
  version: 0.2.179
  story_points: 5
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

---

# What was built

The shape is exactly the Library's: a `GET` SSE feed the browser opens as an
`EventSource`, a cursor the list read hands out, and a panel that patches the
row an event names instead of re-reading the list. Six numbered behaviours
above, all met. What follows is what differs from the Approach as written, and
the behaviour that was added as a technical consequence.

## The cursor is `users.updated_at`, not `contact_events.recorded_at`

**The Approach's premise is not true.** `contact_events` does not record every
mutation, and [[DOC-44]] §4.1 is why it should not be made to. `addContact` and
`markInvited` write events because they are *acts with meanings*;
`setPersonStatus`, `setPersonRecord` and `writeName` write none, because what
they change is *state* — and the history of a name already lives in
`user_names`. A feed sourced from events would therefore miss every rename and
every status change, which is required behaviour 2; and closing that gap by
emitting a `contact.renamed` event would put a second representation of one
fact beside the table that holds it, which is precisely the `source`-column
mistake §4.1 exists to refuse.

`users.updated_at` is already the answer to *did this person's row change*. It
is stamped by the invite, the status change, the address rewrite, the
admission's `last_seen_at` and the terms acceptance — so one column covers a
person assembled from four tables without the feed knowing there are four.

**A cursor is `<updated_at>|<id>`.** Compound, because a millisecond holds
several writes: a batch invite stamps every contact it touches at one instant,
so a bare timestamp cursor advanced past that instant would deliver the first
of them and silently drop the rest.

## A name write now stamps the person (consequence of behaviour 2)

`writeName` wrote `user_names` and left `users.updated_at` alone, so a rename
moved no column any feed could see. It stamps the person now — on the two paths
that actually write, and never on a no-op commit, because the record pane
commits on blur constantly and a stamp per focus-and-blur would wake every open
Contacts pane in the business for a change that did not happen.

This is the one write-path change the feature required. It also corrects an
existing inconsistency: `setPersonRecord`'s *address* branch already stamped the
person for the same reason.

## Each poll reads from behind its own cursor (consequence of the cursor choice)

The ticket store's change log hands out a monotonic integer minted by the
writer. `updated_at` is `new Date()` in whichever isolate did the write, and two
isolates do not agree to the millisecond — so a row stamped slightly *behind* a
cursor another isolate had already advanced would be a contact that never
appears. That is this ticket's own bug, reintroduced in a form nobody would
find.

Every poll therefore reads from five seconds before its cursor. Re-reading that
window is a scoped, indexed scan; re-*sending* it every two seconds would
rebuild every row on screen for as long as the pane is open, so the connection
remembers what it has already delivered and skips it. The cursor also only ever
moves forward, so a batch large enough to fill one poll entirely out of the
lookback cannot wind it back and re-read the same rows for ever.

## The pane inserts by the list's own order, not the feed's

The feed is ordered by when a row *changed*; the list is ordered by when it was
*created*, and the two disagree the moment a backdated or imported contact
arrives. An arriving person is placed by `created_at ASC, id ASC` — `peopleOf`'s
own key — so a new contact joins at the end (behaviour 5) and nothing already on
screen moves, whatever order the feed delivered it in.

## There is no `exit`

Nothing in this product deletes a contact — withdrawing access sets `status` and
leaves the row, which the access facet shows — so a row that has entered the
list never leaves it, and the origin has no `exit` frame to send. The
drop-the-absent rule stays in `refresh()`, where the list it prunes against is a
complete one (behaviour 4): an event says who *changed* and never who is gone,
so pruning on an event would unselect everybody the feed did not just mention.

## A change-cursor index

`db/migrations/0003_contact_change_cursor.sql` adds
`idx_users_tenant_updated ON users (tenant_id, updated_at)`, with the same
statement folded into the baseline for databases created from scratch. Without
it, *who in this business has changed since* is a scan of the business's whole
contact list every couple of seconds per open pane. It also serves
`contactChangeHead`'s `ORDER BY updated_at DESC LIMIT 1`, which is the read the
list does before every load.

## Surfaces

| | |
|---|---|
| `GET /api/people` | now answers with `seq` — the cursor read **before** the list, so a write landing between the two is in both the page and the replay, which is idempotent |
| `GET /api/people/changes?since=` | SSE. `ready` frame first carrying the cursor as its `id:`, then one `contact` frame per changed person carrying the row; `: ping` on an idle connection; `Last-Event-ID` wins over `?since` |
| `subscribeContacts` (`builder/api.js`) | the `EventSource`, returning a closer — and an **inert** closer where the browser has none, which is behaviour 6 |
| `createPeoplePanel` | `refresh()` re-arms from the cursor its own read returned; `clear()` closes the feed, so a business switch cannot leak the previous business's contacts into a pane naming another; new `destroy()`, called by `app.js`'s teardown |
| `deps.contactChangePollMs` | a clock double for the suite, on the grounds `deps.tickets`' `opts` is injectable — the shipped 2s cadence is asserted against the exported constant |

## Test plan

- `tests/test_UAT_FC_REQ-233_contacts_live.test.ts` (jsdom, mounted against the
  installed components) — the **pane**. Subscribes from the list's cursor;
  degrades with no feed; closes and re-opens across a business switch and on
  destroy; a captured lead appears with no re-read; it joins at the end and
  moves nobody; a backdated arrival lands in its own place; a repeated frame is
  one row; a stage move and a rename from elsewhere replace the stale values;
  an arrival obeys the facet currently set and is revealed when it is cleared;
  **ticks survive an arrival and an update**.
- `tests/test_UAT_FC_REQ-233_contact_changes.workers.test.ts` (workerd, real D1,
  through `route()`) — the **origin contract**. The list read carries a cursor;
  an empty business reads as before-every-row; the compound cursor does not
  half-deliver a batch stamped at one instant; a write nobody on the connection
  made arrives, carrying the row; the `ready` frame states the cursor;
  `Last-Event-ID` beats `?since`; an invite and a rename move the contact's
  cursor **with the row backdated out of the lookback window**, so those are
  claims about the write and not about the replay; a no-op name commit wakes
  nobody; **a feed raised in one business never sees another's contact**; the
  shipped cadence; the wind-back; and a delivered row is not re-sent every tick.

Both suites were checked negatively: with the subscription disabled 12 of 13
pane cases fail, and with `writeName`'s stamp removed both rename cases fail.