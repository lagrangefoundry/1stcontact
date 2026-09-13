---
uid: comment-0b245b1f
id: COMMENT-2880
type: comment
title: Comment on epic EPIC-4
created_by: xgd
created_at: '2026-09-12T22:26:31.983715+00:00'
updated_at: '2026-09-13T22:10:22.695634+00:00'
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

<!-- xgd-turn id="a65d6961-239a-4213-8f79-37321d5122a1-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T20:22:20.649485+00:00" -->
#### You
ok let me talk about lifecycle:

1. I imaging provisioning a new account with an Unnamed business. One of the onboarding jobs of the user will be to rename the business. However this is not final - the business name is purely internal (and per our design rules cannot be a db key) the user is allowed to change the business name at any time

2. I feel like the slug in the URL may be redundant. It does allow a user to read the URL and know that the like is to that business/site but this URL is not for sharing and only every used during site development. I think we could safely remove the slug and simplify our story

3. Separately the user needs to choose a 1stc.site subdomain (if they don't yet have a domain name) the subdomain must be unique over 1stc.site subdomains. (aside: And we need to restrict - inappropriate ones)

<!-- xgd-turn id="a65d6961-239a-4213-8f79-37321d5122a1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T20:24:29.202791+00:00" -->
#### Claude
Three good simplifications. I agree with two outright, and the third I'd take in a narrower form than you've proposed — for a reason worth seeing.

## 1. Lifecycle: agreed, and it exposes a latent bug we'd be about to trip

"Internal, not a key, changeable at any time" is consistent with what we settled last turn — a `UNIQUE (owner_account_id, name)` constraint is not a key. Nothing references `tenants.name`; the tenant id stays the only address. The constraint stops two indistinguishable rows appearing in one account, and that's all it does.

But there's a problem sitting in the code right now. `sessionIdFor(slug)` returns `` `site-${slug}` `` (`host-core.ts:427`), and since BUG-90 the slug is derived from the business name. The transcript lives in a ticket found by `fields.session_id`. So **the first time someone renames their business, the assistant's entire conversation is orphaned** — not deleted, just unreachable, replaced by an empty session. Nothing triggers it today because no rename path exists. The feature we're about to build is the trigger.

That's independently decisive for point 2.

## 2. The slug: you're right about what you're looking at, but it's two things

- **(a) The store's addressing primitive.** Three store implementations (`d1r2-store` 82 refs, `memory-store` 53, `fs-store` 50), `edit.ts` (233), `router.ts` (93), the conformance harness, publish, preview, the whole CLI. And the local file store is genuinely multi-site and *not* tenanted — `storage/sites/` holds `1stcontact`, `gigabytealchemy` and `xgd` side by side, addressed by exactly this name. Removing it there isn't a simplification, it's a rewrite of the store contract.

- **(b) A name the user sees, derived from the business name, in `/preview/<slug>/<channel>/`.** That's the redundancy you're pointing at, and it is real: `api.js` already carries the business separately in `businessScope`, so with one site per business the slug in that URL tells the reader nothing the scope doesn't already say.

So my recommendation: **keep the column, sever it from the business name, stop showing it.** At provision it gets an opaque value rather than `businessSiteName(name)`. Then:

- nothing derives from the business name any more except the label
- "does the slug follow a rename?" — the question I put to you last turn — simply evaporates
- the session id stops moving, so the conversation survives a rename
- the preview URL stops leaking a name it has no reason to carry
- the store contract, the CLI, the fs layout and the conformance harness are untouched

This lands your simplification — the user never sees it, never chooses it, never renames it — for a one-line change at provision instead of a three-store refactor. It also finishes REQ-190's opaque-keys argument rather than contradicting it. The one thing I'd want to verify before writing it up is whether the builder chrome displays the slug anywhere today; `app.js` has 31 references and most look like addressing, but that needs a pass rather than an assumption.

## 3. The subdomain — and the lifecycle question your point 3 raises

Note how cleanly this inverts against the business name, which is worth stating explicitly in the docs the settings chat reads:

| | Business name | `1stc.site` label |
|---|---|---|
| Visible to | the owner and us | the public |
| Unique across | one account | **every label ever issued** |
| Changing it | free, no consequence | old one retained, never re-issued |
| Asked for | early and cheaply | deliberately |

**When is it allocated?** Your epic cites DOC-45 §7 — assigned at provision from the slugified business name — but you've just said the user *chooses* it. Those conflict, and at provision the name is `Unnamed business`, so the auto-assigned label would be `unnamedbusiness`, which is worse than having none.

I'd resolve it by moving the moment: **allocate the label at first publish, not at provision.** Before publish the site has no public address and needs none. At publish the user is asking to go live, so they are by definition ready to make the choice — which answers the epic's real objection (don't block someone on a choice they aren't ready for) without assigning them a name derived from a placeholder. It's also what keeps DOC-45 §4 safe: once the `/site/<key>/` path grammar is deleted, publishing without a label would produce an unreachable site, so requiring it at publish is the guard.

**On restriction — three tiers, and only two of them can be mechanical:**

1. **Syntactic** — DNS label rules: 1–63 chars, `a-z0-9-`, no leading/trailing hyphen, and refuse the `xn--` prefix so nobody hand-rolls a punycode lookalike. Mechanical.
2. **Reserved** — `www`, `mail`, `api`, `admin`, `ns1`, `mx`, `_acme-challenge`, plus product-reserved `app`, `portal`, `support`, `1stcontact`. A list. This is TODO-6 §2's.
3. **Inappropriate** — the hard one, and I'd split it rather than treat it as one list. **Impersonation refuses outright** (banks, government, us) because the harm lands on a third party immediately and there's no benefit of the doubt to give. For the slur/obscenity tail, a substring blocklist has the Scunthorpe problem and will eventually refuse a real furniture restorer's real business name — which for this product is a worse failure than briefly allowing something we later revoke, especially since we're already committed to retention and revocation.

One rule I'd hold firmly: **the settings AI must not be the gate.** It would be judging its own user's request and can be talked out of a refusal. The list refuses; the AI's job is to explain the refusal and help find an alternative — which is exactly what the surface declaration's error prose is for, and why writing those refusals well is part of the API work rather than a doc afterthought.

Tier 3 is TODO-6's to build; the initial REQs only need the seam it plugs into.

## What I need before writing

Last turn's four are still open (I'd now drop "does the slug follow a rename" — replaced by the opaque-slug proposal above), plus:

