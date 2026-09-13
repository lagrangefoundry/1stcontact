---
uid: comment-cd9c1549
id: COMMENT-2884
type: comment
title: Comment on epic EPIC-10
created_by: xgd
created_at: '2026-09-13T00:19:33.278873+00:00'
updated_at: '2026-09-13T21:03:33.328723+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-d6d7ea63
  kind: chat_transcript
---

<!-- xgd-turn id="c5228fc5-11c5-4c8f-9c8b-19e873a2ed2f-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T00:19:19.642309+00:00" -->
#### You
Ok lets discuss the email capture functionality. There are some things live but lets put aside implementation for a second and discuss requirements.

I want to be able to configure business-specific settings to be associated with a contact - all businesses need t_and_c_accepted, privacy_policy_accepted for first contact I need: beta_asked for xgd I need newsletter, whitepapers - all of these are recording requests or acceptances of the user. Each one means that a user clicked a button and/or checked a box.

Lets call these T/F properties user acceptances - lets start with system defined ones that the business can use or not. We may choose to add custom per-business acceptances later. 

In time these will generalize beyond T/F values to real onboarding surveys.

Each checkbox going to T is an event in the contact event log.

Then the email capture module needs to do the following:

1. Capture the email entered in the box and add it to the contact list
2. Based on configuration of the module set one or more user acceptance to T (acceptances implied in jut hitting the button)
3. Based on checkboxes that the user checks set one or more user acceptance to T (addition optional opt ins)
4. Send a configurable email to the users account this email can contain:
 - a difficult to guess link to a "hidden" page with capture content (e.g. whitepapers)
 - a sign in link
 - just a welcome message

Please investigate the state of the implementation and then lets discuss the product then the design

<!-- xgd-turn id="c5228fc5-11c5-4c8f-9c8b-19e873a2ed2f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T00:23:37.151713+00:00" -->
#### Claude
I've read through the implementation. Here's where things actually stand, then the product questions I think need answering.

## What is built

**The form module** — `packages/framework/src/modules/contact-form/` (v5). Field schema of `text|email|tel|textarea|checkbox`, each field rendered as an L1 `control` node; honeypot, Turnstile mount, a hidden form-instance handle; posts to a module-owned `./api/lead` (not configurable — BUG-86 removed `config.action`). Config carries `asset`/`assetName`/`assetUrl`, `successMessage`, `submitLabel`.

**The endpoint** — `apps/public-site/src/lead.ts`. Shape → size → rate-limit → honeypot → Turnstile, one frozen acknowledgement for every outcome, write handed to control-app over an RPC service binding (no URL reaches it).

**The write** — `apps/control-app/src/lead.ts::captureLead`. Resolves site→business from the path, reads the form's definition **out of the snapshot the submitter was actually served** (published revision, or draft for the operator's preview), pulls the email, calls `addContact` (idempotent on `(tenant, email)`, `pipeline_stage='lead'`), writes one `form.submitted` contact event.

**The data model** is in good shape for this: `contact_events` is immutable and append-only with an `ABORT` trigger, `kind` is an unconstrained dotted string precisely so the set can grow, and the schema comment already states the discipline you're describing — *"An event says this happened. Anything that CHANGES is state and lives elsewhere."*

**Asset delivery** — at most once per (contact, asset), ever; suppressed on bounce or complaint; renders the business's `asset` template ticket; records an `email` ticket; appends `asset.sent`.

## What is missing, against your four requirements

| You want | Reality |
|---|---|
| 1. Capture email → contact list | **Done.** |
| 2. Implied acceptances on submit | **Nothing.** No config, no concept. |
| 3. Checkbox → acceptance | **Half.** `provenanceOfSubmission` writes `consent: [{field, wording, answer}]` into the `form.submitted` event's `detail` JSON. That is *evidence* and nothing reads it back — you cannot query "who is on the newsletter", segment on it, show it on the contact, or withdraw it. There is no acceptance **state** anywhere. |
| 4. Configurable email | **Barely.** Exactly one template (`asset`) fires, and only when `asset`+`assetUrl` are both set. A form without an asset sends nothing at all — the 1st Contact beta form mails no one. No "welcome only", no sign-in link, no per-form choice of copy. |

