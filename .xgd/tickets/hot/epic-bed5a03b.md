---
uid: epic-bed5a03b
id: EPIC-17
type: epic
title: Security Analysis
created_by: martin-github@westhead.me
created_at: '2026-09-17T19:33:30.327185+00:00'
updated_at: '2026-09-17T21:15:24.100209+00:00'
completed_at: null
last_field_updated: body
status: ongoing
fields:
  priority: medium
  chat_comment: comment-808ab9c9
---

## What this is

A standing threat model for 1st Contact: the assets worth protecting, the
boundaries an attacker has to cross to reach them, what stands in the way today,
and what does not. It is a *living matrix*, revisited periodically and at the
design time of each epic — not a one-off audit.

It is deliberately started **ahead of need**. The product is small enough today
that a finding is a design decision; after a paying customer and a live mail
path, the same finding is a migration.

**Scope.** The whole platform. [[DOC-2]] covers one boundary well — site
definition → render, structured-only, validated by construction — and says
explicitly that platform concerns are out of its scope. This is that scope.

### Method, and why this shape

Four passes, in this order, because each one bounds the next:

1. **Assets first.** A threat matrix built from a vulnerability checklist
   produces a long list of equally-weighted rows. Built from *what would be
   worst to lose*, it produces a short ranked one.
2. **Walk the boundaries.** Every place a less-trusted party hands data or a
   request to a more-trusted one. For each, ask STRIDE as a prompt-list
   (spoofing, tampering, repudiation, disclosure, denial, elevation) — not as a
   taxonomy to fill in.
3. **The AI lens, as two tables not one.** Prompt injection is not a single
   threat; it is a product of two independent things: **where untrusted text can
   reach the model's context** (entry) × **what a turn is allowed to do**
   (authority). A row in either table is only as bad as the other table makes
   it. This split is what makes the AI surface tractable, and it is how the
   mitigations divide: you cannot reliably stop injection, so you bound
   authority.
4. **Then the future epics**, at design time, where a control is still free.

**A row is closed by evidence, not by assertion** — the same standard the rest
of the project holds itself to ([[DOC-2]] §4). "Covered" below means there is a
control *in the code*, cited; where a control is claimed by a docstring and not
yet by a test, the row says so.

### The severity column

Impact × likelihood **at current exposure**, and current exposure is unusual:
the builder is behind Cloudflare Access and admission is invite-only, so most
rows have an authenticated, known party on the wrong side of them. Where a row
gets materially worse at GA — or the moment uploads become anonymous — it says
`Now → Later`.

---

## 1. What we are protecting, ranked

| # | Asset | Why it ranks here |
|---|---|---|
| A1 | **A customer's working mail** | [[EPIC-13]]'s own principle: a site outage is visible and survivable; an email outage is invisible, total, and the fastest way to lose a business permanently. Nothing else on this list can end a customer's trade. |
| A2 | **Control of a customer's domain** (NS, MX, SPF/DKIM/DMARC) | Our Cloudflare token will be able to rewrite a customer's zone. Whoever holds it can intercept their mail and impersonate them. Highest-impact single compromise in the product. |
| A3 | **Contact PII, and the business's own record** | Contacts, correspondence, the engagement ledger. We are processor, the business is controller ([[DOC-37]]). Cross-tenant leakage is the unrecoverable version. |
| A4 | **Session and account integrity** | A session in the builder is authority over everything else on this list, including the assistant. |
| A5 | **Published-site integrity** | Defacement of a business's front door; and script on their origin reaches their visitors. |
| A6 | **Sending reputation** (ours, shared across all businesses) | One abusive sender on shared infrastructure degrades deliverability for every customer. Slow to lose, very slow to regain. |
| A7 | **The global `1stc.site` namespace** | First-come, final, never re-issued ([[DOC-45]] §7). A burned label is burned permanently. |
| A8 | **Platform credentials** (model providers, ESP, Cloudflare, Stripe) | Bearer credentials to paid APIs; unbounded spend and impersonation. |
| A9 | **Availability and cost** | AI turns and browser renders cost real money per call. |
| A10 | **The cross-client corpus** | The one place one client's material could reach another client's session ([[DOC-15]], `exportable`). |

---

## 2. Actors and boundaries