- **Opaque slug at provision, or do you want to push on removing the column entirely?** I recommend opaque.
- **Label at first publish, rather than at provision?** I recommend at publish.
- **Is the label in the initial REQ scope at all,** or do the first REQs cover business name only and the label follows once TODO-6's PSL work is moving? Your scope note says "business, site and 1stc.site subdomain name" — but with the slug gone opaque there's no longer a "site name" to configure, so the initial scope may be just the business name plus the label's storage and uniqueness.

<!-- xgd-turn id="7ae4186f-e1f2-4fe6-be0f-750f9c187b04-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T20:33:48.364273+00:00" -->
#### You
Your epic cites DOC-45 §7 — assigned at provision from the slugified business name — but you've just said the user *chooses* it. <-- DOC-45 is wrong (please change it). This has to be user chosen and it may take them some time. It is a dependency on publication. To go live they either need a 1stc.site hostname OR a custom domain OR both.

I think they should be able to change the hostname but only to another one that hasn't yet been taken and doing so relinquishes the original

Lets punt on the obscenity question for now.

<!-- xgd-turn id="7ae4186f-e1f2-4fe6-be0f-750f9c187b04-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T20:36:15.596281+00:00" -->
#### Claude
Two things there: DOC-45 needs editing, and one of them reverses a decision the epic currently argues for. Let me read §7 first.

DOC-45 §7 is rewritten — it now says the label is customer-chosen, that publication is the gate (`1stc.site` label **or** custom domain **or** both), and that changing relinquishes the original. I kept the doc's shape: the old rule and both arguments that held it up are recorded under "What this replaces, and why", because tickets cite §7 and a silent reversal would leave them pointing at something that no longer exists. The falsifier flipped too — it was "a provisioned site with no address", which is now the ordinary case; it's "a published site with no host mapping".

I also settled §11 item 4 (per business, one at a time — reopens when a business holds two sites) and opened two new items for what §7 deliberately doesn't say.

## This reverses the epic, and you should see it

EPIC-4's body currently argues the opposite:

> **Old labels are retained and never re-issued.** A customer who put `alice.1stc.site` on a van and then renames needs the old one to keep working, and re-issuing it to someone else would hand over whatever inbound links and reputation the previous holder built.

Your rule kills the first half outright — one label at a time, no alias, the van is stale. That's a real simplification (no redirect layer, no multi-label holding, no "which one is primary") and I think it's the right trade at this stage.

But the second half is separable and you haven't ruled on it. "Only to another one that **hasn't yet been taken**" is ambiguous exactly there: does a relinquished label go back in the pool, or is it retired? **I'd retire it.** It's one status value instead of deleting a row, and it's the difference between `alice` becoming available to a stranger who then receives the van's traffic, versus simply being gone. Cheapest possible insurance against the only genuinely bad outcome in this design.

