---
uid: comment-433635b0
id: COMMENT-6228
type: comment
title: Comment on epic EPIC-30
created_by: xgd
created_at: '2026-11-01T17:08:12.468071+00:00'
updated_at: '2026-11-04T18:09:30.279922+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-087800af
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "ba9b144a-1c44-4049-b429-e9126143aebe",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="08e9e927-e718-4f8e-aada-61bb6fe669e0-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T17:07:01.733475+00:00" -->
#### You
Lets talk about notifications.

We need a notifications system that allows different parts of the system to notify the owner an/or delegates when something happens. Examples of notifications include:
1) Long running job finished
2) Site form filled in by a site user
3) Site failure or outage 

The job of this EPIC is not to generate the triggers but to provide an internal API that can be called to send notifications.

Notifications will be sent via Email, Push (when we create an app), SMS (maybe).

Lets talk about the design of this - please start by investigating what has already been created.

Our first goal will be to create a notification tool so the consulatant or host can trigger a notification to the user to tell it that a long running job has been completed.

Notification messages - for now lets keep the subject and message body as system parameters for this initial notification it would be powerful to allow a link that would take the user to the builder tool with the correct business open. That link should be passed by the caller it should not be part of the notification system. In future we may allow content defined by the AI.

Notification targets - for now lets treat system notifications as going to the owner and all delegates for a site.

<!-- xgd-turn id="08e9e927-e718-4f8e-aada-61bb6fe669e0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T17:16:02.600648+00:00" -->
#### Claude
I looked at what exists. Most of the parts for email are already built, and the gaps are small. One thing first: the current child ticket, REQ-626, conflicts with what you just described, so it needs rewriting before anyone builds it.

## What exists

- **Sending and recording email.** `sendRecordedEmail` (`apps/control-app/src/messages.ts:220`) sends through Resend and saves each email as a ticket in the business's store. The record goes from queued to sent or failed, and Resend's webhook later updates it to delivered, bounced or complained. Invites, delegate invites, sign-in and lead emails all use it, one recipient per message.
- **Email wording.** `templates.ts` holds business-scoped templates with `{{token}}` placeholders. The set of keys is closed: `invite`, `signin`, `lapsed`, `delegate`.
- **People.** The owner is `tenants.owner_account_id` → users. Delegates are rows in `memberships` with role `delegate` that haven't been revoked. Email addresses are in `user_emails`, which has a `verified_at` column. Nothing yet lists "everyone on business X with a verified address"; that lookup is about one SQL join.
- **Builder links.** The builder for a business is at `/b/<businessId>/`, and `show_client` adds a fragment such as `#show=…&page=…`. Opening that link without a session redirects to `/sign-in?return=…`. The person has to type their email again, and the `#show=` part is lost, because the server never sees fragments.
- **Tools.** Consultant tools are declared in `plan-surface.json` and handled in `show-core.ts`. The host supplies what a tool needs through `HostDeps`, wired up in `router.ts`, where the business is known from the session's scope.
- **Missing entirely:** any notification to an owner (DOC-47 says outright that nobody is emailed when an enquiry arrives), unsubscribe links, per-person preferences, rate limiting on outgoing mail apart from sign-in, any record of whether a builder tab is open, any "job finished" hook, and any push or SMS code.

## Proposed design

**1. An internal API, `notify()`, in a new `notifications.ts` file.** Callers would use it like this:

```ts
notify(env, { businessId, kind: 'job_done', link, dedupeKey?, siteId? })
```

- `kind` comes from a fixed list. Each kind has its subject and body set by the platform, with placeholders only for things like `{{business}}` and `{{link}}`. Because the wording is ours, it can't leak private customer data. AI-written wording can be added later as an optional extra field.
- **Recipients** are the owner plus every delegate who hasn't been revoked, each at their verified primary address, with duplicates removed. Callers don't choose who gets it.
- **Channels** share one small interface, `send(recipient, rendered)`. Email is the first and calls `sendRecordedEmail`, one message per person, sent from the platform's `no-reply@1stcontact.io`. Push and SMS would plug in later as further channels without changing any caller.
- **Records.** Each person's email is recorded as it is today. I'd also save one `notification` ticket per event: the kind, the link, who called it, and how each delivery went. That record would feed the future "while you were away" summary and the portal's activity view (DOC-5 rule 27). It's optional; we can skip it if you'd rather keep v1 smaller.
- **Guards:**
  - At most one notification per `dedupeKey`, for example one per job.
  - A simple cap per business per hour.
  - Each email carries an unsubscribe link. Until a Settings page exists, the opt-out is saved per person (`users.fields`) and that person is skipped from then on.
