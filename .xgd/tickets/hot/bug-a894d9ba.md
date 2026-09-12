---
uid: bug-a894d9ba
id: BUG-90
type: bug
title: Switching business shows a same-named site from the wrong business
created_by: martin-github@westhead.me
created_at: '2026-09-12T21:58:13.622062+00:00'
updated_at: '2026-09-12T22:41:59.849115+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-3f8412fd
  commits:
  - working_sha: 95d3460bf36dab406e4432ae46ffc2aeacda2801
    reconcile_sha: null
    main_sha: null
  - working_sha: de5acab10cc4515b365ec997f0ba084a6cf247ad
    reconcile_sha: null
    main_sha: null
  version: 0.2.182
---

## What happens

In the Site tab, switching the business selector from **XGD** to **1st Contact**
leaves what looks like the previous business's site on screen. The switch appears
not to have happened.

## Why

Two causes, one visible.

**The collision.** `selectBusiness` (`apps/control-app/src/builder/app.js`) carries
the remembered site slug across a business change whenever the new business also
holds a site with that slug:

    const slug = list.some((entry) => entry.slug === currentSite)
      ? currentSite
      : (list[0]?.slug ?? null)

Slugs are unique *per business* (`UNIQUE (tenant_id, slug)`), so a matching slug in
another business is a name collision, not the same site. The rule is right for a
reload — same business, remembered slug — and wrong for a genuine business change.

**The reason it is systemic.** Every newly provisioned business gets a starter site
slugged `unnamed` (`STARTER_SLUG`, `identity.ts`). Once there is more than one
customer, nearly every pair of fresh businesses collides on that one word, so the
carry fires on almost every switch. `unnamed` is also written into the site's
`config.businessName` and tagline, so a brand-new business's site introduces itself
to visitors as "Unnamed" even though `provisionBusiness` has just recorded the
business's real name one statement earlier.

## The rule this ticket adopts

**For now a business holds exactly one site, and that site is named after the
business.** No site selector is built; that is deferred with the settings work.

A site's name is derived from its business's name by lowercasing it and removing
every character that is not a letter or a digit. `1st Contact` becomes
`1stcontact`, `XGD` becomes `xgd`, `Gigabyte Alchemy` becomes `gigabytealchemy`,
`Lagrange Foundry` becomes `lagrangefoundry`. Spaces and punctuation are removed
rather than turned into hyphens, which is what the three sites that already exist
are named and what keeps the derived name equal to the name already in use.

A business name that contains no letter or digit at all derives an empty name,
which cannot address a site. Such a business falls back to its own business id, so
provisioning always produces a reachable site rather than failing at the last step.

The word `unnamed` stops being a site name. `STARTER_SLUG` and `STARTER_NAME` are
deleted rather than kept as a fallback — a business always has a name, so there is
never an occasion to use them.

## Behaviour

1. Provisioning a business named `Gigabyte Alchemy` creates one site whose slug is
   `gigabytealchemy`, whose `site.json` `id` is `gigabytealchemy`, and whose
   `config.businessName` is `Gigabyte Alchemy` verbatim — the business's name as
   entered, not the squashed form.
2. The starter tagline names the business the same way: `Gigabyte Alchemy — built
   with 1st Contact`.
3. Provisioning a business whose name yields no letters or digits creates a site
   named after the business id, so the site is still addressable.
4. No site is provisioned under the name `unnamed`.

## The sites we already have

The rule is applied to the existing local development store, which is the only
store holding any sites — production holds one tenant, no sites and no users.

- **1st Contact** holds three sites: `1stcontact`, `gigabytealchemy` and `xgd`. The
  last two are leftovers from a `1c push` sweep that ran on 2026-09-06, before the
  XGD business existed. `xgd` is byte-identical to the XGD business's own copy.
- `xgd` under 1st Contact is deleted, with its asset rows and its R2 objects.
- A **Gigabyte Alchemy** business is created through `provisionBusiness`, the one
  path that writes a tenant, a membership, an entitlement and a site together. The
  real `gigabytealchemy` site is moved into it and the starter site provisioning
  created is deleted, so the business ends with the one site that has its content.
- Moving a site between businesses is `UPDATE sites SET tenant_id`. R2 keys are
  `draft/<siteId>/assets/…` and every child table names the site and not the
  tenant, so no bytes move and no other row changes.
- **Lagrange Foundry**'s site is renamed `unnamed` to `lagrangefoundry`, and
  **Felix Test**'s `unnamed` to `felixtest`.
- Each site's `site.json` `id` is set to its slug and its `config.businessName` to
  its business's name. A tagline is rewritten only where it is still the starter
  placeholder; an authored tagline is left alone.
- `alpha` under `biz_uatwestheadme` is left alone: it is residue from a test suite
  that recreates it, not one of ours. Alice's three seed businesses are left with
  no site, as `db/dev-seed.sql` intends.

## Not in this ticket

- **The slug carry is not removed.** With one site per business it cannot misfire:
  a business's only site is `list[0]`, so the carried slug and the fallback select
  the same row. It becomes reachable again the moment a business holds two sites,
  which is when the site selector lands — the fix then is to remember the selected
  site per business rather than globally.
- Nothing enforces one-site-per-business; `1c push` can still add a second.
- Renaming a business does not rename its site. That is the settings work.