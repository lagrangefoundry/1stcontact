---
uid: comment-58c81db3
id: COMMENT-594
type: comment
title: Comment on chat CHAT-13
created_by: xgd
created_at: '2026-07-31T00:38:16.056694+00:00'
updated_at: '2026-07-31T01:11:41.050366+00:00'
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

<!-- xgd-turn id="a743940b-fd5c-461e-9ed9-59e409d59c89-user" -->

<!-- xgd-chat role="user" ts="2026-07-31T00:53:22.082943+00:00" -->
#### You
We need the ability to add and collect the results of multiple checkboxes (1) we need mailing list consent (2) interest in the closed beta (3) there might be T&Cs too - can we make the module flexible?

Abuse - could every load of the form contain a new SHA that works one time and expires? That would simplify things no?

1. Yes absolutely
2. The email must come from the site - in this case xgd.dev
3. 1stcontact is the website builder, sites are drafted there and then published to their own domains
   4. per subscriber
   
   1. yes DOC-4 and DOC-5 in ../xgd-biz
      6. Per above checkbox config required - we can discuss the details

<!-- xgd-turn id="a743940b-fd5c-461e-9ed9-59e409d59c89-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-31T00:56:30.395695+00:00" -->
#### Claude
Let me check the papers and the custom-domain path, since point 3 changes the architecture materially.

Good answers — several of these change the shape more than the checkboxes do. Taking them in order of impact.

## Checkboxes: yes, and the module barely has to change

Rendering and submission are identical for all three of your cases. What differs is *server-side meaning*. So the module stays dumb and the meaning lives in the form config.

**Module change (→ v5), the whole of it:**
- Add `'checkbox'` to the `fields.type` enum (`meta.ts:48`).
- It renders as a `control` node like every other field — L1 owns the look entirely.
- `required: true` already means "must be checked" in HTML. That's your T&Cs gate, no new config.
- Reject `labelMode: 'placeholder'` for checkboxes — there's no placeholder attribute on a checkbox. Forcing `visible` is right anyway: these labels are sentences that usually contain a link ("I accept the [Terms]"), and `visible` means the words are an authored L1 text run, so the link is authorable.

That gives you N checkboxes, any names, any labels, any required-ness, purely from `config.fields`. No new config surface at all.

**What deliberately stays out of the module:** the meaning. "This box grants marketing consent", "that one is terms v3", "that one is a beta segment" — all server-side, keyed by field name. Three reasons:

1. The site definition renders to a **public static snapshot**. Declaring "this checkbox grants consent" there is both leaky and unenforceable — the server has to decide regardless.
2. T&Cs need the **terms version recorded at consent time**, and that version changes independently of the page. A stale cached page must not record consent to terms the visitor never saw.
3. It keeps `config` data-only per DOC-25 §2. A `consent: true` flag in the module would be a promise the module can't keep.

**Server-side semantics** — a small typed enum per field in `form_configs`:

| kind | Effect |
|---|---|
| `list_consent` | Insert `list_memberships` with `consented_at`, `consent_source`, IP/UA. Unchecked → no row, ever. No soft opt-in. |
| `interest` | Set a segment flag on the subscriber (`beta_interest`). Not consent — carries no mailing rights. |
| `terms` | Record `terms_accepted(subscriber, version, at)`. Server rejects if the configured terms box is absent/false; the client `required` is a UX affordance, never the enforcement. |

One trap worth naming now: **an unchecked checkbox is omitted entirely from `FormData`**, so the key is simply absent from the JSON. `client.js:65` already serializes that way. The server must treat absent as `false` and must never distinguish the two.

## The nonce: it helps, but there's a catch specific to this system

**The catch:** pages are static snapshots served from R2 and edge-cached (`IMMUTABLE_CACHE`, `apps/public-site/src/index.ts:23`). A SHA baked in at render time is baked into the *cached artifact* — every visitor gets the same one, so "works one time" means the first submitter burns it for everyone. Self-DoS.

So it has to be **fetched at runtime**, not rendered: `GET /api/f/<site>/<form>/nonce`, called by `client.js` on load. That works, and I'd do it. Two notes:

- **Make it stateless.** Don't store issued nonces — sign them: `HMAC(secret, form_id ‖ issued_at ‖ ip_prefix)`, verify signature and freshness. Single-use then needs only a small KV set of *spent* nonces with a TTL matching the window, rather than a row per issue.
- **It requires JS**, and the no-JS `<form method=post>` baseline is a vetted module obligation. I'd keep the baseline and treat "valid nonce" as a *trust signal that relaxes rate limits*, not a hard gate — otherwise the obligation breaks.

