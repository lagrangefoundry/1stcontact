---
uid: doc-2b91ec43
id: DOC-34
type: doc
title: Internationalization & Localization Model
created_by: xgd
created_at: '2026-08-15T23:58:49.039815+00:00'
updated_at: '2026-08-15T23:58:49.039815+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  doc_kind: architecture
---

# Internationalization & Localization Model

**Status:** Founded by [[chat-8c8e0f89]] (CHAT-26). Decides how a site expresses
its **locale, currency, and time** — what is built now, what is deliberately
deferred, and which rules are binding on behavior modules that do not exist yet
(payments, calendar). Amends nothing; adds a concern no existing document owned.

## 1. Purpose & scope

The first customer cohort is international — Ireland (EUR) and the UK (GBP)
alongside US customers. This document answers three questions that were about to
be answered by accident:

1. Do we key site text off language/region with locale bundles? — **No** (§3).
2. How does a site represent **money** so it renders locally? (§6)
3. How does a site represent **time**, given a calendar capability is coming? (§7)

The scope is the **customer's site**. How *we* bill *them* for 1st Contact
([[DOC-32]]) is a separate concern and is not addressed here.

## 2. Two problems, not one

"Our customers are international" and "our sites must be multilingual" are
different problems, and conflating them buys an expensive solution to the rarer
one.

| | Problem | Who has it |
|---|---|---|
| **Localization** | EUR not USD; VAT-inclusive display; Impressum; date, phone, address convention | **Every** non-US business, on day one, in **one** language |
| **Translation** | The same page in two languages | A minority — genuinely multilingual markets |

A Dublin barber is monolingual and permanently EUR. A UK consultancy is
monolingual and permanently GBP. **Neither ever needs currency conversion, a
currency switcher, or a rate feed.** What they need is *single-currency that
isn't USD*, rendered in local convention.

Localization is the urgent, small problem. Translation is the rarer, larger one.
This document builds the first and reserves the seam for the second.

## 3. Why not locale-keyed text bundles

The classic i18n bundle — nodes hold keys, `bundles/<locale>.json` holds strings —
is **the wrong primitive for this substrate**, for three L1-specific reasons.

**3.1 It assumes text is substitutable under fixed layout.** That is true in flow
layout, where the box adapts to whatever is poured in. L1 pins geometry as
absolute keyframes per viewport width ([[DOC-23]] §3), and a `text` run declares
its own measure (`sizing`). German runs roughly 30% longer than English for short
strings. Substituting the string under pinned geometry does not reflow — it
overflows or clips.

**3.2 RTL is not a string swap.** Arabic and Hebrew mirror the x-axis. In a
substrate whose geometry *is* a set of x coordinates, a mirrored layout is
definitionally a different document, not a different string table.

**3.3 It breaks the fold.** Capture reads rendered literals; it can never produce
a key reference. The round-trip acceptance `capture(render(L1)) ≈ L1`
([[DOC-23]] §7) is transcription with zero inference — keys would reintroduce
exactly the reconstruction step [[DOC-19]]'s "transcribe, don't reconstruct"
lesson exists to prevent.

**The failure mode is what disqualifies it.** A bundle *looks* synchronized while
rendering broken. It trades honest staleness for silent breakage — the worse of
the two.

## 4. Locale is a document variant

[[DOC-23]] §5 already settled the discipline for this shape of problem —
**literal base, optional overlay, base always valid**. A literal hex is always a
valid colour; a palette reference is the refinement. Apply it unchanged:

> An L1 page document is always a complete, **literal** document in **one**
> locale. A second locale is **another document**, authored by the AI from the
> first, free to differ in layout because it must.

The cost is divergence: edit the English hero and the German is stale. That cost
is accepted, because it is **visible and reconcilable** (and the AI is the
reconciler), which strictly beats the bundle's invisible breakage.

One refinement worth recording: `nav`, `config.tagline` and `seoMeta` are
**metadata**, not laid-out text — they have no geometry to break. Locale-keying
*those* is fine. The rule is not "bundles are bad"; it is:

> **Laid-out text → document variant. Metadata text → locale-keyed is fine.**

**None of §4 is built.** It is the reserved seam, recorded so it is not
precluded. See §9.

## 5. Site locale identity

Four fields on `siteConfigSchema` (`packages/site-schema/src/schema.ts`), which
today carries `businessName`, `tagline`, `contact`, `integrations`,
`distribution` — and **no notion of where the business is**:

| field | standard | example |
|---|---|---|
| `country` | ISO 3166-1 alpha-2 | `IE` |
| `locale` | BCP 47 | `en-IE` |
| `currency` | ISO 4217 | `EUR` |
| `timezone` | IANA zone id | `Europe/Dublin` |

**All four default from `country`**, so the consultation asks *one* question
("where is the business?") and derives the rest — each individually overridable.

**They stay separate fields rather than being derived at each use**, because they
correlate without determining. Locale decides placement and separators; currency
decides symbol and decimal count. Both are needed, independently:

```
Intl.NumberFormat('en-IE', {style:'currency', currency:'EUR'})  →  €49.99
Intl.NumberFormat('de-DE', {style:'currency', currency:'EUR'})  →  49,99 €
```

`contact.address` already exists but is a free-text string — it cannot drive any
formatting decision and is not a substitute for `country`.

