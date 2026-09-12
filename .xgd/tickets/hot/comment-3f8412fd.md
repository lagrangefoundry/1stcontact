---
uid: comment-3f8412fd
id: COMMENT-2879
type: comment
title: Comment on bug BUG-90
created_by: xgd
created_at: '2026-09-12T22:00:54.939955+00:00'
updated_at: '2026-09-12T22:13:20.893305+00:00'
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

<!-- xgd-chat-end -->