## One new seam this creates

"To go live they need a 1stc.site hostname OR a custom domain OR both" makes `publish` refuse when a business has no address — and the custom-domain half belongs to EPIC-5/6. So the check wants writing now as *"does this business have at least one address?"* over a list with two possible kinds, of which only one is implemented today. Written as `if (!label) refuse`, it becomes a wrong refusal the day custom domains land.

## Outstanding, so I can write the REQs

Sweeping up what's still open — several are from earlier turns you moved past:

1. Delete `config.businessName` from the stored site definition, making it a render-time input from `tenants.name`? *(I recommend yes)*
2. Opaque slug at provision — keep the column, sever it from the business name, never show it? *(I recommend yes; the alternative is a three-store rewrite)*
3. Discriminator on `Unnamed business` at provision, so an account's second business doesn't trip the uniqueness constraint? *(yes)*
4. Business-name uniqueness compared on a normalised form — case-folded, whitespace-collapsed — rather than exact string? *(yes)*
5. Relinquished label retired rather than returned to the pool? *(yes)*
6. Is the label in the initial REQ scope, or do the first REQs cover the business name only? With the slug going opaque there's no "site name" left to configure, so scope 1 is really *business name + label*.

Give me a yes/no sweep and I'll write them, and fold the epic correction in at the same time.

<!-- xgd-turn id="6e2d33bc-bf25-481b-88f2-1384a3eb5511-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T20:39:22.955778+00:00" -->
#### You
Hmm - lets simplify - for now lets make hostname decisions final - if they are open to arbitrary change and cannot be recycled people could go through dozens of good names.

Longer term we could charge for a namechange, a one off fee, not much money but enough to add friction.

<!-- xgd-turn id="6e2d33bc-bf25-481b-88f2-1384a3eb5511-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T20:41:09.126678+00:00" -->
#### Claude
DOC-45 §6 turns out to matter here — and it means I was too conservative with you last turn. Let me fix the doc first.

DOC-45 §7 now says the label is final. I recorded the reasoning as you gave it — free swaps plus recycling lets one business walk the good-name namespace — and recorded the fee-gated change as *future intent, explicitly not scope*, noting that §5's `site_domains` table already carries `status`, so it lands later as a new row and a status flip rather than a schema change. The falsifier gained a second clause: **any path that updates `site_domains.host` in place**. §11 item 5 dissolved.

I added one consequence you didn't state but that follows: finality decides *how the choice is asked*, not just what's stored. A permanent name, entered as free text, by a low-tech customer, is a permanent typo. Whatever asks for it has to show the whole host — `alice.1stc.site`, not a label field — and say it can't be changed, at the moment of choosing.

The punt on obscenity gets a sharper edge from this, worth noting but not blocking: if the owner can't change their name, a name we later want gone can only be revoked by us. That's an operator action, not self-service.

## I was wrong about the slug last turn

I told you removing it was a three-store rewrite and recommended an opaque slug instead. **DOC-45 §6 already proposes removing it**, with a better-informed argument than mine, and it explicitly carves out the tier I was worried about:

> **The file-backed tier keeps directory names.** `storage/sites/xgd/` is git-tracked, single-user, has no tenant and nothing to collide with […] That is a directory name in a filesystem, not a slug in a schema. […] **the rule is about the multi-tenant database.**

So `fs-store`, `edit.ts` and the CLI — the bulk of the 500-odd references I counted — are out of scope by design. What changes is the D1 port, where §6 observes that every method already opens with `siteIdOf(slug)` and immediately unwinds it. Your instinct last turn matched the recorded design; my caution was the thing that was off.

**And there's a deadline in it:**

> The window is open now and closes on the first customer. […] both hold one tenant, no users and no sites, so it is still a wipe-and-reapply that costs nothing. After a real customer exists the same change is a create-copy-drop-rename on every child table.

DOC-45's own Order of work puts §6 **first**, for a reason that lands directly on us: *"the host work would otherwise be built on a token scheduled to disappear."* That's exactly what we're about to build. So I'd now recommend the slug removal comes **before or with** the label work rather than after — it's cheaper now than it will ever be again, and doing the label first means building it on the token.

One more simplification that falls out: §6 proposes the slug becomes `sites.name`, "the human label the builder lists sites by". With one site per business there is no list to label. So `sites.name` may not need to exist at all.

## Outstanding sweep

