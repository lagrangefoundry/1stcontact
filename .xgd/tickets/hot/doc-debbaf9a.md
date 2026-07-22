---
uid: doc-debbaf9a
id: DOC-16
type: doc
title: Design Intelligence — the Prompt Layer
created_by: xgd
created_at: '2026-07-02T00:53:22.222258+00:00'
updated_at: '2026-07-21T20:38:11.330109+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  doc_kind: architecture
---

# Design Intelligence — the Prompt Layer

## 1. Purpose

The **third leg** of website quality. The framework sets what is *expressible*; the **prompt layer** decides whether we *choose well*; the eyes verify we hit the bar. Prompt quality is the least-commoditized differentiator — everyone will have modules; **taste is the moat.** The goal is blunt: **a tool that makes Claude good at design.**

Companion to [[DOC-4]] (thesis), [[DOC-7]] §6 (language), [[DOC-13]]/[[DOC-14]] (capture/eyes/lifecycle), [[DOC-15]] (corpus).

## 2. The three legs

- **Express** — framework / primitives (can we render it): REQ-14/15/16, the language.
- **Choose** — prompt layer / design intelligence (do we choose *well*).
- **Verify** — eyes (did we hit the bar): [[DOC-13]] §6.

A powerful language with no taste is *powerful mediocrity* — "expensive-looking Bad Wix." The prompt layer is what makes the difference on the *same* framework.

## 3. Components of the prompt layer

1. **Design knowledge** — encoded principles: hierarchy, restraint, rhythm, type pairing, the *tells* of "expensive" vs "template."
2. **Reference corpus (dual-purpose)** — the [[DOC-15]] crawl corpus is BOTH the module-gap source (framework) AND the **taste library** the AI reasons from (prompts). Seeded by the comps: Tier 1 (expensive SaaS/AI — Composio, Cartesia, PlayerZero, Cohere, Anthropic, sycamore.so) and Tier 2 (WebGL/3D frontier — F1/OFF+BRAND, Bruno Simon, Lusion, Immersive Garden).
3. **Design rubric** — an explicit, growing definition of "expensive / template-free." **One artifact, two uses:** the prompt's guidance AND the eyes-loop's acceptance criteria.
4. **Art direction** — the AI committing to a coherent *per-site* design language (palette, type system, motion character, spacing rhythm) and applying it — not just filling modules.

## 4. How we build it — bootstrap by doing (the plan)

**We do NOT build the builder first.** Build order:

1. **Framework** — the primitives (REQ-14 background, REQ-15 layer, REQ-16 motion, …).
2. **The two flagship sites** — **Gen Dev Labs** (the company behind XGD / 1st Contact) and **1stcontact.io** — built by hand / with Claude, targeting **Tier-1 "expensive, template-free."**
3. **The builder** — later, once the framework and the design intelligence are proven.

The flagship sites are the **R&D vehicle** that *generates* the design intelligence: build them, **learn as we go**, and **capture every lesson**. 1stcontact.io must be built *with the product path* (dogfood + the [[REQ-19]] ceiling proof); Gen Dev Labs may flex hardest (Tier-1 with an optional Tier-2 flourish).

## 5. The lessons-capture practice (STANDING)

As we build, capture into the living **Design Lessons Log** ([[DOC-17]] — seeded and ready to append to):

- Every non-obvious design decision + the *why*.
- Corrections — "this read as *template*; here is what fixed it."
- Distilled "expensive" tells.
- Sources: the comps **and online examples + tutorials** — we learn from the design community and established craft, not just our own opinions.

Periodically **distill the log → the rubric + prompt guidance.** The operator brings design experience and opinions; the log converts those (plus external craft) into **reusable prompts** — which is how "make Claude good at design" actually happens.

## 6. Prompt-eval discipline

Prompt quality is testable and versioned like modules: measured by **eyes + human review** across a brief test-set, with the **comps and the two flagship sites** as the bar. Prompts improve against that bar over time.

## 7. Tensions / honest notes

- **Homogenization** — strong direction risks a *house style*, the opposite of template-free. The layer must encode **principles + diverse references** → per-site-appropriate direction, never one signature aesthetic.
- **Taste is subjective / human-in-loop** — the rubric starts rough and improves. **We start somewhere** and iterate; we do not wait for a perfect rubric.
- **Model-dependent** — the layer rides Claude's judgment and improves as the model does.

## 8. Related

[[DOC-4]] · [[DOC-7]] §6 · [[DOC-13]] · [[DOC-14]] · [[DOC-15]] · [[REQ-19]] (ceiling milestone) · [[REQ-21]] (import benchmark).



---

## Update (2026-07-21, REQ-86): taste rides on L1, verified by the 3-probe gate

Since the framework pivot (REQ-79 / REQ-82 / REQ-86) the framework is a **safety
envelope, not aesthetic rails** ([[DOC-24]]): appearance is authored directly as the
**L1 substrate** ([[DOC-23]]) under a security/robustness/cross-browser envelope,
and there are no aesthetic dials to "choose well" among. That sharpens — not
weakens — this doc's thesis that **taste is the moat**:

- **Express** is now "author L1 directly" (an expressively-complete typed tree), with
  capability *behaviour* configured, never coded, by the AI.
- **Choose** (this prompt layer) still decides whether the authored L1 reads
  *expensive* vs *template* — the design knowledge, reference corpus, and rubric are
  unchanged and now the *primary* differentiator, since the envelope no longer
  constrains taste.
- **Verify** is the eyes loop **plus** the mechanical **3-probe gate** (REQ-86,
  `tools/generate/src/l1/probes.ts`): sample-fidelity / off-sample / content-robustness.
  The rubric remains the eyes-loop acceptance criteria; the probe gate is the
  structural floor beneath it (the reproduced L1 must be faithful, sane off-sample,
  and robust to content) before taste is judged at all.

The flagship-site R&D practice (§4) and the standing lessons-capture into [[DOC-17]]
are unchanged — they now record L1-authoring craft rather than module-dial craft.