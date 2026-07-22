---
uid: request-015e42ac
id: REQ-85
type: request
title: 'Framework pivot D: capability-module contract + reframe carousel & contact-form'
created_by: xgd
created_at: '2026-07-20T19:48:30.146121+00:00'
updated_at: '2026-07-22T21:22:12.325849+00:00'
completed_at: '2026-07-22T21:22:12.325849+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: a1f739b67ae42f08a63d1a6174c1ef1fe2edac77
    reconcile_sha: null
    main_sha: null
  - working_sha: 0e7064191d9e7e26c5bc8089748cd322a32d0790
    reconcile_sha: null
    main_sha: null
  - working_sha: 0f3f5b194f562abc431f509179189707ea3055d2
    reconcile_sha: null
    main_sha: null
  - working_sha: 3b65fc824b27ed99c4fef303f00ec47dbb217936
    reconcile_sha: null
    main_sha: null
  version: 0.0.166
  bundled_in: bundle-31e474b9
---

Part of the framework pivot — see **REQ-79 (request-87b26bca)**.

## Goal
Formalise the **behavior-module contract** and reframe the two survivors (`carousel`, `contact-form`) onto it.

## Behaviour
- **Contract**: a behavior module = **vetted core** (framework code; AI never writes) + **typed config** (behaviour/integration params, not aesthetics) + **named L1 presentation slots** + per-module conformance obligations + runtime **isolation** (a misbehaving capability must not break page-level robustness).
- **Reframe carousel**: keep scroll-snap / controls / a11y core + config (slides-visible, controls, autoplay/loop); strip layout dials; slides become L1 slots.
- **Reframe contact-form**: keep field schema / validation / submission / `enhance.ts` core + config; arrangement / labels / submit styling → L1 slots.
- Conformance harness hooks for behavior modules (safety / security / cross-browser / responsive + isolation).

## Acceptance (UAT — `test_UAT_FC_<this REQ id>_*`)
- `carousel_slots`: a carousel with L1-authored slides renders; behavioural config drives scroll/controls; no layout dials remain.
- `contactform_capability`: contact-form config drives fields/submission; presentation is L1 slots.
- `conformance`: both satisfy the capability conformance obligations.

## Docs (same session)
- New: **Behavior-Modules spec** (carousel + contact-form as worked examples); **Behavior-Module Authoring & Vetting process** (replaces DOC-14).
- Update **DOC-8** (tool surface), **DOC-20** (promote the 4 universal ACs as the envelope), **DOC-21** (attribution ladder → L1 axes + capability gaps).


---

## Design decisions (confirmed with operator, this session)

**Slot-attachment seam — Option A (confirmed):** a behavior-module *instance* carries
its presentation as **L1 subtrees** on named slots; the vetted core renders its
behavioural chrome and mounts each slot's L1 via the L1 subtree renderer. The module
wraps L1 (not the inverse). The page-level inert `slot` L1 node stays as the separate
region-reservation seam.

**"Behavior module" ≠ XGD capability matrix.** Here it is the framework runtime notion
(carousel, contact-form; later payments/auth). Layout/aesthetics are owned by L1; a
capability declares only behavioural **config** + named **slots** + conformance
obligations + isolation.

**Scope — full reframe, delivered across multiple `[FREE-CODED]` commits on THIS ticket.**
The literal "no layout dials remain" is honoured: the old dial/content model of both
survivors is removed and the reproduction responsibility for their *look* moves to L1.

## Execution plan (commit sequence, suite green at each step)

1. `BehaviorMeta` contract + `validateBehaviorConfig`/`validateBehaviorInstance`
   (framework, new). No behaviour change yet.
2. Reframe **carousel** → behavioural `config` (`view`, `controls`, `autoplay`, `loop`) +
   repeated `slide` L1 slot; strip every layout dial + styled/markdown content; core keeps
   scroll-snap / dots / a11y and mounts slot L1. Migrate/retire carousel-dial tests
   (module-owned layout moves to L1, covered by REQ-82/83 L1 tests).
3. Reframe **contact-form** → `config` (fields / action / submission) + presentation slots;
   keep field-schema / validation / `enhance.ts` / honeypot / Turnstile core. Migrate req58.