1. Delete `config.businessName` from the stored site definition, making it a render-time input from `tenants.name`? *(yes)*
2. **Remove the slug per DOC-45 §6, and sequence it first** — correcting what I told you last turn. *(yes)*
3. Does `sites.name` need to exist at all, given one site per business? *(I suspect not)*
4. Discriminator on `Unnamed business` at provision? *(yes)*
5. Business-name uniqueness on a normalised form rather than exact string? *(yes)*
6. Initial REQ scope = business name + `1stc.site` label, with no "site name" left in it?

EPIC-4's "Old labels are retained and never re-issued" paragraph is now wrong twice over — there are no old labels at all. I'll record that as a correction section in the epic, matching the one already there from yesterday, when I write the REQs.

<!-- xgd-turn id="9cdc1892-a60b-4f79-9a05-4a1f19a579f9-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T21:12:09.113669+00:00" -->
#### You
ok can you propose the division of work between tickets?

<!-- xgd-turn id="9cdc1892-a60b-4f79-9a05-4a1f19a579f9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T21:13:14.542759+00:00" -->
#### Claude
Here's the split I'd propose. Four tickets, and three of the cut lines need justifying.

| | Ticket | Owner | Depends on |
|---|---|---|---|
| **1** | **Retire the site slug** | standalone REQ — *not* an EPIC-4 child | — |
| **2** | **The business name is stored once and may change** | EPIC-4 | 1 (soft) |
| **3** | **The `1stc.site` hostname: chosen once, required to publish** | EPIC-4 | 1 |
| **4** | **The Settings tab and the settings chat role** | EPIC-4 | 2, 3 |

### 1. Retire the site slug

Drops `sites.slug` and its unique index; the D1 port takes a site key, so every method stops opening with `siteIdOf(slug)`; `/preview/<key>/`; the file-backed tier untouched per §6's carve-out. Also re-keys `sessionIdFor` onto the site key, which closes the latent bug where a rename would orphan the assistant's whole conversation.

**Why it isn't an EPIC-4 child.** It's DOC-45 §6 — addressing infrastructure with nothing to do with a settings surface. The publish path, EPIC-5, EPIC-6 and EPIC-7 all sit on it too, and filing it under the settings epic makes a shared prerequisite invisible to three epics that need to see it. **Sequenced first**, for §6's own reason: the window closes at the first customer, and everything below would otherwise be built on a token scheduled to disappear.

### 2. The business name is stored once and may change

`tenants.name` becomes the only store: `config.businessName` leaves the site definition and becomes a render-time input. Uniqueness on a normalised form per owning account, discriminator on `Unnamed business` at provision. The rename operation, returning **a list of effects rather than a boolean** — published pages stale until republish, page copy may still name the old business.

Ships with its own entries in the settings surface declaration, prose included.

### 3. The `1stc.site` hostname: chosen once, required to publish

`site_domains` per DOC-45 §5. Global uniqueness on `host`, the reserved technical family, **no update path on `host`** — which is the falsifier §7 now carries. Publication gated on *"this business has at least one address"*, written over two address kinds with only the platform one implemented, so custom domains land as a row rather than as an edit to the check.

Also ships its own surface entries — and this is where the prose earns its keep, because "this cannot be changed" has to reach the customer at the moment of choosing.

**Why 2 and 3 are separate** despite both being "names": they share no data, no constraint and no lifecycle. One is internal, freely changeable and unique within an account; the other is public, final and unique across the world. The only thing they have in common is appearing on the same tab, which is ticket 4's problem.

### 4. The Settings tab and the settings chat role

Fourth `TABS` entry, two-pane split, the form path for the business name, and the read-and-status view of the hostname. Then the genuinely novel part: a **business-scoped session** — the project's first, since `sessionIdFor` and "one `SessionManager` per site" both assume a site today — and the project's **second role**, which means a new entry in `instances.json`, priming that carries no site line, and the grant that decides which settings operations the role can reach.

**Why the tab and the role are one ticket:** a two-pane settings page whose right pane has no assistant isn't a shippable half. **Why this is where the estimate lives:** the browser work is a few hours; the business-scoped session and second role are where the unknowns are.

---

### The cut line I'd defend hardest

**The AI-facing declarations live in the capability tickets, not in a ticket of their own.** You asked for "an API to change the names exposed to the AI with documentation", which reads naturally as one deliverable — but `roles.ts` argues against centralising it, and the argument is good:

> a hand-written inventory of tools is precisely the text that is still describing last month's surface six weeks later, and it is worse than no inventory because the model believes it.