Also missing: any notion of an **acceptance registry** (system-defined keys a business opts into), per-acceptance **events**, the **hidden page** (`assetUrl` is a free `url` string the author types — no token, no expiry, no gating, and the whitepapers don't exist as artifacts), and any route from a public form to a **sign-in link**.

One thing that *does* exist and is relevant: `tos_version` + `tos_accepted_at` on `users`, plus `terms.ts`. That is exactly a `t_and_c_accepted` — built as a one-off for platform builder access.

## The product questions

**1. "Acceptance" is covering three different things, and they behave differently.**

- `t_and_c_accepted`, `privacy_policy_accepted` — acceptance of a *document*. Versioned, legally evidenced, not withdrawable (you leave instead).
- `newsletter` — a marketing consent. Tenant is IE, so this **must** be withdrawable, and the withdrawal is itself a record you have to keep.
- `beta_asked`, `whitepapers` — these aren't acceptances at all, they're *requests*. They don't get withdrawn; they get fulfilled.

T/F handles none of the second cleanly: an unticked box today is not the same fact as an unsubscribe last week. My recommendation: the log holds `granted` / `withdrawn` pairs, and the T/F is a **materialised projection** of the latest — which is exactly the division the schema comment already draws, and gives you the fast "who do I send to" query without losing history.

**2. Boolean is already known to be insufficient for `t_and_c_accepted`.** `terms.ts` says it in as many words: *"`tos_version IS NULL` would answer 'has this person ever accepted anything', which is the same question only until the first time the terms change."* If the general mechanism is T/F we re-introduce the bug we already fixed. An acceptance record needs to carry *what was accepted* — a version, or the wording shown. The checkbox path already captures the label for this reason.

**3. Does the platform's own terms collapse into this?** If `t_and_c_accepted` means "accepted the T&Cs of *this business*", then `tos_version`/`terms.ts` is just the 1stcontact tenant's instance of it. That unification is attractive and would kill a special case — but it touches the builder's admission gate, so it's a scope decision, not a free one.

**4. Implied acceptances need authored wording, or they're evidence-free.** "Pressing the button means you accepted the terms" is only true if the page said so next to the button. So the config can't be a bare list of keys — it needs `{key, wording}` per implied acceptance, captured the same way a checkbox label is. Do you agree, or do you want the wording to come from somewhere else?

**5. Which email — and how many?** Templates are already per-business tickets, editable without a deploy, with declared placeholders. The natural shape is: the module config names **which template**, and the template is the copy. The friction: `TEMPLATE_KEYS` is deliberately a *closed* set (`invite|signin|lapsed|asset`) because an open key means a template authored under `sign-in` while the sender asks `signin`, and they never meet. But different forms on one site plainly want different emails. So either the closed set opens with publish-time validation, or per-form copy lives elsewhere. This is the sharpest design question in the list.

**6. The hidden page.** Three quite different things:
   - (a) an unguessable URL to an **artifact** (the PDF) — nearly free today, `site_assets` + R2 already does it;
   - (b) an unlinked **page** on the site — trivially discoverable, needs `noindex` at minimum, isn't really gated;
   - (c) a **token-gated page** — a real feature; published pages are currently static bytes with no gate.
   
   Also: one link for everyone, or one per contact? Per-contact costs nothing and buys you attribution and revocation. Which of (a)/(b)/(c) do you actually mean?

**7. Should a public form be able to send a sign-in link?** In this model a sign-in link mailed to a stranger *is* an invite — there's already a verb (`markInvited`, pipeline → `invited`, `contact.invited`). So "the form sends a sign-in link" = "the form invites into the business". For the 1st Contact beta form that's deliberate; for a customer's newsletter signup it must never happen by accident. Default off, and possibly a second gate beyond ordinary config.

**8. One module or two?** CLAUDE.md is explicit that a new behavior module is the last resort. Everything you've described is config on the existing one. I'd extend `contact-form` rather than author an `email-capture` — though the name is already slightly wrong (it captures a lead, it doesn't contact anyone), so a rename is worth deciding deliberately now rather than letting a second module accrete.

Tell me where you land on these — particularly 1, 5 and 6 — and I'll write the design.

<!-- xgd-turn id="c9152565-d788-4d4d-83bd-150baaaeb121-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T20:48:46.057208+00:00" -->
#### You
Lets talk about the acceptances 
1. The boolean represents current state but we also have the contact event log that registers all changes - I think together these are good
2. Our different acceptances can be configured as revocable or not - the first two are not - they cannot be changed
3. Some acceptances can be changed by the user (newsletter opt-in) such an acceptance should appear on the user portal automatically and allow the user to change it - I think beat_inclusion can reasonably be in this list
4. I included access_to_whitepapers as an acceptance but its not really a state once you have been sent access to the whitepapers you've been sent them - this cannot be "revoked" because it is a statement about something that happened. Perhaps it should not have a boolean on the model, but just be an event (note: it could still have a user checkbox)

So I get to the same three categories you did. I think we have acceptances and they are configured to be one of these three types - agree?

<!-- xgd-turn id="c9152565-d788-4d4d-83bd-150baaaeb121-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T20:49:56.749222+00:00" -->
#### Claude
Yes — agreed on the three categories. Three refinements, and then two consequences your framing implies that aren't yet on the table.

## Refinements

**1. Category 1's state is a version, not a boolean.** "Cannot be changed" is true of the *user's* ability to revoke, but the document itself changes, and a new version has to be re-accepted. `terms.ts` already learned this the hard way and says so:

> `tos_version IS NULL` would answer "has this person ever accepted anything", which is the same question only until the first time the terms change — and then it is silently the wrong one for everybody who accepted the old document.

So category 1 is a **document acceptance**: state is *which version they accepted*, the boolean is derived (`accepted == current`), and when the document version bumps the whole contact list goes false at once and gets re-asked. If we model it as a plain immutable boolean we reintroduce exactly the bug the existing code fixed. It also means a category-1 acceptance definition has to reference a versioned document, which categories 2 and 3 don't.

**2. `beta_inclusion` over-claims; your original `beta_asked` was right.** They asked to be in the beta. Whether they're *in* it is the business's decision, and lives in entitlements/pipeline. If the portal shows "Beta: on" the user reads it as "I'm in", which may be false. Keep the name at the ask — `beta_requested` — and let inclusion be a separate fact.

**3. Category 3 has two events, and one of them already exists.** For whitepapers: `whitepapers.requested` is *their* act (the checkbox), `asset.sent` is *ours* (already written, already the at-most-once ledger). You're describing the second; the missing one is the first. Keeping them apart matters because they come apart in practice — they asked and we failed to send, or they asked twice and we sent once. So category 3 isn't "an event instead of state", it's "the record of the ask, with no state, whose fulfilment is a separate existing event."

That also makes category 3 honest: it's a **request**, not an acceptance. I'd name the umbrella concept accordingly rather than calling a request an acceptance — cheap now, expensive later. But one registry for all three is clearly right, because the module config and the checkbox mapping want to be uniform across them.

## Two consequences

**The portal cannot do what you want it to do — by design.** `account-portal` is read-only by contract: its config has exactly one endpoint, the client issues `GET` and nothing else, and the module header states the reason — *"a portal that can grant itself access is not a portal."* Making category-2 acceptances user-editable there means deliberately opening that contract, which is a decision worth making explicitly rather than discovering during implementation.

**And the portal is unreachable by most of the people who need it.** The portal is for members — signed in, terms accepted. A newsletter subscriber captured by a form is a `lead`, not a member, and cannot sign in at all. So they can never reach the portal to opt out. For marketing mail in an IE tenant that's not a nice-to-have: withdrawal has to be as easy as consent, without a login. Which means category 2 needs **two** surfaces:

- the portal, for members;
- a tokenised unsubscribe link in the mail footer, for everyone.

There is no unsubscribe mechanism anywhere in the codebase today. I'd argue the link is the *primary* surface and the portal is the convenience, not the other way round — and note the shape is the same capability-URL question as the hidden whitepaper page, so the two probably want one answer.

**Related, smaller:** an operator must be able to flip a category-2 acceptance when a contact phones up and asks. That means an acceptance change needs an **actor** — them, us, or the system. `contact_events` has no actor column (`id, contact_id, business_id, kind, occurred_at, recorded_at, ref, detail`), so it goes in `detail` or the table grows a column. Worth settling before we write events we can't attribute.

## Where that leaves the registry

An acceptance definition would carry, roughly: a key, a type (document / preference / request), the wording shown, and per-type extras — a document reference + version for type 1, portal visibility for type 2, a fulfilment action for type 3. Businesses pick from the system-defined set; custom keys later slot into the same registry.

Does that match what you have in mind? If so the open questions left on acceptances are: whether we open the portal's read-only contract, and where the boolean projection actually lives — `users.fields` won't work, since "everyone in this business with newsletter = true" is the query that sends the newsletter and D1 can't index into a JSON column.

<!-- xgd-turn id="7eb03108-c666-4d55-acc0-0af7686f3f89-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T20:59:15.617682+00:00" -->
#### You
1. Agreed
   2. Agree
   3. There is a third event - perhaps the most important - whitepapers_accessed - the link we send is to a page they have to go there and download the papers - we need to track that
   
   On the portal, we disagree. The portal cannot be read only that makes no sense. It is created to allow these things, it will also support managing the users subscriptions and so on.
   
   The user has to sign in to get to the portal yes. Users can also unsubscribe with the unsubscribe link in every email. That does not mean the user portal does not also give them that option.
   
   We don't have unsubscribe because we dont have mailing list functionality yet - you are overanticipating. Lets focus on what we have.
   
   an operator must be able to flip a category-2 acceptance when a contact phones up and asks <-- we currently have no plans for telephone support again over anticipation

<!-- xgd-turn id="7eb03108-c666-4d55-acc0-0af7686f3f89-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T21:00:02.499605+00:00" -->
#### Claude
Taking those corrections: the portal grows write capability deliberately — that's what it's for, and my framing of it as a contract violation was wrong. Unsubscribe and operator-initiated changes are both out of scope until there's a mailing list and a support channel to motivate them. The actor question dissolves with them: if every acceptance change is the contact's own act via a form or the portal, there's nothing to attribute yet.

## `whitepapers_accessed`

This is the substantive addition, and it settles something we left open.

To record an access as a contact event we have to know *which contact* followed the link. A single unguessable URL to an R2 object can't tell us — everyone who gets the mail gets the same link. So the link is **per-contact**, and that answers the hidden-page question from earlier: it's a capability URL minted per contact per asset, and the attribution is the reason, not a bonus.

That makes the hidden page a real route rather than a static published byte. Something has to resolve the token to a contact before serving — a `GET`, so it sits comfortably in `public-site`'s existing character.

Three decisions fall out:

**Does the link expire?** If it does, someone returning in six months has a dead link and no way back: delivery is at-most-once-ever and REQ-223 deliberately refuses a public re-send path. That cost is already accepted for the mail; extending it to the page makes it bite harder, because the page is the thing they actually came for. My inclination is no expiry — the token's value to an attacker is a whitepaper, and the tracking is worth more than the secrecy.

**Page view, or download?** You said they go there and download the papers — plural. Those are two different facts, and the second is much the stronger signal: a page view says the link worked, a download says they took something, and with two papers it says *which*. I'd record both, with the asset in the detail of the download. Do you want that, or is arriving on the page enough?

**Every access, or the first?** Events are facts, and "they came back three times" is a real sales signal. I'd record every one and let the funnel be a query over them rather than a storage decision — which is what the event spine is for.

## Where it sits

`whitepapers_accessed` isn't a fourth acceptance type. It's the fulfilment chain hanging off a type-3 request: the registry entry names the asset, and `requested → sent → accessed → downloaded` follows from it. The registry stays three types and doesn't need to know about the tail.

Still open from before, and the one place I think we have to decide before design: **where the boolean projection lives.** `users.fields` is the obvious home and won't work — "everyone in this business with `newsletter` true" is the query that eventually sends a newsletter, and D1 can't index into a JSON column. That points at a table, which is a schema change. Worth settling now since it shapes everything else.

Want me to write EPIC-10's body up to this point before we move on to the email and the module config?

<!-- xgd-turn id="fc25d876-98ad-4c3c-8f81-e416a95902bb-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T21:03:33.274613+00:00" -->
#### You
Do you want that, or is arriving on the page enough? <-- sorry we want everything - whether they accessed the page, how many times, how long they were there, whether they downloaded both papers or one of them the whole access pattern is really important

`whitepapers_accessed` isn't a fourth acceptance type. It's the fulfilment chain hanging off a type-3 request: <--correct, but I think it needs to show up in the contact event log

I actually think all user accesses need to show up in the event log - we want to know what the user is doing and how often etc

<!-- xgd-chat-end -->