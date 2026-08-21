---
uid: doc-d3aba72c
id: DOC-36
type: doc
title: Data Collection — product telemetry & the outcome corpus
created_by: xgd
created_at: '2026-08-21T02:15:59.782730+00:00'
updated_at: '2026-08-21T02:15:59.782730+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  doc_kind: architecture
  system_kb: true
---

# Data Collection — product telemetry & the outcome corpus

## 1. Purpose & scope

1st Contact will accumulate something no design tool has ever had: **what was decided, why, and
what happened next.** This document records what we collect, how it is structured, and the
principles that keep it useful and defensible.

**Status:** design capture from [[CHAT-21]]. Implementation is largely **post-launch** — but §9
lists two decisions that are cheap today and expensive later, and §4's principle costs nothing to
adopt from the first limb.

**Scope:** what we collect and why. The companion [[DOC-37]] covers what we must be able to destroy;
the two are one design, because what you collect determines what you have to be able to delete.

**Out of scope:** the legal instrument (terms, consent wording, DPAs). §7 describes the *shape* of
the bargain, not its drafting.

**Companions:** [[DOC-35]] (personas, and the elicitation rules that produce this data),
[[DOC-33]] (the consultation and its ledger), [[DOC-31]] / [[DOC-16]] (the design rubric this
corpus eventually replaces with evidence), [[DOC-37]] (deletion).

---

## 2. The thesis — matched pairs

Every design tool has opinions. **None of them has ground truth**, because designers ship and leave;
they never learn what happened next. Wix has traffic data but no design *decisions* — a template
choice isn't a decision. Agencies have decisions and no outcomes. Nobody holds both ends.

Because 1st Contact owns the whole chain — site, capture, list, billing, analytics — we hold
**matched pairs**: *this architecture, this hero, this CTA ladder → this traffic, these enquiries,
this revenue*, longitudinally, tagged by vertical and business size.

Two consequences follow.

**The design rubric can become empirical.** [[DOC-31]] produced findings; the encoded point of view
they imply does not exist yet, and its absence is currently a hard blocker on the divergent-sketch
opening ([[DOC-35]] §11). Today that rubric must be hand-authored. Over time it can be *measured*:
*"single-CTA heroes convert 30% better for local service businesses under N"* is not taste, it is an
observation only we are positioned to make.

**It compounds and cannot be bought.** The asset is accumulated decision→outcome pairs. That is not
scrapeable, not purchasable, and not reproducible by a competitor with more money — only by one with
more time in market.

---

## 3. Four layers, not one dataset

The single most useful framing: this is four datasets with very different value-to-sensitivity
ratios, and **most of the product-improvement value sits in the least sensitive layer.**

| Layer | Examples | Sensitivity | Where the value is |
|---|---|---|---|
| **Structured signals** | Spread rejection rates, capability refusals, stage timings, confusion markers, decision types | **Very low** — aggregate, non-identifying | **High.** Most product improvement lives here |
| **Ledgers** | The [[DOC-33]] §3 decision record — decisions with rationale and rejected alternatives | Moderate | High — already structured, already carries *why* |
| **Transcripts** | Every turn, verbatim | **High** — see §6 | Highest fidelity, most expensive to mine |
| **Outcomes** | Traffic, conversion, enquiries, revenue by source | **High** (commercially) | Highest — this is §2's other half |

---

## 4. Emit, don't mine

**The core principle. Anything we know we will want must be emitted as a typed event at the moment
it is produced — never recovered from prose afterwards.**

Mining unstructured transcripts is expensive, lossy, and privacy-exposing. The ledger already proves
the pattern: it exists precisely because *rationale is unrecoverable from a transcript*, so we write
it down when we have it.

Generalised: **the transcript is the raw material of last resort.** If we find ourselves routinely
re-reading transcripts to answer a recurring question, that is a missing signal, and the fix is to
emit it rather than to get better at mining.

This reframes the consent problem usefully. The instinct is to ask *"how do we get permission to
mine transcripts?"*; the better engineering answer is **instrument so that we rarely need to.**

---

## 5. Named signals

The first four to emit. All are layer-1 (§3) — aggregate, non-identifying, and collectable from day
one with no consent complexity.

### 5.1 Capability refusals — a backlog written by customers
[[DOC-33]] §7.3 already requires the AI to say plainly what cannot be done and log the gap. Formalise
it: **every refusal is a feature request with demand attached, produced by a paying customer at the
moment of genuine need.**

Emit `{kind, requested, nearest_offered, persona, vertical, session}` on every *no*. Aggregated, this
is the L1 capability roadmap and the behaviour-module backlog, prioritised by real frequency rather
than by argument — and it maps directly onto the two gap categories in the project's standing rule
(layout gap → L1 primitive; behaviour gap → module config).

### 5.2 Spread rejection rate — a health check on our own divergence
[[DOC-35]] and the [[CHAT-21]] design work stake everything on **plurality**: two or three genuinely
distinct options at each real decision. The failure mode is offering three shades of the model's
default and calling it divergence.