```
  anonymous internet
        │                                      ┌─ inbound email (EPIC-13, not built)
        ├── published site (public-site) ───────┤
        │     /api/lead, gated assets          └─ form attachments (not built)
        │
        ├── pre-gate control-app routes: /sign-in ×4, /api/email/webhook
        │
        └── Cloudflare Access edge  ← identity-only: anyone with an email passes
                    │
                    ▼
          control-app (the builder)  ── authorization is `admit` + `requireScope`,
                    │                     NOT the Access gate (identity.ts)
                    ├── client (invited, one or more businesses)
                    ├── platform operator (owner of the platform business, BREAK_GLASS)
                    └── the assistant  ── consultant role · settings role
                             │
                             ├── tool authority (l1, fidelity, settings, library, …)
                             └── context intake (chat, uploads, fetched web, captures, KB)
```

Two properties of this picture are load-bearing and easy to forget:

- **The Access gate is not the authorization boundary.** The policy is
  identity-only, so passing it means "someone with an email address", not
  "someone entitled". `identity.ts` says this outright: *"The Access edge stopped
  being the authorisation boundary the moment that policy was set; this file is
  where the boundary moved to."* Any route that treats past-the-gate as
  authorized is a hole (see F5).
- **The draft preview iframe is same-origin with the builder** by construction
  (`builder/page-style.js:14`, `builder/api.js:103`). So site content is not
  sandboxed away from the session that authors it (see F1).

---

## 3. The matrix

### 3.1 Anonymous internet → published site (`public-site`)

| ID | Threat | Vector | Controls today | Residual | Sev | Status |
|---|---|---|---|---|---|---|
| PUB-1 | Lead-capture flood / contact-list pollution | `POST /api/lead` | Ordered cheapest-first: shape, size, Cloudflare rate limit keyed `site:ip`, honeypot, Turnstile — all **fail-closed** (missing secret or limiter ⇒ 503, not open); `verifyTurnstile` treats a network failure as a refusal (`public-site/src/lead.ts:405-452`) | Distributed sources; see PUB-6 | L | Covered |
| PUB-2 | Cross-tenant retargeting — post into another business's contact list | forged `action` / body field naming a tenant | Site key is resolved from the path by the route grammar and never read from the body (`lead.ts:344`); write handed to control-app over a service binding | — | — | Covered |
| PUB-3 | Contact / asset enumeration via response differences | probing `/api/lead`, gated-asset links | One frozen acknowledgement for every outcome; every gate refusal is `null` (`public-site/src/gate.ts`) | — | — | Covered |
| PUB-4 | Sideways use of a per-contact asset link | valid token presented under another site's key | Token names the contact, grant names site + form; the URL's site key is checked *against* the grant, not trusted by it | — | — | Covered |
| PUB-5 | Path traversal / key injection in served bytes | crafted path | Grammar is a pure function of the pathname, tested; the site key is the only untrusted component reaching an R2 key (`site-store.ts:225`) | — | — | Covered |
| PUB-6 | **Stored XSS on a customer's own origin via an uploaded asset** | upload `.svg`/`.html` → promote to site asset → served same-origin | `validateSvg` exists and is **only** called on the AI-authored drawing path (`cli/edit.ts:2866`). `promoteToSiteAsset` validates rights, never content | Full — see **F1** | H | **Open** |
| PUB-7 | Second unpoliced door to the same bytes | `1stcontact-public-site.<sub>.workers.dev` | none — `workers_dev = true` (`public-site/wrangler.toml:5`) | Host-mapping disclosure; a route to any site bypassing per-hostname controls once custom domains land | L | **Open (F8c)** |
| PUB-8 | Turnstile token minted elsewhere | token from any page carrying the (public) sitekey | `success` is checked; `hostname` and `action` are not (`lead.ts:335`) | Low — tokens are single-use and short-lived | L | Partial (F8b) |
| PUB-9 | Edge cache serving the wrong tenant's bytes | cache key missing host/site | resolution is per-request through the grammar | Verify cache keys as caching is tuned | L | Verify |

### 3.2 Anonymous internet → pre-gate control-app routes

| ID | Threat | Vector | Controls today | Residual | Sev | Status |
|---|---|---|---|---|---|---|
| EDGE-1 | Magic-link theft / premature consumption | mail scanners fetching every URL | Redemption is on POST only, never GET (`sign-in.ts`) — the Continue page changes nothing | — | — | Covered |
| EDGE-2 | Sign-in enumeration / link flooding | `POST /sign-in` | One frozen acknowledgement; `SIGNIN_RATE_LIMIT` | Token entropy, single-use and expiry are the component's — worth one UAT stating them here | L | Covered / verify |
| EDGE-3 | Forged provider events mutating contact records | `GET/POST /api/email/webhook` | Svix HMAC over the **raw bytes**, secret required, timestamp window, verified **before** parse and before any lookup (`email-webhook.ts`) | Replay inside the timestamp window — confirm event-id idempotency | L | Covered / verify |
| EDGE-4 | A new pre-gate exemption opening the Worker | a future route mounted ahead of `guardAccess` | Exemptions are exact path-and-method matches, never prefixes (`index.ts`, stated in `sign-in.ts`) | Hand-maintained — see **F5** | M | Partial |
| EDGE-5 | Reaching the builder around the Access hostname | `workers.dev` | Stated twice: `workers_dev = false` (`control-app/wrangler.toml:22,393`) **and** in-Worker verification of the Access JWT — signature over the published JWKS, `alg` pinned from the JWKS and never from the token header, `aud`, `iss`, `exp`/`nbf`, fail-closed (`access.ts`) | — | — | Covered (exemplary) |