- **Link rule:** `notify` only accepts a link to this platform's own origin, under `/b/<businessId>/`. Without that rule, a tool the AI can call becomes a way to email phishing links. Validating the link is the one thing the system does to it; the caller still builds it.

**2. The tool, `notify_client`, for the consultant.** Its parameters would be `kind` (only `job_done` for now) and a destination in the same terms as `show_client` (draft page, question, board). The tool turns that destination into a URL with the existing `showHref` code and calls `notify()`. The host can call `notify()` directly when it finishes a job itself. Both paths go through the one API.

**3. Fix links for people who aren't signed in.** The builder's view needs to travel in the query string, or `/sign-in?return=` needs to keep it. Otherwise "open the draft" lands on the bare builder. This is a small change, but without it the link doesn't work.

## Changes needed to REQ-626 and the epic

- **Recipients:** REQ-626 sends to "the person who started the work". You want the owner and all delegates.
- **Wording:** REQ-626 has the consultant writing the subject and body. You want them fixed by the system.
- **Open-tab check:** REQ-626 skips the email if the person has the builder open. Nothing records that today, so I'd drop it from v1 and rely on the dedupe key.
- **Epic principles:** "The person who started the work is the one told" needs the same correction.

I'd keep this as one child: REQ-626 rewritten to cover the API plus the tool, rather than splitting it in two.

## Decisions needed

1. **Delegates who have never signed in** have no verified address. Should they be skipped, or emailed at the address their invite went to?
2. **Sign-in from the email:** the link can either sign the person in automatically (a per-person magic token, which lasts a limited time) or be a plain link that asks them to sign in. Automatic is smoother, but anyone the email is forwarded to can get in. I'd use a plain link for v1, plus the fix in point 3 so the destination isn't lost.
3. **Sender:** I'm assuming platform-branded mail from 1st Contact rather than the business's own sending domain, since it goes to the owner, not to their customers.

Once you've answered these, I'll rewrite REQ-626 and correct the epic body. I won't touch either before then.

<!-- xgd-turn id="229689d3-c3db-4e2c-8291-4d6a89cb62f5-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T17:19:44.696210+00:00" -->
#### You
**Missing entirely:** any notification to an owner (DOC-47 says outright that nobody is emailed when an enquiry arrives), unsubscribe links, per-person preferences, rate limiting on outgoing mail apart from sign-in, any record of whether a builder tab is open, any "job finished" hook, and any push or SMS code. <-- that is the second gap this ticket is intended to address...

Skip anyone without an email address

2. auto sign in would be very cool - yes please

3. I think this should be an option, both will be true for this first email 1st Contact is the correct brand to send

<!-- xgd-turn id="229689d3-c3db-4e2c-8291-4d6a89cb62f5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T17:20:50.027251+00:00" -->
#### Claude
Now REQ-626 — rewriting to the agreed design, keeping its original why and marking what's superseded.

I've updated both tickets with your answers. No code was written. REQ-626 is still at draft, ready for its own session to pick up.

On your first point: yes, that list of gaps is what this epic is for. The epic body now says so in a "What exists / what this epic fills" section.

