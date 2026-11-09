---
uid: story-f2e5032c
id: STORY-177
type: story
title: 'Public forms accept a submission: anonymous lead capture with asset delivery
  and anti-abuse controls'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:28:58.988888+00:00'
updated_at: '2026-11-09T00:28:58.988888+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-7ba3af93
  capability_uid: capability-e5939ceb
  story_kind: feature
  story_points: 3
---

## Story
**As a** visitor to a business's published site, **I want** to submit one of its public forms (a waitlist, a beta application, a "send me the papers" request) without signing in, **so that** my address and what I wrote reach that business's contact list, and any asset the form promised arrives in my inbox. **As the** business and the platform, **we want** that endpoint to be useless for mailing strangers, probing who is already a contact, flooding a contact list, or burning the sending domain's reputation.

## Description
Before REQ-223 every public form in the product posted to an endpoint that had never existed. This story covers the capability that now exists: an anonymous visitor writing into one tenant's contact database through a form on that tenant's published site.

In scope:
- **The endpoint.** A same-origin `POST /api/lead` on the published site: the bare path for the apex site and `/site/<siteKey>/api/lead` for a keyed site. It accepts a JSON submission (the upgraded form) and a native form POST (no JavaScript).
- **Which tenant.** The tenant is taken from the request URL and never from the body.
- **What is written.** One contact at the `lead` stage per (tenant, address). Each submission adds one append-only provenance event: site, page, form instance, submit label, the other answers, and every declared consent checkbox with its wording and answer. Authored values are read from the site's live published definition.
- **Controls.** Body and field limits, a rate limit keyed on site and source IP, a honeypot, and server-side Turnstile verification. Any missing configuration fails closed.
- **The acknowledgement.** Every outcome that depends on who submitted answers one frozen acknowledgement, byte for byte. Malformed or unverified submissions are refused instead.
- **Asset delivery.** A form that declares an asset sends it at most once, ever, per address, through the platform's existing recorded-mail path. An address with a bounced or complained message is never sent to.
- **The internal seam.** The write is handed to the control app over a service binding to a named RPC entrypoint, and no URL reaches it.
- **Form surface.** `contact-form` gains a `checkbox` field type and a per-mount instance handle. The Turnstile sitekey and widget are stamped onto served pages at serve time. The edit render still cannot post.

Out of scope (REQ-223 §9): notifying the business owner, AI spam detection and reputation checks, the whitepaper PDFs themselves, fixing production sign-in, and a builder UI for a form's `action`. A public re-send path is deliberately excluded (§5). The `complained` message status and webhook mapping, and the amendment of the published-site server's read-only rule, are covered by plan item 8 (STORY-169 / STORY-95 upgrades), not here.

## Technical Context
- **Architecture.** DOC-5 rules 22–23: public forms need no login, and spam is handled by Turnstile, rate limiting and honeypot. AI spam detection and reputation checks are named out of scope, so their absence is a decision. Rule 11: this is the narrow dynamic endpoint the public site is allowed. Rule 34: lead capture is one of the two named exceptions to "a published site never depends on compute".
- **Reuse, unchanged.** Person creation goes through the one definition of how a person enters a tenant (CAP-114 `addContact`: AC-1743, AC-1744, AC-2336), so it is idempotent on (tenant, email) and lands at `pipeline_stage = 'lead'`. The submission is recorded as a contact event (append-only: AC-2258, AC-2263, AC-2264) under a new dotted kind with its label, plus a separate asset-sent kind. The path is resolved by the existing route grammar (AC-2244, AC-2333). Delivery uses the existing mail port, templates (an `asset` template) and message record, so a delivered asset appears in the contact's history beside invites.
- **Ownership.** Every existing add-contact path (STORY-146/165) is owner-only behind Access (AC-2172). This story is the first anonymous write, which is why it is a feature and not an upgrade.
- **Related.** STORY-169 (message status vocabulary, email webhook) and STORY-95 (published-site serving, AC-912) are upgraded by plan item 8 to add `complained` and the single POST exception. STORY-85 owns the behavior-module framework that `contact-form` lives in.
- **Policy tension to flag (not a code issue).** Security Policy §5 says a published site ships no third-party script except Stripe.js on the checkout page. REQ-223 §6 explicitly and deliberately adds Cloudflare's Turnstile script from `challenges.cloudflare.com` on pages carrying a form. The operator's request is the intent and the code follows it, so the Security Policy document needs a second named exception. That is a documentation follow-up, not a defect for regression to fix.