**Consequence for rendering:** `lang` is currently the hardcoded literal
`<html lang="en">` in **two** renderers —
`packages/framework/src/l1/render.ts:2465` and
`tools/generate/src/render/render.ts:188`. Both must emit `lang` (and `dir`) from
the page's locale. This is a live correctness and accessibility defect for any
non-English site, independent of everything else here.

## 6. Money — the clickable / readable line

| | Owner | Why |
|---|---|---|
| **Price you can click** (buy button, booking deposit) | payments module `config` | Displayed price ≠ charged price is a *legal* problem, not a cosmetic one. One source, or they drift. |
| **Price you can only read** (rate card, "from €90") | L1 copy | Nothing to drift against. A literal is honest. |

The first composes through the seam [[DOC-25]] §10 already defines: the module
owns `{amount_minor, currency}`, the display derives from it, and L1 owns every
paint axis. The charged amount and the shown amount are the same number **by
construction** rather than by discipline.

Two details that bite:

- **Minor units are not always 2.** JPY has 0, KWD has 3. Pass the currency to
  `Intl.NumberFormat` rather than dividing by 100.
- **EU and UK consumer-facing prices must display VAT-inclusive** (Price
  Indication Directive 98/6/EC; UK Price Marking Order). This is a legal
  obligation keyed off `country`, and belongs in the capability catalogue
  [[DOC-33]] §13 carries as an open dependency.

**No money annotation is added to L1.** The shape it would take if ever needed is
recorded in §9.

## 7. Time — the rule that is unrecoverable if wrong

Money carries its own disambiguator: a symbol. **Dates do not.** `03/04/2026` is
March 4th in the US and 3 April in Ireland. A misread date on a booking page is a
missed appointment — a real failure, not a formatting nit.

That is still the easy half, because **calendar dates are never L1 copy** — a
calendar module generates them at render from datetime values. The formatting
rule is therefore entirely inside the module (§8).

The hard half is **timezone**, and it is the one item in this document that
cannot be fixed retrospectively:

> Store **instants in UTC** plus an **IANA zone id** (`Europe/Dublin`). Never a
> local wall-clock string. Never a fixed offset (`+00:00`).

- **Offsets break on DST.** Ireland and the UK observe it, and the EU and US
  transition on *different dates* — so a booking made in October for a November
  slot silently shifts by an hour.
- **Wall-clock strings are worse**: they are unrecoverable, because historical
  bookings cannot be re-interpreted without knowing which zone they meant.

"3pm" in whose zone matters the moment an Irish business takes a booking from
someone browsing in New York.

## 8. What this obliges of behavior modules

Binding on [[DOC-25]] / [[DOC-26]] for modules **not yet authored**. Recorded
before the code exists, because both are free now and expensive to retrofit.

**8.1 Payments.** The charged amount is `config` as `{amount_minor, currency}`;
the displayed amount **derives** from it and is never independently authored
copy. Currency comes from `config`, defaulting to the site's. Formatting is
`Intl.NumberFormat` — never hand-rolled symbol concatenation. The module declares
its VAT-display obligation per `country`.

**8.2 Calendar.** The module never emits a hand-formatted date or time string:
always `Intl.DateTimeFormat` with the page locale. It stores instants in UTC with
an IANA zone id (§7), and surfaces the zone abbreviation wherever a cross-zone
booking is possible.

**8.3 Neither is an aesthetic dial.** A formatted price and a formatted date are
*data* resolved from locale, not presentation choices — so this stays inside
[[DOC-25]] §2's "config is data-only, never aesthetics" line rather than
straining it. Their *appearance* remains 100% L1.

## 9. Deliberately not built

Recorded so the absence reads as a decision, not an oversight.

| | Why not | Revisit when |
|---|---|---|
| Locale text bundles | Wrong primitive (§3) | Never in this form |
| Multi-locale page variants (§4) | No customer has two languages | A genuinely multilingual client |
| Multi-currency display / conversion | Every launch customer is permanently single-currency (§2) | A customer sells internationally |
| Money annotation on L1 `text` | A single-currency site gets nothing from it | Multi-currency, or observed price drift |

The money annotation's shape, if it is ever needed: mirror palette exactly — the
literal (`€49.99`) stays **in** the text node so geometry stays pinned against
real rendered text, with an optional `{amount_minor, currency}` overlay making it
derived and *checkable*. The literal is the rendered truth; the annotation is
provenance. That inversion — literal authoritative, token advisory — is the
opposite of conventional i18n and is required by §3.1.

## 10. Consultation impact

[[DOC-33]] Act I gains one question — *where is the business?* — which populates
all four fields of §5 and, through `country`, keys the legal obligations a
capability must declare (VAT display, Impressum in DE/AT, cookie consent). It
belongs in the **Business** ledger section.

## 11. Related

[[DOC-23]] (L1 substrate; §3 geometry, §5 the literal-base/overlay precedent) ·
[[DOC-25]] (behavior-module contract; §2 config is data-only, §10 composition
directions) · [[DOC-26]] (authoring & vetting) · [[DOC-33]] (consultation; §13
capability catalogue) · [[DOC-19]] (transcribe, don't reconstruct) · [[DOC-7]]
(framework architecture; site schema) · [[DOC-32]] (our own pricing — out of
scope here).