### 3.3 Authenticated → control-app (authorization)

| ID | Threat | Vector | Controls today | Residual | Sev | Status |
|---|---|---|---|---|---|---|
| AUTHZ-1 | Cross-business read/write (IDOR) | business prefix / ids in a request | One decision point (`scope.ts`), with a UAT asserting `env.TENANT_ID` has no reader outside it and `identity.ts`; `admit` is pure lookup and creates nothing | — | — | Covered (exemplary) |
| AUTHZ-2 | Business-existence oracle | probing a business id | Three refusal reasons collapse to one on the wire; the reason reaches the log only | — | — | Covered |
| AUTHZ-3 | Escalation to platform admin | `/api/admin/*` | `ownsPlatformBusiness` (membership role, not a flag), refusal answers **404** not 403, and is logged | `BREAK_GLASS` is deployment config: whoever can deploy can own the platform. Accepted, deliberate ([[DOC-40]] §6) | L | Covered |
| AUTHZ-4 | A mutating route that forgets its gate | the 51st route arm | 50 route arms, 32 `requireScope()` calls; per-route owner-only checks. Nothing unguarded found today | No structural guarantee — see **F5** | M | **Partial** |
| AUTHZ-5 | CSRF on cookie-authenticated POSTs | cross-site form/fetch | `Secure`, `HttpOnly`, `SameSite=Lax`; session read refuses a cookie not issued for the request's host (`public-site/src/session.ts`) | `Lax` covers POST; no token. Confirm no state change on GET | L | Covered |
| AUTHZ-6 | **XSS in the builder origin = account takeover** | uploaded file served inline same-origin; AI/客户-authored strings rendered in chrome | `reader.js` writes HTML only through `renderSafe`; `nosniff` on five chrome routes | `/api/material/file` is not one of them; no CSP anywhere — see **F1**, **F3** | H | **Open** |

### 3.4 The assistant — (a) where untrusted text reaches the context

| ID | Entry point | Who controls it | Today | Sev | Status |
|---|---|---|---|---|---|
| AI-I1 | Client chat text | the client (or anyone who takes their account) | trusted by construction; it is the product | — | Accepted |
| AI-I2 | Uploaded files → `describe.ts` digests → material tickets → corpus | whoever hands the client a document | classified at ingestion (`origin`, `rights`, `republishable`); no content trust marking on the *text* | M | Partial |
| AI-I3 | Fetched web material (`/api/material/fetch`) | the author of any page a client names | **Named as a prompt-injection path in the code** (`fetch-guard.ts:17-22`); address guarded (https-only, private/loopback/link-local refused, **every redirect hop re-validated**, size capped on the way in); trust carried on the ticket as `origin: fetched`, `rights: third_party` | M | Partial |
| AI-I4 | Captured reference sites | the author of that site | same guard via `capture/egress-guard.ts`, installed at the driver's **per-request** seam so subresources and redirects are covered too | M | Partial |
| AI-I5 | Tool results echoing earlier attacker text (read the page back) | whoever wrote the page | surface declarations mark returns `provenance: untrusted` | M | Partial / verify |
| AI-I6 | **Inbound email bodies** ([[EPIC-13]]) | **anyone on the internet** | not built. This is the highest-value injection channel the product will ever have, and the epic's purpose is to put those bodies on the record | H | **Design-time** |
| AI-I7 | Visitor-supplied form text, once contacts reach a role's tools | any visitor | not reachable today: no granted role has a contacts tool. Becomes AI-I6-class the moment one does ([[EPIC-11]]/[[EPIC-13]]/[[EPIC-14]]) | H | **Design-time** |
| AI-I8 | Cross-client corpus poisoning | another client | `exportable` governs what may cross ([[DOC-15]], `material.ts:153`) | M | Partial |

