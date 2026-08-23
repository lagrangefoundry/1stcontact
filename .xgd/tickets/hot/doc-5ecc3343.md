---
uid: doc-5ecc3343
id: DOC-32
type: doc
title: Why People Pay For Design — Independent-Designer Economics & AI-Website-Builder
  Pricing Benchmarks
created_by: xgd
created_at: '2026-08-10T17:52:15.012178+00:00'
updated_at: '2026-08-16T01:19:37.724358+00:00'
completed_at: null
last_field_updated: system_kb
status: null
fields:
  doc_kind: architecture
  system_kb: true
  chat_comment: comment-32293ac9
---

Research report, commissioned via a 10-agent Workflow research pass (3 parallel sourcing agents + synthesis), 2026-08-10. Source material: agency "why hire us" pages, freelance/agency pricing surveys and published pricing pages, and existing AI-website-builder pricing pages (Wix, Squarespace, Framer, Durable, 10Web, Dorik, Hostinger, B12). Commissioned from the [[CHAT-134]] strategy discussion — companion to [[DOC-31]] (design differentiation audit). Feeds the pricing/packaging decision in that discussion; see [[CHAT-134]] for 1stcontact's own unit-economics follow-up, which this report explicitly does not attempt.

**Revised 2026-08-11 (zero-human-time positioning).** The original synthesis assumed a live human on the consult and a small human-review allowance in the ongoing tier. That is now explicitly out of scope: 1stcontact is designed for **zero human time in the delivery path** (§0). The market evidence in §2 and §3 is unchanged — it is the same benchmark set — but every recommendation in §4 has been re-derived under the autonomy constraint, and the human-dependent proposals have been removed rather than softened.

# Why People Pay For Design — Independent-Designer Economics & AI-Website-Builder Pricing Benchmarks

## 0. Design constraint: zero human time

**1stcontact is fully autonomous. No proposal in this report may depend on a human being present, reachable, or in the loop.**

This is a design constraint, not a cost-optimization preference, and it has three consequences that run through everything below:

1. **No human labour appears in any cost line.** The marginal cost of a session is compute, inference, and infrastructure. There is no fully-loaded hourly rate to amortize, which is precisely what makes the $200–$1,000 band defensible against a $2,500–$5,000 human benchmark (§4.1).
2. **No proposal may promise human attention, and no marketing claim may imply it.** Where the market's value drivers are stated in terms of a person (§2D — "the team that pitches is the team that builds"), the report re-derives what the buyer is *actually* purchasing underneath that framing, and asks whether an autonomous system delivers it better, worse, or differently. Several of them it delivers strictly better; one it cannot deliver at all, and that is stated plainly rather than papered over (§4.2, recommendation 4).
3. **Human involvement is a defect to be engineered out, and must be measured as such.** Some human time is likely unavoidable in practice — content moderation and abuse/liability review are the obvious cases, and possibly dispute handling. These are treated as **named, bounded exceptions with an owner and a per-session budget**, tracked as a rate to be driven toward zero, not as an accepted line item that quietly grows. If a human minute is required, it is a bug with a ticket, not a service tier. Any such exception must be costed explicitly in the unit-economics model (§4.3) — an unmeasured moderation queue is the single most plausible way this business quietly becomes labour-bound.

---

## 1. Executive Summary

People do not pay independent designers for pixels — they pay to offload risk, time, and strategic judgment they don't trust themselves (or a template) to handle well, and they pay a *premium* for direct, undiluted access to whatever is actually doing the work. Across agency marketing pages, freelancer pricing surveys, and forum-summary sourcing, the same value drivers recur regardless of price point: opportunity cost of the owner's own time, escape from templated "sameness," measurable performance/SEO/conversion outcomes, credibility in trust-sensitive verticals, and — specifically for boutique/independent providers — direct access with no hand-off between the thing that listens and the thing that builds.

