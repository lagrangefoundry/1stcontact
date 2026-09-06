---
uid: doc-8f1d018c
id: DOC-45
type: doc
title: 'Site addressing: what URL reaches a site, and what a name is allowed to mean'
created_by: CHAT-40
created_at: '2026-09-06T18:54:28.856907+00:00'
updated_at: '2026-09-06T18:54:28.856907+00:00'
completed_at: null
last_field_updated: created_at
status: open
fields:
  doc_kind: architecture
---

# Site addressing: what URL reaches a site, and what a name is allowed to mean

## Why this document exists

[[REQ-190]] settled **identity** — every row is named by an opaque 128-bit key,
and no name a human typed is ever a key. It did not settle **addressing**, and
the two got tangled together for a specific reason: before [[REQ-190]] they were
the same thing. `/site/<slug>/` carried no business, so the slug had to be unique
across the whole deployment for the URL to name one site — which is precisely
what made a chosen name a key.

Pulling them apart ([[CHAT-40]]) turns out to decide several things at once, and
to delete more than it adds. This document is the model that outlives those
tickets: what forms of address exist, what each one is allowed to promise, and
which names are permitted to carry meaning.

Sections state a rule, the reason it is a rule *here*, and where useful a
**falsifier** — the shape in the code that would prove the rule broken.

## 1. Identity and address are different layers

- **Identity** answers *which site* — `sites.id`, opaque, minted, never shown
  meaning through ([[DOC-43]] §1–3).
- **Address** answers *what someone types* to reach it.

Addressing is therefore a **resolution layer**: some token in a URL resolves to a
site key, and the store serves that site's bytes. Every form in §2 is a different
resolver in front of the same store.

The consequence is the point: **no form of address requires a change to how a
site is identified.** Adding custom domains, changing the interim address, or
deleting an address form are all edits to a resolver and a mapping table. This is
what "additive, not a reversal" meant in [[REQ-190]]'s transcript, stated as a
rule rather than as a reassurance about one ticket.

**Falsifier:** a change to how a site is addressed whose plan includes re-keying
a row.

## 2. The forms of address

| | Form | Who can reach it | What resolves it | Uniqueness required |
| --- | --- | --- | --- | --- |
| **A** | `app.1stcontact.io/preview/<site>/draft/` | logged-in operators of that business | session scope → business, then the site token | **none** — the business is already in the session |
| **B** | a shared draft link | anyone holding the link | a minted, revocable share token | **inherent** — it is a secret |
| **C** | `alice.<platform-apex>` | anyone | host → site | **global**, within our apex |
| **D** | `alicesplumbing.com` | anyone | host → site | global, and DNS enforces it |
| **~~E~~** | `1stcontact.io/site/<siteKey>/` | anyone | the key itself | inherent — **deleted, see §4** |

**Form B does not exist today and is the largest gap.** "Open in new tab" in the
builder hands the operator a URL behind Cloudflare Access, so anyone they send it
to is bounced. Showing a draft to a client before publishing is the most ordinary
thing a person building a site for someone else does, and it is currently
impossible.

[[REQ-149]] D7 deleted the old `/site/<slug>/draft/<sha>/` channel, correctly —
only `1c deploy` produced it and the deploy manifest was its only index, so it
was the half-present feature `CLAUDE.md` forbids. Reviving that *shape*
deliberately is a different act, and the form it should take is **publish to an
unlisted address** rather than *expose the live draft*:

- it reuses the publish machinery instead of adding a second unauthenticated
  render path;
- Access is hostname-scoped, so serving a draft from `app.` means punching a
  path-shaped hole in the gate — the last thing that origin should grow;
- and it is honest. What the client comments on is frozen, so it cannot change
  under them between looking and replying.

**Form A needs no readable token.** Its URL is an `iframe` `src` and an
open-in-new-tab that the operator *looks at* rather than shares — see §6.

## 3. A host names a site, not a business

Tempting to map host → business, because [[DOC-40]] v1 gives a business exactly
one site. But §2.3 of that document already commits to several sites per business
(two brands, two locations, one customer list), and at that point
`alicesplumbing.com/<slug>/` is not an address anyone would accept for a domain
they bought. A domain names a site; that is how the rest of the web works, and it
is uniform across forms C and D.