**What "Partial" means here, precisely.** The address guards are good and the
provenance field exists. What is not yet demonstrated is the part that matters:
that untrusted text arrives in the context *framed as data, inside a marked
envelope the model is instructed never to obey* — and that a UAT proves it with
a live payload. Until then AI-I2…I5 are mitigated at the network layer and
labelled at the data layer, not defended at the prompt layer.

### 3.5 The assistant — (b) what a turn is allowed to do

| ID | Authority | Granted? | Worst case if a turn is hijacked | Sev | Status |
|---|---|---|---|---|---|
| AI-A1 | Edit the draft (`AuthorPages`, `ManagePages`, `WriteConfig`, `ManagePalette`) | yes | draft defacement; visible, reversible, not public | L | Accepted |
| AI-A2 | **Publish** | **no** — `instances.json` grants no `Publish`, and `roles.ts` records why: *"the publishing rule went with the grant"* | — | — | **Covered, and the right pattern** |
| AI-A3 | Write a drawing (SVG) | yes | none: `validateSvg` is a closed grammar, every byte accounted for, refuse-whole (`site-schema/src/svg.ts`) | — | Covered (exemplary) |
| AI-A4 | **Claim a hostname** | **yes** — `ClaimHostname` (`settings-core.ts:205`) | permanently burns the business's one and only free address, and a global first-come name that is never re-issued. Irreversible by design | H | **Open — F2** |
| AI-A5 | Rename the business | yes | cosmetic, reversible | L | Accepted |
| AI-A6 | Fetch/photograph an arbitrary public URL | yes | **exfiltration channel**: the URL is attacker-chosen and can carry conversation or business data in its query. The egress guard stops *internal* reach, not outward data | M | Partial |
| AI-A7 | Beacon on next render — place an absolute `https` image/link in the draft | yes | the viewer's browser calls an attacker URL when the preview renders | M | **Open — F4** |
| AI-A8 | Spend (model tokens, browser renders, image generation) | yes | per-session browser budget and per-session image budget exist (`shot.ts:149`); no token/spend cap per account | M | Partial |
| AI-A9 | Write DNS records ([[EPIC-5]]) | not built | mail interception, domain takeover. The epic already marks MX/SPF/DMARC/DKIM *privileged* and asks the right open question: *"How much can the assistant change unsupervised?"* | C | **Design-time — answer with F2's mechanism** |
| AI-A10 | Send mail on the business's behalf ([[EPIC-13]]) | not built | reputation damage, phishing from a trusted sender | H | **Design-time** |

**Detective control.** Every tool call is audited — one R2 object per record at
`audit/<tenant>/<session>/<n>.json`, append-only by construction because
distinct keys cannot collide (`ai.ts`). So AI-A6's exfil URL is *recorded*. What
does not exist is anybody or anything looking at it (see PLAT-6).

### 3.6 Platform, supply chain, operations

| ID | Threat | Controls today | Residual | Sev | Status |
|---|---|---|---|---|---|
| PLAT-1 | Committed credentials | `.dev.vars` gitignored; `wrangler secret` (write-only) not `[vars]`, with the reasoning recorded per secret; committed-credential scan tests that avoid being their own counter-example (`tests/support/credential-scan.ts`) | `.gitignore` matches `.dev.vars` **exactly** — `apps/control-app/.dev.vars~` exists untracked and is committable (F8a) | L | Covered / F8a |
| PLAT-2 | Secret leakage through error text | applied at the last point before a string becomes a body, on both paths that can emit one; value-matched not pattern-matched (`redact.ts`) | — | — | Covered (exemplary) |
| PLAT-3 | **Unpinned third-party code in production** | `@lagrangefoundry/*` (AI library, toolbox bridge, webui) resolves out of an out-of-repo shared store populated by `bin/install`; **zero occurrences in `pnpm-lock.yaml`** | no version pin, no integrity digest, on the code that runs the tool loop and the builder | M | **Open — F7** |
| PLAT-4 | Service-token / non-human identity misuse | `SERVICE_TOKEN_IDENTITIES` maps a machine caller to an identity ([[BUG-59]]); Access verification treats `common_name` as an identity | scope, rotation and least privilege are not yet stated; [[EPIC-16]] will add a deploy identity | M | Design-time |
| PLAT-5 | Cloudflare account compromise | — | total: zones, registrar, D1, R2, Access policies, secrets. Concentration is the architecture ([[DOC-1]]) | H | **Accepted, needs stated controls** (MFA, scoped tokens, audit log review) |
| PLAT-6 | No security-event definition or review | `admin_route_refused` and egress refusals are journalled; the tool audit is written | nothing defines *which* events are security-relevant, and nothing reviews them. An attack is reconstructible and not noticeable | M | **Open** |
| PLAT-7 | PII to model providers | disclosure is policy ([[DOC-1]] §26) | needs: minimisation, zero-retention/no-training terms confirmed per provider, and a statement of what leaves | M | Open |
| PLAT-8 | DNS rebinding defeating both guards | stated honestly in both `fetch-guard.ts` and `egress-guard.ts`: workerd cannot resolve a name before fetching it | unclosable from inside a Worker | L | **Accepted, documented** |

