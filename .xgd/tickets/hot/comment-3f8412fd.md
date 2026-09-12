---
uid: comment-3f8412fd
id: COMMENT-2879
type: comment
title: Comment on bug BUG-90
created_by: xgd
created_at: '2026-09-12T22:00:54.939955+00:00'
updated_at: '2026-09-12T22:47:26.380484+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-a894d9ba
  kind: chat_transcript
---

<!-- xgd-turn id="6fa44a2e-4b76-4c4f-a7bc-26d777480adb-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T22:00:33.980519+00:00" -->
#### You
When I change site from XGD to 1st contact in the Site tab, I see the other site come up.

I think this is because of a name confusion there is an "unnamed" associated with the site and look up does not respect business.

I would like to discuss both the naming situation which is feeling a little confused and the site change issue.

<!-- xgd-turn id="6fa44a2e-4b76-4c4f-a7bc-26d777480adb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T22:05:54.973960+00:00" -->
#### Claude
I dug into this. Both halves have concrete answers — and the mechanism isn't quite what you guessed, though your instinct about `unnamed` is right about a *different* bug.

## 1. The switch itself

**There is no site selector.** The dropdown in the Site tab is the *business* switcher (`createBusinessSwitcher`, accessible label `"Business"`, prepended into the shell bar). So "changing site from XGD to 1st Contact" is changing business — which is part of the naming confusion, see §2.

The lookup *does* respect business. The store handle is bound to a tenant at construction and every query carries `WHERE tenant_id = ?`; `sites` is `UNIQUE (tenant_id, slug)`. What doesn't respect business is the **selection carried across the switch** — `apps/control-app/src/builder/app.js:1035`:

```js
const slug = list.some((entry) => entry.slug === currentSite)
  ? currentSite
  : (list[0]?.slug ?? null)
```

Your local D1 says why that bites:

| Business | Sites |
|---|---|
| XGD (`biz_96fc…`) | `xgd` |
| 1st Contact (`biz_51a6…`) | `1stcontact`, `gigabytealchemy`, `xgd` |

Switching XGD → 1st Contact, `currentSite` is `xgd`, 1st Contact *also* holds an `xgd`, so the slug is kept and you land on 1st Contact's own copy of the xgd site — same `site.json`, renders identically. It reads as "the switch didn't happen."

The code even knows this is wrong; the comment above that line says *"the same slug in two businesses is two different sites"* and then uses a slug match as evidence the operator's selection survived. It's the right rule for a **reload** (same business, remembered slug) applied to a **business change**, where a matching slug is a name collision, not identity.

**The bigger consequence:** `1stcontact` and `gigabytealchemy` are currently unreachable. The only chooser is `list[0]` (`ORDER BY slug`, so `1stcontact`), and once `xgd` is remembered nothing can get you off it — `api.js:485` still records the v1 assumption *"a business holds one site"*, which your data has already outgrown.

