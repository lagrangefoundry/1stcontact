---
uid: comment-be13ecf2
id: COMMENT-2288
type: comment
title: Comment on chat CHAT-40
created_by: xgd
created_at: '2026-09-06T18:07:08.297924+00:00'
updated_at: '2026-09-06T18:40:50.730128+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-e6435d6a
  kind: chat_transcript
---

<!-- xgd-turn id="f33fa294-5f40-4e99-9682-c7d3f5c3a26c-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T18:06:56.406958+00:00" -->
#### You
Let's talk about site addressing. That is "What are the url[s] that can take someone to the site?"

I think there are various forms:
1) We need a "logged-in only" access to the draft site - this is what happens when you hit "Open in new Tab" on the site tab.
2) We probably need a short domain for people who don't (yet) have a domain e.g. alicesplumbing.1stc.site or alicesplumbing.1stc.io (both these second level domains are available)
3) Fully publish to their own domain - xgd.dev, alicesplumbing.com

I just had conversations on REQ-190 about slugs and uniqueness (please read the transcript) I want to have a conversation here to put all this in perspective.

I THINK the only situation we need unique slugs for is 1 and we can use the hash for that.

Obviously 2 requires global uniqueness but that's ok the user can choose that if they need it. We might buy a couple of 2nd tier domains for this purpose

<!-- xgd-turn id="f33fa294-5f40-4e99-9682-c7d3f5c3a26c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T18:10:35.069988+00:00" -->
#### Claude
Read REQ-190's body and its full chat transcript. Here's the perspective you asked for.

## First, the two questions that keep getting tangled

REQ-190 settled **identity** — every row is named by an opaque 128-bit key, and a name a human typed is never a key. It did *not* settle **addressing**, and the reason the two got mixed up is that before REQ-190 they were the same thing: `/site/<slug>/` carried no business, so the address *was* the identity, which is exactly why a chosen name had to be globally unique.

Post-REQ-190 they're separable, and that's the whole win. Addressing is now a **resolution layer**: some token in a URL → a site key → bytes. Every form below is a different resolver in front of the same store, and none of them touches the schema you just baselined. That's what "additive, not a reversal" meant.

## Second — there are four forms, not three

| | Form | Who can see it | What resolves it | Uniqueness needed |
|---|---|---|---|---|
| **0** | `1stcontact.io/site/<siteKey>/` | anyone | the key itself | **inherent** (128 random bits) |
| **1** | `app.1stcontact.io/preview/<slug>/draft/` | logged-in operators of that business | session scope → business, then slug | **within the business only** |
| **1b** | *share a draft with a client* | anyone holding the link | a minted share token | **inherent** (minted secret) |
| **2** | `alice.1stc.site` | anyone | host → site | **global, within our apex** |
| **3** | `alicesplumbing.com` | anyone | host → site | global, and DNS already enforces it |

**Your instinct is right but aimed one row off.** Form 1 needs no global uniqueness *at all* — the business is already in the session, so the slug is business-scoped and stays that way. The key already does form 0's job. The form that genuinely needs a minted unguessable token is **1b**, which you didn't list: showing a draft to a client who has no login. That's the single most common thing a designer does, and today it can't be done — "Open in new tab" hands the operator a URL behind Cloudflare Access, so anyone they send it to gets bounced.

REQ-149 D7 deleted the old `/site/<slug>/draft/<sha>/` channel, correctly, because only `1c deploy` produced it and it was a half-present feature. But the shape it deleted is close to the right answer for 1b, and I'd argue for reviving it deliberately as **"publish to an unlisted address"** rather than "expose the live draft":

- it reuses the publish machinery instead of adding a second unauthenticated render path;
- Access is hostname-scoped, so serving a draft off `app.` means punching a path-shaped hole in the gate — the thing you least want to do;
- and it's honest. What the client comments on is frozen, so it doesn't change under them while they're looking at it.

Revocable, optionally expiring, one per site (or per snapshot). That's the one place "use the hash" is load-bearing.

