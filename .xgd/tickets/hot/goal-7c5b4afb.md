---
uid: goal-7c5b4afb
id: GOAL-50
type: goal
title: 1c Beta Ready
created_by: xgd
created_at: '2026-09-18T19:34:07.801448+00:00'
updated_at: '2026-10-31T00:46:48.255109+00:00'
completed_at: null
last_field_updated: children
status: underway
fields:
  provenance: planned
  children:
  - goal-ea2db3b7
  - goal-f6704841
  - goal-4fbdf71e
  - goal-d976334c
  - goal-f3141c51
  - todo-3c78b018
  - todo-d61dcb04
  workstream: false
  chat_comment: comment-7796efec
---

Bring 1st Contact to the point where beta testers can use it and give feedback.

This replaces [[GOAL-1]] (1stcontact app) as the organising root. GOAL-1 was a description of the product, not a finishable objective -- it could never be closed, so it could never say whether anything was progressing. Beta Ready can be closed.

Three parts, from the operator breakdown of 2026-09-18:

1. **Live and updatable** -- site and app published on Cloudflare, test and deploy flows understood, sign-in/sign-up tested. Straightforward, and satisfying to finish.
2. **Core web dev experience tested and effective** -- where most of the time goes. Build out Lagrange Foundry, the teaser site, xgd, and example sites from scratch; every friction found becomes an [[EPIC-19]] child.
3. **Supporting functionality sufficient and tested** -- DNS migration, basic test, monitoring, logging, deployment. Not blocking the start of beta; not far behind it either.

No target_date yet. The three sub-goals are marked as workstreams, which is the daily resolution the operator actually works at.


## Beta launch checks (operator, 2026-10-29)

These are manual end-to-end tests the operator runs in production before the first invite. Tick a box when a run passes, and note the date and anything it turned up. A failure becomes a ticket under the epic that owns that surface.

- [ ] **1. Sign-in from a cold start.** Use a brand-new email that has never touched 1c, and ideally a phone. Go invite email → magic link → terms → starter business → builder. Check: the mail lands in the inbox and not spam; a link opened on another device; an expired or reused link.
- [ ] **2. End-to-end site creation in production.** One full build from an empty site through to publishing on an internal domain (a 1stc.site subdomain). Check the published site on a phone and that its contact form delivers a lead.
- [ ] **3. Deploy during a live build.** During run 2, run `bin/deploy --env production` while a builder turn is in flight. Record what the tester sees: whether the turn completes, errors or hangs, and whether the chat recovers on reload. This decides whether fixes can ship during beta sessions or only in quiet windows.
- [ ] **4. Beta invite (re-test).** Invite a tester from the console and follow the email through to their first turn.

## Kill switches (as found in code, 2026-10-29)

- **One person:** People tab → status not `active` (`/api/people/status`). This ends their sessions at once (`people.ts` `endSessionsFor`), and `admit` refuses them afterwards (`user_inactive`). Not verified: whether a builder turn already in flight runs to completion.
- **One business:** revoke its grant (`/api/grants/revoke`). The person is still admitted but has nothing selectable.
- **All AI:** no flag exists in the product. Options without a code deploy: disable the key or set a spend limit in the Anthropic console (also a hard cost ceiling), or `wrangler secret delete ANTHROPIC_API_KEY --env production` (the builder then shows its "no key" message).
- **Who can create businesses:** only the operator. Builder sign-in (`admit`, `identity.ts`) reads users from the platform tenant alone. So only Level 1 people, whom the operator invites from the console, can accept the terms and get a starter business (REQ-203). Contacts that a tester invites belong to the tester's own business and can never reach the builder.


Tracked as operator todos: 1 → [[TODO-13]], 2 → [[TODO-14]], 3 → [[TODO-15]], 4 → [[TODO-16]].

## Folded-in goals from the old GOAL-1 map (2026-10-30)

GOAL-1 was abandoned when this goal replaced it. Its still-open children were reviewed and the ones beta depends on now sit here.

### [[GOAL-2]] Site: the chat-based website builder

The chat-based website builder is the platform's main interface (DOC-4 MVP item 2). Users build and change their site by talking to it, with a chat window beside a live preview, and onboarding is part website creation, part business consultation.
- **State:** built and in daily use, and it is what testers use. The goal's body predates this: it still says the builder comes after the flagship sites (DOC-16 §4). That order has now been followed.
- **Overlap:** the active work now runs through [[GOAL-48]] and [[EPIC-19]]. GOAL-2's children ([[GOAL-16]] web editor, [[GOAL-17]] editor chat, [[GOAL-18]] email capture backend, [[GOAL-19]] debugging, [[GOAL-20]] deployment) are older names for work now tracked under EPIC-19, REQ-223 (lead capture), [[EPIC-22]] (Debug tab) and [[EPIC-16]] (Deployment).
- **Beta:** yes. This is the product under test.

### [[GOAL-4]] CRM

CRM Lite tracks leads and customer interactions (DOC-4 MVP item 3, DOC-5), in D1, with Leads, Customers, Follow-ups, Conversations, Quotes and Invoices as the user's concepts. It is not an enterprise CRM.
- **State:** much more is built than its body says ("no code exists"). The People tab, contacts and contact detail, lead capture from public forms (REQ-223, `lead.ts`), document acceptances (REQ-240, the Agreements section) and the contact activity log ([[EPIC-11]]) all exist.
- **Not built:** the DOC-4 lead lifecycle (New Inquiry → Contacted → Quote Needed → Quote Sent → Follow Up → Booked → Lost → Archived). People has a locked "Pipeline" column with no stages behind it yet. Quotes and invoices belong to Payments ([[GOAL-5]], under [[GOAL-54]]).
- **Beta:** yes, for what exists. A contact form delivering a lead into People is part of launch check 2 ([[TODO-14]]). The lead pipeline is not needed for beta. CRM data export and deletion are launch blockers on GOAL-54 (items 2 and 6).

### Not moved here

- [[GOAL-7]] XGD website is already under [[GOAL-48]].
- GOAL-8 and GOAL-9 do not exist.

## Open operator to-dos reviewed for beta (2026-10-30)

### [[TODO-5]] Resend setup: what is left
Resend went live on 2026-09-07 (SPF, DKIM, DMARC `p=none`, Email Routing). TODO-5 lists three things still open, none re-checked since then:
- **Before beta:** rewrite 1st Contact's own `invite` template. It should name the inviter and the product, say what 1st Contact is, carry a signature and have a footer. This is the first thing a tester reads, and launch check 4 ([[TODO-16]]) re-tests it.
- **Before launch:** register `1stcontact.io` in Google Postmaster Tools. Move DMARC to `p=quarantine` once the reports show clean alignment.

### [[TODO-6]] 1stc.site housekeeping: what is left
Checked on 2026-10-30. **Done:** a wildcard `*.1stc.site` record resolves. The reserved-label groups are in code (`hostname.ts`). A database unique index decides who gets a label. Revocation exists (REQ-238).
- **Before beta (lead time):** submit `1stc.site` to the Public Suffix List. It is not on the list today. Acceptance takes weeks and browsers pick the list up a release or two later. Testers' sites will be siblings under one cookie boundary until it lands. That is acceptable with invited testers, but not with the public.
- **Before launch:**
  - Add a CAA record (none exists).
  - Confirm registrar lock, auto-renew, WHOIS privacy and company ownership (not checked).
  - Decide that a custom domain 301-redirects the label (§4).
  - Add a rate limit or other gate on label claims against squatting. During beta only invited people can claim a label, so squatting is not a beta risk.