Two fixes, and I think you want both:
- **(a)** Remember the selected site **per business** (key the panel's `site` storage by business id). Keeps the returning-operator property, drops to the new business's own first site on a genuine switch. Small and contained.
- **(b)** Build the site selector DOC-28 §10 has always specified and was never built. `app.js` explicitly anticipates it: *"when a business can hold several sites, that control calls `panel.setSite` and everything below already follows."*

Without (b), (a) fixes the symptom but still leaves two of your three 1st Contact sites unreachable.

## 2. The naming situation

There are seven names in play for two things:

| Name | Where | Unique | Who reads it |
|---|---|---|---|
| business name | `tenants.name` | not enforced | operator (switcher label) |
| business id `biz_…` | `tenants.id` | global | `/b/<id>` URL prefix |
| site key `site_…` | `sites.id` | global | public URL `/site/<id>/` |
| **site slug** | `sites.slug` | **per business** | builder URL, `localStorage`, `/api/sites` |
| `site.json.id` | definition | duplicate of slug | nobody — but it drifts |
| `site.json.config.businessName` | definition | duplicate of business name | **visitors** — it's on the page |
| `STARTER_SLUG` / `STARTER_NAME` | consts | `unnamed` / `Unnamed` | both |

Two real defects fall out:

**Your `unnamed` is a display-name bug, not a lookup bug.** `provisionBusiness` writes `tenants.name = 'Felix Test'` and then calls `createStarterSite`, which calls `starterSiteJson(slug, STARTER_NAME)` — so the new site's `config.businessName` is `"Unnamed"` and its tagline is `"Unnamed — built with 1st Contact"`, in a business we had just named. Confirmed in your data (Felix Test); Lagrange Foundry's was edited by hand afterwards. The reasoning at `identity.ts:856` — `unnamed` is *"a prompt rather than a description"* — is sound for the **slug** and got applied to the **display name**, where we already know the true answer.

**`site.json.id` duplicates `sites.slug` and no rename updates it.** REQ-190's whole selling point is that renaming a site is one `UPDATE` of one column — but that `UPDATE` doesn't touch the definition, so the two drift silently.

And the vocabulary itself: the tab is *Site*, the control inside it is *Business*, a business holds N sites, and there is no human-readable site title at all (`site.json` has no `name`/`title` — `businessName` is doing that job by accident, which is why it looked to you like an "unnamed" attached to the site).

## Questions before I write anything

1. Is the `xgd` site under the **1st Contact** business deliberate (an import / reproduction) or leftover? It decides whether we also want a "move a site to another business" story.
2. Do you want the site selector now, or just per-business memory first?
3. Should `config.businessName` stay a site-content field, or be seeded from `tenants.name` (still editable, since a site's displayed name may legitimately differ from the registered business)?

I'll hold off coding until you've steered. Shall I record this diagnosis on BUG-90's body now so it survives the session?

<!-- xgd-turn id="3dbf4d6c-138d-4762-8732-32f3740fef95-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T22:13:20.838533+00:00" -->
#### You
Are you SURE there is an XGD SITE in 1st Contact? I know there is an xgd screenshot but a site? Really?

<!-- xgd-turn id="3dbf4d6c-138d-4762-8732-32f3740fef95-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T22:14:22.654027+00:00" -->
#### Claude
Fair challenge — let me re-check rather than trust the join.

Yes — I'm sure, and it's a real site with real pages, not a screenshot. Let me pin down where it came from.

Yes — confirmed, and it's a genuine site, not a screenshot. The evidence:

```
site_9a3dcd09b0e466386d991729bc7e7471 | biz_51a6… (1st Contact) | xgd | version 2
  home.json        42197 bytes
  whitepapers.json 19043 bytes
```

Two real page rows in `site_pages`. And its `home.json` is **byte-identical** to the XGD business's `home.json` (SQL equality on the two blobs returns 1).

But my earlier guess at *why* was wrong. It's not an import or a deliberate reproduction — it's a leftover. The timeline says so:

| When | What |
|---|---|
| 09-06 21:50 | **1st Contact** business created |
| 09-06 23:25:57 → 23:26:01 | `1stcontact`, `gigabytealchemy`, `xgd` pushed into it — three sites, 4 seconds apart |
| 09-10 17:15 | **XGD** business created |
| 09-10 17:21 | `xgd` pushed into *that* |

`db/dev-seed.sql:45-48` names the mechanism: no sites are seeded, and *"the `xgd` site lives in the file-backed store at `storage/sites/xgd/` and is restored [by `1c push`]"*. `storage/sites/` holds exactly those three directories — `1stcontact`, `gigabytealchemy`, `xgd` — in the pre-multi-tenant flat layout. So that 4-second burst was one sweep pushing all of `storage/sites/*` into the only business that existed at the time. Four days later the XGD business was created and `xgd` was pushed again, into its proper home. Nobody removed the first copy.

So: deleting 1st Contact's `xgd` would make your symptom disappear today.

**That would be the wrong conclusion to stop at, though** — and it sharpens the point you were making about `unnamed`.

Your instinct was right, one step removed. `unnamed` isn't what's colliding in *this* instance (`xgd`/`xgd` is), but it's why the slug-carry bug is systemic rather than a one-off: **every newly provisioned business gets a site with the slug `unnamed`** (`STARTER_SLUG`, `identity.ts:869`). Your own data already has two — Felix Test and Lagrange Foundry — and switching between those two businesses reproduces the bug with no stale duplicate anywhere in sight. Once there are a handful of customers, nearly *every* pair of fresh businesses collides on `unnamed`, and `selectBusiness`'s `list.some(e => e.slug === currentSite)` will match on essentially every switch.

So there are two independent things, and I'd keep them apart:

1. **Stale data** — 1st Contact's `xgd` (and possibly `gigabytealchemy`) are pre-XGD-business leftovers. A cleanup, not a code change. Your call whether they go.
2. **The bug** — carrying the selection across a business change on a per-business-unique name. `unnamed` guarantees it fires in production. This is what BUG-90 should be about, and it's unaffected by whether you clean up (1).

My three questions from before collapse to one now, since the data answered the first: do you want the per-business memory fix alone, or the site selector alongside it? Given 1st Contact legitimately holds `1stcontact` and `gigabytealchemy`, without a selector you still can't reach one of them.

<!-- xgd-turn id="32263ec1-e3b2-4446-8c80-e92cbb3dab10-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T22:25:04.445978+00:00" -->
#### You
ok please delete the copy of the xgd site in 1stcontact. Can you crreate a gigabytealchemy business and put that site there and then delete the 1stcontact copy?

Then lets fix the bug - for now there is one site per business and it should take the name of the business - can you update all our sites to fit that rule please?

There is still an onboarding issue to figure out here, but we can come back to that with the settings work

<!-- xgd-turn id="32263ec1-e3b2-4446-8c80-e92cbb3dab10-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T22:47:24.891942+00:00" -->
#### Claude
Good — that answers the selector question: one site per business, no selector, and the site takes the business's name. Let me scope this properly before touching anything.

Before I touch any data, two things I need to pin down: which database you mean, and whether a cross-business move is actually safe.

Production is empty — **1 tenant, 0 sites, 0 users**. So all the data work is local miniflare state only; no production risk. Good.

And the move is safe: R2 keys are `draft/<siteId>/assets/…` — keyed by site id, not tenant or slug (`d1r2-store.ts:410`), and there are zero revisions anywhere. So both a move and a rename really are one-column `UPDATE`s.

Two things to check before I write the ticket:

The site's own content says **"Gigabyte Alchemy"** — so the rule is business name, lowercased, punctuation and spaces removed. That matches all three real sites (`1st Contact`→`1stcontact`, `XGD`→`xgd`, `Gigabyte Alchemy`→`gigabytealchemy`). Now scoping the ticket.

Ticket scoped. Cutting the branch:

`STARTER_SLUG` is asserted by six existing UAT suites — the behaviour change lands on all of them. Let me see how they build businesses before I choose the shape.

This is the pivot point, and it's worth flagging: REQ-190 made a **deliberate** decision that the starter site is *not* named after the business, and pinned it with a UAT that asserts exactly that:

```js
expect(site!.config?.businessName).not.toContain('Coles')
// "the site is not the business, an account will own several"
```

Your "one site per business" rule removes that premise, so BUG-90 supersedes it. I'll record the supersession on the ticket rather than silently flipping it. First the source change:

Now replacing the block (lines 838–913) with the business-derived naming:

Now the six existing UAT suites that pin the old rule:

Now updating the four simpler suites:

Now REQ-190 — the suite that pins the superseded decision:

Now the four tests whose *subject* is the naming decision:

Those tsc errors are pre-existing (missing workers types / generated files under that config). Let me run the actual suites:

All 17 pass, including the two new BUG-90 tests. Now the other five suites:

63 passing. Now a dedicated BUG-90 suite for the ticket's four behaviours, moving the derivation tests out of REQ-190 to avoid duplication:

All 799 workers tests pass. Now the node suite:

Two failures. Let me check whether they're mine — `1c assets` may have dirtied tracked files:

Confirmed pre-existing — both fail identically on the pristine tree. Restoring my changes:

Short SHAs — the gate wants 40-character ones:

Code side is done and merged (`free_coded`, v0.2.182). Now the data migration. Backing up first:

Access-sim is running. Let me mint a session for `martin@westhead.me` and use the real provisioning route:

The dev server picked up the merged code — `siteSlug: "gigabytealchemy"` confirms the new rule end to end. Now the deletions:

No surgical delete tool exists, so this is direct-to-store. Checking the R2 layout:

All clear — no shared blobs. Running the migration:

Now step 5 — bringing each `site.json` into line with its business:

Data is exactly right. Verifying through the running app:

zsh doesn't word-split by default — let me redo that:

All four render distinct documents. Recording the outcome on the ticket:

Both halves are done and verified.

## The bug

You were right that a name collision was behind it, and right that `unnamed` was implicated — just one step removed from where you pointed.

`selectBusiness` carries the remembered slug across a business change whenever the business being entered also holds that slug (`app.js:1035`). Slugs are unique *per business*, so a match across businesses is a coincidence, not the same site. That rule is correct for a reload and wrong for a switch. What made it fire constantly is that every business provisioned got its site under one fixed word — so two businesses could not help colliding.

**Fixed by the rule you set:** one site per business, named after the business — lowercased, non-alphanumerics removed (`1st Contact`→`1stcontact`, `Gigabyte Alchemy`→`gigabytealchemy`). `STARTER_SLUG`/`STARTER_NAME` are deleted, not kept as a fallback. A name that derives nothing falls back to the business id so provisioning always yields an addressable site.

Commit `95d3460b` + version bump, merged to `xgd-working`, ticket at `free_coded`, branch cleaned. New suite `test_UAT_FC_BUG-90_site_named_after_business.workers.test.ts` (6 UATs). **799 workers tests and 3017 node tests pass**; the 2 node failures (`bug32-webui-scope-rebrand`, `BUG-67_backend_settings`) fail identically on a pristine checkout of the branch point — pre-existing, not mine.

**One thing you should know I did:** this reverses a decision REQ-190 made deliberately and pinned with a UAT asserting the starter is `unnamed` and explicitly *not* the business's name — "an account will own several". Your one-site-per-business rule removes that premise, so I rewrote that test in place with the supersession recorded there rather than flipping it quietly.

## The data

Production was empty (1 tenant, 0 sites, 0 users), so this was local only. State backed up first.

| Business | Site | Was |
|---|---|---|
| 1st Contact | `1stcontact` | unchanged |
| Gigabyte Alchemy | `gigabytealchemy` | moved out of 1st Contact |
| XGD | `xgd` | `businessName` was `xgd` → `XGD` |
| Lagrange Foundry | `lagrangefoundry` | was `unnamed` |
| Felix Test | `felixtest` | was `unnamed`/`Unnamed` |

1st Contact's leftover `xgd` is gone (9 asset rows, 9 R2 objects, 9 blob files — no shared blobs, checked first). Gigabyte Alchemy was provisioned through the real `/api/admin/businesses` route, which returned `siteSlug: gigabytealchemy` — your running dev server had already picked up the new code, so that's the fix confirmed end to end, not just in a suite. Authored taglines (1st Contact's, Lagrange Foundry's) were left alone; only the two scaffold placeholders were rewritten.

Verified live: four businesses in the switcher, one site each, no two slugs equal, all four rendering different documents. No restart needed.

Three things I deliberately did not touch: `alpha`/`biz_uatwestheadme` (test residue that suites recreate), Alice's three seed businesses (dev-seed intends them siteless), and the R2 audit objects under `site-unnamed/` (append-only log of what happened when it *was* called that).

## Left open, as you said

The onboarding gap is now sharper, so it's worth naming for the settings work: a signup with no display name gets a business called "Unnamed business" — which now derives the site `unnamedbusiness`. The word moved from the site to the business rather than going away. The fix is to ask, not to give the site a fixed name again; I put that in a comment at `onboarding.ts` and a UAT pins it.

Also latent: the slug carry itself is still in `selectBusiness`. With one site per business it can't pick the wrong row — a business's only site is also what the fallback would choose — so I left it rather than widening scope. It becomes live again the moment a business holds two sites, which is when the site selector lands; the fix then is to remember the selection per business rather than globally. That's recorded in the ticket's "Not in this ticket".

<!-- xgd-chat-end -->