## Reconciliation Decisions
- **Unknown site and submissions with no address** (decided at reconciliation, 2026-11-08). REQ-223 §2/§8.2 lists five indistinguishable outcomes and is silent on a site key that names no site, or a submission carrying no email-shaped value. The code writes nothing in both cases and still answers the frozen acknowledgement. This follows the same rule (the response must not reveal anything about tenants or addresses), so it is formalized as part of the frozen-acknowledgement AC and the provenance/no-write ACs.
- **Two classes of response** (decided at reconciliation, 2026-11-08). Intent says identity-dependent outcomes are indistinguishable, and that a missing or invalid Turnstile token and oversized bodies are *refused*. The code draws the line exactly there: refusals (415 wrong content type, 413/400 limits, 400 missing token, 403 failed verification, 503 unconfigured or unwritable) are visibly different from the acknowledgement, because a malformed request tells the caller nothing about anybody. Formalized as separate refusal ACs.
- **Unwritable deployment fails closed** (decided at reconciliation, 2026-11-08). Intent says absent Turnstile configuration fails closed and is silent on a missing service binding, a missing or erroring rate limiter, or the write throwing. The code answers 503 in each case rather than thanking a visitor whose address was dropped (the DOC-47 failure). Formalized as its own AC.
- **"Refused before the body is parsed"** (§8.10, decided at reconciliation, 2026-11-08). Taken literally, a field count cannot be checked before parsing. The code refuses a declared over-size body (8 KiB) without reading it, and also refuses after a bounded read for chunked bodies. Field count (24) and per-field length (4000 bytes) are checked immediately after parsing, before any rate-limit, verification or write. The AC states this ordering, not an impossible one. The intent is satisfied: nothing large is processed and nothing is written.
- **Control order** (decided at reconciliation, 2026-11-08). Intent names the controls but not their order. The code runs shape, then size, then rate, then honeypot, then Turnstile, so a honeypot hit never spends a siteverify call. Formalized as: a filled honeypot is acknowledged without contacting the verifier.
- **Authored values come from the live published revision** (decided at reconciliation, 2026-11-08). §7 requires storing "the wording the visitor was shown". The code reads consent wording, submit label, page and asset from the site's live published definition by form-instance handle, never from the request, so a caller cannot assert a wording or an asset. Every declared checkbox is recorded, ticked or not (an unticked box submits nothing), and the address is not repeated in the answers bag. Reserved wire fields (honeypot, Turnstile token, instance handle) are not stored. Formalized in the provenance AC.
- **A body field naming a tenant is stored as an answer** (decided at reconciliation, 2026-11-08). §8.5 says such a field "is ignored" for routing. The code ignores it for routing and keeps it as one more thing the visitor typed (§4: extra fields must not be dropped). Formalized that way.
- **Half-declared asset** (decided at reconciliation, 2026-11-08). Intent is silent. A form with an asset key but no URL, or a URL but no key, is treated as promising nothing, because at-most-once needs a key to remember and delivery needs a URL. Formalized in the asset-delivery AC.
- **Apex endpoint with no apex site** (decided at reconciliation, 2026-11-08). Intent is silent. A deployment with no apex site answers a bare `POST /api/lead` with the ordinary 405, the same as any other path.
- **Unconfigured sitekey serves the published page unchanged** (decided at reconciliation, 2026-11-08). The refusal happens loudly at the endpoint (fail closed), not by altering the page.
- **Capability placement** (plan open assumption). Placed in CAP-114 (capability-e5939ceb) because the substance is the identity write. The checkbox and Turnstile form-surface ACs are folded in as the consent and anti-spam half of the same capability per REQ-223 §7. They could move to STORY-85 without other change.

## Dependencies
None.

## Story Points
3
