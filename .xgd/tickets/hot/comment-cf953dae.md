---
uid: comment-cf953dae
id: COMMENT-3011
type: comment
title: Comment on bug BUG-97
created_by: xgd
created_at: '2026-09-16T01:00:51.456961+00:00'
updated_at: '2026-09-16T02:08:22.747080+00:00'
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

<!-- xgd-turn id="47f7d474-c9b4-4188-93f7-f61a7083228b-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T01:21:35.379459+00:00" -->
#### You
that sounds good - questions:

1. what will happen when we are on dev servers with nothing published
2. what happens when the user tries it in preview mode before publishing?

2 is particularly important - we should think it through - it is not desirable for the user to be forced into a situation where the first time they can test the email is when the site is live (I mean if that's the best we can do etc we could accept it - but its not great)

<!-- xgd-turn id="47f7d474-c9b4-4188-93f7-f61a7083228b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T01:24:49.092227+00:00" -->
#### Claude
Let me trace both cases properly rather than guess.

Let me check BUG-94, which is adjacent to question 2.

Traced both. Answers are concrete, and question 2 has a real gap that the link fix alone doesn't close.

## 1. Dev with nothing published

**It collapses into question 2, because with nothing published there is no published channel to test on.** `public-site` resolves a site through its live revision — `store.resolve(siteKey)` returns `null` when there's no published revision, so `127.0.0.1:8787/site/<key>/whitepapers` 404s the *form*, before any submission. The only place the form exists is the draft preview.

And that path works, with no dependence on `site_domains` at all:

- `formDefinitionOf(…, 'draft')` reads the draft pages directly — no revision needed (BUG-78 already built this).
- Contact, `form.submitted`, acceptances, grant: all written as normal.
- Link → `http://127.0.0.1:8788/preview/<key>/draft/api/download/<grant>`, served by the new draft gate route.

That last point matters more than it looks: REQ-238 only requires an address **before publishing**, so a site being built in preview has no `site_domains` row yet. The draft branch must not consult one — and it doesn't. The `no_site_address` refusal is reachable only on the published channel, which is a state publish already forbids.

The residual: in dev *with* something published, a published-channel submission mints a link at the site's real host (`xgd.dev`, `alice.1stc.site`) that won't resolve from your machine. That's correct rather than broken — a published link should name the published address — and it's why dev testing belongs on the draft channel.

## 2. Preview before publishing — the gap is that you never see the email

With the fix the whole loop runs, and then stops one step short:

| where the message could show | what it shows today |
|---|---|
| `capturingMailer` console line | `to=` and `subject=`. No body, no link. |
| Builder → Contacts → Messages | subject / when / status / failure. `MessageRecord` **already carries `body`** over the wire and the pane drops it. |
| BUG-94's email-page preview | the template — `{{cta_url}}` unresolved. The look, not the link. |

Dev has no `RESEND_API_KEY` (`.dev.vars` holds only the three Access/admin vars), so `mailerFor` hands back the capturing adapter: nothing leaves the building. The rendered body **is** persisted — `sendRecordedEmail` writes it as the ticket body and `/api/people/messages` returns it — so the mail you'd have received exists, in full, with a working link in it, and there is no surface that shows it to you.

So BUG-97 on its own gets a preview submission to "a message was queued", with a link that is correct, followable, and invisible.

**What closes it, cheaply:** make a Messages row expandable to show the message **as sent** — the stored body in a sandboxed iframe, so it paints like the mail and the link is clickable. No new data, no new endpoint; a pane change in `builder/people.js` and some CSS. That makes a preview submission a complete rehearsal: press the button, open the contact, read the real mail, click the real link, get the real paper — nothing published, no mail provider, no live site.

It isn't dev-only value either. In production it's the answer to *"what exactly did we send this person, and does their link work?"*, which is the support question.

One thing I noticed while tracing: in dev the record is written `status: 'sent'` with `provider_id: local_…`, so the pane says **sent** for a message that never left. The `local_` prefix already distinguishes it — three lines in `messageLine` to say *not sent — no mail provider configured* instead. Cheap, and it removes the worst misreading available in that pane.

## Proposed scope

1. Published link from `site_domains`, option (B) shape (`https://<host>/site/<key>/api/download/<token>`) — your call still stands from my last message; say the word if you'd rather have (A).
2. Draft-channel link + the draft gate route in `control-app`.
3. `no_site_address` refusal on the published channel, no grant minted, no mail.
4. Operator callers pinned unchanged by UAT.
5. **Messages row shows the message as sent, and says so when it wasn't.**

Items 1–4 are the ticket as written. **5 is the one I need your yes on** — it's what makes the ticket's own promise ("delivers something the operator can actually open") actually true, but it's a builder pane rather than the link, so it's fair to call it a separate ticket and let BUG-97 land a correct-but-unviewable link in dev.

Fold 5 in, or file it separately?

<!-- xgd-turn id="b95b878b-ef86-4419-a9b3-0b6ae30f37ab-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T01:38:34.472508+00:00" -->
#### You
5 - agree

<!-- xgd-turn id="b95b878b-ef86-4419-a9b3-0b6ae30f37ab-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T02:08:21.866240+00:00" -->
#### Claude
Option (B) plus item 5. Starting with the ticket scope, then the branch.

Ticket scoped. Now the branch.

Now implementing. Shared gate vocabulary first:

Now `public-url.ts` — the audience split the ticket is about:

Now the address picker in `hostname.ts`:

Now `lead.ts` — the origin field, the refusal, and the two link shapes:

Now the link composition and the refusal in `deliverForm`:

Now the `gateUrl` thunk in `captureLead`:

Now the channel argument on `control-app`'s gate:

Now document why the channel is there:

Now `public-site/gate.ts` reuses the shared grammar and page:

Now the preview gate route:

Now the router's remaining pieces — `p` → request pathname, `GateRouteEnv`, and the draft artifact serving:

Now the origin on the draft lead route:

Now `deliverDraftArtifact`, next to `servePreview`:

Now let's typecheck what we have before the UI half.

Now the CSS:

Now the fixtures — sites need addresses, per REQ-238:

Now wire it into `seedFormSite`:

Let me run the affected existing suites to see where we stand before writing the new UATs.

Two failures, both older UATs pinning the defect itself. Updating them to assert the site's own host:

Now the first UAT file:

Now the draft gate UAT:

The draft now renders. Cleaning up the probe and fixing the cache-control assertion:

Now record the `uncacheable` interaction in the code, then the pane UAT:

Now the full suite:

Clean. Let me review my own diff before committing.

Ticket updated. Now committing:

`status=free_coded`, both SHAs recorded, version bumped to 0.2.214. Releasing the lock and tearing down the branch:

Let me confirm the merged tree is green:

BUG-97 is implemented, merged to `xgd-working`, and the ticket is `free_coded` (version 0.2.214).

## What landed

**The published link names the address the site has.** `gateLinkFor` in `lead.ts` reads `site_domains` through `hostname.ts`'s new `addressForLinks` — custom preferred over platform, asked over `kind` so EPIC-6 lands unchanged — and composes with `recipientSiteUrl`. `publicSiteUrl` and `PUBLIC_SITE_ORIGIN` are byte-identical; a UAT pins both operator callers, including the preview redirect through the real route.

Option (B) as agreed: `https://<the site's host>/site/<key>/api/download/<token>`. The reasoning is recorded in `public-url.ts` next to the function, so the next reader doesn't re-litigate it.

**The draft half.** A draft submission's link names the origin that took it plus the site's draft channel, and `control-app`'s preview route now answers the gate — page and artifact, the bytes out of the draft via `servePreview`. `openGate`/`takeAsset` take the channel, since a never-published site has no revision for a published read to resolve against. The link also names the business explicitly (`businessPath`), because a mail read days later shouldn't resolve against whichever business a session had selected.

**No address → `no_site_address`**: no grant minted, no mail, reason reported. Reachable from the published channel only.

**Item 5.** A message in the contact pane opens to show the body as sent, in a sandboxed iframe with `allow-popups` so the gate link is pressable — no same-origin, no scripts, no top-navigation. A message written `sent` with a `local_` provider id now says *"Recorded only — this deployment has no mail provider, so nothing was delivered."*

The gate's path grammar and page moved to `contact-form/gate.ts` beside `DOWNLOAD_PATH`; `public-site` no longer keeps its own copy.

## Two things worth your attention

**A fixture bug the draft gate exposed.** `seedFormSite` seeded a `site.json` with no `id`, `theme` or `nav` — **its draft never validated**. No suite noticed because none of them ever rendered it. It seeds `starterSiteJson` now. Also, a published fixture site now holds an address, since REQ-238 requires one and that helper writes revisions directly rather than going through `POST /api/publish`. Both are recorded in the ticket body so reconciliation doesn't read them as drift.

**Two pre-existing failures in the full suite, unrelated to this ticket** — I left them alone rather than widening scope:

- `tests/bug32-webui-scope-rebrand.test.ts` — the webui scope is restated in `tools/generate/src/cli/assets.ts` and `tests/test_UAT_FC_REQ-228_the_assistant_can_read_the_tickets.workers.test.ts`, neither of which is in my diff.
- `tests/test_UAT_FC_BUG-67_backend_settings.test.ts` — `install({ gemini: { model: 'x' } })` no longer throws.

Everything else passes: 4352 tests, 512 files.

**On your question 1** — with nothing published in dev there is no published channel to test on at all (`public-site` resolves a site through its live revision, so the form itself 404s). It collapses into question 2, and the draft path now carries it end to end with no address, no publish and no mail provider.

<!-- xgd-chat-end -->