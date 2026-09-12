---
uid: comment-0b245b1f
id: COMMENT-2880
type: comment
title: Comment on epic EPIC-4
created_by: xgd
created_at: '2026-09-12T22:26:31.983715+00:00'
updated_at: '2026-09-12T22:49:04.803744+00:00'
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

<!-- xgd-turn id="1c60ea9e-0679-42f5-9c4e-80f34a934a49-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T22:46:55.262723+00:00" -->
#### You
Ok lets start with the underlying data model - I think there is way more complexity there than we need.

1) Lets store the business name exactly once and lets discuss the constraints - I think it needs to be unique within an account - but every account can have a business named "unnamed", for example
2) We are not building for multi-site business today there is exactly one site in each business. At some point in a few years time, if there is demand we will generalize to multi-site businesses but not today, ok?

<!-- xgd-turn id="1c60ea9e-0679-42f5-9c4e-80f34a934a49-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T22:49:04.398642+00:00" -->
#### Claude
Good — point 2 is the bigger simplification than it looks, and it's already half-landed. Here's what I found, and where I land.

## Point 2 dissolves two of the epic's open questions

BUG-90 (your commit from an hour ago) already made it true: *"A business holds exactly one site for now"*, and the site's slug is now derived from the business name at provision. Its comment even defers the naming question to here — *"That is the onboarding question this bug deliberately leaves open: the fix is to ask, which is the settings work."*

So the epic's open questions 1 (label per site or per business?) and 2 (one page or page-per-site?) both stop being questions. One business, one site, one label. And **"site name" stops being a separate concept** — there is one name, and the site is called after it.

## Point 1: `tenants.name` is the store, and the site's copy should die

The duplication is a copy taken once and never synced. `createStarterSite` writes `starterSiteJson(slug, businessName)` at provision (`identity.ts:936`), and after that the two drift freely. The only reader of the copy I could find is `render.ts:162`, for the page `<title>`.

So: **delete `config.businessName` from the stored site definition and make it a render-time input supplied from `tenants.name`.** That keeps the renderer a pure function of what it's given, removes the field from `packages/site-schema/src/schema.ts:924`, and means there is nothing to sync because there is no second copy. Blast radius is real but bounded: schema, `render.ts`, the publish path, and three constructors (`scaffold.ts:41`, `repro.ts:160`, `portal.ts:237`).

The alternative — keep the field and have the settings API rewrite it on rename — is *more* complexity, not less: it adds a sync path, a divergence state, and a "is this draft stale" question. Not worth it.

## What's irreducible: one name, three derivations, three different change semantics

This is the part the settings API actually has to own, and it's now clear rather than tangled:

| Derived thing | On rename | Why |
|---|---|---|
| **Site slug** (`sites.slug`) | **follows, silently** | The slug never leaves the builder — `public-url.ts` confirms the published address is `/site/<opaque-key>/`, not the slug. Nothing external references it, so a rename is one `UPDATE` with no consequences. Leaving it frozen would recreate exactly the "site named after the *old* business" confusion BUG-90 just fixed. |
| **`1stc.site` label** | **does not follow** | It's on a van. Your epic already commits to old labels being retained and never re-issued. Renaming the business must *offer* a matching label, never take one. |
| **Published pages** | **stale until republish** | The `<title>`, and worse, any body copy the assistant wrote that names the business. That second one can never be auto-synced — it's authored prose, not a derivation. |

That last row is the reason I'd have the rename API return **a list of effects, not a boolean**: "slug moved to `colesbakery`; your `1stc.site` address still says `oldname` — want it changed?; 3 published pages still mention the old name." That's precisely the material the settings chat is for, and it makes the AI useful rather than decorative.

## The uniqueness constraint — four things to settle

`UNIQUE (owner_account_id, name)` on `tenants` is the shape. Four wrinkles:

1. **The platform business is exempt for free.** `owner_account_id` is NULL for 1st Contact, and SQLite treats NULLs as distinct in a unique index. Convenient, but it's accidental — worth stating as a decision rather than letting it be a side effect.

2. **The default name trips the constraint immediately.** `UNNAMED_BUSINESS_NAME = 'Unnamed business'` is a fixed string, so an account provisioning a *second* business collides on it. A constraint the system itself can trip is one that will get worked around. I'd add a discriminator at provision — "Unnamed business 2" — which also keeps the derived slugs distinct.

3. **Exact-string uniqueness won't do the job it's for.** "Cole's Bakery" / "cole's bakery" / "Coles  Bakery" are three rows under an exact match, and the switcher shows three indistinguishable entries. I'd compare on a normalised form (case-folded, whitespace-collapsed) and store what they typed. Note this is *looser* than the slug derivation, which strips punctuation entirely — so "Coles Bakery" and "Cole's Bakery" would be allowed as two businesses that derive the same slug. That's harmless (different tenants, slug is per-business) but it should be a known fact, not a surprise.

4. **The constraint does not deliver a clean switcher.** Grants span accounts — you can hold a grant on a business owned by someone else's account — so two identically-named businesses can still appear side by side in one person's switcher. Per-account uniqueness is worth having as data integrity, but it isn't the guarantee it might look like. If a clean switcher is the actual goal, that's a disambiguation-on-display problem, separately.

## What I need from you before writing the REQs

- **Delete `config.businessName` from the site definition, or keep it as a written-through cache?** I recommend delete.
- **Does the slug follow a rename?** I recommend yes, silently — nothing external points at it.
- **Discriminator on the default name at provision?** I recommend yes.
- **Normalised comparison for uniqueness, or exact string?** I recommend normalised.

Say yes/no to those four and I'll write the REQs. My instinct on the split is still two: one for the tab and the business-scoped settings chat role, one for the names API and its surface declaration — but with the model this much simpler, the second one is now genuinely small, so folding them into a single REQ is defensible if you'd rather.

<!-- xgd-chat-end -->