If the prose for "rename the business" ships in a different ticket from the rename operation, they drift by construction. So each capability declares its own operations and writes its own refusals; ticket 4 owns only the role, the grant and the priming — the parts that are about *who is reading the manual*, not what's in it.

### What's still unanswered

Tickets 2 and 3 are writable now from what you've decided. The four sweep items I haven't heard back on all sit inside ticket 2 — delete `config.businessName`, normalised uniqueness, the default-name discriminator, and whether `sites.name` survives at all. If any of those go the other way it changes ticket 2's body, not this division.

Say go and I'll write all four, plus the EPIC-4 correction retiring the "old labels are retained" paragraph.

<!-- xgd-turn id="8555989d-699b-4083-bc7a-b96449e26546-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T21:15:20.365272+00:00" -->
#### You
Identify the child request/bug tickets needed to realize this epic's design. Create each one via `xgd ticket create --epic-parent <this epic's uid>`, and set depends_on between the new children to reflect build order. A child can live in a different registered project when that's where the work belongs — add `--project <name>` (or a `ticket://org/repo/` store reference) to the create call; --epic-parent works the same way whether the epic and the child are in the same project or not. If this epic already has epic_children, add further children incrementally (diff against the existing list) — do not replace what's already there.

<!-- xgd-turn id="8555989d-699b-4083-bc7a-b96449e26546-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T21:19:27.331478+00:00" -->
#### Claude
No existing children, and `depends_on` is a list of human IDs in `fields`. Creating them now.

Now the epic — its children list and the decisions this discussion reversed.

Four tickets created and wired.

| | | Depends on |
|---|---|---|
| **REQ-236** | Retire the site slug: the D1 store addresses a site by its key | — |
| **REQ-237** | The business name is stored once, and may change at any time | REQ-236 |
| **REQ-238** | The `1stc.site` hostname: chosen once, and required before publishing | REQ-236 |
| **REQ-239** | The Settings tab, and the settings chat role | REQ-237, REQ-238 |

`epic_children` holds 237, 238 and 239.

**REQ-236 is not an epic child, deliberately** — that's a departure from your instruction's literal form, so flagging it. It's DOC-45 §6, and the publish path plus EPIC-5/6/7 all sit on it; filing a shared prerequisite under one epic hides it from the other three. The other children depend on it, so the build order is still expressed. Say the word and I'll reparent it.

**EPIC-4 updated.** Children table with the rationale for each cut line, plus a `## Correction, 2026-09-13` section in the style of the existing one. It withdraws "the label is assigned, never demanded up front", withdraws "old labels are retained and never re-issued" (there are no old labels now), withdraws scope item 3's multi-site premise, settles all three open questions, and corrects the "What exists today, verified" section — which said the business name lives in `tenants.name` without mentioning the second copy in the site definition. Original body untouched; the correction supersedes rather than rewrites.

## Calls I made that you never explicitly answered

All five are written into the ticket bodies as decisions, so overturning any of them is a body edit rather than a rethink:

- `config.businessName` leaves the stored site definition, becoming a render-time input (REQ-237)
- The slug goes entirely rather than becoming opaque (REQ-236)
- `sites.name` is not created at all — there's no list to label (REQ-236, with the reasoning and the one-migration cost of adding it later)
- A discriminator on `Unnamed business` at provision (REQ-237)
- Uniqueness compared case-folded and whitespace-collapsed (REQ-237)

And one place where **REQ-239 pushes back on the epic**: the epic says Settings is "a record-and-status surface, not a workshop", which reads as chat-only. REQ-239 has the left pane editing the business name directly, with the assistant owning the hostname — on the grounds that making someone converse to fix a typo in their own business name is the friction we're removing. Both paths call the same API, so the checks can't diverge. If you'd rather it were strictly chat-only, that's REQ-239's body.

<!-- xgd-turn id="e023fe1a-2335-473b-a932-6c98b6d4f757-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T21:35:10.255944+00:00" -->
#### You
I'm sorry these are details that I just don't understand the consequences of. Can you rephrase each question to tell me what it means for the product architecture/future modularity or user experience

<!-- xgd-turn id="e023fe1a-2335-473b-a932-6c98b6d4f757-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T21:36:12.168008+00:00" -->
#### Claude
No apology needed — these were phrased as implementation choices when what you need is the consequence. Here they are again, ordered by how much the answer matters.

---

## 1. Delete the site's short name, or just make it meaningless? *(the only irreversible one)*

Every site has a short internal name like `colesbakery`, used to look it up. Nothing public uses it — it appears only in the preview URL you see while building. So it's a **second way to identify a site**, alongside the real ID.

