---
uid: comment-e2f4d75b
id: COMMENT-3025
type: comment
title: Comment on epic EPIC-14
created_by: xgd
created_at: '2026-09-17T00:34:57.069190+00:00'
updated_at: '2026-09-17T01:49:38.158361+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-2d9e2d56
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1c7551b1-8534-47b3-b8e3-851b5b02d102",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="fa23d02d-aa31-40f4-b59f-256ea741d632-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T00:34:27.717078+00:00" -->
#### You
We need a platform capability to notify users of things. Notification will be primarily email but we will add push (when we do the app) and maybe SMS so the delivery must be separated from the notification control.

As with all our features there are three levels 0 -me and my team, 1 - 1c customers, 2 - their customers.

All levels will have coarse grained controls in their User portal, basically and opt-in/out to notifications - at this point I am not sure what notifications will be for level 2 lets assume that we will have them and work through the details later. There are probably two levels of notification: informational ("a new user just requested the whitepapers") and transactional ("your payment failed"). I don't think we offer an opt-out for the second.

Notifications would have finer grained controls on the Settings tab. As we add platform notifications capabilities we will add the controls and configure them to be informational or transactional.

This epic then is for the framework that supports notifications and their controls

<!-- xgd-turn id="fa23d02d-aa31-40f4-b59f-256ea741d632-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T00:44:43.293604+00:00" -->
#### Claude
Now add EPIC-10 to the siblings table and the forms producer reference.

EPIC-14's body is written. It stays at `draft` — this was scoping, no code, so no branch or commit.

**What I grounded it on** (verified in the tree, not assumed):

- **You already have exactly one outbound chokepoint.** `messages.ts:220`'s `sendRecordedEmail` is reached by every send site (`invites.ts:269`, `sessions.ts:449` via `signInMailer`, `lead.ts:1113`). The notification layer sits *above* it and needs no second path — that's the biggest thing this epic inherits.
- **The preference store already exists and is the right one.** `user_acceptances` ([[REQ-240]]) holds one row per (contact, key), with a two-value CHECK on `granted` — so **absence of a row is the third state and means "the type's declared default"**. That is what makes adding a notification type a code change rather than an N×M backfill.
- **A contact can already change their own preferences without the builder** — `/api/acceptances` + `/account` ([[REQ-245]]). That's your coarse portal control, already standing.
- **Address suppression exists for exactly one caller** (`lead.ts`'s `suppressed()`), consulted by asset delivery and nothing else.

**Decisions I took, and the ones worth your eye:**

1. **Audience is relational, not a level.** [[DOC-42]] §3's falsifier forbids a `level` column or branching on level. So a type declares `subject` / `operators` / `platform`, resolved from where the event happened — and `lead.captured` with audience `operators` *is* level 1 on Alice's site and level 0 on ours, one declaration, no branch. Your 0/1/2 is the right way to talk about it and the wrong way to build it.
2. **Three suppressions, kept separate** — producer ("don't raise": EPIC-7's propagation window, EPIC-13's synthetic traffic), preference (informational only), address (overrides everything *including* transactional). The hardest case falls out of that: a transactional notification to a burned address must be loud, because the canonical instance is a person who can no longer receive a sign-in link.
3. **Class is on the type, not the raise**, with a written test — otherwise everything becomes transactional within a year.
4. **The three identity messages (`invite`/`signin`/`lapsed`) become transactional notification types in the same pass** (D7), so there's one ledger and one suppression story rather than two. Cheap because transactional consults no preference.
5. **`MAIL.md`'s `List-Unsubscribe` deferral expires** (D8) — it was conditional on never sending bulk mail, and an informational stream is bulk mail in the sense Gmail's rules mean.
6. **Informational must not share its return path with sign-in** (D9) — `messages.ts` already names that failure, and for level 2 the domain at risk is the *customer's* via `sending_domains`.
7. **Nothing built for push/SMS** — but SMS is blocked on a schema gap [[DOC-42]] §4.1 already records: `user_emails` is email-only by name and CHECK, and no `phone` exists anywhere. Push registrations are not addresses and want their own table.

**Three things I'd like your call on** (all in §Open questions, 8 total):

- **Can an audience be an address that isn't a contact?** "Send enquiries to `enquiries@alicesplumbing.com`, not to every operator" is an ordinary want, and a shared mailbox has no preferences, no suppression history and no erasure rights.
- **An in-product inbox as a channel?** It's the only honest answer when every external channel is suppressed — it's what makes "we couldn't reach you" recoverable rather than terminal.
- **Level-2 types** — I listed candidates and committed to none, per your "work through the details later."

Two housekeeping notes: the title reads **"User Notifiations"** — I left it alone per the rules; say the word and I'll fix the typo (or rename to area style, e.g. *"Notifications: the framework, its controls, and channel-independent delivery"*). And **EPIC-7's notification section needs narrowing to check/*raise*** — it currently scopes routing, severity and suppression itself, which this framework takes over; I've recorded that as an amendment owed rather than editing that ticket from here.

<!-- xgd-turn id="09c5188a-3eec-4927-8e5a-2dd0655c6637-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T01:49:38.064824+00:00" -->
#### You
I suspect notifications will only go to members.

Our initial focus will be on 1c notifications going to our level 1 users (keep the bigger picture in mid but that's our focus).

Feature request: If the user takes an action (like DNS configuration) that has a flow involving notifications and the user has notifications off we should have a popup we can trigger at the right place to let them know - if you turn notifications on we can tell you when your new domain is ready.

<!-- xgd-chat-end -->