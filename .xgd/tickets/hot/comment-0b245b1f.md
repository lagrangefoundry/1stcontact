---
uid: comment-0b245b1f
id: COMMENT-2880
type: comment
title: Comment on epic EPIC-4
created_by: xgd
created_at: '2026-09-12T22:26:31.983715+00:00'
updated_at: '2026-09-12T22:28:58.532144+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-0728e1c5
  kind: chat_transcript
---

<!-- xgd-turn id="45c83588-f284-46bb-a6a6-5d63b39da78e-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T22:26:22.571079+00:00" -->
#### You
Settings should be the rightmost tab. It will be a collection of areas starting with names - site, business, 1stc subdomain and then DNS settings. The former are relatively simple database strings - the latter are complex DNS settings

It needs to be a 2 panel page, the settings will be on the left, and on the right will be a chat window with a dedicated settings role

As we build out the settings we need to build out an API to allow them to change, making appropriate checks, propagating effects and so on. This API must be exposed to the settings chat role.

We need to create documentation so the settings chat understands all the settings, when they are right and wrong and how to apply them. Our user base is low-tech and so this AI agent will help them make changes.

Lets discuss the concept and then I would like you to create REQs for the initial scope which is

1. Settings tab - with settings pane and chat pane - initially just names that can be configured business, site and 1stc.site subdomain name
2. API - to change the names exposed to the AI with documentation

<!-- xgd-turn id="45c83588-f284-46bb-a6a6-5d63b39da78e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T22:28:58.472149+00:00" -->
#### Claude
I've read the epic and traced what actually exists. Here's the shape as I see it, with the places where the concept needs a decision before I can write the REQs.

## What "names" actually means today — it's four things, not three

| | Where it lives | Status |
|---|---|---|
| Business name | `tenants.name` (D1) | exists — what the business switcher shows |
| Business name **again** | `site.json` → `config.businessName` | exists, **per site**, required by the schema, renders into every page `<title>` (`render.ts:162`) |
| Site identity | `sites.slug` — unique per tenant, the addressing key | exists; there is **no site display name** |
| `1stc.site` label | — | does not exist anywhere |

So the very first setting already demonstrates the propagation problem you want the API to own: **the business name is stored twice and the two can silently disagree.** Rename the business in the record and the live site still says the old name. And the site copy is in the *draft*, so changing it doesn't reach the public site until publish — a consequence a low-tech user will not anticipate and the AI has to say out loud.

That's a good thing, not a problem: it makes the API's job concrete on day one rather than theoretical.

## The API and its documentation are one artifact, not two

You asked for an API plus documentation so the settings chat knows when a setting is right or wrong. The project already has exactly this mechanism and it would be a mistake to build a second one:

- A **surface declaration** (`tools/generate/src/cli/ai/l1-surface.json`, `library-surface.json`) declares operations *and* carries the prose — an `overview`, per-parameter descriptions, and error messages written as advice rather than codes. Look at `library-surface.json`'s `AMBIGUOUS`: *"that name fits more than one item, and guessing which would be a wrong answer that looks like a right one."*
- That declaration is **projected** into the role's tool manual; `instances.json` grants a role specific operation groups, so a session is never told about a capability it wasn't given.
- `roles.ts`'s header argues this explicitly: a hand-written inventory of tools "is precisely the text that is still describing last month's surface six weeks later, and it is worse than no inventory because the model believes it."

So "documentation for the settings chat" = a `settings-surface.json` whose prose teaches the judgement, plus refusals that teach at the moment they fire. Not a DOC ticket that drifts.

**The corollary I'd hold as a rule: one API, two callers.** The left-hand pane's form and the AI's tool call the same endpoint. Checks, propagation and audit cannot then diverge between the human path and the conversational path.

## The non-obvious cost: this is the project's *second* chat role

Today there is exactly one (`CONSULTANT_ROLE`), and the session machinery assumes it:

- `sessionIdFor(slug) = 'site-<slug>'` and "one `SessionManager` per site" (`host-core.ts:427,450`)
- the priming carries a mandatory site line (`siteLine`), and `registerSiteProviders` binds a slug

But **settings are business-scoped, not site-scoped** — a business has several sites (DOC-40 §2.3) and the subdomain/business name sit above any one of them. So the settings session needs a business-keyed session id and manager, and a role whose priming doesn't assume a slug. That's the real work in these two REQs; the tab itself is cheap (a fourth `TABS` entry with `fill: true`, and `createChatPanel` is already site-agnostic by REQ-127 — it takes a session and nothing else).

## Four decisions I need before writing the REQs

1. **Is the `1stc.site` label per site or per business?** Your epic leaves this open (§Open questions 1). I'd say **per site** — DOC-45 §3 says a host names a site, and one label per business makes a second site unreachable. Allocated at site provision from the slugified business name, discriminator on collision.

2. **Is there a site *display name*, and can the slug change?** Right now a site has only a slug. If Settings is to list sites meaningfully, either the slug becomes user-facing (and then renaming it is an addressing change with the same consequences as the subdomain label), or we add a display name and keep the slug opaque. I'd add a **display name** and leave the slug alone — it's cheap, and it stops a cosmetic rename from being an addressing event.

3. **Does the left pane edit directly, or is the chat the only writer?** Your epic says Settings is "a record-and-status surface, not a workshop", which reads as chat-only. I'd push back for these three strings: making someone converse to fix a typo in their business name is the friction we're supposed to be removing. My proposal — **the pane edits the simple strings directly; the chat owns anything with consequences** (the subdomain label now, DNS later) — with both going through the same API so the checks are identical.

4. **Does renaming the business propagate to the site's `config.businessName`?** I'd say: **the API detects the divergence and reports it; it does not silently rewrite the site.** Rewriting touches the draft, which then needs publishing to be true in public — a hidden effect. Reporting it lets the AI say "your site still says the old name — want me to change it? It'll go live when you publish."

If you're happy with those four recommendations (or tell me where I've got them wrong), I'll write the two REQs as children of this epic: **REQ-A — the Settings tab, two-pane, business-scoped settings chat role** and **REQ-B — the names settings API and its surface declaration**, with the dependency running B → A for the chat's tools but A standing up independently with the form path.

<!-- xgd-chat-end -->