4. Conformance: add the **`isolation`** dimension (malformed config/slot → inert degrade,
   never throws, never breaks page robustness) + wire both capabilities' obligations;
   update req39–42.
5. New UATs: `test_UAT_FC_REQ-85_carousel_slots`, `_contactform_capability`, `_conformance`.

## Docs (same session, separate from the code commits)
Behavior-Modules spec + Authoring/Vetting process (replaces DOC-14); update DOC-8 / DOC-20 / DOC-21.


---

## Scope escalation (operator-confirmed): re-base reproduction off module dials

Running the staged reframe reveals the blast radius is larger than the initial
inventory: the **reconciliation / reproduction engine renders through the
carousel & contact-form components via `dials`/`content`**, so reframing them to
`config`/`slots` breaks ~65 tests across ~20 files — including formal reconciliation
ACs, not just fidelity checks. Operator directive: **proceed carefully, across more
commits on this ticket.**

Capability now owned by L1 (absolute-or-overlay values, spacing, content-width,
gradients, letter-case, alignment) — the module-rendered assertions for these move
to L1's own coverage (REQ-82/83); the module-dial tests are retired.

**Reconciliation ACs superseded by the pivot** (reproduction-via-module-dials for
the two survivors; the capability is preserved in L1, re-expression tracked):
- AC637 — text-fill gradient (via module)
- AC660–665 — colour hex/role, absolute length, named step, radius dials
- AC666–670 — per-breakpoint length dials
- AC676–678 — contact-form field-labels / submit-inline / submit-colour treatments

Migration rule per test: **DIAL-LAYOUT** module assertion → delete (L1 owns it);
**framework-utility** assertion (dials.ts/text-style/markdown/breakpoints/tokens
resolvers, tested directly) → keep, drop the module vehicle; **BEHAVIOUR** →
migrate `content`→`config`, presentation→`slots`. Module versions bump:
carousel v1→v2, contact-form v2→v3.

## Revised commit sequence
2. Module reframe (carousel+contact-form+registry+render+site-schema+harness) +
   migrate every affected test to green (direct + fidelity + reconciliation).
3. Conformance `isolation` dimension + wire obligations + new REQ-85 UATs.


---

## Correction (operator): behavior modules SHIP vetted client code

Dropping carousel autoplay/loop "because it needs client JS" was wrong — a
behavior module's whole point is fixed, vetted, tested **behavioural code**;
only its *appearance* is L1-flexible. The 404 was a **pipeline gap**, not a
reason to remove behaviour: `tools/generate` renders SSR HTML via Astro's
container API and never bundles/ships island JS, so the dev-path `<script
src=…index.astro?astro&type=script>` 404s. The same gap silently broke
contact-form's `enhance.ts` (not conformance-tested, so unnoticed).

**Fix — behavior client JS becomes a first-class shipped asset** (mirrors
`getModuleCss` → `theme.css`):
- Each capability authors a self-contained, defensive **`client.js`** (plain
  browser JS, no imports) — unit-tested by import, shipped verbatim.
- `getModuleClientJs()` folds the catalog's `client.js` files; the render
  pipeline writes `capabilities.js` to the dist and references it with a single
  `<script type="module" src="./capabilities.js">`. No dev-path island scripts.
- **Restore carousel `autoplay`/`loop`** as vetted behaviour in `carousel/client.js`.
- Migrate contact-form `enhance.ts` → `contact-form/client.js` onto the same
  mechanism (its enhancement now actually ships).

Isolation still holds: `client.js` is defensive (guards elements, try/catch), so
a misbehaving capability degrades to the no-JS baseline.


---

## Docs — DONE (this session)

- **NEW [[DOC-25]]** — Capability Modules — Contract & Catalog (carousel + contact-form worked examples).
- **NEW [[DOC-26]]** — Behavior-Module Authoring & Vetting Process (**replaces [[DOC-14]]** lifecycle; DOC-14 given a successor pointer).
- **[[DOC-20]]** — promoted the universal ACs to the FIVE-AC envelope (added **isolation**); harness interface + fixtures reframed to config/slots.
- **[[DOC-21]]** — attribution ladder reframed: layout gap → L1 axis; behaviour gap → configure existing capability → author new ([[DOC-26]]).
- **[[DOC-8]]** — tool surface: the AI authors L1 + configures capability `config`/`slots`, never module dials.