### 3.7 Arriving with planned epics (design-time rows)

| ID | Epic | The threat to decide now |
|---|---|---|
| FUT-1 | [[EPIC-13]] | Inbound mail is anonymous input that becomes (a) stored content, (b) model context, (c) a forwarding action. Open-relay and destination-verification are named in the epic; the **injection** half is not. |
| FUT-2 | [[EPIC-13]] | Custody of send-as SMTP credentials and DKIM private keys; shared sender reputation across all businesses (A6). |
| FUT-3 | [[EPIC-5]]/[[EPIC-6]] | Privileged-record policy (MX/SPF/DMARC/DKIM/NS): snapshot, diff, human confirmation, declared target, propagation window. Transfer-authorisation custody. |
| FUT-4 | [[EPIC-4]]/[[DOC-45]] | **The `1stc.site` PSL submission is a security control**, not hygiene: until it lands every customer site shares an eTLD+1, so cookie and origin adjacency between customers is real. [[TODO-6]] §1's weeks of lead time put it on the critical path. Also: the session cookie's `Domain` must never be set to a customer-site apex. |
| FUT-5 | custom domains | Dangling-DNS / subdomain takeover: a customer CNAME pointing at us with no live site, or a revoked label. Revocation exists by design — re-issue must not. |
| FUT-6 | [[EPIC-9]] | Stripe webhook signature + event idempotency; no card data (already policy); server-side price/plan resolution, never client-supplied. |
| FUT-7 | [[EPIC-14]] | A notification is an outbound channel an attacker can drive. The epic already records the shape: *"abuse of a marketing form breaks the login."* |
| FUT-8 | [[EPIC-15]] | Marker forgery — the gutter doc already has the right rule (a bad marker degrades to *real*, because marking real traffic as test is the attack). Plus a scheduled `DELETE` holding production credentials, with its own rails. |
| FUT-9 | [[EPIC-12]] | Site duplication must not copy across a business boundary, and must not carry grants, tokens or synthetic markers with it. |

---

## 4. Findings, ranked

### F1 — Untrusted uploaded bytes are served as documents on the builder's own origin **[High → Critical]**

`GET /api/material/file` returns the uploaded bytes with the **uploaded
content-type** and `content-disposition: inline`, and that route sets neither
`nosniff` nor a CSP (`router.ts:3985-3996`). `TYPE_BY_EXTENSION` maps
`html → text/html` and `svg → image/svg+xml` (`material.ts:257-290`). The
builder's preview iframe is same-origin *by construction*.

So a file dropped on a chat can become a same-origin HTML or SVG **document** on
`app.1stcontact.io`. Script there runs as the signed-in user against every
`/api/*` route: publish, claim a hostname, read the whole business, drive
`/api/ai/prompt`. If a platform operator opens a client's file, it crosses into
platform ownership.

`svg.ts`'s own docstring predicts this exactly — *"an asset was a file an
operator placed on their own machine, so a human vouched for the bytes and an
extension check was the whole of the question. The moment a model can author the
bytes, that footing is gone."* A **client** dragging a file onto a chat removed
the same footing by a different door, and `validateSvg` was only wired to the
first one.

It becomes Critical, not High, the moment the uploader is anonymous — form
attachments or [[EPIC-13]] inbound mail.

*Mitigation, in preference order:* (a) serve user content from a **separate
origin** so this class cannot reach the session at all — the structural fix, and
cheap now; (b) interim: `content-disposition: attachment` for everything outside
a small render-safe inline allowlist, plus `nosniff` and
`Content-Security-Policy: default-src 'none'; sandbox` on that route; (c) run
`validateSvg` on the upload/promotion path too, so the human door and the model
door give one answer.

### F2 — The assistant holds an irreversible, global, unrecoverable action **[High]**

The settings role is granted `ClaimHostname` (`settings-core.ts:205`). A
`1stc.site` label is one per business, **final**, never changed and never
re-issued ([[DOC-45]] §7). The surface prose warns the model at length; the
*grant* lets it act. [[DOC-45]] §7 also requires the choice to be shown to a
human as the whole host, with its finality stated **at the moment of choosing** —
a requirement a tool call satisfies for nobody.

