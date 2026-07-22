---
uid: doc-61ec479a
id: DOC-26
type: doc
title: Behavior-Module Authoring & Vetting Process
created_by: xgd
created_at: '2026-07-21T20:10:50.239883+00:00'
updated_at: '2026-07-22T00:01:19.398561+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  doc_kind: architecture
---

# Behavior-Module Authoring & Vetting Process

**Status:** Founded by **REQ-85** (framework pivot Phase D). The process half of
the behavior-module contract ([[DOC-25]]); **replaces the lifecycle of
[[DOC-14]]** ("module = layout unit / two-tier layout composition"), which is
withdrawn. Companion to [[DOC-24]] (framework purpose), [[DOC-23]] (L1),
[[DOC-20]] (conformance), [[DOC-2]] (security).

## 1. When you do NOT author a behavior

Authoring a new behavior is the **last resort, highest bar**. Since the pivot
there are two kinds of gap, resolved in different places — reach for neither by
reflex (see the project `CLAUDE.md` "Close behavior gaps in L1"):

- **Layout / presentation gap** → **add a typed L1 primitive** ([[DOC-23]]). There
  is no `hero` module to add a dial to; the fix is a new typed axis on the one L1
  substrate. Never a new "layout module", never a raw-CSS hole.
- **Behavior gap that fits an existing behavior** → **configure it**: add a
  dial / variant / content field to that behavior, or extend a shared resolver.
- **Only a genuinely new *kind of behaviour* with its own core** → author a new
  behavior module. This doc.

## 2. The trigger

An **eyes-verified behavioural gap** during composition: a behavior the site
needs (take payment, capture email to a provider, animate on scroll) that **no L1
axis and no existing behavior can express**. The AI composes, renders,
screenshots, compares to the target ([[DOC-13]] eyes), and confirms the gap is
*behavioural*, not layout. The trigger emits a **behavior spec** — a structured
description of the behaviour + config surface + slot shape + the target evidence.

## 3. Lifecycle

```
behavioural behavior gap (eyes)
 → behavior spec           behaviour + config + slots + target evidence
 → 1C, in-session            Claude drafts the behavior core + client.js   [DRAFT — works for this site]
 → operator approves the behaviour + look in draft preview                   [eyes sign-off]
 → XGD hardens               RED/GREEN tests, quality gates, security review,
                             generalize, author the BehaviorMeta contract,
                             satisfy the conformance obligations (incl. isolation)
 → published                 site-local OR promoted to the shared catalog
 → the site can publish
```

Unchanged from [[DOC-14]] §4 in *shape* (draft → harden → publish; site-local vs
library by gap frequency; the approved draft screenshot is the visual-regression
target; publishing gates on hardening); what changed is the **unit** (a behavior,
not a layout module) and the **vetting obligations** below.

## 4. Vetting / hardening obligations (the bar to publish)

A behavior is a **gated artifact** — draft code may run in a draft site, but a
site cannot go **live** on an unhardened behavior. Hardening must establish:

1. **The `BehaviorMeta` contract** ([[DOC-25]] §2) — `config` is behavioural and
   typed; `slots` are named L1 presentation seams; `conformance.obligations` are
   declared. No aesthetic dials leak in.
2. **`validateBehavior*` holds** — config typed/bounded; required slots present;
   **every slot subtree is valid L1** (the security line).
3. **The universal ACs pass** ([[DOC-20]]) against config/slot fixtures: safety,
   security, cross-browser, responsive.
4. **Isolation passes** (REQ-85) — degenerate-but-valid config/slots degrade
   inertly (render without throwing, page intact); the `client.js` is defensive
   (guards every element, try/catches) so a misbehaving behavior can never break
   page robustness.
5. **Client behaviour ships correctly** — vetted `client.js` (plain browser JS, no
   imports), unit-tested by import, folded into `capabilities.js` by the pipeline
   ([[DOC-25]] §4). No dev-path island scripts.
6. **Security review** ([[DOC-2]]) — the behavioural core is the sanitization
   boundary for its config/slots; any URL sink is allowlisted; a fail-loud refusal
   on hostile input is correct.

## 5. Site-local vs catalog promotion

Decided at hardening, informed by **gap frequency** across captures:

- **Site-local** — a one-off behavior; hardened, published with that site;
  `1c render` resolves site-local behaviors alongside the shared catalog.
- **Shared catalog** — the behavioural gap recurs across sites; XGD generalizes it
  into a reusable behavior in `packages/framework/src/modules/registry.ts`. This
  is how the behavioural library grows — by real demand through the reproduction
  flywheel ([[DOC-21]]), not by fiat.

## 6. The flywheel (unchanged thesis)

The **site-builder** (Claude in 1C) discovers a needed behavior; the **dev-system**
(Claude in XGD) builds it properly — contract, tests, conformance, isolation,
security review — and folds it into the catalog. The product grows its own
behavioural library through its own development process, so "no expressive ceiling"
([[DOC-24]]) is economically real: appearance is already unbounded via L1, and new
*behaviour* arrives vetted, on demand.

## 7. Related

[[DOC-25]] (behavior contract) · [[DOC-24]] (framework purpose) · [[DOC-23]] (L1) ·
[[DOC-20]] (conformance) · [[DOC-2]] (security) · [[DOC-21]] (reproduction growth
loop) · [[DOC-14]] (superseded) · REQ-85.