## Third — the subdomain label must not be the slug

This is the part that protects what REQ-190 just landed. If `alice.1stc.site` derives its label from the site's slug, the slug becomes globally unique again and you've re-imported the exact defect: two customers can't both call a site `home`, the refusal tells one of them the other exists, and a rename is a global claim.

So: **the label is its own attribute on its own row.** Something like

```sql
CREATE TABLE site_domains (
  id       TEXT PRIMARY KEY,      -- opaque, per the rule
  site_id  TEXT NOT NULL REFERENCES sites(id),
  host     TEXT NOT NULL,         -- 'alice.1stc.site' | 'alicesplumbing.com'
  kind     TEXT NOT NULL,         -- 'platform' | 'custom'
  status   TEXT NOT NULL,         -- 'pending' | 'active'
  ...
);
CREATE UNIQUE INDEX ... ON site_domains (host);
```

`UNIQUE(host)` looks like data-as-key and isn't, and the distinction is worth writing into DOC-43: **a public address is a globally-unique attribute whose uniqueness belongs to the namespace it lives in, not to our identity model.** DNS is global whether we like it or not. The existence-oracle objection from DOC-43 §4 doesn't apply either — the value's entire purpose is to be publicly resolvable, so "someone holds this label" is not a disclosure. The row still has an opaque key, so a host can be *changed* without rewriting anything, which is the property the rule actually exists to buy.

## Fourth — a host names a *site*, not a business

Tempting to say host → business, because DOC-40 v1 gives a business exactly one site. But §2.3 already commits to several sites per business (two brands, two locations, shared customer list), and at that point `alicesplumbing.com/<slug>/` is not an address anyone would accept for a custom domain. A domain names a site; that's how the world works, and it's uniform across forms 2 and 3.

Business still falls out of it — a site names its business, so host → site → business is one extra hop and gives you the identity context when you need it.

## Fifth — one canonical address, everything else redirects

Once forms 2 and 3 exist, a site answers on up to three addresses. That's a duplicate-content problem and, more practically, a "which one do I put on the van?" problem. Rule:

> A site has exactly one canonical address at any moment — custom domain, else platform subdomain, else `/site/<key>/`. Every lesser form 301s to it, and pages carry `<link rel="canonical">`.

With the caveat that the 301 only fires when the canonical is *active*, so `/site/<key>/` stays the always-works address while a custom domain's DNS or cert is still settling. That's worth keeping deliberately rather than retiring: it needs no configuration and cannot break.

This is free, incidentally, because of REQ-109 — pages reference their assets document-relatively, so the same frozen revision serves correctly under any prefix with no re-render. Worth verifying the same holds for *internal nav links* before committing to it; I didn't check that.

## Sixth — which apex, honestly

The wildcard DNS record and wildcard cert cost the same either way, so this is purely brand, trust and longevity:

- **`.site`** — reads as what it is, cheap, but it sits on the higher-abuse-rate TLD lists some spam filters and reputation services weight against. For a business whose site is their front door, that's a real if small tax.
- **`.io`** — short and trusted, but it's a ccTLD for a territory whose sovereignty is being transferred, and there's genuine unresolved risk about the long-term future of the namespace. For addresses you're asking customers to treat as permanent, that's the wrong kind of risk to take on their behalf.
- **`sites.1stcontact.io`** — costs nothing, no new registration, no new reputation to build, and says who's hosting. Longer, and slightly more "hosted somewhere" in feel.

My lean: buy both short domains if they're cheap (they're cheap insurance and a competitor holding `1stc.site` would be annoying), but ship on the one that isn't `.io`. The interim address is *interim* by design — the whole product motion is toward form 3 — so optimising it for beauty over durability is the wrong trade.

Which raises a product question rather than a design one: **should we sell them the domain?** Registering `alicesplumbing.com` on their behalf at cost removes the single largest friction step between form 2 and form 3, and it's the natural moment to do it. Worth a decision, not worth designing here.

## What I'd park, loudly