Two ways to name one thing is where bugs breed, and we found one already: because the short name is derived from the business name, renaming a business would silently move the customer's assistant session and **lose their entire chat history**. Not delete it visibly — replace it with an empty conversation.

- **Delete it:** the whole category of bug goes. A site has one identity.
- **Make it meaningless:** smaller change today, but a redundant identifier stays in the system permanently, and anyone reading the code in two years has to work out which of the two to trust.

**The timing is the real stake.** The database currently holds no customers. Deleting the column now is a wipe-and-reload that costs nothing. After the first real customer it becomes a careful data migration across seven tables. DOC-45 wrote this down as *"the window is open now and closes on the first customer."*

**My recommendation: delete, now.** It's the one decision on this list that gets meaningfully more expensive if you defer it.

---

## 2. Should the website store its own copy of the business name?

Today the business name is written into the site's data when the site is created, and never updated. Rename your business and **your website still shows the old name in the browser tab.**

- **One copy:** the name lives in one place, the site reads it when it's built. Rename, republish, correct everywhere.
- **Two copies:** we write code to copy it across on every rename, and accept a state where the record and the website disagree.

**The architectural stake is the pattern, not this one field.** Everything else a site displays is coming: phone number, address, opening hours, logo. If the answer is "the site is generated from the business's data", they all inherit it for free. If it's "the site keeps its own copy", every future setting arrives with its own sync bug to write and its own way to drift.

**Cost:** the site's file format changes, so everything reading or writing a site definition needs a pass. Bounded, but real.

**My recommendation: one copy.** You're choosing the rule for every setting after this one.

---

## 3. Type in a box, or ask the assistant?

To change your business name — do you edit a text field, or converse with the AI?

The epic argued Settings is a place you *read*, with the assistant doing the work. **That's right for the hostname**: permanent, public, one shot, genuinely deserves a conversation that makes sure the customer understands before committing.

**It's wrong for the business name.** It's a typo fix. Making someone talk to an AI to correct a typo is worse than a text box, and it's the friction this product exists to remove.

The thing that makes "both" safe: **one API, two ways in.** The box and the assistant call the same operation, so the box can't allow something the assistant would refuse. This also matches what you originally asked for — an API "exposed to the settings chat role" implies the API stands on its own with chat as one consumer.

**My recommendation: box for the business name, assistant for the hostname.**

---

## 4. Should a second business be allowed to be born broken?

New businesses are called "Unnamed business" until renamed. We're adding a rule that one account can't hold two businesses with the same name.

So if someone creates a second business before renaming the first, **they get refused for a name we chose on their behalf** — an error for something they didn't do.

The fix is to call the second one "Unnamed business 2".

**My recommendation: yes.** A rule the system itself can trip is a rule people learn to work around.

---

## 5. Is "Cole's Bakery" the same name as "cole's bakery"?

When we check for a duplicate, do we compare exactly, or ignore capitals and extra spaces?

- **Exactly:** those count as different, so a customer ends up with **two entries in their business switcher that look identical and can't be told apart** — which is the precise thing the rule was added to prevent.
- **Ignoring case and spacing:** they count as the same, and the second is refused with an explanation.

One limitation either way: this only works within one account. Someone with access to two businesses owned by *different* people can still see two identical names. That's a display problem, solved separately.

**My recommendation: ignore case and spacing.**

---

## 6. Should a site have a name of its own?

Separate from the business's name. Today one business has exactly one site, so a site's own name would always just be a second copy of the business's name.

It only starts to mean anything if a business has several sites — "the bakery site" and "the wedding cakes site".

- **Leave it out:** nothing changes. Add it in a few years alongside the site selector, as one small database change.
- **Put it in now:** a field nothing displays and nobody sets, which will probably be the wrong shape by the time it's needed.

**My recommendation: leave it out** — it matches your own "generalise in a few years if there's demand".

---

None of these block each other. Answer the ones you have a view on and I'll take the recommendation on the rest.