**But it doesn't simplify away the control that matters most.** A fresh nonce still buys one email to an attacker-chosen address, so it does nothing about amplification. Per-address send dedupe is what kills that, and it's *simpler* than the nonce — one index, one check.

Recommended v1 stack, cheapest first: **per-address dedupe** → **honeypot** (shipped) → **stateless HMAC nonce** → **IP-prefix rate limit**. And **Turnstile drops out of v1** — it's an unwired mount div today and it taxes conversion on your primary capture form. Keep it as the escalation lever; the mount point is already there.

So yes: your idea does simplify things, just not in the place you expected. It buys us deferring Turnstile, which was the expensive part.

## "From xgd.dev" is the big one

This reshapes more than the rest combined.

- Each published site needs its **own verified sending identity** on a domain the *customer* controls — SPF/DKIM/DMARC on xgd.dev's DNS.
- Resend and Postmark both do multi-domain with a provisioning API, so 1stcontact can create the domain, surface the exact records, and poll for verification. **That's a builder feature** — "add these three records to your domain" is a screen someone has to build — not a detail of this endpoint.
- Needs `site_email_identities`: from address, from name, reply-to, provider domain id, verified status.
- **Fail visibly when unverified.** Don't silently fall back to a 1stcontact-owned sender — it trains people to skip setup and it poisons your shared domain reputation.
- **Download links must be on xgd.dev too.** An email from `hello@xgd.dev` linking to `1stcontact.io/d/<token>` reads as phishing and will get filtered. So `/d/<token>` is a route on the published site's host.

**Which surfaces a prerequisite gap I should flag rather than assume past:** `parseRoute` is pathname-only and requires `/site/<slug>/…` (`apps/public-site/src/routes.ts:104`). There is **no host→slug mapping**, and no ticket for one — REQ-110/111 cover R2 and serving, nothing covers custom domains. Sites publishing to their own domains isn't implemented yet.

The good news: it's a **release** dependency, not a **build** dependency. Since the site is in the path (`/api/f/xgd/whitepapers`), the endpoint code is host-agnostic — it works at `1stcontact.io/site/xgd/` today and at `xgd.dev` unchanged once custom domains land. Only the end-to-end demo on xgd.dev is gated.

## One thing I couldn't verify

The `xgd` CLI pins its workspace — running it from `../xgd-biz` prints `→ Changed to XGD workspace: /Users/martin/Projects/1stcontact` and returns *this* repo's tickets. So I couldn't read xgd-biz's DOC-4/DOC-5, and I'm not switching your active workspace to do it. Note that this repo's DOC-4/DOC-5 are "Webcaretaker" and "Gendev Website Caretaker Architecture" — product/architecture docs for the builder, whereas CHAT-12 describes the papers as being about the structural wall and XGD-as-governor. Possibly different tickets with the same numbers in the other store.

It doesn't block the design — delivery is the same either way. What I do need eventually: are they **markdown ticket bodies needing a render-to-PDF step**, or already-built PDFs I just put in R2?

## Proposed tickets

Three, with the checkbox folded in rather than standing alone:

| Ticket | Scope | Pts |
|---|---|---|
| **REQ-α — capture backend + checkbox** | D1 migration, `POST /api/f/<site>/<form>`, form-config lookup, checkbox field type (module v5), consent/terms/interest semantics, nonce + dedupe + rate limit | ~10 |
| **REQ-β — sending identity + delivery** | `site_email_identities`, provider seam, domain provisioning + verification, Queue, templates, `download_tokens`, `/d/<token>` | ~10 |
| **REQ-γ — custom-domain routing** | host→slug resolution in public-site | ~5 |

γ is a separate concern that publishing needs anyway — I'd file it even if email never happened, and it doesn't block α or β.

Want me to create α and β now and start on α? And should γ be filed as a standalone request, or do you already have that planned elsewhere?

<!-- xgd-turn id="7f73783a-0bfc-4db6-b296-42b8a5b90a28-user" -->

<!-- xgd-chat role="user" ts="2026-07-31T01:10:32.467068+00:00" -->
#### You
please explain γ

