---
uid: chat-ae42db86
id: CHAT-20
type: chat
title: 1c coverage
created_by: xgd
created_at: '2026-08-11T19:58:36.655467+00:00'
updated_at: '2026-08-11T19:58:36.655467+00:00'
completed_at: null
last_field_updated: created_at
status: open
fields: {}
---

## 1stcontact — Next Stages for L1 / AI Website Building (design discussion, continued from xgd session CHAT-134)

This ticket continues a design conversation that started in an xgd-hosted chat session
(xgd ticket CHAT-134 / chat-b9d358a1), where 1stcontact code and tickets were being read
and written cross-project. The full prior conversation is preserved verbatim in the
`chat_transcript` comment on this ticket. This body carries forward the distilled summary
from that session so the conversation can continue natively in 1stcontact.

### Framing: three distinct tracks
1. **(1) Internal capability R&D** — engineering diagnostics, no customer in the loop.
2. **(2) Free consultation** (~15 min) — dual-purpose: real value + sales pitch. Must be cheap, scalable, low risk of embarrassment (a bad demo hurts more than no demo).
3. **(3) Paid consultation** (~$200-1000 one-time + $30-80/mo ongoing) — deep, high-touch, becomes an ongoing relationship.

### Reproduction/import — resolved
- NOT needed as a "faithful starting draft" for (2)/(3) — the live conversation is the source of truth, not a scrape.
- IS needed as **context/ingestion**: exact content extraction (already solid — DOM/computed-style capture pipeline) + genuine visual perception via a vision-model pass (not yet built — screenshots exist in the capture bundle today but are only ever pixel-diffed, never shown to a model). The AI needs to *see* the site to have an informed conversation and to honor existing investment/attachment (colors/style the client already likes).
- True reproduction-fidelity (can L1 faithfully rebuild an existing site) stays a (1)-only diagnostic: vision-only, no-DOM-access, iterative self-correction loop, used to separate "L1 schema ceiling" from "AI taste/execution skill."
- Shared infra: image-content-block support on the model backend serves both the (1) diagnostic and the (2)/(3) ingestion step — one investment, two payoffs.

### (3) Paid session — sketch
- Step 0 (background, before session starts): ingestion (content + vision read) so the AI walks in already informed.
- Phase A: story/content conversation — bare-bones, text-only L1 (no styling) to keep focus on messaging/structure before visual polish.
- Phase B: design/effects conversation — same `set_l1` tool loop, filling in visual axes live in front of the client.
- Live progressive assembly is the emotional core of the value prop — watching it happen is part of what's being sold, not just the resulting file.
- Open question: does the $30-80/mo tier mean self-serve ongoing edits (client becomes a caretaker-role user) or continued design/marketing input from us? Affects whether session-AI and ongoing-edit-AI are the same role.
- Pending check: how much of the live-render-while-chatting mechanism already exists (recent commits suggest a live AI chat panel + site-session binding already landed).

### (2) Free consult — sketch
- 15 min, free, dual-purpose, must be cheap and low-risk. NOT a scaled-down (3) — full live bespoke generation per prospect is too slow/risky/costly.
- Shape: (a) curated example gallery (bucket-1 output), relevant to the prospect's vertical, near-zero marginal cost, zero risk; (b) one narrow, fast, live micro-build (e.g. a single hero section), personalized, proving personalization without full-site risk.
- Ingestion (content + vision) can run in the background as soon as the prospect submits their URL, before the call starts — lets the opener be specific ("I noticed X...") at no live time cost.

### Business-head correction (important)
- Don't optimize for maximal flashiness. A plumber persona may care about conversion (clear phone number, service area, trust signals, fast load, obvious "call now") far more than scroll animation — "because we can" is a failure mode, not a feature.
- The rubric needs a **restraint / fit-to-audience axis**, not just an impressiveness score: is a conversion-first, professional-trust-first execution (trades, local services, healthcare) vs. a brand-experience-first, innovation-signaling execution (funded startups, creative/DTC) — and the discovery conversation's job includes figuring out where a given client sits on that spectrum, then calibrating output accordingly. The "5 factors" (layout novelty, motion, typography, imagery, bespoke details) are a palette to draw from *appropriately*, not a checklist to maximize.

### What (1) owes (2)/(3)
- Design-philosophy/rubric — from a deliberate survey/critique exercise. Not "teach Claude design" (it has broad principle knowledge already); the exercise is about deciding and encoding *our* point of view, and correcting for the internet's statistical pull toward mediocre/templatey as the mode.
- Reference corpus — three-way, not just premium:
  - Premium/bespoke non-template sites (design-award sites, agency portfolios, funded startups, DTC/luxury brands)
  - Direct competitor baseline: actual Wix/Squarespace/Framer output
  - Badly-executed bespoke sites (mediocre despite not being templated) — a third calibration point, since "not a template" doesn't automatically mean "good"
