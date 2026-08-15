---
uid: comment-48483d87
id: COMMENT-1023
type: comment
title: Comment on chat CHAT-26
created_by: xgd
created_at: '2026-08-15T23:36:00.037329+00:00'
updated_at: '2026-08-15T23:53:54.123325+00:00'
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

<!-- xgd-turn id="e9f44bfd-f87c-40ab-931b-7d8074167c76-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-15T23:53:53.869384+00:00" -->
#### Claude
That narrows it usefully — and I think it's smaller than you're bracing for.

## Your launch group doesn't need multi-currency

A Dublin barber charges EUR. Forever. A UK consultancy charges GBP. Forever. Neither ever needs conversion, a currency switcher, or a rate feed. What they need is **single-currency that isn't USD**, rendered in local convention.

That's a config field and a formatter, not a system. The expensive thing — multi-currency display with conversion — is for businesses selling internationally, which is rare in the first-contact SMB market and can wait until someone actually asks.

## The line that matters: clickable vs readable

| | Owner | Why |
|---|---|---|
| **Price you can click** (buy button, booking deposit) | Payments module `config` | Displayed price ≠ charged price is a *legal* problem, not cosmetic. One source or they drift. |
| **Price you can only read** (rate card, "from €90") | L1 copy | Nothing to drift against. A literal is honest. |

You already have the composition for the first — DOC-25 §10's slot/control seam. The module owns `{amount_minor, currency}` and the display derives from it; L1 owns every paint axis. Stripe is the source of truth for what's charged, the module for what's shown, and they're the same number by construction.

For the second, **don't build a money annotation on L1 text.** I was going to propose one (literal base + optional `{amount_minor, currency}` overlay, mirroring how palette works). It's the right shape if you ever need it — the literal stays in the document so geometry stays pinned against real text, and the annotation makes it checkable. But a permanently-single-currency site gets nothing from it. Revisit when a multi-currency customer shows up.

## Dates are the more dangerous one, and not for the reason you'd think

Money carries its own disambiguator — a symbol. Dates don't. `03/04/2026` is March 4th in the US and 3 April in Ireland. A misread date on a booking page is a missed appointment, which is a real failure, not a formatting nit.

But that's still the easy half, because **calendar dates are never L1 copy** — the module generates them from datetime values at render. The rule is just: the calendar module never hand-formats, always `Intl.DateTimeFormat(locale)`. Free to state now, before it's built.

The genuinely expensive-later item in this entire conversation is **timezone**, and it's easy to miss:

- "3pm" in whose zone? An Irish business taking a booking from someone browsing in New York.
- Store **instants in UTC** plus an **IANA zone ID** (`Europe/Dublin`) — never a local wall-clock string, never a fixed offset (`+00:00`).

Offsets break on DST, and Ireland/UK and the US transition on *different dates* — so a booking made in October for a November slot silently shifts by an hour. Wall-clock strings are worse: you can never fix them later, because you can't re-interpret historical bookings without knowing what zone they meant. This is the one thing here that's genuinely unrecoverable if you get it wrong.

## What to actually add

Four string fields on `siteConfigSchema`, all derivable from one consultation question ("where's the business?"), each overridable:

```
country   'IE'              ISO 3166-1
locale    'en-IE'           BCP 47
currency  'EUR'             ISO 4217
timezone  'Europe/Dublin'   IANA
```

Keep them separate rather than deriving at use — they correlate but don't determine. Locale decides placement and separators; currency decides symbol and decimal count. `Intl.NumberFormat('en-IE', {currency:'EUR'})` → `€49.99` but `de-DE` with the same currency → `49,99 €`. You need both, independently.

Two things worth knowing: minor units aren't always 2 (JPY is 0, KWD is 3 — pass the currency to `Intl` rather than dividing by 100), and EU consumer-facing prices must display **VAT-inclusive**. That last one is a legal obligation the payments module should declare in DOC-33's capability catalogue, keyed off `country`.

Note `contact.address` already exists but is free-text — it can't drive any of this.

## The package

| | Effort | When |
|---|---|---|
| Four config fields | ~1–2h | Now — unblocks everything, zero risk |
| `lang`/`dir` from locale (kills the hardcoded `en`) | ~1h | Now, same ticket |
| Payments: price is config, display derives | free | Write it down before the module exists |
| Calendar: UTC instants + IANA zone, `Intl` only | free | Write it down before the module exists |
| L1 money annotation | — | Don't build |

The two "free" rows are the highest-value things in the table — they cost nothing today and are the ones that hurt if a module ships without them.

Want me to scope a ticket for the two implementation rows? That's a genuine code change, so it'd need a branch and UATs under the free-coding protocol — say the word and I'll cut it. The module rules I'd suggest landing as a DOC amendment instead, since there's no code to attach them to yet.

<!-- xgd-chat-end -->