Business still falls out of it, because a site names its business
(`sites.tenant_id`). So `host → site → business` is one hop and yields the
identity context wherever it is needed — which §10 turns out to need.

## 4. A site has exactly one address, on its own host

**Decided ([[CHAT-40]]): the `/site/<siteKey>/` path grammar is deleted.**

It survives today only because it is the only public address that exists. It has
no permanent job, and three arguments for keeping it were examined and do not
hold:

- **Tests do not need it.** Workerd tests construct requests with arbitrary
  origins — `new Request('https://1stcontact.io/site/…')`, `https://app.example/…`
  — so no DNS is ever involved and a host-based resolver tests exactly as easily
  as a path-based one.
- **The screenshot worker does not use it.** `shotPreview` goes through
  `PreviewRenderer` and `previewOriginResolver` (`apps/control-app/src/shot.ts`)
  against the preview channel. That is form A.
- **`1c serve` does not use it.** That is the file-backed authoring tier, which
  never touches D1 keys or host mappings.

The one real case is `wrangler dev` on `localhost`, where a host-only resolver
finds no site. That does not need a second grammar — it needs **a row mapping
`localhost` to whichever site is being worked on.** Configuration as data, not a
branch in the resolver. (`*.localhost` resolves to loopback natively in Chrome
and Firefox if several are wanted at once.)

### What deleting it buys

The public grammar loses its prefix entirely and **a site sits at the root of its
host**. From `apps/public-site/src/routes.ts`:

- the `SITE_SEGMENT` check and site-token extraction go — the path is just the
  path;
- `SITE_KEY_PATTERN` / `isValidSiteKey` go;
- the whole `{ kind: 'redirect' }` route case goes. It exists *only* because a
  site served under a prefix breaks document-relative asset references when the
  trailing slash is missing. At the root there is no prefix and no hazard.

So the resolver ends with exactly one rule — `host → site → live revision → object`
— and no fallback grammar to keep consistent with it. **That is the argument for
deleting it.** Not the exposure argument, which §8 declines.

### Sequencing

Because it is the only public address today, it cannot simply go. *"The
`/site/<key>/` grammar is deleted"* is an **acceptance criterion of the custom-host
work**, not a separate cleanup, and that work must follow §6 rather than precede
it.

**Falsifier:** a second way to reach published bytes that is not a host mapping.

## 5. A public address is a globally unique attribute, not a key

This amends [[DOC-43]] §4, which reasons about uniqueness scope on the assumption
that a global data constraint is nearly always a mistake.

A host is data somebody chose, and it must be globally unique. That is not our
schema making an assertion about the world — **DNS is a global namespace whether
we like it or not**, and a mapping table that allowed two rows for one host would
simply be broken.

The existence-oracle objection ([[DOC-43]] §4) does not apply here, and the reason
is worth stating so the exception is not read as an erosion: an oracle matters
when the value is one a business would not otherwise disclose. **A public address
exists in order to be publicly resolvable.** "Somebody holds this label" is
information the DNS system gives away for free, by design, to anyone who asks.

So:

- the mapping row has an **opaque key** like every other row ([[DOC-43]] §1);
- `host` is an **attribute** with a unique index, which is what lets a host be
  *changed* without rewriting anything — the property rule 1 exists to buy;
- the site is named by **key**, never by a host or a name.

Sketch, not a schema:

```
site_domains(id PK opaque, site_id → sites.id, host UNIQUE, kind, status, …)
```