**EPIC-30**
- States that the epic provides the internal `notify()` API, not the triggers.
- Recipients are the owner and every live delegate at their verified address. People without one are skipped, and callers never supply addresses. This replaces the old "the person who started the work" rule.
- Subject and body are set by the system for each kind of notification. The caller supplies the link, and `notify()` only checks that it points into this business's builder (`/b/<businessId>/…`).
- There are two options per notification: automatic sign-in, and the sender (1st Contact or the business's own domain). I took "both will be true" to mean the first email uses both: automatic sign-in, sent as 1st Contact. Tell me if you meant something else.
- Later children are listed: form submissions, outages, Settings preferences, "while you were away", push and SMS.

**REQ-626**, retitled to cover the API plus the first caller. The original quote is kept, with a note on what the rescope replaced.
1. **The `notify()` API:** recipients, the `job_done` kind, the two options, and email as the only channel for now.
   - Guards: one notification per job, an hourly cap per business, and an unsubscribe link that records an opt-out per person.
   - The result says who was sent to and who was skipped, but never includes email addresses.
2. **Links survive sign-in:** the `#show=` part of the link is lost during sign-in today, so the link has to carry the view in a way that survives it.
3. **The "job finished" tool:** the consultant calls it with a destination in `show_client` terms, and the host can use the same path directly. One or two lines of priming tell the consultant when to use it.
4. **Six tests,** each traced to wording in the body.

One consequence of automatic sign-in: each email works like a password while its link is valid, so anyone it's forwarded to gets that person's access. I'd have REQ-626 make the link single-use and short-lived, about a day. Say if you'd prefer longer, for people who open the email the next morning.

<!-- xgd-turn id="05ddb85e-7028-4188-844c-a17e70484f62-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T17:22:46.512296+00:00" -->
#### You
a day is fine - it is intended for immediate use

<!-- xgd-turn id="05ddb85e-7028-4188-844c-a17e70484f62-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T17:23:15.831251+00:00" -->
#### Claude
I've added the 24-hour limit to both tickets:

- **REQ-626:** the sign-in link in each email works once and expires after 24 hours. If someone follows a link that's used or expired, they go to the normal sign-in page and still end up on the same view afterwards. The sign-in test now also checks that following the link a second time, or after 24 hours, doesn't sign anyone in.
- **EPIC-30:** the automatic sign-in option says the same thing in one line.

REQ-626 is still at draft and ready for its own session to build.

<!-- xgd-turn id="8d474397-2ba6-4c7a-b85a-7e1b4e42d5b4-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T17:13:07.037969+00:00" -->
#### You
I want to talk about the architecture of "Buyer emails". My thinking on EPIC-30 was that it represented notifications to owners but actually this is wrong - owners are just level 1 users, notifications should go to level 1 and level 2 users.

But there is a missing UX here. The message needs to be editable/brandable by the site owner with AI support. This is not a launch requirement I guess, but I want to think ahead a little. I imagine this as a new tab "Messages"?

Messages is a 3 pane tab Items - Detail - AI Chat

A message consists of all the parts for a message:
Email text (as markdown) - user editable
SMS/push text (as txt)- user editable
sender email address- user editable
trigger event for sending this message
An HTML styled version of the message using a style template that an AI consultant can modify (written in L1 and rendered to the email?)

What do you think of all this?\

<!-- xgd-turn id="8d474397-2ba6-4c7a-b85a-7e1b4e42d5b4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T17:15:46.405884+00:00" -->
#### Claude
I think the direction is right, and most of it builds on things already in the code. One structural change I'd make: don't store the markdown text and a separate styled HTML version of the same email. Details below. I haven't changed EPIC-30 or anything else yet.

## Level 1 and level 2

This fits the model you set out on REQ-170: Alice is a 1st Contact customer (level 1), and Bob is a customer of Alice's business (level 2). Every message is then **one business writing to one person connected to it**:

- "Your draft is ready" to Alice is a message the **1st Contact business** sends to its own customer. You'd edit it in the 1st Contact business's Messages tab.
- "Thanks, we got your enquiry" to Bob is a message **Alice's business** sends to its customer. Alice edits it in her own Messages tab.

So there aren't separate "owner notifications" and "buyer emails". It's one system, and each message belongs to the business that sends it. `templates.ts` already works this way for invite, sign-in, lapsed and delegate: each business keeps its own copy in its own ticket store, and the 1st Contact business is simply one of those businesses.

## A Messages tab: yes, and it fixes a real problem

Message wording is currently kept in three different places:

1. **Templates** (`templates.ts`): invite, sign-in, lapsed and delegate. They're tickets, so they can be edited, but nothing in the UI lets anyone edit them.
2. **Notifications** (`notifications.ts`, from REQ-626): the "job done" wording is written into the code.
3. **Form messages** (REQ-247): each one is an L1 page of the site, rendered to email by `packages/framework/src/l1/email-render.ts`. There's already a declared list of what L1 can do in an email (`site-schema/src/l1/email.ts`).

A Messages tab only makes sense if it replaces all three rather than becoming a fourth. Items, Detail and an AI chat (the "Messages assistant") is the right layout.

## The message parts

| Part | My view |
|---|---|
| **Email text (markdown)** | Yes. Rendered through the safe sink, so raw HTML inside the markdown is ignored (security policy §1). Placeholders come from a closed list per message. |
| **Styled HTML version** | **Generate it, don't store it.** One **style template per business**, written in L1 by the AI, with a slot where the markdown goes. Restyling the template rebrands every message at once. If each message kept its own HTML, the markdown and the HTML would drift apart. REQ-247 puts wording and styling together on one page, so it would need to switch over to this. |
| **SMS/push text** | Yes, optional and length-limited. If it's empty, that channel isn't used for this message. |
| **Sender address** | **A choice, not free text.** It should be picked from the business's verified sending domains (`sending.ts`) or 1st Contact. Free text invites spoofing and lands mail in spam. Reply-to can be freer. |
| **Trigger** | Picked from a **fixed list of events the platform produces**. System messages such as sign-in and invite can have their wording edited but not their trigger. |

**Things I'd add:**

- **Subject line.**
- **Audience:** the business's own staff (level 1 and delegates) or the person who triggered it (level 2).
- **On/off switch.**
- **Required placeholders:** for example, an editor can't delete `{{link}}` from the sign-in message, or the unsubscribe line.
- **Preview with sample data, and "send a test to me".**
- **Version history:** templates already work as "the newest ticket wins", so older versions are kept automatically.

**Scope boundary:** this tab is for **messages sent when something happens** (transactional). Newsletters and marketing need consent, and the law around them is different, so they belong somewhere else.

## Order of work, if it isn't needed for launch

1. Messages tab listing every message, with editable wording, bringing together the three places above.
2. One shared L1 style template per business, edited by the AI.
3. SMS/push text once those channels exist.

## Decision for you

I'd reword EPIC-30 to something like "Messages: what a business sends to its people, and when", and put the Messages tab into it as a later child. The alternative is a separate Messages epic, with EPIC-30 staying as the delivery layer (`notify()`, channels, limits). Given you like fewer tickets, I lean towards rewording EPIC-30. Tell me which you prefer and I'll update it.

<!-- xgd-turn id="4a4267e8-6d2a-465b-9c4d-c2a6d6d29a59-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T17:52:46.861791+00:00" -->
#### You
No lets pivot this epic

I think we are aligned let me drill in a little further

Proposal: The messages tab shows two kinds of thing
- Messages
- Templates

Templates are generated by the AI using L1
Each message references a template and its detail page shows a render of what it should look like in the users mailbox

More than one template is allowed although we would default to one.

Question to think about: We will (eventually) support email lists and sending messages to those - I think that will use this same interface perhaps this is a different kind of message, much of the rest applies

| **Sender address** | **A choice, not free text.** It should be picked from the business's verified sending domains (`sending.ts`) or 1st Contact. Free text invites spoofing and lands mail in spam. Reply-to can be freer. |
| --- | --- |

<-- suggest: the user needs a UI to add senders this is then a drop down from that. The domain(s) are fixed, but the user part of the email can be anything they want (though we would recommend that they don't use usernames that would tend to route to spam)

<!-- xgd-turn id="4a4267e8-6d2a-465b-9c4d-c2a6d6d29a59-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T17:54:18.091875+00:00" -->
#### Claude
I've rewritten EPIC-30 around this and retitled it "Messages: what a business sends to its people, and when". The original reasons and the survey are kept, and your words from today are quoted as the reason for the change. No code was changed.

## Messages and templates

I agree with this split, and it gives each part one job:

- **Templates** decide how mail looks. The AI writes them in L1, and they're rendered with the email-safe L1 subset and renderer that form emails (REQ-247) already use. Each template has a slot where the message's text goes. A business starts with one and can have more.
- **Messages** hold the words and the rules: subject, markdown body, SMS/push text, sender, template, trigger, audience, and an on/off switch. The detail page shows how the message will look in the recipient's mailbox, filled in with sample data, and offers "send a test to me".

The styled HTML is generated from the message and its template each time and isn't saved per message. That means changing a template restyles every message that uses it.

## Email lists

I agree these belong in the same interface, as a third kind of message: a **broadcast**, sent by a person now or at a scheduled time, to a list. It would share templates, senders, the editor, the preview and the AI chat. Three things are different, and I've recorded them in the epic:

- **Consent:** each contact's consent has to be recorded.
- **Compliance:** every broadcast must include an unsubscribe line and the business's postal address, as marketing-mail law requires.
- **Separate sending:** broadcasts should go out separately from transactional mail, so spam complaints about a newsletter can't hurt delivery of sign-in and enquiry emails.

## Senders

I've written this up as you described it:

- A Senders screen where the business adds addresses, which then become the sender dropdown on each message.
- The domain is fixed to the business's verified sending domain, or 1st Contact's own domain for the 1st Contact business.
- The part before the @ is free. Today it's always `no-reply`.
- The screen warns against names that tend to land in spam.

I added one more warning: replies go to the sender address, so it should be a real mailbox, or the message should set a separate reply-to.

## What the epic now says

- **One system for all mail:** every message is one business writing to one person connected to it. "Draft ready" to Alice is a message from the 1st Contact business, and "got your enquiry" to Bob is a message from Alice's business. There's no separate system for owner emails and buyer emails.
- **The tab replaces the three existing places message wording lives** rather than adding a fourth: `templates.ts`, the wording written into `notifications.ts`, and form messages stored as whole L1 pages.
- **`notify()`** (REQ-626, built and waiting for you to approve reconciliation) is the delivery layer underneath. Its fixed list of kinds becomes the list of triggers, and the wording for each comes from that business's message.
- **Later children, none needed for launch:** the Messages tab, Senders, triggers for forms and outages, preferences, push, SMS and broadcasts.

When you're ready to start on the Messages tab, I'd make it the next child ticket.

<!-- xgd-turn id="a166cfab-ad32-4a69-a66d-c009b55fc26d-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T18:05:22.260272+00:00" -->
#### You
Oh one other feature - each message detail page should have a "Send to me" button that the operator can use to test what the email really looks like in an Inbox. Any fields should be filled with fake values, I guess?

<!-- xgd-turn id="a166cfab-ad32-4a69-a66d-c009b55fc26d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T18:05:50.699629+00:00" -->
#### Claude
Yes, fake values are the right choice. I've added a **"Send to me"** button to every message's detail page in EPIC-30, with these rules:

- **Real sending path.** The test goes out with the message's actual sender, template and formatting, so you see what a real inbox and its spam filter do with it. A preview pane alone can't show that.
- **Only to you.** It goes to the signed-in person's own verified address, and there is no recipient field. If you could type an address, the button could be used to send mail to anyone.
- **Fake values.** Each placeholder gets an obvious fake, such as "Sam Sample" or an `@example.com` address. The fakes are defined alongside the list of placeholders, so the on-screen preview and the test email always show the same text. Real customer data is never used.
- **Safe links.** A test never creates a real sign-in link or unsubscribe record, so a forwarded test email can't sign anyone in or unsubscribe them.
- **Kept apart from real sends.** The subject is marked as a test, and it's recorded as a test send. It doesn't count towards the business's hourly limit, and it has its own small rate limit.

These are only recorded in the epic for now. Nothing is built yet.

<!-- xgd-turn id="8df96946-c1f7-41a6-b552-a39568135a06-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T18:08:38.208945+00:00" -->
#### You
Oh one other related - whenever we send emails to a contact we should record that and make it visible on their contact record. We need to store exactly the email that was sent not just a reference to the Message object that could change...perhaps message objects need to be versioned and we store a reverence to the version that was sent?

<!-- xgd-turn id="8df96946-c1f7-41a6-b552-a39568135a06-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T18:09:23.805817+00:00" -->
#### Claude
I'd do both, and most of the first half already exists. I've added a "Record of what was sent" section to EPIC-30.

**What happens today (REQ-198 and REQ-267):** every email sent through `sendRecordedEmail` saves a record with the exact subject, from address, to address, and the full HTML body that went out, plus its delivery status. The contact page in the People tab already lists these under "Messages" and shows each body in a sandboxed frame. So "exactly the email that was sent" is already stored and visible.

**What the epic now says:**

- **The stored copy is what we rely on, and the version link records where it came from.** A link to a version alone can't reproduce an email. The placeholders were filled from that particular event, and the code that turns a template into HTML changes over time. So the record keeps the full email, and the SMS/push text once those channels exist. It also points to the message version and template version that produced it.
- **Versioning works the way templates already do.** Saving a change writes a new record, and the newest one is used. Old versions are never edited, so a sent record's links stay valid. Today a sent record only links to the template version; it will also link to the message version.
- **Each email is saved under the business that sent it, on the recipient's contact page.** That follows from the pivot, and it changes one thing that's already built. REQ-626 saves the "draft ready" email in Alice's own business. Under the new model it is a message from the 1st Contact business, so it belongs on Alice's contact page in the 1st Contact business. I've noted that this should move when the Messages tab is built.
- **"Send to me" tests are recorded as tests** and don't appear on anyone's contact page.

Nothing is built yet; all of this is recorded in the epic for the later Messages tab work.

<!-- xgd-chat-end -->