The product already has the right pattern and states the reasoning: `Publish` is
withheld from the consultant *by grant, not by instruction*, because publishing
is the user's decision. Hostname claiming is strictly more irreversible than
publishing.

*Mitigation:* a **confirmation seam** for irreversible actions, enforced by the
toolbox rather than by prompt text — declare the effect (`irreversible`) on the
operation, and have the model *propose* into a card the human performs.
[[EPIC-5]]'s nameserver card is already this shape. This also pre-answers
[[EPIC-5]] open question 2 for MX/SPF/DKIM/DMARC/NS, which is where the same
mechanism matters most (AI-A9).

### F3 — No Content-Security-Policy anywhere **[Medium-High]**

Neither Worker sets a CSP; `nosniff` appears on five chrome routes and nothing
else; no `frame-ancestors`, `Referrer-Policy` or `X-Frame-Options`. CSP is the
defence-in-depth layer behind F1, PUB-6 and F4 — the one that still works
against the sink nobody spotted. *Mitigation:* a policy on the builder chrome
(`script-src 'self'`, `frame-ancestors 'none'`, `connect-src 'self'`,
`object-src 'none'`, `base-uri 'none'`) and one on published pages, reconciled
with what behaviour modules genuinely need.

### F4 — The draft preview is a usable exfiltration beacon for a hijacked turn **[Medium]**

L1's URL allowlist permits absolute `http(s)` for an image `src` — correct for
the injection threat it was written for ([[DOC-2]] §2), and it also means a turn
can place `https://attacker/?data=…` on a page and have the *viewer's* browser
call it on the next render. Combined with AI-A6 (photograph any URL) this is two
independent outbound channels. *Mitigation:* constrain AI-authored image `src`
to relative/site-asset (the normal case anyway), and/or `img-src 'self'` in F3's
policy.

### F5 — Authorization is per-route and hand-maintained **[Medium]**

50 route arms; 32 `requireScope()` calls; owner-only and admin-only checks
written per route. Nothing was found unguarded — the finding is the **absence of
a structural guarantee**, on a surface where the Access gate explicitly is not
the boundary. *Mitigation:* a route-inventory UAT in this project's existing
idiom (the same idiom as the UAT asserting `TENANT_ID` has no third reader):
every route arm either names a gate or appears on an explicit anonymous list,
and a new arm that does neither fails the build. Same guard shape covers EDGE-4.

### F6 — Nothing asserts what the assistant is granted **[Medium]**

`Publish` is withheld by a line in `instances.json`, and no test fails if that
line changes. The set of irreversible operations is not declared anywhere a test
can read. *Mitigation:* a UAT pinning each role's granted group set to a declared
expectation, so widening a grant is a deliberate, reviewed act. Cheap, and it is
what makes F2's fix durable rather than a one-off.

### F7 — Unpinned third-party code executes in production **[Medium]**

`@lagrangefoundry/*` — the AI library, the toolbox bridge, the webui components —
resolves from an out-of-repo shared store populated by `bin/install`, and appears
**zero times** in `pnpm-lock.yaml`. That is the code running the tool loop and
the builder chrome, with no version pin and no integrity check. First-party
source today; the gap is the mechanism, and the mechanism is what supply-chain
compromise exploits. *Mitigation:* pin by version + digest, record the resolved
digest in the deploy record, and refuse a deploy whose digest differs from the
one the tests ran against.

### F8 — Three small ones **[Low]**

(a) `.gitignore:67` matches `.dev.vars` exactly; `apps/control-app/.dev.vars~`
is present and untracked, so a `git add -A` commits a secrets file. Widen to
`.dev.vars*`. (b) `verifyTurnstile` checks `success` only — add `hostname` and
`action`. (c) `public-site` runs with `workers_dev = true`: a second, unpoliced
door to the same public bytes and to `/api/lead`, and a route around
per-hostname controls once custom domains land.

---

## 4a. Blast radius and recovery

The operator's hypothesis — *injection should be constrained by tenant and
should not reach the backups, so a breach takes a site down and it is rapidly
restored* — is the right frame, and it is worth stating as a design principle
because it converts an unwinnable goal (*stop injection*) into two buildable
ones (**bound the blast radius**, **make restore real**). Checked against the
code, the first half is already true by construction and the second half is not
true yet.

### What is already confined (verified)

