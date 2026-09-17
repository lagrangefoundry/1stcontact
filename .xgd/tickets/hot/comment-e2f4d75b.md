---
uid: comment-e2f4d75b
id: COMMENT-3025
type: comment
title: Comment on epic EPIC-14
created_by: xgd
created_at: '2026-09-17T00:34:57.069190+00:00'
updated_at: '2026-09-17T01:53:42.934976+00:00'
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

<!-- xgd-turn id="09c5188a-3eec-4927-8e5a-2dd0655c6637-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T01:53:42.861326+00:00" -->
#### Claude
Now the decision amendments and open-question updates.

Folded all three into EPIC-14. The members-only rule turned out to be the load-bearing one — it overturned a decision from the last pass.

**"Notifications only go to members"** is now model §2, and it earns its place three ways: a member has somewhere to put a preference (account, portal, login), has a standing worth notifying about, and is erasable through a cascade that already exists. A stranger who can't reach any control shouldn't be receiving preference-governed mail — the framework would be claiming to honour a choice they were never able to express.

It also forced a distinction I think is the most useful thing in the ticket now:

> A **reply** answers something this person just did. A **notification** tells them about something that happened elsewhere, or later, or to somebody else.

The invite, the sign-in link and the gated download are all replies — addressed to whoever just acted, consulting no preference because there is none to consult. **That reverses D7.** Last pass I said absorb those three as transactional notification types to get one ledger; under §2 they'd force the audience resolver to admit non-members, for tidiness rather than for a reader. What D7 was right about survives untouched: the single ledger and the single address-suppression check live in the *delivery* layer, below both, where `sendRecordedEmail` already is. One path, several callers — already true across `invites.ts`, `sessions.ts` and `lead.ts`. And the risk it was closing gets closed more simply: a sign-in link can't be withheld by a preference because it never reaches the layer that consults one.

It also demoted D8. The unauthenticated unsubscribe token was justified by the level-2 form submitter who has no session — a person who now receives no notifications at all. Every recipient is a member with a portal, so the token is for *one-click* (which a login-gated link isn't) rather than for lack of any other route. Smaller claim, smaller mechanism.

**Level-1 focus** is a new section near the top, and it gives level 2 a structural reason to wait that's stronger than "we haven't decided": a level-2 notification needs a level-2 *member*, and a business's own sign-up is barely a thing yet. The section is explicit that this decides what's implemented, not what's modelled — [[DOC-40]] §2.1 rule 1 is the failure mode, and a platform-only notification framework would have to be rewritten to serve the customers it was built for.

**The contextual prompt** needed a primitive that doesn't exist, so it's now two pieces:

- **Model §9 — the reachability probe.** The same decision function, run without sending, returning *the reason* rather than a boolean. That typing is the whole point: for a burned address, offering "turn notifications on and we'll tell you when your domain is ready" is a promise the system cannot keep, and the most confident-sounding lie the framework could tell. The remedy there is a different address, never a toggle.
- **Scope §7 — the prompt itself**, with six rules. Two worth your eye: the registry carries a **promise string** ("when your new domain is ready") so the prompt and the control can't describe the same type differently; and **one click grants that one type**, not the category. The awkward case is honest rather than solved — if the coarse master switch is what's blocking, granting the single type changes nothing, and flipping the master starts delivering every other default-on type too. The prompt says that in words rather than quietly flipping it or silently failing.

Two things I'd flag:

- **Members-only makes "send enquiries to `enquiries@alicesplumbing.com`" awkward** (OQ1). The shape of the answer is "to receive notifications, be a member" — a shared mailbox *can* be a contact, signed up like anybody else, and that keeps the path honest with no non-contact in it. Whether that's the answer or a dodge that reads as absurd the first time someone accepts terms on behalf of `enquiries@` is the open part. It's a real small-business want, so worth deciding before the audience resolver is written.
- **I didn't file the prompt as a child ticket** — this session is scoped to EPIC-14 and you didn't say to create one. It's scoped inside the epic body and ready to lift out. Say the word and I'll file it as a child REQ.

<!-- xgd-chat-end -->