On the supply side, the market has already converged on **flat/tiered package pricing over hourly billing** (82% of freelance designers price this way), with a strong project-fee center of gravity at **$2,500–$5,000** for a real small-business site, a **sub-$1,000 "template-adjacent" tier**, and **maintenance retainers in the $100–$3,000/month range**. AI website builders (Wix, Squarespace, Framer, Durable, 10Web, Dorik, Hostinger) have separately converged on **tiered flat subscriptions ($10–$40/month) metered by an internal AI-credit allowance**, with free/low-cost tiers functioning as the trial mechanism. **B12 is the one product in the set that pairs an AI-assisted flow with human consultation, and it prices that human-delivered "done-for-you" outcome at $1,999 one-time.**

That B12 data point is the report's central economic finding, and it reads differently under the autonomy constraint than it did originally. B12 is **not** the model to imitate — it is the **price of doing this with humans**. Buyers demonstrably pay ~$2,000 for a done-for-you site outcome when a person delivers it. 1stcontact targets a comparable *outcome* with **no marginal human cost**, which is exactly what licenses the $200–$1,000 band: the discount is funded by the removed labour, not by reduced quality or ambition.

1stcontact's planned structure — free AI-led consult/demo, $200–$1,000 one-time paid build session, $30–$80/month ongoing — sits in a **genuinely underserved gap**: priced above commodity self-serve AI builders (which top out around $30–40/mo and deliver a tool rather than an outcome) but well below the human-delivered outcome benchmark ($1,999 at B12; $2,500–$5,000 for independent designers). The recommendation in Section 4 is to **tier the $200–$1,000 band explicitly by scope** (mirroring the dominant flat-package pattern), **meter the $30–$80/mo tier by usage/credits** (mirroring the AI-builder convention that protects provider margin, and which is the only viable structure once human review is off the table), and **anchor positioning on the delivered outcome and the interaction properties an autonomous system genuinely has** — real-time, unlimited-patience, zero-queue, zero hand-off — rather than on borrowed boutique-designer language that implies a person. Hitting the specific 90% net-cost-positive target remains a unit-economics question this report cannot resolve — see the explicit caveat in Section 4.3.

---

## 2. Value-Proposition Thesis: What Is Actually Being Purchased

Synthesizing across the "why hire a designer" sourcing, ten distinct (but overlapping) purchase motives recur. They cluster into four categories. Categories A–C transfer to an autonomous provider essentially unchanged; category D is the one that needs decomposition, because its market framing is stated in terms of a person.

### A. Buying back the owner's own time and risk
The most consistently cited driver is **opportunity cost**, not sticker price. One analysis quantifies it directly: ~30 hours of DIY effort at $50/hr = $1,500 in owner time, plus ~$540/year in platform fees — "nearly professional pricing without superior results" (Zentus). The recurring framing across sources is a reallocation question — *"is your time best used learning how to build websites, or running your business?"* (Matt Chase Designs) — not a pure cost comparison. This is the strongest and most universal motive, present regardless of industry or business size.

**Transfers fully.** This driver is about the *buyer's* time, not the provider's. It is agnostic to whether the work is done by a person, and an autonomous provider that compresses delivery from weeks to a single session strengthens it.

### B. Buying an outcome, not an artifact
Multiple sources are explicit that DIY sites are rarely built with conversion, SEO, or business objectives in mind (Olly Olly), and cite concrete before/after numbers: a custom-built site ranking #1–2 in 9 cities across 2 states and driving 100+ customers from organic search (Hello Web Designs); a boutique case study citing 719 initial customers, 343 repeat buyers, 226.82% ROI, and an 88% lift in organic keywords (Forge and Smith). The purchase, in other words, is framed as a *revenue instrument*, and the decision heuristic several sources converge on independently is the clearest articulation of this: **if the site's job is to exist, a builder is fine; if the site's job is to win customers, a professionally built site "almost always pays for itself."** This heuristic is directly usable in 1stcontact's own positioning language.

**Transfers fully, and is the primary claim.** The buyer is purchasing an outcome; who or what produces it is instrumental. This is the single most important framing for an autonomous provider, because it is the one where "no human involved" is simply irrelevant to the value delivered — and it is where the offer should be anchored (§4.2, recommendation 4).