| Claim | Evidence |
|---|---|
| A session cannot name another business | The store handle is `forTenant`-bound before the host is reached; there is **no tenant argument anywhere on the path** (`ai.ts:100-104`, `:327-330`). `scope.ts` has already made that decision per request. |
| A session cannot name another site | The L1 surface declares one site and no operation takes a site argument (`l1-surface.json` overview). |
| A hijacked turn cannot publish | `Publish` is not in the consultant's grant (`instances.json`) — by grant, not by instruction. |
| A hijacked turn cannot delete assets | `ManageAssets` (`add_asset`, `remove_asset`) is **not granted** either. |
| Published revisions are append-only | `site_revisions` rows plus frozen source and render in R2; live is derived as the highest id, never stored, so there is no pointer to repoint (`d1r2-store.ts:70-75`, [[DOC-12]] §4). |
| Total site destruction is unreachable | `forget()` deletes a site and every revision, is tenant-scoped, and **has no caller anywhere in the product**. |

So the public site is genuinely out of reach of a hijacked turn, and so is every
other business. The reachable blast radius is **one business's draft**.

### The draft is expendable; the published revision is the artifact

The operator's line, and it is the right one: **nobody should expect to restore a
draft.** A draft is working state. What must survive anything is the **published
site — fixed in time and immutable — and that has to be enforced rather than
intended.** Recovery is then a single well-defined move: check out revision N and
publish it forward. The schema already anticipates exactly this — `based_on`
exists *"so that a forward-only rollback is self-documenting"* ([[DOC-12]] §4,
`0001_baseline.sql:210-213`).

So the journal's not being a revision is **correct by design**, and the earlier
framing of it as a gap is withdrawn.

### Immutability today: intended, respected, enforced nowhere

| Layer | What holds it | Enforced? |
|---|---|---|
| Revision numbering | `-- Monotonic per site, and forward-only. Never reused, never renumbered.` plus `PRIMARY KEY (site_id, id)` (`0001_baseline.sql:203-223`) | **Yes** for the row's existence |
| The revision row | nothing forbids `UPDATE` or `DELETE`. The schema contains **exactly one** immutability trigger and it is on `contact_events` — *"a correction is an appended event that supersedes, never an edit of the row that was wrong"* (`0001_baseline.sql:709-713`) | **No** |
| The frozen bytes in R2 | `writeRevision` `put`s every object into `published/<site>/<id>/` **before** the `INSERT` whose primary key would have refused the id (`d1r2-store.ts:788-862`). `put` overwrites | **No** — the constraint protects the log, not the bytes |
| Byte integrity | `sha` — a digest of the frozen definition, recorded at publish (`publish.ts:322`) and described in the schema as *"AUDIT, NOT ADDRESSING… are these the same bytes?"* — is **never read back anywhere**. `readRevision` reads the row for existence and the objects for content, and compares nothing | **No** — the detector exists and is not wired up |
| Concurrent publishes | `nextRevisionOf(history)` is read-then-write with no lock (`publish.ts:316`). Two publishes compute the same id, both write into the same prefix, one `INSERT` wins | **No** — [[DOC-1]] §7 specifies a Durable Object for exactly this; not built |
| Write authority over the bucket | `public-site` holds an R2 binding to the whole `SITES` bucket; *"This Worker READS ONLY"* is a comment, not a grant (`public-site/wrangler.toml:40`) | **No** |

None of these is a live exploit path today — the only writer of a revision is
the publish path, and it behaves. They are the difference between *a property
the code respects* and *a property the store guarantees*, which is the
distinction the operator is asking to close, and the same distinction [[DOC-2]]
draws between structural and procedural security.

The cheapest of them is also the most valuable: **the digest is already being
computed and stored.** Verifying it on checkout turns "immutable by convention"
into "tamper-evident by construction" for the price of one comparison.

### What recovery then is