<!-- xgd-turn id="3bc5c3b2-6913-43eb-bc0b-07117cc6cb17-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T21:58:20.831977+00:00" -->
#### You
1. Sure delete it
   2. This depends what you mean, I think the website should be composed of standalone characters if my website has the title of my business foo and I later change my business to be called bar, I do not expect the website to be automatically updated. I need to do that there are so many implications for appearance that site changes need to be explicit particularly something as important as the main title. So if you're talking about the user facing name, I do not want it to be automatically updated. If you're talking about some other site representation of the business name then please explain what you're referring to.
   3. OK, this one is important and seems to have got lost in the noise of all the details my goal here is to have (1) a settings page where changes can be made to the settings this includes the business name it is displayed as a field that can be edited when clicked on (2) an API that allows the AI to do the same changes. I think the documentation takes the philosophy of the site a little bit too far, there are some things that it is just easier to do directly than through discursive communication. On the other hand I want the AI to have the ability to do it if the user asks. The experience of choosing the subdomain name will be very like the experience of choosing a main name in a domain name interface. There will be a user UI where you type in the name you press return and it says already taken OR yes you can have it. The AI has an API to this same face and can suggest names and check whether they have been taken, so it could hopefully come up with new ideas that were still available. However I still want the basic API to be available. 
   
   5. Ignore capitalization and spacing
   6. Not today

<!-- xgd-turn id="3bc5c3b2-6913-43eb-bc0b-07117cc6cb17-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T22:01:38.528600+00:00" -->
#### Claude
Question 2 is the one I under-explained. Let me check exactly what that field does before answering.

Confirmed — and you're right, I was pointing at the wrong thing. Let me be exact about what that field is.

**It is not the name on your website.** Your headline, your wordmark, your footer, any sentence naming the business — all authored page content. Nothing in this work touches a word of it. Renaming your business will never rewrite your site's visible text.

`config.businessName` has exactly **one** reader in the whole codebase (`render.ts:162`), and it does one thing: it's the fallback for the HTML `<title>` — the browser tab text and the heading in a Google result — used only when a page hasn't been given an explicit SEO title.

So your principle holds, and it changes my recommendation: **that field stays, and a rename must not touch it.**

What's actually defective is its *name*. Calling it `businessName` makes it read as a duplicate of the business record, which is what sent me down the wrong path for three turns. It isn't a duplicate — look at what it sits beside in `siteConfig`: `tagline`, `contact.email`, `contact.phone`, `contact.address`. That's a set of **things the site says about the business**, all authored, all explicit. The business record is a different thing: what *we* know the business is called.

The right model, which I think is what you've been saying all along:

| | What it is | Changes how |
|---|---|---|
| `tenants.name` | What the business is called. The record. Stored once. **Never rendered onto the site.** | Freely, any time, no consequence |
| `siteConfig` (`businessName`, `tagline`, `contact…`) | What the **site says**. Authored content. | Only by an explicit site edit |

They usually agree. They're allowed not to. What was missing isn't a sync — it's that **nothing tells you they've diverged**, which is exactly the effects report already in REQ-237: rename the business, and it tells you your site still says the old name and offers to change it as a separate, explicit edit you confirm.

Let me update the tickets.

All four tickets and the epic updated. What your answers changed:

**REQ-237** — the "store it once, delete the site's copy" decision is withdrawn and replaced with the two-names model above. A rename now explicitly propagates to *nothing*, and the effects report is what makes that safe: the caller is told what's inconsistent and each item is an **offer, never an action** — "your site still calls you Foo, shall I change that too?" I also corrected a bullet that said the site's title would be stale "until the next publish"; under your rule it's stale until somebody edits the site, because publishing re-renders what the site says and what it says hasn't changed.

**REQ-238** — now two operations, `check` and `claim`. The registrar experience you described is the design target, not an analogy. The important bit is why `check` has to be a first-class operation rather than an internal step of claiming: **it's what makes the assistant useful rather than decorative.** A customer whose first six choices are gone is exactly who needs help, and the assistant can only help if it can test its own suggestions before offering them. I also recorded that `check` reserves nothing — two people can be told "available" at once, and the loser finds out at `claim` — because a check that held a name would be a permanent lock on a public namespace obtainable by typing.

**REQ-239 and EPIC-4** — the "record-and-status surface, not a workshop" framing is withdrawn as a general rule, with your reasoning recorded: some things are easier done directly than through discursive communication. Settings are editable fields; the assistant is a second caller of the same API; neither is a fallback for the other.

**REQ-236** unchanged — delete the slug, confirmed.

## Two left

**A. You skipped question 4.** New businesses are born called "Unnamed business". We're adding a rule that one account can't hold two businesses with the same name — so someone who creates a second business before renaming the first gets refused, **for a name we chose on their behalf.** The fix is to call the second one "Unnamed business 2". Any reason not to?

**B. A new small one, from your answer to 2.** The field is called `businessName`, which reads as "a copy of the business's name" — that's what misled me for three turns. It actually means "the name this site gives the business". Renaming it to say so is a small change (the schema, one render line, three constructors, three files on disk).