### C. Buying differentiation and trust signaling
- **Anti-genericness**: "Wix templates start to look like Wix templates" — a documented sameness problem that undermines brand differentiation (BleylDev, Hello Web Designs). Designers build "around your specific services" rather than fitting the business into a template.
- **Credibility in trust-sensitive verticals** (law, medicine, real estate, luxury retail): an amateurish DIY site is framed as an active liability — "one lost high-value client because of a DIY-looking website costs more than hiring a designer would have" (Zentus).
- **Total cost of ownership**: DIY wins on year-one sticker price but loses by year two or three once premium app add-ons stack up ($500–$1,500 one-time frequently undercuts multi-year DIY subscription costs — Crearewebsolutions).
- **Ownership/portability**: DIY-platform sites are effectively unexportable — "leaving the platform means rebuilding from scratch" (BleylDev) — versus a professionally built asset the client actually owns.

**Transfers, conditionally — and it is the category most at risk from autonomy.** Anti-genericness is a *property of the output*, not of the producer, so it transfers if and only if the generated output is genuinely non-templated. That is exactly the risk [[DOC-31]] flags: an autonomous generator that defaults to the same section order across every customer reproduces the template-DNA failure it exists to escape, and does so at scale. This category is therefore not a positioning claim to make — it is an output property to verify, via [[DOC-31]]'s structural-vs-cosmetic diagnostic run against 1stcontact's own output distribution.

### D. Buying access, attention, and expertise — decomposed
This is the category the market states in terms of a person, so it needs decomposing into what buyers are actually purchasing before any of it can be claimed:

| Market framing (as sourced) | What is actually being bought | Autonomous delivery |
|---|---|---|
| **No hand-off** — "the team that pitches your ideas is the team that actually works on your project" (Nora Kramer Designs) | Context is not lost between the conversation and the build; nobody re-explains the brief to a junior | **Strictly better.** There is literally one system; there is no hand-off to lose context across. This is the rare case where the autonomous version is not an approximation of the human promise but a stronger form of it |
| **Selective attention** — boutiques take fewer projects so work doesn't "get lost in the shuffle" | The provider is not rationing attention across a queue; the buyer isn't waiting behind other clients | **Strictly better.** No queue, no capacity constraint, no scheduling. Availability is an infrastructure question, not a calendar one |
| **Ongoing accountability** — "with a DIY builder, you're on your own... if something breaks, it's your problem" (Olly Olly) | Something remains reachable and responsible after launch, rather than the buyer being alone with a broken site | **Deliverable, and it is the ongoing tier's actual job** (§4.2, recommendation 3). Requires the always-on system to detect and act, not merely to answer when asked — an autonomous monitor that catches a break before the owner does is a stronger version of this promise than a human who responds to a support email |
| **Strategic/marketing expertise beyond visual production** — designers "know all about digital marketing" and can validate whether design choices serve business goals (Simply Built) | Judgment about whether the site will actually work commercially, not just look acceptable | **The genuinely contested one.** This is a capability claim about the system's judgment, and it is provable only by outcomes. It should not be asserted as a positioning line until there is evidence; see §4.2, recommendation 4 |

**Synthesis for 1stcontact**: the proposed format — a live, conversational, story-first discovery session that produces a working site *in front of the client* — delivers categories B and D simultaneously in a single session, and C conditionally (on output quality). None of the AI-builder competitors offer it (they are all self-service tools that hand you an editor, not an outcome), and no freelancer can deliver it at this price point or on this timescale (freelance delivery is asynchronous, over days or weeks).

The differentiator is therefore **the format and the outcome — a real-time conversation that ends with a finished site — not the presence of a person and not the AI as such.** "AI website builder" is the wrong category to be compared in; so is "boutique designer." The honest and stronger frame is the one thing neither competitor offers: *you talk about your business for fifteen minutes and a site exists at the end of it.*

---

## 3. Pricing Benchmarks

### 3.1 Independent designers / small agencies