**The portal on a customer's own domain.** DOC-40 §2.1's recursion says Bob logs in to Alice's Plumbing and reaches his portal. Today the portal is at `app.1stcontact.io/account` because identity lives on that origin, and `1stcontact.io` is GET-only, edge-cached and authenticates nobody — one cached portal page would be everybody's answer. Once Alice has `alicesplumbing.com`, Bob's portal wants to be at `alicesplumbing.com/account`, and that needs an *authenticated* surface on a customer host. That's the same fork REQ-183 D1 already flagged as provisional, and form 3 is what forces it. It doesn't block anything below, but it means "custom domains" is not purely a public-bytes feature and shouldn't be scoped as one.

---

Two things I'd like your call on before I write anything up:

1. **Is 1b (share a draft with a client) in scope for this conversation, or a separate thread?** I think it's the highest-value gap on the list and the only one that needs a new secret, but it's also the only one that isn't strictly about *addressing*.
2. **Do you want this as a doc, or as tickets?** My read: one doc — the addressing model, with the uniqueness-scope table and the canonical rule — since it amends DOC-43 (§4's uniqueness-scope reasoning) and DOC-12 §9's per-business-hostname sketch, both of which currently under-describe this. Then tickets fall out of it cleanly: the `site_domains` table plus wildcard subdomain, then custom hostnames, then the share link.

<!-- xgd-turn id="2a327b3f-6a6b-4334-bdd5-0a53c0429996-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T18:38:21.543679+00:00" -->
#### You
What is the usecase for form 0 isn't it covered by form 2?

Do we even need a slug now? Form 1 can be addressed with the SHA

<!-- xgd-turn id="2a327b3f-6a6b-4334-bdd5-0a53c0429996-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T18:40:50.146307+00:00" -->
#### Claude
Both questions cut in the same direction. Let me check the code before I answer, because the second one depends on what the slug is actually still doing.

Checked the code. Both answers are "yes, and further than you'd think" — here's the evidence.

## Form 0: mostly redundant, but it has one job that isn't about production

You're right that form 2 covers form 0's *product* use. If every site gets a platform subdomain, `1stcontact.io/site/site_a3f9…/` is an ugly second address for something that already has a readable one, and I flagged the canonicalisation problem that creates last turn.

The job it keeps is: **addressing a site where there is no DNS to address it by.** Host→site resolution needs a real namespace and a wildcard cert. Path→site works on `localhost:8787`. So `1c serve`, the workerd dev server, CI, and the screenshot worker all need a path grammar, and none of them can have a host mapping.

So form 0 isn't a fourth product address — it's the **substrate** address. Which resolves the duplicate-address worry cleanly:

- **In production**, a site always has an active domain, so form 0 always 301s to the canonical. Nothing links to it, nothing indexes it.
- **In dev/CI**, there is no domain row, so form 0 serves, and it's the only address.

One obligation falls out: **the label must be auto-assigned at provision**, or there's a window where a site has no canonical address and form 0 becomes a public address by default. Slugified business name, short discriminator on collision, freely changeable afterwards — the ordinary signup-name flow. Same shape as REQ-190's `unnamed`: the default exists and visibly asks to be changed, rather than blocking the customer on a choice before they have anything.

## The slug: it's already vestigial, and the code says so

This is the stronger of your two questions. Look at what the store port actually does:

```
tools/generate/src/store/d1r2-store.ts
  createDraft(slug) → siteIdOf(slug) → ...
  hasDraft(slug)    → siteIdOf(slug) → ...
  readPages(slug)   → siteIdOf(slug) → ...
  listAssets(slug)  → siteIdOf(slug) → ...
  forget(slug)      → siteIdOf(slug) → ...
  siteKey(slug)     → siteIdOf(slug)          ← a method whose entire job is the conversion
```

**Every port method takes a slug and immediately spends a D1 round trip undoing it.** There's a public `siteKey(slug)` whose only purpose is to expose that conversion to callers — and it's called from exactly two places (`router.ts:1454`, `router.ts:1921`), both of which just want to build a public URL.

The slug is a pure indirection layer that every single call has to unwind. And there's nothing left underneath it:

- child tables are `PRIMARY KEY (site_id, name)` — no slug (`0001_baseline.sql:129`, `:141`)
- R2 is `draft/<siteId>/` and `sites/<siteId>/rev/` — no slug
- `published_sites` is deleted — no global claim
- the public address is the key today and the host tomorrow — not the slug

What's left is `UNIQUE (tenant_id, slug)` on `sites` and the string in `/preview/<slug>/draft/`. That's it.

### It's two jobs wearing one name

1. **A URL-safe addressing token** in the preview URL. This should be the key. It's an iframe `src` and an open-in-new-tab that the operator *looks at* rather than shares — readability buys nothing, and it costs a lookup on every call.
2. **The human label the builder lists sites by.** This should be `sites.name`: prose, no character restrictions, **and no uniqueness constraint at all.**

So the collapse is:

| today | after |
|---|---|
| `sites.slug` + `UNIQUE (tenant_id, slug)` | `sites.name` — prose, unconstrained |
| `STARTER_SLUG='unnamed'` + `businessName='Unnamed'` | one constant, `Unnamed` |
| `siteIdOf(slug)` on every port call | gone — the port takes a key |
| `siteKey(slug)` | gone — the caller already holds it |
| slug-shape refusal in the port | gone (public-site's key pattern stays) |

Renaming a site becomes *entirely* unconstrained — no claim, no refusal, no error path, not even within the business. Two sites called "Shop" is the operator's problem, not a schema violation.

That's REQ-190's own rule followed one step further than it went. It said a slug is an attribute, then left a unique index on it — which is a key doing its job in a smaller room. And there's a tell: REQ-190 justified keeping two constants as *"so editing the prose can't silently rewrite a key."* That argument only holds while the slug is a key or an address. Remove both jobs and the justification evaporates on its own, which is decent evidence the job really is gone.

### Two things this does *not* reach

**Page slugs stay.** `site_pages.name` — `home.json`, `about.json` — is the path *after* the host (`alicesplumbing.com/about`). That's a genuine public address and it genuinely must be readable. Nobody wants `alicesplumbing.com/page_a3f9…`. Worth stating explicitly, because "do we need slugs" reads as if it might reach these.

**The file-backed tier keeps directory names.** `storage/sites/xgd/` is git-tracked, single-user, has no tenant and nothing to collide with; `storage/sites/site_a3f9…/` would be miserable to work in. That's a directory name in a filesystem, not a slug in a schema. REQ-190's transcript left this open (question 5: *"the ticket says 'across the schema' and should say which schema"*) — this is the answer, and it should be written down rather than inferred.

### The thing that makes this urgent rather than tidy

Dropping the column is a schema change, and the baseline has now been applied to remote and local D1. But there's one tenant, no users and no sites in either, so it's still a wipe-and-reapply that costs nothing.

**That window closes the moment there is a real customer**, and after that the same change is a create-copy-drop-rename migration on every child table. If we're doing it, the argument for doing it now is much stronger than the argument for the change itself.

---

I haven't traced every call site — I checked the schema, the store port and the two `siteKey` callers. `import-site.ts` and `assemble.ts` both carry a `slug` and I don't yet know which side of the fs/D1 line they fall on.

Where I'd go next, in order:

1. **Write the addressing model down as a doc** — the four forms, form 0 as substrate, host→site, one canonical address. It amends DOC-43 §4 and DOC-12 §9, both of which currently under-describe this.
2. **Kill the slug** as its own ticket, and do it before the domains work, because the domains work would otherwise be built on top of a token that's about to disappear.
3. **Then** `site_domains` + wildcard subdomain, then custom hostnames, then the share link.

Want me to scope (1) and (2) against CHAT-40 now? I'd want your call on the auto-assigned-label rule and on whether `sites.name` gets *any* uniqueness (I'd say none) before writing either.

<!-- xgd-chat-end -->