**Falsifier:** a host as a primary key; a site referenced from this table by
anything but its key; or a uniqueness scope in this system whose reason nobody
can state ([[DOC-43]] §4's original falsifier, unchanged).

## 6. The site slug has no job left

**Proposed ([[CHAT-40]]), pending the decisions in §11.** The evidence is in the
code rather than in the argument.

Every method of the D1 store's port takes a slug and immediately spends a lookup
undoing it — `createDraft`, `hasDraft`, `readPages`, `listAssets`, `forget`,
`readSiteJson`, `write` all begin `siteIdOf(slug)`
(`tools/generate/src/store/d1r2-store.ts`). There is even a public `siteKey(slug)`
whose entire purpose is to expose that conversion, called from exactly two places,
both building a public URL.

The slug is a pure indirection layer that every call has to unwind, and after
[[REQ-190]] there is nothing left underneath it:

- child tables are `PRIMARY KEY (site_id, name)` — no slug
  (`0001_baseline.sql`);
- R2 is `draft/<siteId>/` and `sites/<siteId>/rev/…` — no slug;
- `published_sites` is deleted — no global claim;
- the public address is the key today and the host tomorrow — not the slug.

What remains is `UNIQUE (tenant_id, slug)` on `sites` and the string in
`/preview/<slug>/draft/`.

### It is two jobs wearing one name

1. **A URL-safe addressing token** in the preview URL. This should be the key
   (§2, form A). Readability buys nothing on a URL nobody shares, and costs a
   lookup on every call.
2. **The human label the builder lists sites by.** This should be `sites.name`:
   prose, no character restrictions, **and no uniqueness constraint at all.**

| today | after |
| --- | --- |
| `sites.slug` + `UNIQUE (tenant_id, slug)` | `sites.name` — prose, unconstrained |
| `STARTER_SLUG='unnamed'` + `businessName='Unnamed'` | one constant |
| `siteIdOf(slug)` on every port call | gone — the port takes a key |
| `siteKey(slug)` | gone — the caller already holds it |
| slug-shape refusal in the port | gone |

Renaming a site becomes entirely unconstrained — no claim, no refusal, no error
path, not even within the business. Two sites called `Shop` is the operator's
problem, not a schema violation.

This is [[DOC-43]] §1 followed one step further than [[REQ-190]] took it. That
ticket said a slug is an attribute and then left a unique index on it, which is a
key doing its job in a smaller room. There is a tell: [[REQ-190]] justified
keeping `unnamed` and `Unnamed` as two constants *"so editing the prose can't
silently rewrite a key"* — an argument that only holds while the slug is a key or
an address. Remove both jobs and the justification dissolves on its own.

### Two things this does not reach

- **Page names stay.** `site_pages.name` — `home.json`, `about.json` — is the
  path *after* the host (`alicesplumbing.com/about`). That is a genuine public
  address and must be readable. Nobody wants `alicesplumbing.com/page_a3f9…`.
- **The file-backed tier keeps directory names.** `storage/sites/xgd/` is
  git-tracked, single-user, has no tenant and nothing to collide with;
  `storage/sites/site_a3f9…/` would be miserable to author in. That is a
  directory name in a filesystem, not a slug in a schema. [[REQ-190]]'s
  transcript left this open — *"the ticket says 'across the schema' and should
  say which schema"* — and this is the answer: **the rule is about the
  multi-tenant database.**

### The window is open now and closes on the first customer

Dropping the column is a schema change, and the baseline has been applied to
remote and local D1. But both hold one tenant, no users and no sites, so it is
still a wipe-and-reapply that costs nothing. After a real customer exists the
same change is a create-copy-drop-rename on every child table. **The argument for
doing it now is stronger than the argument for the change itself.**

## 7. Every site has an address from the moment it exists

A platform label is **assigned at provision**, not chosen before the customer has
anything. Slugified business name, a short discriminator on collision, freely
changeable afterwards — the ordinary signup-name flow.

The reasoning is [[REQ-190]]'s `unnamed` reasoning: the default must exist and
must visibly ask to be changed, rather than blocking the customer on a choice
they are not ready to make. It is also what makes §4 safe — if a site could exist
with no host mapping, deleting the path grammar would leave it unreachable.

Labels that could impersonate the platform or a service are reserved (`www`,
`app`, `api`, `mail`, `admin`, and the rest of that family).

**Falsifier:** a provisioned site with no address.

## 8. Platform detection is not a property we defend

Worth stating plainly so nobody spends effort on it. A visitor can tell who hosts
a site from response headers, framework class conventions, asset paths, any
generator metadata, and certificate transparency logs. Every Squarespace, Wix and
Shopify site is identifiable in seconds and none of them treats it as a defect.

The property that matters is not secrecy about the host. It is that **the
customer's address bar says their name and the visible chrome does not advertise
us** — which forms C and D deliver in full.

This is why §4 deletes the path grammar on the grounds that it has no job, rather
than on the grounds that it leaks the platform. The second argument is
unwinnable and does not need to be won.

## 9. The interim apex is a durability decision, not a branding one

The wildcard DNS record and wildcard certificate cost the same whatever the apex
is, so the choice is entirely trust and longevity:

- **`.site`** — reads as what it is and is cheap, but sits on the higher-abuse-rate
  TLD lists that some spam filters and reputation services weight against. For a
  business whose site is their front door, a small but real tax.
- **`.io`** — short and trusted, but a ccTLD for a territory whose sovereignty is
  being transferred, with genuinely unresolved questions about the namespace's
  long-term future. For addresses customers are invited to treat as permanent,
  that is the wrong risk to take on their behalf.
- **a subdomain of the product's own domain** — costs nothing, registers nothing,
  builds no new reputation, and says who is hosting. Longer, and reads more
  "hosted somewhere".

The address is **interim by design** — the whole product motion is toward form D —
so optimising it for beauty over durability is the wrong trade. Buying a short
domain is cheap insurance against a competitor holding it either way.

Related and adjacent: **selling the customer their domain.** Registering
`alicesplumbing.com` on their behalf at cost removes the single largest friction
step between forms C and D, and provisioning is the moment to offer it. A product
decision, recorded here because this is where it surfaces.

## 10. An authenticated surface on a customer's host

[[DOC-40]] §2.1's recursion says Bob signs in to Alice's Plumbing and reaches his
portal. Today the portal is at `app.1stcontact.io/account` because identity lives
on that origin, and `1stcontact.io` is GET-only, edge-cached and authenticates
nobody — one cached portal page would be everybody's answer ([[REQ-183]] D1).

Once Alice has `alicesplumbing.com`, Bob's portal wants to be at
`alicesplumbing.com/account`. That needs an authenticated surface **on a customer
host**, which is the same fork [[REQ-183]] D1 recorded as provisional, reached
from the other side.

Nothing above depends on resolving it. It is written down because it means
**custom domains are not purely a public-bytes feature** and must not be scoped as
one.

## 11. Open decisions

1. **Does `sites.name` carry any uniqueness?** Recommendation: none. A list the
   operator reads is not a namespace.
2. **Which apex** (§9), and whether the product sells domains.
3. **Whether form B is a frozen snapshot or a live draft render** (§2).
   Recommendation: frozen, for the three reasons given there.
4. **Whether the platform label is per site or per business.** §3 says a host
   names a site, which implies per site; a business with several sites then holds
   several labels. Cheap either way, but it should be said once rather than
   discovered.

## 12. What this supersedes

- **[[DOC-12]] §9**, "URL scheme" — *"sites are served path-based under the apex
  (`/site/<slug>/…`). Subdomain serving and custom domains are later and
  additive."* Superseded: path-based serving is deleted (§4), and the token was
  never going to stay a slug (§6). The "relocatable artifacts mean neither needs
  a re-render" half stands and is what makes §4 cheap.
- **[[DOC-12]] §9**, "Draft access control" — *"per-viewer sharing arrives with
  login."* Superseded by §2 form B: link-private sharing is a minted token and
  does not wait for per-viewer identity.
- **[[DOC-43]] §4** gains the namespace carve-out in §5. The rule is unchanged;
  the exception is now stated rather than left to be argued each time.
- **[[DOC-43]] §9**, "keys escape the database", lists
  `draft/<tenant>/<slug>/assets/…` — already stale after [[REQ-190]], and §6
  removes the slug from the last place it could reappear.

## Order of work

1. **§6, the slug** — first, because the host work would otherwise be built on a
   token scheduled to disappear, and because the window in §6 is open now.
2. **§5 and §7, the mapping table and the platform label** — the first real
   address.
3. **§4, deleting the path grammar** — an acceptance criterion of (2), not a
   separate ticket.
4. **§2 form B, the share link.**
5. **Custom hostnames**, which are (2) plus certificate provisioning, and which
   §10 says are not only a public-bytes feature.