These are the human-delivered benchmarks. They matter as the **price of the outcome when labour delivers it** — the anchor 1stcontact is discounting against — not as a cost structure to imitate.

| Segment | Structure | Price | Source |
|---|---|---|---|
| Pricing model used (freelancers) | Flat/package (82%) vs. hourly (60%, usually secondary) vs. retainer (minority, <19% of revenue for most) | — | webdesigneracademy.com |
| Paid discovery/scoping session | Uncommon (~15% of designers charge for it) | — | but 2x more likely to land $5,000+ projects — webdesigneracademy.com |
| Hourly — entry | Hourly | $25–$40/hr | goLance |
| Hourly — mid | Hourly | ~$58/hr avg | webdesigneracademy.com |
| Hourly — experienced | Hourly | $50–$100/hr | Wix rates guide |
| Hourly — senior/specialist | Hourly | $75–$150/hr (avg ~$103, ceiling ~$200) | goLance |
| Simple brochure site (3–5 pages), low end | Flat project | $750–$1,000 | Fourth Coast Web |
| **Sweet-spot small-business site (single most common band)** | Flat project | **$2,500–$5,000** | webdesigneracademy.com |
| Custom/feature-rich (CMS, booking, e-commerce, API) | Flat project | $4,000–$15,000+ | webdesigneracademy.com |
| Small-agency full build (5–12 pages) | Flat project | $6,000–$15,000 | Jim.com, GruffyGoat |
| Budget/template-adjacent studio | Flat project or subscription | starting $490 / or $79/mo | Debuggers Studio, TL Design Studios |
| WebFX tiers (mid agency) | 3-tier flat | Basic $6,500–$15,000 / Intermediate $15,000–$50,000 / Advanced $50,000–$100,000 | webfx.com |
| Maintenance-only retainer (bare bones) | Monthly retainer | $100–$500+/mo | Jim.com |
| Maintenance + light design retainer | Monthly retainer | $500–$3,000/mo (up to $5,000/mo "comprehensive") | ManyPixels |
| Small-client design retainer benchmark | Monthly retainer | $1,000–$5,000/mo | gigradar.io |

**The load-bearing row for 1stcontact is the bare-bones maintenance retainer at $100–$500/mo.** That is the observed market floor for *any* recurring human involvement, however minimal. 1stcontact's $30–$80/mo tier is priced at roughly a sixth to a third of that floor — which is only coherent because there is no human time in it at all. Any recurring human minute in the ongoing tier does not shave the margin; it inverts the price point.

### 3.2 AI website builders / AI-assisted design products

| Product | Structure | Free tier / trial | Paid tiers (representative) | AI usage metering | Human-in-the-loop? |
|---|---|---|---|---|---|
| Wix | Tiered flat, annual discount | Free (branded/subdomain) | $17–$159/mo | AI bundled, unmetered | No |
| Squarespace | Tiered flat + AI credits | 14-day trial | $29–$99+/mo | Metered: 10–120 AI credits/mo | No |
| Framer | Tiered flat + shared AI-credit pool | Free (500 credits/mo, branded) | $10–$100+/mo | Metered: 500–3,000+ credits/mo | No |
| Durable | Tiered flat | Free (perpetual) | $22–$41/mo | Bundled, scales by tier caps | No |
| 10Web | Tiered flat, usage caps | 14-day trial | $10–$22.50/mo (consumer); $42.50–$80+/mo (agency) | Metered: 100–300 AI credits/mo | No |
| Dorik | Tiered flat, generous free tier | Free (perpetual) + 7-day full trial | $29–$99/mo (or lifetime $249–$599+) | Not AI-metered; scales by collaborators/pages | No |
| Hostinger | Tiered flat, long-term discounts | No trial (money-back guarantee) | $11.99–$27.99/mo | Metered: 5–15 AI credits + 50–100 AI agent credits | No (chatbot support only) |
| **B12** | Tiered flat + AI credits **+ one-time human add-on** | Free (30 credits/mo) + $1/mo intro (3 mo) | $49–$399/mo | Metered: 200–300 AI credits/mo | **Yes** — live Customer Success team + optional **$1,999 one-time** done-for-you build |
| **1stcontact (planned)** | **One-time scoped session + tiered flat monthly** | **Free AI-led consult/demo** | **$200–$1,000 one-time; $30–$80/mo** | **Metered credits (§4.2.3)** | **No — by design (§0)** |

