---
uid: comment-433635b0
id: COMMENT-6228
type: comment
title: Comment on epic EPIC-30
created_by: xgd
created_at: '2026-11-01T17:08:12.468071+00:00'
updated_at: '2026-11-07T19:35:53.263064+00:00'
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

<!-- xgd-turn id="b4ca3a6a-6b2b-4fea-99a9-f0c5cdadd788-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T18:04:26.067673+00:00" -->
#### You
ok so we now have an ecom function - can you take a look at how the messages have been implemented and whether this deviates from our design? This is the time to look at building this since we now have real use cases - what will it take?

<!-- xgd-turn id="b4ca3a6a-6b2b-4fea-99a9-f0c5cdadd788-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T18:05:49.805555+00:00" -->
#### Claude
Reading the new order-email code against the EPIC-30 design now; nearly done.

The shop's emails match the design on when they're sent, who gets them and who they're from. They don't match it on where the wording lives, how the email looks, or where the sent copy is recorded. I've added a review section to EPIC-30 with the details. No code was changed.

## What REQ-644 built

There are seven new emails:
- **Two to the owner and their team**, sent through `notify()`: "New order" and "A buyer asked to cancel".
- **Five to the buyer:** confirmation, shipped, cancelled, cancellation declined and return refunded.

## Where it matches the design

- **Each email maps to exactly one event.** Those events are the trigger list we planned.
- **Each email goes to one audience:** either the business's own people or the buyer. That is the model we agreed.
- **Buyer emails are sent in the business's name.** They come from the business's verified domain if it has one, otherwise from the platform address under the business's name. Replies go to the owner.
- **Test orders are marked `[Test]`**, and buyer details only go to the buyer and the team.

## Where it deviates

1. **The wording now lives in four places, not three.** The buyer emails' text is written into the code (`copyFor` in `order-emails.ts`), and two more kinds were added to `NOTIFY_KINDS`. The Messages tab was meant to replace three places; now it has four to replace.
2. **The emails have no styling or branding.** Each body is assembled by hand from plain paragraphs and lists, with no template.
3. **Sent emails don't appear on anyone's contact page.** A buyer isn't a contact, so each email is recorded against the order instead (`contactId = order.id`). Nothing shows in the People tab, and the record doesn't say which message or template version produced it.
4. **The on/off switch is in the wrong place.** "Email the buyer when an order ships" sits in Settings → Shop, not on the message.

The shop also shows a gap in the design itself. Markdown can't show an order's items, totals or delivery address. So a message needs **block placeholders**: sections the platform fills in, such as `{{order_summary}}`, `{{facts}}` and `{{shipping_address}}`. Each would sit in the text like a paragraph and have fake values for the preview and "Send to me". I've added this to the epic.

## What it would take

Following your fewer-tickets and switch-over-in-one-go preferences, I'd plan three child tickets:

1. **Messages and templates as stored records, with one way of rendering them (about 13 points).**
   - Each business gets a `message` record per trigger: subject, markdown, SMS text, sender, template, audience, on/off.
   - Each trigger has a fixed list of placeholders with fake values, including the block placeholders.
   - Each business gets one default L1 email template with a slot for the message.
   - Rendering goes markdown → safe HTML → the template → the existing L1 email renderer.
   - All four current wording sources move over at once, and the code copies are deleted.
   - Sent-email records gain the message and template version.
   - Buyers become contacts at checkout, so order emails appear on their contact page.
   - The "job done" record moves to the 1st Contact business.
