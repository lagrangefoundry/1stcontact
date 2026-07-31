---
uid: comment-58c81db3
id: COMMENT-594
type: comment
title: Comment on chat CHAT-13
created_by: xgd
created_at: '2026-07-31T00:38:16.056694+00:00'
updated_at: '2026-07-31T00:52:23.254122+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-189287b8
  kind: chat_transcript
---

<!-- xgd-turn id="7387a055-2201-48ae-b442-0f6a19365d59-user" -->

<!-- xgd-chat role="user" ts="2026-07-31T00:38:14.027731+00:00" -->
#### You
We need to design an email capture capability module with a backend. The functionality is being discussed in the chat entitled "XGD website copy". 

We need a backend that can:
1. Store emails that are entered
2. Send out a preconfigured email message when an address is registered - in our case this will be a message giving access to the (hard to guess) urls of the white papers

<!-- xgd-turn id="4ef0b968-4124-4808-ba94-d3184fcb25e3-user" -->

<!-- xgd-chat role="user" ts="2026-07-31T00:39:12.046433+00:00" -->
#### You
We need to design an email capture capability module with a backend. The functionality is being discussed in the chat entitled "XGD website copy".

We need a backend that can:

1. Store emails that are entered
2. Send out a preconfigured email message when an address is registered - in our case this will be a message giving access to the (hard to guess) urls of the white papers

Eventually the backend will have some basic mailing list and CRM capabilities.

<!-- xgd-turn id="4ef0b968-4124-4808-ba94-d3184fcb25e3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-31T00:42:12.921153+00:00" -->
#### Claude
I'll dig into the existing context first — the referenced chat, the current whitepapers work, the contact-form module, and what backend infra exists.

Good context to work from — here's what I found, then the design.

## What already exists

| Piece | State |
|---|---|
| `contact-form` behavior module (v4) | **Done.** Field schema, no-JS `<form method=post>` baseline, JSON-`fetch` enhancement, honeypot. Already used with a single email field on `storage/sites/xgd/draft/pages/whitepapers.json`, posting to `/api/lead`. |
| `/api/lead` | **Does not exist.** `public-site` returns 405 for any non-GET (`apps/public-site/src/index.ts:39`). |
| D1 | **No bindings, no migrations.** `db/migrations/` is empty. |
| Turnstile | **Mount point only** — `index.astro:91` renders `<div data-turnstile-target>` but nothing loads the widget or verifies a token. Anti-spam today is honeypot-only. |
| The papers themselves | **Do not exist** as artifacts. CHAT-12 flags this; they're ticket bodies, no PDFs anywhere. |
| Form `action` | Not passed through `relativizeUrl` (it goes straight to `assertSafeUrl`), so `/api/lead` stays root-absolute and resolves to the serving origin. No REQ-109 bug here. |

## Recommendation 1: don't author a new behavior module

You asked for an "email capture capability module". I'd push back on that framing: `contact-form` with one email field **is** email capture. A new module would duplicate its entire vetted core — field schema, a11y label association, honeypot, no-JS baseline, JSON submit, isolation obligations — for zero new *kind* of behaviour. That's exactly the reflex CLAUDE.md's "close gaps in L1 / configure before authoring" rule exists to stop.

The genuinely new thing you're describing is **the backend**. There is exactly one real module gap in it:

- **A `checkbox` field type** for mailing-list consent. `config.fields.type` is `text|email|tel|textarea` (`meta.ts:48`). Consent is behavioural (it changes what is submitted and what the server is legally permitted to do with it), not aesthetic, so it's a legitimate `config` addition. Bumps the module to v5.

Everything else is server-side.

## Recommendation 2: the backend shape

**Where it lives.** `public-site`, per DOC-7 §10 ("public-facing endpoints live on the `public-site` Worker — form submission, magic-link initiation"). A POST branch ahead of the existing route grammar; `control-app` stays for authenticated surfaces.

**Endpoint identifies the form in the path**, not in module config:

```
POST /api/f/<site>/<form>      →  /api/f/xgd/whitepapers
```

The server looks up a `form_configs` row for that pair: expected fields, which email template fires, which list to join, whether Turnstile is required. That row is the "preconfigured" in "preconfigured email message" — and it means an unknown `<site>/<form>` is a 404, so the endpoint is **not an open send-to-anyone relay**. No module change needed; the site definition already carries the path.

**Schema (first migration).** The load-bearing split is immutable event vs mutable identity — it's what lets mailing list and CRM grow later without reshaping capture:

| Table | Role |
|---|---|
| `submissions` | One immutable row per POST: form, raw payload JSON, IP hash, UA, timestamp. Never updated. |
| `subscribers` | Identity, keyed by email. Status, first/last seen, source form. Mutable — this is the row that becomes a CRM lead. |
| `email_sends` | Audit + idempotency: template, recipient, provider message id, status, attempts. |
| `download_tokens` | Per-subscriber paper access (below). |
| *later* `lists` / `list_memberships` | Only ships now if the consent checkbox ships now. Carries `consented_at` + `consent_source` — the legal record. |

**Delivery.** Enqueue to a Cloudflare Queue, consume, send via HTTP provider, write `email_sends`. The Queue is ~15 lines and buys retry + DLQ; hand-rolling that with `waitUntil` plus a cron sweeper is more code and worse. Provider behind an `EmailProvider` interface — same seam pattern as `SiteStore`, so swapping it is one class. **Resend** for v1 (plain `fetch`, no SDK, Workers-native, good free tier); Postmark if transactional deliverability is worth paying more for.

**Prerequisite that blocks everything:** SPF/DKIM/DMARC on the sending domain. Nothing below works until that's done, and it's an operator action.

**Paper links.** Two shapes:

- *(a) One shared unguessable URL* — reuses the content-addressed pattern already in the route grammar, and matches DOC-12's declared "link-private, not authenticated" stance. Simplest. Leaks the moment one recipient forwards it.
- *(b) Per-subscriber token* — `download_tokens` row, email carries `/d/<token>`, worker validates and streams the R2 object (keeping the key private).

**I recommend (b).** It's one small table on top of ones you already need, and it gives you *who actually read the papers* — which is the entire reason to gate them on an address in the first place. Gate on email and then be unable to attribute a download, and you paid the conversion cost for nothing. It also makes "resend my link" a supported operation rather than a support conversation. Revocable, not expiring — a dead link on a paper someone asked for is a bad experience; revocation is the lever you actually want.

**Abuse.** An open POST that emails an arbitrary address is an email-bomb amplifier. Mitigations, in order of value: dedupe/rate-limit sends per address per form (also handles honest double-submits), rate-limit per IP, verify Turnstile server-side — which means finishing the widget wiring, since today it's a bare mount div.

**Consent vs transactional.** The paper delivery is transactional — the address proved itself by receiving it, so single opt-in is fine and no unsubscribe link is required. *List* mail is different: it needs the explicit checkbox, a stored consent record, and a token'd unsubscribe route. Don't conflate them.

## Open decisions I need from you

1. **Extend `contact-form` (my rec) or author a separate module?**
2. **Sending domain and provider** — `1stcontact.io`, a gendevlabs domain, or something else? Who does the DNS?
3. **Which host serves the XGD site?** If it ends up on a non-`1stcontact.io` domain served by a different worker, the root-absolute `/api/lead` action becomes cross-origin and needs CORS or a co-located endpoint. Worth settling before the endpoint path is baked into the site definition.
4. **Per-subscriber tokens or one shared URL?**
5. **Do the papers exist yet, and are they PDFs?** The delivery half can't be verified end-to-end without them — I can build against a placeholder, but flagging it as a gap rather than silently stubbing.
6. **Consent checkbox now or later?** Drives whether `lists`/`list_memberships` land in the first migration.

## Proposed ticket split

Rather than one large ticket, I'd suggest two — but I won't create anything until you say so:

- **REQ-α — lead capture backend**: D1 migration, `POST /api/f/<site>/<form>`, form-config lookup, dedupe + rate limit, Turnstile verification. ~8 pts.
- **REQ-β — transactional delivery + gated papers**: Queue, `EmailProvider` seam, template, `download_tokens` + `/d/<token>` route. ~8 pts.

Capture without delivery doesn't meet your stated ask, so β follows α closely — but they're separately shippable and separately testable, and bundling them makes one ~16pt ticket whose UATs are hard to keep coherent.

The checkbox change is small enough to fold into α if you want consent in the first cut; otherwise it's a third small ticket later.

Which of the six decisions do you want to settle first?

<!-- xgd-turn id="ab9e64b8-09c0-4625-b205-0a82447c19e5-user" -->

<!-- xgd-chat role="user" ts="2026-07-31T00:52:23.225428+00:00" -->
#### You
We need the ability to add and collect the results of multiple checkboxes (1) we need mailing list consent (2) interest in the closed beta (3) there might be T&Cs too - can we make the module flexible?

Abuse - could every load of the form contain a new SHA that works one time and expires? That would simplify things no?

1. Yes absolutely
2. The email must come from the site - in this case xgd.dev
3. 1stcontact is the website builder, sites are drafted there and then published to their own domains
5. yes DOC-4 and DOC-5 in ../xgd-biz

<!-- xgd-chat-end -->