**Cross-cutting patterns:**
1. Tiered flat subscription is the near-universal AI-builder structure; none use hourly/consultant billing. Nothing in the market requires an autonomous provider to invent a novel billing shape — the conventional one fits.
2. AI usage itself is usually metered as a secondary axis (credits) *inside* a flat tier — this is the mechanism the market uses to cap the provider's variable cost exposure while still offering unlimited-feeling access. For a zero-human provider this is not merely a convention to follow but **the only remaining margin-protection lever**, since there is no billable-hours dial to fall back on.
3. Free tier vs. time-boxed trial split roughly evenly; a permanent free/branded tier is the more common trial substitute.
4. **Every competitor in the set except B12 is fully autonomous — and every one of them delivers a *tool*, not an outcome.** The autonomy constraint therefore does not, by itself, differentiate 1stcontact from Wix or Durable; what differentiates it is that the autonomous session ends with a finished site rather than an editor login. B12 is the only product delivering the outcome, and it charges $1,999 because a person delivers it. **The gap 1stcontact occupies is "outcome, autonomously" — a quadrant currently empty in this benchmark set.**

---

## 4. Recommended Pricing Framework for 1stcontact

### 4.1 Where 1stcontact sits on the map

Plotting 1stcontact's three components against the benchmarks:

| Component | 1stcontact's plan | Nearest benchmark(s) | Positioning read |
|---|---|---|---|
| Free AI-led consult/demo | Free, dual-purpose (value + pitch), zero human time | Majority (~85%) of designers use free discovery calls; Wix/Durable/Framer free tiers as trial mechanism | Occupies the same funnel slot as both, but its cost is compute rather than labour — so it scales with demand instead of capping on calendar availability. This is the single largest structural advantage over the human benchmark |
| $200–$1,000 one-time build session | Flat, live, session-based, autonomous | Below B12's $1,999 human done-for-you add-on; below designer sweet spot ($2,500–$5,000); overlaps template-tier freelance work ($490–$1,000) | **Premium-to-DIY, budget-to-agency** — and the discount is explicitly funded by removed labour cost, not by reduced scope or quality |
| $30–$80/mo ongoing | Flat monthly, metered, autonomous | Squarely inside AI-builder subscription range (Wix $29, Squarespace $29, Framer $30, Durable $22–$41, B12 $49); far below the $100–$500/mo human maintenance floor | Priced like a **SaaS subscription**, because that is what it structurally is. The price point is not merely helped by zero human time — it is *only available* because of it |

The structural implication is now a design invariant rather than a caution: **the $30–$80/mo tier is priced below the market floor for any human maintenance involvement, so it cannot carry human time at all.** Everything in §4.2 follows from that.

### 4.2 Structural recommendations

**1. Keep the free consult free, and treat it as a compute-funded acquisition channel — not a scarce appointment.**
The data supports free discovery as the market norm on both sides of the benchmark set. Under the autonomy constraint the economics differ from the human version in a way worth exploiting deliberately: a human's free consult is rationed by calendar and is a real opportunity cost, so designers gate it (~85% offer it, but selectively). 1stcontact's is rationed only by compute cost, so it can be offered **at unlimited concurrency, instantly, at any hour** — which is itself a differentiator against every designer benchmark and against B12's scheduled Customer Success call. Model its cost as **customer-acquisition cost amortized across paid conversions**, not as a line item expected to be cost-positive on its own, and monitor the free-session compute burn per conversion as a first-class metric (§4.3) — it is the one unbounded cost in the model and the obvious target for abuse.

