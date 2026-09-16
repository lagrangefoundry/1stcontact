---
uid: comment-cf953dae
id: COMMENT-3011
type: comment
title: Comment on bug BUG-97
created_by: xgd
created_at: '2026-09-16T01:00:51.456961+00:00'
updated_at: '2026-09-16T01:06:09.535612+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-3fe8c3a6
  kind: chat_transcript
---

<!-- xgd-turn id="0b45e1d0-34d5-47cb-b131-d05c5ab02cee-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T00:59:57.878696+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="0b45e1d0-34d5-47cb-b131-d05c5ab02cee-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T01:06:09.344510+00:00" -->
#### Claude
I've read the ticket, the design discussion in `comment-cd9c1549`, and the code (`public-url.ts`, `hostname.ts`, `lead.ts`, `control-app/gate.ts`, `public-site/{routes,gate,index}.ts`, both `wrangler.toml`s). The shape is clear and I agree with the reasoning. Two things I want your call on before I write code, because they change the work materially.

## 1. The published link resolves nowhere today — which form do you want?

`public-site` has **no host→site resolution**. `parseRoute` only knows `/site/<key>/…` and "everything else is the apex site" (from `APEX_SITE_KEY` config). And production routes are `1stcontact.io` + `*.1stcontact.io/*` only — nothing for `1stc.site` or a custom domain. DOC-45 §4 says resolution is a separate ticket gated on TODO-6 §§1/5 (wildcard `A`/`AAAA`, `*.1stc.site` cert, PSL), none of which is done.

So `https://alice.1stc.site/api/download/<token>` — the clean form, key gone — is **correct by construction and dead on arrival** until that lands. Today's wrong link at least resolves in production.

Three options:

- **(A) Clean form now.** `https://<host>/api/download/<token>`. Matches the symptom in full (right host, no key). Published links stop working until host resolution + DNS land; I'd note that explicitly on the ticket.
- **(B) Right authority, existing path.** `https://<host>/site/<key>/api/download/<token>`. Satisfies the test as literally written — *"the site key does not appear in the URL's **authority**"* — and works the instant you point `xgd.dev` (or the wildcard) at `public-site`, with no resolution work. Doesn't fix the key-exposure half of the symptom.
- **(C) Fix it properly here.** Add host→site resolution to `public-site` (it already has the D1 binding — ~30 lines reading `site_domains` by request host) and emit the clean form. Bigger, overlaps DOC-45's order-of-work item 4, and for the root-of-host case has to settle how it interacts with the apex site.

**My recommendation: (B) now, (C) as its own ticket.** It's the only option where the mail link is both right about the host and actually followable, and it doesn't quietly pre-empt the resolution ticket. But your phrasing of that test item reads like you may already have had (B) in mind — or you may want (A) and to accept the interval. Which?

## 2. Confirming the draft half's scope

`/preview/<site>/draft/api/download/<token>` isn't a route — `servePreview` would 404 it. So "delivers something the operator can actually open" needs a gate branch in `control-app`'s preview route: `openGate`/`takeAsset` gain a channel argument (a never-published site has no *published* form definition to resolve against), the downloads page HTML moves to a shared module both apps import, and artifact bytes reuse `servePreview` against the draft channel. The origin comes from the submission's own request (`new URL(request.url).origin`, set in `router.ts`) rather than a new constant — draft submissions only ever arrive at the builder, so that's the honest source and needs no config. **That's what makes the dev symptom go away today**, independent of question 1.

Confirm that's in scope? It's the bulk of the work.

## Decisions I'll make myself unless you object

- A site holding both kinds: prefer `custom`, else `platform`. Read over `kind`, never by matching the apex, so EPIC-6 lands unchanged.
- No address → a new `DeliverySkip` (`no_site_address`) reported per asset through the existing `nothing()` path; the grant is not minted and no mail goes out. A form promising *no* assets still sends its welcome — it carries no `cta_url`, so there's nothing to compose.
- `publicSiteUrl` and `PUBLIC_SITE_ORIGIN` stay exactly as they are; the new composition is its own function, and a UAT pins both operator callers' current output.

<!-- xgd-chat-end -->