That is directly measurable. **If clients accept the first-presented option most of the time, our
options are not distinct.** Emit which option was chosen, its position, and whether anything was
rejected. A spread where nothing is rejected is a *failed spread*, and this is the cheapest available
early-warning on the exact template-DNA problem [[DOC-31]] exists to prevent.

Note it is a measurement of **us**, not of the customer.

### 5.3 Confusion markers
[[DOC-35]] §9.4 argues confusion is silent and detection asymmetric. That is a runtime problem, but
across thousands of sessions it is also an analytical one: the places where the product
*systematically* loses people.

Emit the absence-shaped signals: answer-length collapse, agreement without elaboration, question
repetition, and the domain-baseline gap (§9.4's control condition — engaged about their business,
flat about the site).

### 5.4 Stage timings and abandonment
Where sessions stall, where they run long against the scope band, where they end. Cheap, and it is
the only way to know whether the arc's claimed pacing survives contact.

---

## 6. The sensitivity catch

The intuition that this is low-risk data — *"people are building public websites, not discussing
medical conditions"* — is broadly right, with one specific exception that is worth knowing about
because **we cause it ourselves.**

[[DOC-35]] §6.3's capacity questions deliberately elicit **client counts, churn, conversion rates and
pipeline length**. That is revenue concentration and business health: genuinely confidential, and
considerably more sensitive than the framing suggests. Add competitor discussion, unpublished
pricing, and — for some personas — clients' personal circumstances.

None of this makes the plan wrong. It means:

- The **outcomes** and **capacity** layers warrant stricter handling than the design layer.
- Anything surfaced back across customers (§7) needs **minimum cohort sizes**. *"The only caterer in
  Boulder"* is identifiable no matter how the aggregate is computed.
- The consent conversation should be honest that business numbers are in scope, not only design
  choices.

---

## 7. Reciprocity — the bargain that makes consent easy

The strongest version of this is not extraction-with-permission. It is **giving the aggregate back.**

*"Businesses like yours convert at about 3%; you're at 1.2%."* *"Most caterers your size see
enquiries peak in October."* *"Sites in your trade that added a lower-commitment entry point saw
enquiries roughly double."*

A sole proprietor cannot obtain benchmark data any other way, at any price. This is what Stripe and
Shopify give their merchants and it is uniformly popular.

Three properties make it the right design rather than merely a nice gesture:

- **Consent stops being a legal chore and becomes a feature** people opt into, because the loop
  improves *their* business and not only our product.
- **It is a retention mechanic** — the benchmarks get better the longer they stay, and they are
  lost on leaving.
- **It disciplines us.** If a signal cannot eventually be given back in some form, it is worth asking
  why we are collecting it.

Opt-out must exist regardless (§10), and the reciprocal framing is what makes opt-out rare rather
than what makes it unnecessary.

---

## 8. The tenant escape boundary

Collection and deletion meet here, and the rule belongs in both documents.

Most of §5 and §7 requires data to **leave the tenant** — that is the entire point of cross-customer
learning. So:

> **Anything crossing the tenant boundary is either irreversibly aggregated at the moment it crosses,
> or it carries the tenant key so that it dies with the tenant. There is never a third category.**

Get that right and tenant deletion ([[DOC-37]] §4) remains true without constraining what we learn.
Get it wrong once and "delete my account" becomes a lie we cannot detect.

Practically this means the aggregation step is part of the *emit* path, not a later batch job:
signals are written in already-aggregable form, and anything retaining per-customer granularity is
tenant-keyed by construction.

---

## 9. Two decisions that are cheap now and expensive later

**Record the onboarding sessions.** With permission, audio at minimum, transcribed. Eight
technology-anxious novices talking about websites for an hour is the **register corpus** [[DOC-35]]
§9 currently asserts without evidence — including, crucially, *their own words for things*, which is
what §9.6 says the AI should adopt. That recording cannot be obtained again and costs nothing but
asking. (See the session protocol work for the observation sheet.)

**Adopt §4 and §8 from the first limb.** Emitting typed signals and enforcing the escape-boundary rule
are nearly free at limb one and a migration at limb five.

---

## 10. Positions and open questions

**Positions taken:**
- Layer-1 signals are collected always; they are non-identifying and carry no consent burden.
- Ledgers, transcripts and outcomes require consent, with **opt-out available**.
- Data is used **solely for product improvement and for reciprocal benchmarks**. Not sold, not
  published, not shared.
- Aggregate benchmarks are subject to minimum cohort sizes.

**Open:**
- **Few-shot vs fine-tuning.** Using strong sessions as few-shot exemplars in the prompt layer is a
  different act from training a model, with different consent implications — and early on, materially
  more value per unit of effort. Worth keeping the distinction explicit as this develops.
- Whether outcome benchmarks are a paid feature, a retention feature, or the consent consideration
  itself.
- Whether opt-out is all-or-nothing or per-layer (§3 suggests per-layer is both feasible and fairer).
- How long transcripts are retained once their signals have been extracted. If §4 works, the answer
  may be "not very long," which is also the best privacy posture available.
- Whether the empirical rubric (§2) feeds the prompt layer directly or is curated by us first. The
  [[DOC-31]] anti-genericness argument suggests curation, since an unattended optimiser converges on
  whatever converts *on average* — which is the definition of a template.
