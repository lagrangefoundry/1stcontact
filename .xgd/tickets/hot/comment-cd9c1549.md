---
uid: comment-cd9c1549
id: COMMENT-2884
type: comment
title: Comment on epic EPIC-10
created_by: xgd
created_at: '2026-09-13T00:19:33.278873+00:00'
updated_at: '2026-09-13T00:23:37.292261+00:00'
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

<!-- xgd-chat-end -->