**2. Sub-tier the $200–$1,000 paid session by explicit scope, not by time spent — and enforce scope programmatically.**
The dominant pattern among independent designers is flat/package pricing tied to scope (82% of freelancers), not hourly billing. For an autonomous provider, hourly billing is not merely awkward to justify to a consumer audience — it is meaningless, since there are no hours being sold. Recommend three explicit scope bands within the range, mirroring the WebFX/small-agency tiering pattern:
- **~$200–$350** — single-page/landing-page scope (mirrors the low end of the "template-adjacent" freelance band, $490–$1,000, but priced lower because there is no labour to recover).
- **~$400–$650** — small multi-page business site (the segment where independent designers' $750–$1,000 low tier and 1stcontact's offer compete on outcome, not price).
- **~$700–$1,000** — added complexity (booking, e-commerce basics, integrations) — still well under B12's $1,999 and the $2,500+ where independent-designer custom work begins.

**The scoping mechanism is where the autonomy constraint bites hardest, and it is the highest-leverage margin lever in the model.** In the human version of this business, scope discipline is a judgment a designer exercises during the discovery call — the paid-discovery data point (designers who charge for discovery land 2x more $5,000+ deals) is really a proxy for *structured, disciplined scoping conversations*. 1stcontact cannot rely on a person exercising that judgment, so the discipline must be **built into the product as a deterministic gate**: the free consult classifies the request into a band, states the band and its price to the customer before payment, and the paid session is *bounded by that classification at execution time* — not merely guided by it. An autonomous session with no enforced scope ceiling will drift into $1,000-tier work at $200-tier pricing on every ambiguous request, and unlike a human it will do so tirelessly and at scale. Concretely, this needs: a classifier at intake, an explicit customer-visible scope statement at the point of sale, a hard resource/turn budget per band at execution, and an in-session upgrade path when the customer asks for out-of-band work.

**3. Meter the $30–$80/mo tier by usage/credits; differentiate the tiers by capability and autonomy, never by human review.**
Every AI-builder competitor in this price band (Squarespace, Framer, 10Web, Hostinger, B12) protects margin at a flat subscription price by metering the AI-driven component with a monthly credit allowance rather than promising unlimited usage. This is the clearest convergent structural lesson from the benchmarking: **flat price + metered usage is how this exact market segment already solves the "stay net-positive per customer" problem** — and for a zero-human provider it is the only available lever. Recommend:
- **$30/mo** — a capped allowance of AI-assisted edit/update credits, self-serve, plus hosting and the baseline autonomous uptime/breakage monitor.
- **$80/mo** — the same, differentiated along axes that are all machine-deliverable: a larger credit allowance; access to higher-capability generation for more ambitious changes; proactive autonomous review (periodic checks against conversion/SEO/accessibility heuristics, surfaced as suggested edits rather than waiting to be asked); faster or priority processing; richer analytics.
- **No tier includes human review, "designer-reviewed" edits, or human support hours** — those are removed from the offer, not capped. This is not a margin compromise: it is what §3.1's $100–$500/mo human maintenance floor makes structurally necessary at this price point. The ongoing tier's answer to §2D's "ongoing accountability" driver is the **autonomous monitor** — a system that detects a broken form or a dropped page and fixes or flags it before the owner notices — which is a stronger delivery of that promise than a human who replies to a support email within two business days.
- **Support is part of the product surface, not a staffed function.** If a customer cannot get an answer from the system, that is a product gap to close, not a queue to staff.

**4. Anchor positioning on the outcome and the format. Do not borrow boutique-designer language that implies a person.**
Leading with "AI website builder" invites direct price comparison to Wix/Durable/Squarespace, where a $200–$1,000 one-time fee looks expensive against their $0–$40/mo entry points — and it is also inaccurate, since those products sell an editor and 1stcontact sells a finished site. But the original recommendation here — lead with the boutique "direct access, no hand-off" narrative — is **withdrawn under the autonomy constraint**, on two grounds:

