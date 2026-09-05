---
uid: comment-5200935a
id: COMMENT-2286
type: comment
title: Comment on chat CHAT-39
created_by: xgd
created_at: '2026-09-05T22:42:15.049823+00:00'
updated_at: '2026-09-05T23:13:07.785924+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-998e7ab3
  kind: chat_transcript
---

<!-- xgd-turn id="5877f09b-712a-476c-a9f7-2ccbb8d1d95e-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T22:42:05.719812+00:00" -->
#### You
OK, so we have most of the infrastructure that we now need in order to start seriously discussing how to create the basic on boarding flows I need for my early beta trials.

The flow must start in my view of users in the 1stcontact app.

I think "Invite" is the wrong action - the first and more fundamental is add - so I need a "+" CTA that pops up a model to add a Contact (important naming - the general term here is no People, Users, Customers it is "Contact" - I hope our table has that name)

Next once I have them I need to "Invite" them. I am not sure that this is a general action beyond the beta flow but lets assume it will be for now. So each row in the item list needs a check box, I check N and click the "Invite" button (which should be disabled unless there is at least one box checked). Invite pops up a modal which is an email form, With a From, Subject a To-List that lists the email addresses (note this will be sent as N emails hence To-List: not To: - I'd like a mouse hover on the To-List that explains this - basically we do not want to give contact emails to each other), and a body - the body must come from a new ticket type "template" we will manually create a ticket for this for now. Critically it needs to contain a welcome message and a CTA with an button and a "cut and paste this link if that doesn't work"

The link will take them to a sign-up page - agree to the T&C (we do not have text right now - leave that until later - use Ipsum Lorem or some  place holder text - make sure it DOES NOT look like T&C) and then they should get through to the app.

Secondary flow: we also need a similar flow for when their login expires

We need a placeholder 1c site page it can say nothing for now (stealth mode ;-) ) but it should have top right a Sign In link - clicking Sign In -> modal Enter your email -> Please check your email for a sign in link. Sign in template used - clicking the link signs the user in.

Signed in user on 1stcontact.io should see the stealth mode home page with links at the top right "My Businesses", "User Portal Icon"

<!-- xgd-turn id="5877f09b-712a-476c-a9f7-2ccbb8d1d95e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T22:45:18.246852+00:00" -->
#### Claude
I'll survey what exists before we design this — naming, current User tab, auth, and email capability are the four things that will shape the answer.

I've surveyed the existing code. There's more here than you might expect — and two hard blockers that shape everything.

## Naming: the table is `users`, and that's deliberate

`db/migrations/0004_identity.sql` creates `users`, tenant-scoped, unique on `(tenant_id, email)`. There is no `contacts` table and there should not be one — DOC-42 §9's falsifier is literally *"a User list and a CRM list that can disagree about a person who is both"*. Contact, invited and member are **three states of one row**:

| State | Marker |
|---|---|
| contact | `invited_at` null |
| invited | `invited_at` set, `tos_accepted_at` null |
| member | `tos_accepted_at` set |

So your instinct is right at the product level and the schema already agrees with it. What changes is the **surface vocabulary** — the tab, the modals, the API responses say "Contact". One collision to settle: if the population is called Contact, state 1 can't also be called "contact". Suggest **Added / Invited / Signed up**.

## Two blockers

**1. There is no email sender in this repository.** `invitePerson` says so in its own docstring: *"AND NO MAIL IS SENT. There is no sender in this repository."* Cloudflare's `send_email` binding only delivers to addresses pre-verified in your account, so it's useless for inviting strangers. You need an ESP (Resend or Postmark) plus SPF/DKIM/DMARC on `1stcontact.io`. **This is the critical path** — DNS propagation and sender reputation have lead time that no amount of coding removes.

**2. Cloudflare Access owns login, and your flows collide with it.** Today `app.1stcontact.io` is fronted by Access with the OTP provider; `access.ts` verifies the JWT on every request and there is no cookie or session concept anywhere in the codebase. If you send an invite email with a link to the app, the invitee clicks it and gets **Cloudflare's** OTP challenge and a **second, Cloudflare-branded email** before they ever see your welcome page. And "Sign In → check your email for a sign-in link" on the 1c site cannot exist at all under Access.

So the flows as described **force the auth migration** DOC-40 §3 parks as *"Later: our own magic link"* — an `auth_tokens` table, a `sessions` table, and turning the Access policy off. That's the largest single piece of work here, and everything else queues behind it.

Worth naming the cost: Access is currently also a *cost* boundary (unauthenticated traffic never reaches the Worker). Removing it makes denial server-side. Fine at beta volume, an open question at signup volume.

## The design insight that collapses three flows into one