- Example-site gallery — curated, generated (real sites as inspiration, not copied) output for (2)'s sales collateral; needs to be a matrix (industry × style-direction × restraint-level), including tasteful/restrained examples, not just maximal ones.
- Missing L1 primitives surfaced along the way (already flagged: no general z-index/overlap primitive beyond nesting/absolute geometry; transforms are rotate/scale only, no skew/3D).
- Vision-model input capability (shared with ingestion, see above).
- NOT owed: reproduction-as-deliverable/faithful-rebuild capability.

### Sales/design playbooks (not literal scripts)
- Structured topic checklists + branch logic + example phrasings, not word-for-word scripts (fixed scripts fight the "no templates" ethos).
- Source: Martin + contacts manually running real discovery sessions first (both "existing site" and "blank slate," and across the restraint spectrum), capturing transcripts, then mining for which phrasings/sequencing actually produced signal vs. boilerplate.
- The two variants are really one shared main flow with two different openers — existing-site opens from ingestion context, blank-slate opens with open-ended audience/differentiator questions; they likely converge into the same design-phase flow.
- Gather in advance: vertical taxonomy with go-to opening questions + a rough restraint/fit default per vertical; fixed CTA/conversion-goal menu; the rubric (house vocabulary for the design conversation).

### Premium-non-Wix audit
- Source via design-award sites, agency portfolios, funded-startup landing pages, DTC/luxury brand sites.
- Score against the rubric; look for recurring patterns.
- Key strategic question per pattern: is it a *technical* ceiling on Wix/Squarespace/Framer's editor model (validates L1's structural moat) or just something their users don't ask for (shifts weight toward the consultation experience mattering more than schema power)?

### Wix-differentiation / independent-designer research
- Concrete, answerable question: what do independent web designers actually sell that gets clients to pay far more than a $20/mo Wix site?
- Working hypothesis (needs light validation via informal interviews): it's mostly *not* raw visual technique — it's (a) a consultative relationship that removes decision fatigue, (b) taste-as-a-service / accountability, (c) strategic pushback on bad ideas, not just execution, (d) risk transfer.
- Implication: the (3) session's *conversational/consultative structure* is likely the real differentiator from Wix, not raw L1 technical expressiveness alone.

### Pricing / offer differentiation
- Business goal (explicit): **net cost-positive ~90% of sessions** — bootstrapped, quality-focused, non-volume business.
- Working hypothesis: cost ≈ tokens, users don't understand tokens but do understand time, so approximate with time-based pricing (~$200 to start + $X/hour beyond) — but pure hourly penalizes efficient sessions and creates meter-anxiety that fights the premium feel.
- Recommendation: **tiered packages with a generous included allowance + overage**, not raw hourly — Starter/Pro/Founder tiers differing in included revision rounds, effect/motion budget, turnaround priority, and possibly a human-review pass reserved for the top tier.
- The monthly $30-80 tier is a more natural place for usage-based/hourly-flavored billing.
- To hit "net positive 90% of the time": need a real internal cost model (tokens per turn × expected turns per session-type) PLUS a soft session-scope-cap mechanism (checkpoint that flags/upsells when a session runs deep into the tail).

### Research reports landed (2026-08-10)
Both commissioned via a 10-agent background Workflow run from the xgd session, written into
1stcontact's own doc ticket store, integrated with the existing design-lessons pipeline:
- **DOC-31** — Premium, Non-Template Web Design — Differentiation Audit. Headline: most differentiation among even award-winning sites comes from the *taste-gap* category (restraint, locked palettes, typography-as-device, bespoke content architecture) — achievable with zero new technical capability — not the *technical-ceiling* category (WebGL/3D, custom shaders, continuous scroll-linked motion), which is real but a minority even among the most acclaimed sites. Includes a checklist of concrete, citeable template-DNA anti-patterns worth turning into an automated critique pass against our own output.
- **DOC-32** — Why People Pay For Design — Independent-Designer Economics & AI-Website-Builder Pricing Benchmarks. Confirms the "boutique direct-access, no hand-off" value thesis; independent designers price flat/tiered ($2,500-5,000 sweet spot), not hourly; existing AI builders all use flat-subscription + metered-AI-credits ($10-40/mo, no live human); B12 is the closest existing analog (live AI + human, $1,999 one-time) confirming our $200-1,000 band is a deliberate discount off a real comparable. Explicitly does not (cannot) validate the 90%-net-positive target, which still needs our own internal token/cost model.
- Both cross-linked into **DOC-17** (Design Lessons Log), which feeds **DOC-16** (the prompt/rubric layer).

### Agreed phase sequencing
1. **Research phase** — DOC-31, DOC-32 (done).
2. **Example-pool phase** — build the reference corpus and example gallery, extract the rubric, informed by DOC-31. **← next up**
3. **Close the loop on L1** — fix identified primitive gaps (z-index/overlap, skew/3D, etc.), build docs/examples operationalizing what makes output differentiated.
4. **Playbooks phase** — discovery/design playbooks for (2) and (3), informed by the rubric, gallery, and closed L1 gaps.

### Next up
Example-pool phase: build the reference corpus (premium / Wix-baseline / bad-bespoke) and
example-site gallery, informed by DOC-31.