1. Detect (sha mismatch, or the operator's report).
2. `checkoutRevision(site, N)` — implemented, correct, and today reachable only
   through the CLI against the **filesystem** store (`cli/commands.ts:189`,
   `fsSiteStore(ctx)`). It needs a route and a control.
3. Publish forward. `based_on` records what it was rolled back to.

The draft is discarded in step 2, which is the point: `checkoutRevision` already
refuses a dirty draft unless forced, and forcing it is the correct answer here.

### The principle, stated for reuse

> **Confine, then recover.** Every AI capability is bounded to one business by
> the handle rather than by a predicate; every destructive or irreversible
> effect either has a restore point behind it or a human in front of it.

That sentence is what makes the prompt-injection rows in §3.4 tolerable while
the prompt-layer defence (REQ 8 below) is still outstanding — and it is what
stops being true the moment AI-I6/AI-I7 land, because those change *who* can
reach the context, not what a turn may do.

---

## 5. Proposed REQs

Not yet filed — say the word and they go in at `draft`.

| # | Ticket | Covers | When |
|---|---|---|---|
| 1 | **Library: untrusted uploads must not be documents on the builder's origin** (separate origin; interim `attachment` + `nosniff` + sandbox CSP) | F1 (a)+(b), AUTHZ-6 | **Now** |
| 2 | **Assets: validate SVG content on the upload path, not only the AI path** | F1 (c), PUB-6 | **Now** |
| 3 | **Both Workers: a Content-Security-Policy and the standard response headers** | F3, F4, AI-A7 | **Now** (ships with 1) |
| 4 | **AI surface: a confirmation seam for irreversible operations** — declared effect, enforced by the toolbox; the model proposes, the human performs | F2, AI-A4, and the mechanism [[EPIC-5]] OQ2 needs for AI-A9 | **Now** — one operation today, three surfaces later |
| 5 | **Enforce published-revision immutability** — an `UPDATE`/`DELETE` trigger on `site_revisions` on the `contact_events` precedent; claim the revision id **before** writing bytes; refuse a `put` into an existing revision prefix | §4a — the store guarantees it instead of the writer respecting it | **Now** |
| 5a | **Verify the digest that is already stored** — compare `sha` on checkout (and on a scheduled sweep); the detector exists and is unwired | §4a — tamper-evident for the price of one comparison | **Now** (smallest item on this list) |
| 5b | **A restore control in the product** — `checkoutRevision` + publish forward, over the D1/R2 store; discard the draft, record `based_on` | §4a — recovery exists in the CLI against the filesystem store only | **Now** |
| 5c | **Serialize publishing** — the Durable Object [[DOC-1]] §7 already specifies | §4a — two publishes can compute the same revision id | Next |
| 6 | **Router: a structural guard that every route arm names its gate** | F5, EDGE-4, AUTHZ-4 | **Now** (a test, not a feature) |
| 7 | **AI surface: pin each role's granted capability set with a UAT** | F6, AI-A2, and what keeps 4 from regressing | **Now** (a test, not a feature) |
| 8 | **Ops: state and test the backup posture** — D1 Time Travel, R2 retention, a restore runbook | §4a (3), PLAT-5 | Next |
| 9 | **Deploy: pin and verify the shared component store by digest** | F7 | Before the first paying customer |
| 10 | **Prompt injection: an untrusted-content envelope, proven by UAT** | AI-I2…I5 | **Gated on AI-I6/AI-I7** — mandatory before inbound mail or contacts reach a role's tools; deferrable until then *because* §4a holds |
| 11 | **Ops: name the security events, and review them** | PLAT-6 | Next |
| 12 | **Hygiene: `.dev.vars*`, Turnstile `hostname`/`action`, `workers_dev` on public-site** | F8 | Next (minutes) |

Recommended alongside: promote this matrix to a `doc` (`doc_kind: architecture`,
so it stays out of the production KB) once it has been through one review cycle,
with [[DOC-2]] linking to it as the platform-scope companion.

---

## 6. Accepted risks, stated so they are not re-discovered

- **Cloudflare account concentration** (PLAT-5). The architecture chose it
  deliberately; the answer is operational controls, not a second provider.
- **DNS rebinding** defeats the literal-host checks in both guards. Both files
  say so. Unclosable inside a Worker.
- **`BREAK_GLASS` means deploy access is platform ownership** — deliberate, and
  the alternative is a lockout with no row to fix it ([[DOC-40]] §6).
- **A hijacked turn can deface the draft.** Visible, reversible, not public,
  because `Publish` is not granted.
- **The assistant can fetch and photograph public URLs.** A real capability, so
  a real outbound channel; bounded by budget and recorded in the audit.
- **AI spend has no per-account ceiling.** Bounded today by invite-only
  admission; it needs one before self-signup ([[DOC-40]] §5).

## 7. How this gets re-run

1. **Per epic, at design time.** Add the epic's rows to §3.7 *before* its first
   REQ is written. That is where a control is free.
2. **Periodically, whole-matrix.** Re-walk §2's boundaries against the code;
   every "Covered / verify" either becomes a cited test or drops to Partial.
3. **On every new trust boundary** — a new pre-gate route, a new AI grant, a new
   place untrusted bytes are stored or served, a new non-human identity. Each of
   those is a new row, not a judgement call.

The two questions worth asking every time, because they are what found F1 and
F2: *what is the least-trusted party who can reach this?* and *what is the most
irreversible thing that can happen if a turn goes wrong?*
