---
uid: comment-0b245b1f
id: COMMENT-2880
type: comment
title: Comment on epic EPIC-4
created_by: xgd
created_at: '2026-09-12T22:26:31.983715+00:00'
updated_at: '2026-09-13T20:41:09.185725+00:00'
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

<!-- xgd-chat-end -->