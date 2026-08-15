---
uid: comment-48483d87
id: COMMENT-1023
type: comment
title: Comment on chat CHAT-26
created_by: xgd
created_at: '2026-08-15T23:36:00.037329+00:00'
updated_at: '2026-08-15T23:52:19.726196+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-8c8e0f89
  kind: chat_transcript
---

<!-- xgd-turn id="7e4a9226-1248-427a-8a00-5f90841b9c01-user" -->

<!-- xgd-chat role="user" ts="2026-08-15T23:35:56.330345+00:00" -->
#### You
Internationalization and Localization. It just occurred to me that my initial launch group are all international so we will need some ability to at least internationalize currency and payments. But I also know that this is VERY painful to add later. Should we allow multiple bundles keyed off language or region for our text?

<!-- xgd-turn id="7e4a9226-1248-427a-8a00-5f90841b9c01-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-15T23:38:58.481958+00:00" -->
#### Claude
Let me ground this in the actual schema before answering — the right answer depends a lot on how L1 pins geometry.

Grounded first — here's what's actually in the code today:

| | Today |
|---|---|
| `siteConfigSchema` | `businessName`, `tagline`, `contact`, `integrations`, `distribution` — **no country, no locale, no currency** |
| `siteSchema.pages` | flat list, unique `slug`, no locale dimension |
| L1 `text` node | `text: string` literal, plus its own `sizing` measure and pinned geometry |
| Renderers | `<html lang="en">` **hardcoded** in `packages/framework/src/l1/render.ts:2465` and `tools/generate/src/render/render.ts:188` |
| Currency | nothing, anywhere. No `Intl.` use at all |

## Two different questions are hiding in one

**"My launch group is international"** and **"our sites need multiple languages"** are not the same problem, and I think the first is your actual near-term need.

A German bakery and a Swiss consultancy are each *monolingual*. What bites them isn't translation — it's **localization**: EUR not USD, VAT-inclusive price display (a legal requirement in the EU, not a preference), an Impressum (legally mandatory in DE/AT), date and phone formats, GDPR copy. **All of that bites on a single-language site**, and none of it needs a text bundle.

Translation is the rarer, later case. Localization is the one your launch group hits on day one.

## The bundle question: no — and the reason is specific to L1

Locale-keyed string bundles assume **text is substitutable under fixed layout**. That's true in flow-layout HTML, where the box adapts to whatever you pour in. It is not true here:

- L1 pins geometry as absolute keyframes per viewport width, and a `text` run declares its own measure. German runs ~30% longer than English for short strings. Swapping the string under pinned geometry doesn't reflow — it overflows or clips.
- RTL isn't a string swap at all. It mirrors the x-axis. That is definitionally a different document.
- **Bundles break the fold.** Capture reads rendered literals; it can never produce a key reference. `capture(render(L1)) ≈ L1` is transcription with zero inference — keys would introduce exactly the inference step DOC-19's "transcribe, don't reconstruct" lesson exists to prevent.

The failure mode is what makes it worse than doing nothing: a bundle *looks* synchronized while rendering broken. You'd trade honest staleness for silent breakage.

## What instead: locale is a document variant

DOC-23 §5 already settled the discipline for exactly this shape — **literal base, optional overlay, base always valid**. Colour got it; palette references are a refinement over an always-valid literal hex. Apply the same:

An L1 page document is always a complete, literal document in **one** locale. A second locale is **another document**, authored by the AI from the first, free to differ in layout because it must. Cost: divergence — edit the English hero and the German is stale. But that's *visible* and reconcilable (the AI is the reconciler), which is strictly better than the bundle's invisible breakage.

One genuine wrinkle worth naming rather than glossing: `nav`, `tagline` and `seoMeta` are **metadata**, not laid-out text. The bundle model is fine for those — they have no geometry to break. So the distinction is sharper than "bundles bad": *laid-out text → document variant; metadata text → locale-keyed is fine.*

**Don't build any of this now.** Just don't preclude it.

## What's actually cheap now and expensive later

The fear is right but the surface is small — four decisions, not a subsystem:

1. **`country` on `siteConfigSchema`.** The single highest-value field, and it unlocks localization with zero translation work. VAT display, legal obligations, currency default, address/phone format all key off it.
2. **`locale` / `defaultLocale`.** `pages` is keyed by unique slug today; adding a locale dimension later means a compound key and a migration across every stored site.
3. **URL shape — decide, even if unimplemented.** Once published revisions exist at paths, changing this breaks links and SEO. Recommend path prefix (`/de/about`) with the default locale unprefixed.
4. **`lang`/`dir` from the page locale.** This is already a live correctness/a11y bug for any non-English site — two hardcoded literals.

Items 1, 2 and 4 are maybe a couple of hours total. Item 3 is free.

## Currency and payments: keep it out of L1

Payments is a behavior module that doesn't exist yet — which means the rule can be set *before* it's built, and this is the one that actually prevents the pain you're anticipating:

> **A transactional price is module `config`, never L1 copy.** `{amount_minor: 4999, currency: 'GBP'}`, formatted at render by `Intl.NumberFormat` with the page locale.

If a price ever lands in an L1 `text` node, changing currency becomes a copy edit across every page — exactly the "painful later" you're worried about. Prices in *prose* ("from £50") stay copy; those are claims, not transactions, and that's honest.

This lands cleanly on DOC-25's existing rule that `config` is data-only and never aesthetic. And it feeds DOC-33 §13's open capability-catalogue question — which flags that as "the largest unresolved dependency" and needs a capability to declare what it *obliges* per country. **Country is that catalogue's most important input.**

## One thing to disambiguate

"Internationalize currency and payments" could mean either:

- **We charge them** — 1stcontact's own $200–1,000 session and $30–80/mo (DOC-32) billed to international customers. That's a PSP config plus a country on the tenant record.
- **They charge their customers** — the payments behavior module.

Different problems, different fixes. Which did you mean? (My guess is both, but the first is more urgent and much smaller.)

## What's free

The consultation itself in the client's language costs nothing — the model is multilingual, the system KB stays English, the AI reads English and speaks German. No work needed.

---

Want me to turn this into a DOC, or go straight to REQs for the four seams? The four are small enough to be one ticket if you'd rather not fragment them.

<!-- xgd-turn id="9283d8d3-6e79-40aa-996d-cb07d98ae08d-user" -->

<!-- xgd-chat role="user" ts="2026-08-15T23:51:54.800759+00:00" -->
#### You
The second I am more worried about - I can get paid in USD by CC internationally to begin with - eventually it will impact conversion enough but I have people who are would be customers in Ireland (Euro) and UK (GBP) they need to use their domestic currencies - I don't think the payments side is too hard - Stripe should solve that. But I need to be able to represent money locally

<!-- xgd-turn id="e9f44bfd-f87c-40ab-931b-7d8074167c76-user" -->

<!-- xgd-chat role="user" ts="2026-08-15T23:52:19.554156+00:00" -->
#### You
The second I am more worried about - I can get paid in USD by CC internationally to begin with - eventually it will impact conversion enough but I have people who are would be customers in Ireland (Euro) and UK (GBP) they need to use their domestic currencies - I don't think the payments side is too hard - Stripe should solve that. But I need to be able to represent money locally

Dates is another - less serious but we will have a calendar feature

<!-- xgd-chat-end -->