**The invite link and the sign-in link are the same primitive.** An invite email is just a sign-in link issued to someone whose `tos_version` is unset. They click it, get a session, and `guardTerms` — which already exists — routes them to the T&C interstitial. No separate "sign-up page" is needed.

That means one token mechanism serves: invite, sign-in, and (probably) your expiry flow. Three templates, one machine.

## What already exists

Genuinely useful amount:

- **T&C page** — `terms.ts` already serves Lorem Ipsum placeholder copy at `/terms`, with `guardTerms` blocking everything behind it and `acceptTerms` stamping `tos_version`/`tos_accepted_at`. Your "use Lorem Ipsum, make sure it doesn't look like real T&C" requirement is already met.
- **Invite** — `invitePerson` writes the row and stamps `invited_at`, correctly updating rather than inserting for an existing contact.
- **Lapse model** — `identity.ts` has `LapseReason` with four cases (`expired`, `revoked`, `not_yet`, `never_granted`) and `BusinessLapse`. Your expiry email has a data model waiting for it.
- **Portal** at `/account`, and `businessesFor` for "My Businesses".

## The gaps, concretely

| Flow piece | State |
|---|---|
| "+" Add Contact | `invitePerson` conflates add and invite. Needs splitting into `addContact` (no `invited_at`) and `invitePerson`. Small, clean, the model already anticipates it. |
| Row checkboxes + bulk Invite | `invitePerson` takes one email; needs to take N person ids. UI work in `builder/people.js`. |
| Invite modal (From / Subject / To-List / Body) | All new. |
| `template` ticket type | New type in `productTypePack()` (`tickets.ts`). Good fit — and because templates are tenant tickets, Alice gets the same capability for free, which satisfies DOC-40 §2.1 rule 1. |
| Sending | Nothing. |
| Magic link + sessions | Nothing. |
| Stealth apex with Sign In | `public-site/src/index.ts` serves `APEX_BODY = 'Hello from 1stcontact.io'` and declares *"There is no authentication"*. Making it session-aware amends that premise — cookie scoped to `.1stcontact.io` so both Workers read it. |

## Decisions I need from you

1. **Own auth now, or keep Access for the beta?** I don't think there's a real choice — the flows don't work under Access — but it's a big commitment and worth you saying so explicitly.
2. **ESP: Resend or Postmark?** And who does the DNS records — that should start today regardless of anything else.
3. **Is the invite body editable in the modal before sending?** My recommendation: prefilled from the template, editable for *this send*, and the edit is **not** written back to the template (editing a template is a different act). Also: **From should be display-only** — an arbitrary From breaks DKIM.
4. **Template placeholders** — I'd have the template declare its required tokens (`{{cta_url}}`, `{{name}}`) and have the sender **refuse to send** if one is missing, rather than mailing out a dead button.
5. **"When their login expires"** — do you mean session expiry (which the sign-in flow already covers) or **entitlement lapse** (`LapseReason`, i.e. their grant ran out)? These are different emails with different copy.
6. **Stealth page** — hardcoded HTML, or an actual published 1c site in the `1stcontact` tenant? Dogfooding says the latter; speed says the former. I lean hardcoded for now, but built so the sign-in chrome is separable, because you'll want it over a real site later.

## Suggested decomposition

Six tickets, in dependency order — the first two are the ones that block everything:

1. **Email sender** — ESP binding, verified domain, a `sendEmail` port with a no-op local implementation
2. **Own auth** — `auth_tokens` + `sessions` migration, token issue/redeem, cookie on `.1stcontact.io`, Access policy retired
3. **`template` ticket type** — schema, placeholder contract, three seed templates
4. **Contacts tab: add + bulk invite** — split `addContact`/`invitePerson`, checkboxes, invite modal, To-List tooltip
5. **Stealth apex + sign-in** — public-site session awareness, Sign In modal, signed-in chrome
6. **Lapse email** — once (5) settles what "expires" means

Tell me which of the six decisions you want to settle now and I'll write the tickets.

<!-- xgd-turn id="162f9d43-7c72-44c1-bdce-3a3615c6a6e8-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T23:13:07.291276+00:00" -->
#### You
See DOC-44 users is wrong we are deliberately changing it to Contacts. The inital state of a contact will be  a Lead.

6. A published 1stcontact site - definitely
5. We have a REQ to deal with that lets make initial tokens long lived 3 months? and figure this out a little later
4. Yes agree
3. agree that is the intent - separate UI for template modification
2. I don't understand this
1. Lets discuss

Also I missed something.  I want a ticket type "email" and I want to store all outgoinng email associated with the user we sent it to starting with the invite - these records will be visible on the Contacts/Users page

<!-- xgd-chat-end -->