- **Accuracy.** That language ("the person who actually builds it," "personal attention") implies a human. Using it would be a claim the product cannot honour, in a category where trust is a substantial part of what is being sold (§2C). A customer who discovers the implied person does not exist has been misled about the thing they were told to value most, which is a materially worse outcome than never having made the claim.
- **It is not the strongest claim available.** The decomposition in §2D shows that two of the three deliverable sub-drivers — no hand-off, and unrationed attention — are *stronger* in the autonomous version and can be stated literally rather than by analogy. There is no need to borrow the framing.

Recommend anchoring instead on:
- **The outcome** (§2B, the strongest and most transferable driver): a site whose job is to win customers, not merely to exist. This is the load-bearing claim and it is fully honest.
- **The format**, stated literally: a real-time conversation about your business that ends with a finished, live site — available instantly, at any hour, with no appointment, no queue, no brief to write, and no hand-off between the thing that listened and the thing that built it. Every clause there is literally true of an autonomous system and none of it is true of any competitor in §3.
- **The comparison set**, chosen deliberately: compare against the *outcome* benchmarks (B12's $1,999; the $2,500–$5,000 designer band) rather than the *tool* benchmarks (Wix, Durable), so the price reads as a steep discount on a comparable deliverable rather than a premium on a cheap tool. This is what allows 1stcontact to avoid racing to the cheapest possible price: the anchor category matters as much as the number.
- **Not claiming strategic/marketing judgment** (§2D, row 4) until it can be evidenced by customer outcomes. It is the one sub-driver whose autonomous delivery is genuinely unproven, and asserting it early is the fastest route to eroding the credibility the other three claims depend on.

### 4.3 Explicit caveat on the 90% net-cost-positive target

Everything above addresses **market positioning and structure** — where 1stcontact's price points sit relative to comparable designer and AI-builder offers, and what structural mechanisms (scope-tiering, programmatic scope enforcement, usage-metering, zero human time) the market and the autonomy constraint jointly require to protect margin at a given price point.

**It does not, and cannot, tell 1stcontact whether $200 (or $350, or $1,000) actually clears their own cost floor in 90% of sessions.** That requires an internal unit-economics model this report has no visibility into. Under the autonomy constraint the cost lines are these:

- **Per-session compute/token cost of the live conversational build** — and critically its *variance*, not its mean, since a 90%-of-sessions target is a statement about the distribution's tail. Conversation length, model calls, revision cycles, and retry/regeneration on failed generations all drive it.
- **Automated QA and verification cost per session** — the autonomous replacement for human review. Rendering, capture, comparison, conformance and accessibility passes, and any regeneration those passes trigger. This is a real and recurring cost that grows with quality ambition; it is the line most likely to be underestimated because it has no labour analogue to reason from.
- **Infrastructure and hosting cost** amortized per paid customer and per free-tier customer.
- **Free-session compute burn per paid conversion** — the free consult's cost must be amortized across conversions, not treated as free (§4.2.1). Unlike a human's free consult, this one has no natural capacity limit, so it needs both a per-session budget and an abuse/scraping control.
- **Distribution of actual client requests across the proposed scope tiers**, and the observed rate of scope drift past the enforced band (§4.2.2). A $200 tier only stays cost-positive if the classifier and the execution-time budget actually hold.
- **Marginal cost of servicing the $30–$80/mo tier** over a multi-month customer lifetime, including credit redemption rates and the compute cost of the always-on autonomous monitor (which runs whether or not the customer engages that month).
- **The bounded human exceptions (§0.3), costed explicitly and tracked as a rate.** Content moderation, abuse/liability screening, and dispute handling are the realistic candidates. Each needs a named trigger condition, a measured per-session incidence, a fully-loaded cost, and a reduction target. **If the moderation rate is not instrumented from day one, this is the line that silently converts the business back into a labour-bound one** — and it will do so invisibly, because it appears as an operational burden rather than as a cost-of-goods line.

1stcontact should build that model (ideally session-level, not averaged, since the target is a percentile) before finalizing exact price points inside the recommended bands, and should treat the tiering/metering/scope-enforcement structure above as the mechanism for keeping its assumptions defensible — not as a substitute for building it.