<!-- xgd-turn id="7f73783a-0bfc-4db6-b296-42b8a5b90a28-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-31T01:11:41.022341+00:00" -->
#### Claude
Confirmed it's an anticipated follow-on, not something I invented: DOC-12 §163 says subdomain and custom-domain serving are "later and additive", and REQ-111's Non-goals list "No custom domains, no subdomain routing, no D1." So the design already expects γ — nobody's filed it.

## What γ is

Today `public-site` decides which site to serve **entirely from the pathname**. `parseRoute(url.pathname)` never reads the hostname (`apps/public-site/src/index.ts:79`), and the grammar requires `/site/<slug>/…`:

```
1stcontact.io/site/xgd/whitepapers.html   →  serves the xgd site      ✓
xgd.dev/whitepapers.html                  →  parts[0] !== 'site'      ✗ not-found
```

The wildcard route `*.1stcontact.io/*` is already declared in `wrangler.toml`, but xgd.dev isn't in it at all — and even if it were, the path grammar would reject every URL. So "sites published to their own domains" currently has no mechanism.

γ adds two things:

**1. A host→slug mapping.** `xgd.dev` → slug `xgd`. I'd put it behind the existing `SiteStore` seam as a `slugForHost(host)` method — that seam exists precisely so "no other part of the Worker knows where the truth lives" (`site-store.ts:9`), so an R2 reverse-index now (`domains/<host>.json`, mirroring `manifestKey`) and a D1 `site_domains` table later costs one class. If α lands first, it can go straight to D1.

**2. A root-relative route grammar for custom-domain hosts.** On its own domain the site lives at the root: `xgd.dev/` → `index.html`, `xgd.dev/whitepapers.html` → that page, no `/site/<slug>` prefix. Drafts would need `xgd.dev/draft/<sha>/…`, making `draft` a reserved top-level segment there too — which deploy already enforces via `assertNoReservedSegment`.

## Why it's ~5 points and not a one-liner

The routing change itself is small. The surrounding work isn't:

- **TLS is the real cost.** Cloudflare has to terminate HTTPS for a domain in someone else's account. That's **Cloudflare for SaaS / Custom Hostnames**: call the API to register the hostname, the customer adds a CNAME, Cloudflare issues the cert, you poll until verified and surface the state. Worth noticing that this is **structurally the same workflow as β's email-domain verification** — customer adds DNS records, we poll, we show status. Two instances of one mechanism; they should probably share it.
- **Apex CNAME.** `xgd.dev` at the apex needs CNAME flattening or an A record — the usual wrinkle, and it's the customer's DNS, not yours.
- **The `apex` route branch becomes host-dependent.** Today `/` returns the `APEX_BODY` placeholder. After γ, `/` means "marketing site" on 1stcontact.io and "the customer's home page" on xgd.dev.
- **Reserved hosts.** A customer must not be able to claim a hostname that shadows `app.1stcontact.io` or the apex.
- **A decision, not a given:** do draft previews exist on custom domains at all? I'd argue no — drafts are a builder concern, and serving unfinished work on the customer's brand is a downside with no upside. Keeping drafts on 1stcontact.io simplifies the grammar too.

## Why it's separate from the email tickets

Two reasons.

**It's needed for publishing regardless.** The product is "sites published to their own domains." Today none can be. This ticket exists whether or not email capture ever ships — bundling it into an email ticket would hide a core publishing capability inside a feature ticket.

**But it doesn't block α or β.** This was deliberate in the endpoint design: the site is in the *path* (`/api/f/xgd/whitepapers`), not derived from the host, so the endpoint behaves identically on both hosts and needs no change when γ lands. What's gated is only the end-to-end demo — you can't actually send from `hello@xgd.dev` with links to `xgd.dev/d/<token>` until xgd.dev serves anything.

One payoff worth naming: γ is what keeps the form and its endpoint **same-origin**. Without it, a form on xgd.dev posting to 1stcontact.io is a cross-origin POST needing CORS — more moving parts and a worse security posture. With it, there's no CORS story at all.

## So the ordering is

α and β can start now and be verified against `1stcontact.io/site/xgd/`. γ is what flips the whole thing onto xgd.dev at the end — and if it slips, α and β still ship and still work, just on the builder domain.

Shall I file all three and start on α? If you'd rather keep the ticket count down, γ is the one I'd defer filing — though I'd rather file it than leave a known publishing gap untracked.

<!-- xgd-chat-end -->