2. **The Messages tab (about 15–20 points).** List, detail and preview panes, editing, "Send to me" with its own rate limit and safe links, and the Messages assistant editing wording and the L1 templates. The Shop on/off switch moves onto the message. If this is too big, the assistant could come second.
3. **Senders (about 5 points).** The business can choose the part before the @ (today it's always `no-reply`), with the spam warning and a reply-to option.

SMS, push and broadcasts stay out of scope.

## Decisions for you

- **Should buyers become contacts?** I recommend yes. It's what lets "record it on their contact page" work, and it fits CRM Lite (DOC-5 item 17). It does mean every checkout creates or matches a contact in People.
- **Should REQ-247's form messages move in child 1, or later?** They're whole L1 pages that mix words and styling, so each one has to be split into a message plus a template, including any a business has already customised. Moving them in child 1 keeps the switch-over in one go; doing it later is less risky.
- **Should child 2 launch with the assistant, or with manual editing first?**

Once you've answered, I'll create the child tickets.

<!-- xgd-turn id="611c18d7-0fb5-4c97-850c-583d6f45d18f-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T18:19:06.557189+00:00" -->
#### You
**Should buyers become contacts?**  See REQ-659
**Should REQ-247's form messages move in child 1, or later?** Yes
**Should child 2 launch with the assistant, or with manual editing first? We can build in stages but an assistant is needed before launch**

**Also I am imagining a slight broadening of scope here - this EPIC so far has been focused on email I think Messages should have 3 tabs "Email" | "Legal"**

**Legal is being discussed in EPIC-29 it will not have an assistant - you just need to be aware of the mode**

<!-- xgd-turn id="611c18d7-0fb5-4c97-850c-583d6f45d18f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T18:19:54.983843+00:00" -->
#### Claude
I've updated EPIC-30 with your three answers and the new tab layout. All the earlier sections are kept.

**Buyers as contacts.** REQ-659 is now listed as a child of this epic. It belongs to EPIC-9, and it provides the contact that shop emails get recorded on. Once it lands, the shop part of "record of what was sent" works.

**REQ-247 form messages** move over in the first child, with everything else at once. Each form message is currently a whole L1 page. It becomes a message plus a template, and a business that has already customised its page keeps that look as its own template.

**The assistant** can come in stages: manual editing first, then the Messages assistant. The epic now says the assistant must be in place before launch. It edits wording and templates and never sees contact data.

**Email and Legal.** The epic now describes Messages as a business's outgoing words: what it sends, and what it requires people to accept.
- **Email** is this epic: messages, templates and senders, with the assistant pane.
- **Legal** belongs to EPIC-29: the business's Terms and Privacy Notice, versioned and accepted. It has two panes and no assistant. This epic only supplies the mode switch and a tab frame that works without the chat pane; EPIC-29 owns the documents, viewer, publishing and acceptance. I haven't changed EPIC-29.

The planned children are now in the epic:
1. Messages and templates stored as records, with one way of rendering them, all switched over at once (about 13 points).
2. The Messages tab in Email mode, built in stages, with the assistant before launch (about 15–20 points).
3. Senders (about 5 points).

**Two things I need from you:**
1. You said three tabs but named two: Email and Legal. What's the third? SMS/push would fit, but it could be something else.
2. Should I create those three child tickets now?

<!-- xgd-turn id="d5101c37-6aba-4ccc-a876-e6559a7210a1-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T18:25:30.562572+00:00" -->
#### You
Actually legal does need an assistant...so they will be symmetric. I suggest create the 3 pain UI from the start. AI chat should just a a drop in - the tools and prompts for those screens can come in a second pass.

Two tabs for now

I would like to hear the plan for "wiring" up the assistants before you create tickets - they need (1) tools to view and modify the messages (no modification for legal just view) (2) priming that explains their tools, their role and how things work (3) reminders that tell them about changes the user has made and things they cannot forget to do

<!-- xgd-turn id="d5101c37-6aba-4ccc-a876-e6559a7210a1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T18:27:25.268064+00:00" -->
#### Claude
Checking how the site consultant learns about edits the user made themselves, so the plan reuses that.

I've updated the modes section of EPIC-30: two modes, Email and Legal, both with three panes from the start, and the chat pane added as a drop-in. I haven't recorded the wiring below or created any tickets yet; that waits for your agreement.

The wiring copies the **Settings assistant** (REQ-239), which has already worked through the same problems. It has its own role and its own set of tools. Its tool descriptions are written next to the tools and its tool manual is generated from them, not written by hand. And the pane and the assistant change things through the same API: neither drives the other.

## Two assistants, not one

There would be a **Messages assistant** and a **Legal assistant**: separate roles with separate conversations. The two need different permissions, and we learned with Settings that an assistant told about something it can't do will offer it anyway, apologise for it, or keep trying it. Each mode's chat pane opens its own role. Both reuse the existing host setup: one manager per business per role, plus the usual budget, spend metering and interrupted-turn handling.

## 1. Tools

**Messages assistant** (a new set of tools, `messages`, which use the same routes as the pane):

| Read | Change |
|---|---|
| `list_messages`: trigger, audience, on/off, subject, template, sender | `update_message`: subject, markdown, SMS text, sender, template, on/off |
| `read_message`: every field, plus its placeholders, which ones are required, and their fake values | `create_template` / `update_template`: an L1 email document, checked by `validateL1` against the email allow-list |
| `list_templates`, `read_template` | `set_default_template` |
| `list_triggers`: the fixed list of events and the placeholders each one offers | `revert_message` / `revert_template`: back to an earlier version |
| `list_senders` | `send_test`: the "Send to me" action, only to the signed-in person and under the same rate limit |
| `preview`: the rendered email with fake values, as a picture so the assistant can see it | |
| `list_changes(since)`: edits the client has made in the pane | |

Each tool refuses with the reason when a change breaks a rule: removing a required placeholder, using a placeholder the trigger doesn't offer, a sender not on the list, SMS text that's too long, or raw HTML.

There are two deliberate gaps:
- **No tool reads sent mail or contacts.** Sent emails contain buyer and lead data, and DOC-5 rule 26 means that data never goes to an AI provider.
- **No tool sends to anyone except the signed-in person.**

**Legal assistant** (a `legal` set of tools, read-only):
- `list_documents`: the business's required set, and for each document its current published version and any draft.
- `read_document(version)` and `list_versions`, so it can compare versions.
- `acceptance_summary`: **counts only**, such as "12 of 14 have accepted the current Terms". It never names anyone.
- `list_changes(since)`.

It has no way to change a document.

## 2. Priming

These go in `priming.json` as `messages_priming` and `legal_priming`, in the same three parts Settings uses:
1. **A role section** I write myself, describing the role and how things work.
2. **The tool manual**, generated from the tool descriptions. Nothing in the role section lists the tools.
3. **The business line**, which names the business and is read again every turn so a rename never leaves it stale.

**The Messages role section explains:**
- A business writes to its own people or to its contacts.
- Messages hold the words and templates hold the look. The styled email is generated, so changing a template restyles every message that uses it.
- Triggers are fixed, and system messages (sign-in, invite and so on) can't change trigger.
- Required placeholders can't be removed.
- This tab is for transactional mail only, not marketing.
- Changes go live on the next real email, so suggest "Send to me".
- It never sees customer data.

**The Legal role section explains:**
- What the required sets are, and the difference between level 1 and level 2.
- Publishing a new version makes everyone accept again.
- The Privacy Notice says "I have read", not "I agree".
- It explains what a document says but isn't a lawyer, and says so when asked for advice.
- The client edits in the pane; it can't.

## 3. Reminders

Reminders are short lines repeated every turn, so they stay pointers; the detail lives in the priming. There are three kinds.

**Changes the client made.** This is the same idea as the site consultant's `site.changes` notice. The host counts message and template edits made *in the pane* since the assistant's last turn. If there were any, the reminder says something like "The client has changed 2 messages since your last turn. Call `list_changes` with since: … before you touch anything, and never write over a change you haven't read." Legal works the same way for a document draft edited or a version published.

It also works the other way: a `messages_changed` event (the same shape as `BUSINESS_CHANGED`) makes the pane refresh when the assistant saves something.

**What the client is looking at.** This one is new: a line naming the message, template or document open in the Detail pane, so "make this friendlier" refers to the right thing.

**Things it mustn't forget.** These are fixed one-liners:
- *Messages:* "After a change, say which messages it affects (a template affects all that use it) and offer a test send." "Say what a change will do to real emails before making it."
- *Legal:* "You can't change documents and you don't give legal advice." "Before the client publishes, say that publishing makes everyone accept again."

Both also get the shared session-budget and interrupted-turn reminders.

## The children this gives (replacing the earlier three)

1. **Records, one way of rendering, all switched over at once** (about 13 points). Unchanged, including REQ-247's form messages.
2. **The Messages tab frame** (about 13 points): the Email/Legal switch, three panes in each mode, Email editing, preview and "Send to me", the Legal list and viewer, and the chat pane as a drop-in. The Legal content comes from EPIC-29's existing mechanism.
3. **Wiring the assistants** (about 13 points): both sets of tools, both roles, priming, reminders, and change signals in both directions. The Messages assistant must be working before launch.
4. **Senders** (about 5 points).

## Three decisions for you

1. **Do edits go live when saved, or as a draft that the client publishes?** I recommend live on save: every save is a version, so it can be reverted, and "Send to me" is the safety check. With drafts, every message would need a publish step and two states.
2. **Should the assistant be able to send the test email itself?** I recommend yes. It only reaches the signed-in person and is rate-limited.
3. **Should the Legal assistant see acceptance counts?** I recommend counts only, never names.

Once you agree, or change any of these, I'll add the plan to EPIC-30 and create the four children.

<!-- xgd-turn id="9f209771-7ac5-4b33-a7a4-96f54af5f062-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T18:31:45.815669+00:00" -->
#### You
1. Keep it simple - live on save - as we discussed this gives messages a different lifecycle than the rest of the site
   2. Yes - nice feature
   3. Sure but what is an acceptance count exactly?

<!-- xgd-turn id="9f209771-7ac5-4b33-a7a4-96f54af5f062-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T18:32:40.579323+00:00" -->
#### Claude
I've recorded all three decisions and the full assistant plan in EPIC-30. I haven't created the child tickets yet.

## What an acceptance count is

It applies to each required document, such as the business's Terms. It counts only the people who actually have to accept that document:
- **Level 1:** the business's members, meaning the owner and delegates.
- **Level 2:** contacts who have signed in to the business's portal. Someone who only filled in a form never has to accept anything, so they aren't counted.

Those people are split three ways:

| | Example |
|---|---|
| Accepted the **current** version | 11 |
| Accepted only an **older** version | 3 |
| Accepted **none** (never, or withdrew) | 0 |

The data already exists. The `user_acceptances` table keeps one row per person per document, including which version they accepted, so the count is one grouped query for each business.

That lets the Legal assistant answer two useful questions without naming anyone: "Has everyone accepted the new Terms yet?" and "If you publish this, 14 people will be asked to accept again."

## What I've recorded

- **Live on save,** in your words, including that messages have a different lifecycle from the rest of the site. Every save creates a new version that can be reverted, there are no drafts, and "Send to me" is how you check a change.
- **The Messages assistant can use "Send to me" itself.** It only sends to the signed-in person and has the same rate limit as the button.
- **The Legal assistant sees acceptance counts only,** as defined above.
- **The assistant plan:** the tools, priming and reminders for both assistants, as agreed.

## Planned child tickets

1. Messages and templates stored as records, rendered one way, with everything switched over at once (about 13 points).
2. The Messages tab: Email and Legal modes, three panes each, with the chat pane slotting in (about 13 points).
3. Wiring both assistants: their tools, priming, reminders, and change notices in both directions (about 13 points).
4. Senders (about 5 points).

Shall I create these four now?

<!-- xgd-turn id="859cda8e-4d9d-47e4-9424-afaf3a21c216-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T18:56:25.380316+00:00" -->
#### You
Please create the tickets and tell me which ones can be implemented in parallel

<!-- xgd-turn id="859cda8e-4d9d-47e4-9424-afaf3a21c216-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T18:58:34.253621+00:00" -->
#### Claude
Now linking them from the epic.

Nothing was applied (good — the placeholder field was rejected with it). Retrying with the real child uids.

I've created four child tickets under EPIC-30, all at draft and linked from the epic:

| Ticket | What it covers | Points |
|---|---|---|
| **REQ-660** | Messages and templates as stored records, one way of rendering them, and all four places message wording lives today switched over at once | 13 |
| **REQ-661** | The Messages tab: Email and Legal modes, three panes each, editing, preview, "Send to me" | 13 |
| **REQ-662** | The Messages assistant and the Legal assistant | 13 |
| **REQ-663** | Senders | 5 |

Each ticket also has its test plan and an "Order and dependencies" section.

## What can run in parallel

**Start now:**
- **REQ-660** goes first, because the other three use the routes it adds.
- **REQ-659** (in EPIC-9) can run at the same time. Both change `order-emails.ts` and the sent-email record, so whichever merges second adapts to the other. Shop emails only appear on the buyer's contact once REQ-659 has landed.
- **REQ-661** can also start early on its tab frame and Legal mode, since those only need the legal documents mechanism EPIC-29 already has (REQ-488). Its Email mode has to wait for REQ-660.

**Once REQ-660 has landed, run these together:**
- **REQ-661** builds the Email mode.
- **REQ-662** builds the assistants, but must land after REQ-661. Its last step is hooking the assistants into REQ-661's chat pane, and into what the client has open and what they've changed.
- **REQ-663** builds Senders. Its list sits in REQ-661's Email mode, so whichever of the two lands second puts it there. Until then each business has the one sender it uses today.

So at most three sessions can run at once: REQ-660, REQ-659 and REQ-661's frame now, then REQ-661, REQ-662 and REQ-663 once REQ-660 is in.

<!-- xgd-turn id="a0b0480c-721a-4cb3-b232-1e2b9dd5c831-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T19:21:23.068091+00:00" -->
#### You
BTW I am not crazy about the "Messages" tab name - it suggest notifications or incoming emails. Can you suggest alternatives?

<!-- xgd-turn id="a0b0480c-721a-4cb3-b232-1e2b9dd5c831-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T19:21:44.225456+00:00" -->
#### Claude
Here are some options. I'd keep in mind that the tab holds two things: the emails the business sends automatically (wording and look), and the legal documents its people have to accept.

| Name | For | Against |
|---|---|---|
| **Paperwork** (my pick) | Order confirmations, receipts, "your order has shipped", Terms and Privacy Notice are all the standard paperwork of running a business. It sounds like something you set up once and then forget, which is the right feel. It doesn't suggest an inbox. | Slightly playful. SMS and push texts are a stretch under this name. |
| **Emails & Legal** | Literally says what's in it, so nobody can misread it. | Long, and it has to be renamed if SMS or push are added. |
| **Correspondence** | Clearly outgoing and formal. | Long, a bit stiff, and can still suggest letters you've received. |
| **Wording** | Says it's about the words. | Doesn't cover templates (the look) or accepting Terms. |
| **Documents** | Fits Legal well. | Weak for emails, and could be confused with the Library. |

Two names I'd avoid:
- **Templates**, because a template is one thing inside the tab (the look), and people could confuse it with site templates.
- **Communications**, because it still suggests an inbox.

**One clash to settle whichever name you pick.** The epic puts mailing-list broadcasts in this tab later. But the tab-assistant list also has a planned **Marketing** tab, which is where newsletters would naturally go. I'd move broadcasts to Marketing and keep this tab for transactional mail and legal documents, which also makes the name easier to choose.

The assistants would keep their mode names, **Email assistant** and **Legal assistant**, whatever the tab is called.

Tell me which name you'd like, and I'll rename the tab throughout EPIC-30 and REQ-660 to REQ-663.

<!-- xgd-turn id="8223e8bf-7f75-452c-82a9-a18a4c1fa236-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T19:24:43.618060+00:00" -->
#### You
Ok lets call it Paperwork please - can you make that change - including to your title and the child tickets and can you answer the questions in the REQ-660 transcript. Put the answers in its ticket body

<!-- xgd-turn id="8223e8bf-7f75-452c-82a9-a18a4c1fa236-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T19:27:29.149340+00:00" -->
#### Claude
Checking whether a level-1 user is always a contact in the 1st Contact business (it decides question 5).

Now writing the answers into REQ-660.

I've renamed the tab to Paperwork in EPIC-30 and all four child tickets, and answered all six REQ-660 questions in its ticket body.

## The rename

The epic is now **"Paperwork: what a business sends its people, and what it asks them to accept"**. The four children (REQ-660 to REQ-663) are retitled to match. "Message" is still the name of one kind of item inside Email mode. The two assistants are now the **Email assistant** and the **Legal assistant**, and the Email assistant's role in REQ-662 is renamed from `messages` to `email`.

## The REQ-660 answers, in brief

1. **Form messages:** agreed, with one change: each form's message is keyed by the form itself (`form_reply:<site>:<form's template name>`), not by a page id, since the email pages are going away. Email pages are retired. Older site versions that still contain them must still load, so a rollback works, but those pages are ignored. Form messages take effect as soon as they're saved.
2. **Splitting a customised page:** agreed, done mechanically. The test is that the first email after the switch-over has the same text and colours as before.
3. **New forms before the Email assistant exists:** the gap is acceptable. When a form is created, it gets its message straight away, and the site consultant can still write a tailored reply at that point; otherwise it gets a plain default. After that, the wording is edited in Paperwork.
4. **When migration happens:** today's wording is filled in the first time a business's messages are read. Form pages are converted once, by a one-off job run on dev and then production, and the job and the old-page reader are then deleted. Converting gradually would keep the old reader forever.
5. **Recording "job done" under 1st Contact:**
   - Alice always has a contact record in the 1st Contact business, because every builder user signs in through it.
   - The hourly limit, the duplicate check and the opt-out move with it, but not by searching the 1st Contact store. That store will hold every business's emails, so searching it on every send would get slower without limit. The limit and duplicate check use a small indexed table, and "Stop these emails" becomes a preference in the existing acceptance records.
   - "New order" stays recorded under Alice's own business: it's her business writing to its own team.
6. **Sender and look:** each email keeps the address it uses today (invite and delegate stay `invite@1stcontact.io`), which corrects the earlier "one sender per business" line. The default template comes from today's standard email page in the business's colours, and links render as a button with the plain address underneath.

## Size: 25 points, over the 20-point limit for free-coding

I kept REQ-660 as one ticket and recorded the reason in its body: you decided the form messages move in this switch-over, and splitting them out would mean two places holding form wording for a while. If you want it under 20, the clean split is answer 5 (the new table, the opt-out preference and the "job done" move), because it doesn't touch the wording switch-over.

REQ-660 is still at draft. Its session will need prompting to read the answers and start.

<!-- xgd-turn id="f047e6e6-1e60-4c02-86cf-1936f25bee63-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T19:28:30.774609+00:00" -->
#### You
Older site versions that still contain them must still load, so a rollback works, but those pages are ignored. Form messages take effect as soon as they're saved. <-- keep this simple we have no live sites only test sites

<!-- xgd-turn id="f047e6e6-1e60-4c02-86cf-1936f25bee63-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T19:29:13.319480+00:00" -->
#### Claude
I've simplified REQ-660 on that basis, and taken out the migration work along with the rollback rule, because it existed for the same reason.

- **No rollback compatibility.** Older site versions don't have to keep loading their email pages.
- **No converting customised pages.** Existing email pages on the test sites are deleted. Every existing form gets a standard reply message in the business's default template. No custom look is carried over.
- **No migration job.** Today's wording is filled in the first time a business's messages are read, as it is now. The code that reads the old email pages is deleted in this ticket.
- **Form replies still take effect when saved.** I left that rule in, because it's the "live on save" decision you made, not a compatibility measure.
- **Size is down to about 20 points** (from 25), which is within the free-coding limit, so it no longer needs splitting.

I made the same simplification in EPIC-30's plan. REQ-660 is still at draft, ready for its session to start.

<!-- xgd-turn id="dc0ed054-ff09-4f81-9f95-4932686809f0-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T19:32:48.204251+00:00" -->
#### You
**Sender and look:** each email keeps the address it uses today (invite and delegate stay `invite@1stcontact.io`), which corrects the earlier "one sender per business" line. The default template comes from today's standard email page in the business's colours, and links render as a button with the plain address underneath. <-- we did not talk about sender configuration. What I am expecting is that the emails will come from the domain but the site is published on and the owner can configure a set of predefined send from emails. These can be used arbitrarily to be the sender for different emails. Send a configuration probably belongs in the paperwork tab

<!-- xgd-turn id="dc0ed054-ff09-4f81-9f95-4932686809f0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T19:33:53.649792+00:00" -->
#### Claude
You're right: answer 6 invented a sender rule we never discussed. I've taken it out, and sender configuration now belongs to REQ-663 only, written up as you describe it.

**REQ-660** no longer touches senders. Every email keeps the From and reply-to it has today, and the "sender" field is removed from its message records.

**REQ-663 (Senders)** now quotes your words and says:
- Senders are set up in the Paperwork tab, as a list per business.
- The domain is fixed to a domain the business's site is published on, once sending from that domain is verified. A business with several such domains picks one for each sender. The part before the @ is free.
- Any sender can be used for any email, and many emails can share one sender. One sender is the business's default, used by any email that doesn't name its own.
- The screen warns against names that tend to land in spam, and points out that replies go to that address.
- Until a business has a sender of its own, mail keeps today's From.

I've rewritten EPIC-30's Senders section to match.

**Two open questions, recorded in REQ-663:**
1. **A site published only on its `<name>.1stc.site` address.** I'd keep sending from the platform address under the business's name, as today. We could set up sending on each site's own `.1stc.site` address, since we control that domain, but there would be no mailbox there to receive replies, the address would have no sending history with spam filters, and our email provider (Resend) limits how many sending domains we can verify.
2. **Should connecting a custom domain switch on sending from it automatically?** Today it's a separate toggle (REQ-259). "Come from the domain the site is published on" suggests it should be automatic. The same safeguard would still apply: we only add the anti-spoofing policy record (`_dmarc`) if the domain has none, and only in report-only mode. I'd make it automatic.

<!-- xgd-turn id="1c00b2bd-1cac-4c6f-892c-41f4f37336bb-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T19:35:23.846568+00:00" -->
#### You
1. OK
   2. Yes

<!-- xgd-turn id="1c00b2bd-1cac-4c6f-892c-41f4f37336bb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T19:35:51.695479+00:00" -->
#### Claude
I've recorded both answers in REQ-663 and EPIC-30, and replaced REQ-663's open questions with them.

1. **A site on `<name>.1stc.site` only** sends from the platform address under the business's name, and that is its only sender.
2. **Connecting a custom domain now switches on sending from it**:
   - The DNS records that let us send mail from the domain are added automatically, and verification starts. The separate "send as your domain" switch is removed.
   - The anti-spoofing policy record (`_dmarc`) is still only added when the domain has none, and only in report-only mode.
   - Until the domain is verified, mail keeps coming from the platform address. Once it's verified, the domain can be used for senders.
   - Disconnecting the domain removes the records we added, as it does today.
   - Existing test businesses with a custom domain but sending switched off are switched on in the same way.

REQ-663's test plan covers both. It also grows from 5 to 8 points, because it now includes changing how domains are connected (REQ-259). Nothing changes in the order of work: it still comes after REQ-660, in parallel with REQ-661 and REQ-662.

<!-- xgd-chat-end -->