The consequence of leaving it: the next person to design against this data — human or AI — hits the same trap I did, and the obvious "fix" they'll propose is the one you just rejected. The consequence of changing it: a file-format change while there are three sites in existence rather than three thousand, and a short window where old and new spellings both exist.

I'd change it, for the same reason as the slug: it's cheap now and it isn't later.

<!-- xgd-turn id="a2e8c54f-cd5c-4ce5-95d6-45b63e02dd96-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T22:05:28.361922+00:00" -->
#### You
on 4 - I thought we covered that earlier - if Unnamed exists then the new business should be Unnamed-1 if unnamed-1 exists then 2...

get the metadata correct

<!-- xgd-turn id="a2e8c54f-cd5c-4ce5-95d6-45b63e02dd96-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T22:07:07.077443+00:00" -->
#### Claude
`depends_on` takes **UIDs**, not human IDs — the dispatcher resolves entries with `ticketing.get(entry)` and the shared grammar documents these as uid-list fields. Mine are human IDs. Fixing those, plus the discriminator scheme.

Metadata fixed and question 4 recorded.

**`depends_on` was wrong on all three children.** I'd written human IDs (`REQ-236`); the field takes **UIDs**. The dispatcher's gating resolves each entry with `ticketing.get(entry)` and treats anything else as a SHA, and the shared reference grammar types `depends_on` as a uid-list field. Left as-is, the dependency gating would likely have failed to resolve and these would have looked unblocked. Now:

| | Status | Parent | Depends on |
|---|---|---|---|
| REQ-236 | draft | — | — |
| REQ-237 | draft | EPIC-4 | `request-03519106` |
| REQ-238 | draft | EPIC-4 | `request-03519106` |
| REQ-239 | draft | EPIC-4 | `request-1e65c6db`, `request-2ac88003` |

`epic_children` holds the three. `priority: high` on all four. `created_by` resolved to EPIC-4 from this session, which matches how the sibling epic's tickets came out.

**Question 4** is in REQ-237 as you specified: base name, then `-1`, `-2`, upward until one is free. Two things I made explicit so they're testable:

- the search runs against **the same normalised comparison the constraint uses**, so it can't propose a name the constraint then refuses — otherwise the two halves drift and provisioning fails on its own suggestion;
- **the suffix is not a count.** An account that provisions three and renames the middle one leaves a gap, and the next provision fills it. So `Unnamed business-2` doesn't mean "the third business", and nothing may read it that way.

## Still open

**Whether to rename `config.businessName`.** It's the trap that sent this design the wrong way for three turns — the name says "copy of the business record", the meaning is "the name this site gives the business". Renaming costs a schema line, one render line, three constructors and three files on disk, while three sites exist rather than three thousand. Leaving it means the next person to design against this data hits the same trap and proposes the fix you just rejected.

That's the only decision left before these are ready to implement.

<!-- xgd-turn id="2feea045-c34d-4c50-82ec-8313a98ee978-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T22:10:01.772950+00:00" -->
#### You
Did you populate the ticket dependencies?

<!-- xgd-turn id="2feea045-c34d-4c50-82ec-8313a98ee978-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T22:10:21.853894+00:00" -->
#### Claude
Yes — on all three children, and I corrected the format one message ago. Re-reading from disk to confirm rather than restating:

Populated, and verified on disk:

```
REQ-236  Retire the site slug                    (no deps — the root)
  ├─ REQ-237  Business name stored once          depends_on: [request-03519106]
  └─ REQ-238  1stc.site hostname                 depends_on: [request-03519106]
        └─ REQ-239  Settings tab + chat role     depends_on: [request-1e65c6db,
                                                               request-2ac88003]
```

REQ-236 carries no `depends_on` deliberately — it's the root of the chain, and DOC-45 §6 says it has to go first while the database has no customers in it.

One thing worth re-flagging, since it's the part most likely to bite: **I got the format wrong initially and fixed it last message.** I'd written human IDs (`REQ-236`), but the dispatcher resolves each entry with `ticketing.get(entry)` and falls back to treating unrecognised entries as commit SHAs. Human IDs would most likely have failed to gate — the tickets would have appeared unblocked and could have been picked up in the wrong order, which for REQ-236 specifically is the failure that costs the most, since its whole argument is "do this before anything else is built on it."

`epic_children` on EPIC-4 holds the three children (`request-1e65c6db`, `request-2ac88003`, `request-e89cbbff`). REQ-236 is intentionally outside it — it's a shared prerequisite for the publish path and EPIC-5/6/7 as well, and burying it under this epic would hide it from them. The `depends_on` edges still carry the ordering, so nothing is lost by it not being a child.

<!-- xgd-chat-end -->