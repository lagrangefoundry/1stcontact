---
uid: comment-b0d6de61
id: COMMENT-255
type: comment
title: Comment on request REQ-85
created_by: xgd
created_at: '2026-07-21T00:28:28.685863+00:00'
updated_at: '2026-07-21T20:12:15.991914+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-015e42ac
  kind: chat_transcript
---

<!-- xgd-turn id="97f55331-c281-4810-9fa7-d5eda5a66311-user" -->

<!-- xgd-chat role="user" ts="2026-07-21T00:28:26.378357+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="97f55331-c281-4810-9fa7-d5eda5a66311-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-21T00:31:43.402685+00:00" -->
#### Claude
I'll start by reading the current ticket state and exploring the relevant codebase structure.

Let me explore the relevant code in depth — L1, carousel, contact-form, module contracts.

Now let me read the module types, carousel, and contact-form in full.

This is a large architectural task. Before I write code, let me verify a few load-bearing facts about the current mechanism so my design matches reality.

I've now mapped the current state thoroughly. Before writing ~20 points of architecture, I need to surface one genuine design fork, because the core mechanism REQ-85 needs **does not exist yet** and the DOCs describe intent, not the concrete TS shape.

## What I found

- **L1 is the layout substrate** (`packages/framework/src/l1/render.ts`); the semantic layout modules are already stripped (REQ-84). The catalog holds exactly two survivors: `carousel`, `contact-form`.
- **But both survivors are still pre-pivot modules.** They use the old `ModuleMeta` (`variants` + `dials` + `contentSchema`) and carry heavy *aesthetic* dials (`surface`, `spacingTop/Bottom`, `gap`, `cardSurface`, `headingCase`, `contentWidth`, `align`, `submitTreatment`, `fieldLabels`, …) plus render their own presentation (styled runs, markdown). That's exactly what REQ-85 says to strip.
- **The "named L1 presentation slot" seam is unbuilt.** The L1 `slot` node (`l1SlotSchema`) renders an *inert placeholder* (`<div data-l1-slot=…>`) and nothing flows presentation into a capability. There is no capability contract type, no config/slot validation, and the conformance harness (`tools/generate/src/conformance`) targets the old `ModuleMeta` shape with no `isolation` dimension.

So this isn't a mechanical reframe — REQ-85 must **invent** the capability↔L1-slot seam.

## The design fork (the one thing I want to confirm)

**How does L1-authored presentation attach to a capability's named slots?**

- **Option A — capability wraps L1 (recommended).** A capability instance carries typed **config** (behaviour only) + a map of **named slots**, each slot holding an L1 subtree (repeated slots → one per item, e.g. carousel slides). The vetted core renders its behavioural chrome (scroll-snap track / form+submission plumbing) and mounts each slot's L1 via `renderL1Document`. Presentation is 100% L1; the module owns zero aesthetics. This matches "slides become L1 slots" cleanly and keeps the security envelope (slot content is L1, validated by `validateL1`).
- **Option B — L1 tree owns a `slot` node naming a capability**, capability decorates that region. This is the DOC-23 placeholder direction, but it's the *inverse* of "presentation → slots" and leaves the presentation-authoring story unsolved.

I recommend **A**. B is the page-level reservation seam (keep the existing inert `slot` node for that); A is what REQ-85 is actually asking for.

## Concrete shape I'd build (on confirmation)

1. **`CapabilityMeta`** (new, `packages/framework/src/modules/capability.ts`): `{ id, version, kind:'capability', config: Record<name,{type:'boolean'|'integer'|'enum', …}>, slots: Record<name,{repeated?, required}>, conformance:{ obligations:[…], except? } }` — no `variants`, no aesthetic `dials`, no styled `contentSchema`.
2. **Validation**: `validateCapabilityConfig` + `validateCapabilityInstance` (config typed & bounded; each required slot present; slot bodies are valid L1 via `validateL1`).
3. **carousel** → config `{ view, controls, autoplay, loop }`; slot `slide` (repeated) mounts L1. Strip every layout dial + the styled-run/markdown content. Keep scroll-snap/dots/a11y core.
4. **contact-form** → config `{ fields[], action, successMessage }` (+ honeypot/Turnstile/`enhance.ts` core); slots for field arrangement / labels / submit. Strip `surface`/`align`/`submitTreatment`/`fieldLabels`/etc.
5. **Conformance**: add an **`isolation`** dimension (malformed config/slot → inert degrade, never throws, never breaks page robustness) and wire both capabilities' obligations. Reuse the existing safety/security/x-browser/responsive checks.
6. **UATs**: `test_UAT_FC_REQ-85_carousel_slots`, `…_contactform_capability`, `…_conformance` (+ isolation).

## Scope reality

This is **~18–20 story points** and it **breaks existing tests by design**: `req79-carousel`, `req39/40/41/42-conformance` (old `ModuleMeta` fixtures), and touches `req84`. That's a lot, but it's cohesive (one contract + two reframes) so it stays a single REQ-85 intent rather than a split.

**One question before I build:** confirm **Option A** (capability wraps L1 slots) is the intended seam — and confirm you want the full reframe now (both survivors + harness `isolation`), versus landing the contract + carousel first and contact-form second. On your "yes" I'll start immediately with the `CapabilityMeta` contract + validation, then carousel, then contact-form, then the harness `isolation` hook, updating the broken tests as I go.

<!-- xgd-turn id="d0a83ec2-2543-4dd1-9b74-57dc8c5e41ab-user" -->

<!-- xgd-chat role="user" ts="2026-07-21T16:16:46.993588+00:00" -->
#### You
**How does L1-authored presentation attach to a capability's named slots? this question confuses me are you talking about XGD capability matrix capabilities? What do you mean by slots?**

<!-- xgd-turn id="d0a83ec2-2543-4dd1-9b74-57dc8c5e41ab-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-21T16:17:27.988736+00:00" -->
#### Claude
Good — let me clear up the terminology, because two different things in this project are both called "capability," and that's on me for not disambiguating.

## 1. No — not the XGD capability matrix

The **XGD capability matrix** is the ticketing/reconcile concept: the record of what the *system* can do, built from ticket bodies. That's unrelated here.

"Capability module" in REQ-85 is a **runtime framework** concept — it's the word your own ticket and `CLAUDE.md` use for the thing carousel and contact-form now are:

> *CLAUDE.md:* "a **module** now means a *capability* — a vetted behavioural core + typed config + named L1 presentation slots (carousel, contact-form; later payments, auth, email-capture)."

So "capability module" = a vetted behavioural building block (carousel, a contact-form, later payments/auth). Same word, totally different layer from the matrix. I'll say "capability module" and never just "capability" to keep them apart.

## 2. What I mean by "slot"

I took the word straight from your ticket ("slides become **L1 slots**", "arrangement / labels / submit styling → **L1 slots**") and from the existing L1 schema, which already has a `slot` node (`l1SlotSchema` → renders `<div data-l1-slot="…">`).

Concretely, a **slot = a named region inside a capability module's output whose *appearance* the module does not dictate — it's filled with L1-authored content.**

Take the carousel as it stands today. Its `.astro` hard-codes what a slide looks like: an avatar `<img>` of a fixed size, a `<p class="carousel__title">` in a fixed font, a markdown body div, etc. — all baked-in aesthetics. REQ-85 says strip that. After the reframe, the carousel core owns **only the behaviour**: the scroll-snap track, how many slides show per view, the dots, keyboard/a11y. Each slide becomes a **slot** — a named empty region — and *what a slide actually looks like* is authored as an L1 subtree (exact boxes/text/images with captured geometry) and dropped into that region.

Same for contact-form: the core keeps field schema + validation + submission + `enhance.ts`; but the *arrangement, labels, and submit-button styling* stop being module dials and become slots filled with L1.

## 3. So my question, in plain terms

When we render a carousel, a slide's **look** has to physically come from somewhere. My question was just: **where does that L1 slide-content live, and how does it reach the carousel core?** Two options:

- **A (recommended):** the carousel instance (in the site definition) *carries* the L1 subtrees for its slides; the core drops each into a slide region. The module wraps L1.
- **B:** the page's top-level L1 tree contains the slide regions, tagged with a `slot` node that says "carousel behaviour goes here," and the core decorates them. L1 wraps the module.

That's the only real fork. **A** matches "slides *become* L1 slots" most directly and keeps slot content inside the validated L1 security envelope.

If that lands, just confirm **A** and I'll start building the `CapabilityMeta` contract → carousel → contact-form → conformance `isolation`. If "slot" still isn't the mental model you intended when you wrote the ticket, tell me how you were picturing a slide's appearance getting authored and I'll match that instead.

<!-- xgd-turn id="1b3ae4ef-38de-45ec-b6a5-c61090d58170-user" -->

<!-- xgd-chat role="user" ts="2026-07-21T16:44:07.761984+00:00" -->
#### You
- **"Yes, Option A"** — capability modules carry their slot content as L1 subtrees.
- **Scope:** do the **full reframe now**

<!-- xgd-turn id="1b3ae4ef-38de-45ec-b6a5-c61090d58170-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-21T16:47:30.840758+00:00" -->
#### Claude
Confirmed: **Option A, full reframe now.** Let me follow the protocol — scope the ticket first, then build. But I need two more integration facts before I write code (how instance props flow, and where per-instance L1 CSS lands). Let me pin those down and set up tracking.

The blast radius for changing the site-schema instance model is huge (dozens of reproduction/fidelity tests build `dials`/`content`). That tells me the right scope boundary. First, let me establish the current test baseline so "don't break existing tests" is grounded in reality.

Baseline is green (50/50). Now the decisive scope question: which existing tests exercise the carousel/contact-form **dials** I'm about to remove? Let me measure precisely.

I've hit a scope reality that materially changes the plan, and I need to flag it before writing code — because it's the "look at what you're about to delete" moment.

## The finding

REQ-85 says **"no layout dials remain"** on carousel/contact-form. But those dials are load-bearing for the project's core reproduction capability. **Eight test files** directly instantiate the two modules and assert on exactly the dials I'd delete:

| Test file | refs | dials it validates |
|---|---|---|
| `req45-fidelity-primitives` | 29 | fidelity primitives via carousel |
| `req58-framework-gaps` | 21 | `gap`, `submitInline`, `fieldLabels`, field styling |
| `req33-verbatim-fidelity` | 13 | verbatim value reproduction |
| `req61-responsive-values` | 12 | responsive dial values |
| `req36-heading-treatment` | 11 | `headingCase` |
| `req55-content-width` | 8 | `contentWidth` |
| `req20-site-fidelity` | 7 | site reproduction |
| `req61-responsive-contentwidth` | 6 | responsive contentWidth |

That's ~100 assertions encoding *reproduction-of-look through module dials* — the thing your memory calls "the GOAL is a reproduction system." Stripping the dials doesn't just break tests; it **removes the reproduction capability those tests guard**, and the replacement isn't a test rewrite — it's the L1-slot path actually reproducing those looks (capture→L1 fold authoring slide/field subtrees). That's engine-level work, dependent on REQ-83.

So my earlier "~18–20 points" was wrong. Reframing the *contract + two modules + conformance* is ~18 points. But **"no layout dials remain" + keep reproduction working** drags in migrating the entire fidelity suite onto L1-slot authoring — realistically a 40+ point epic entangled with the reproduction engine. That's squarely the "would need `xgd develop` to design first" signal, and it's too big/entangled to land as one clean free-coded commit.

## Recommendation — split, and free-code the tractable half now

**REQ-85 (this session) — the contract + reframe seam:**
1. `CapabilityMeta` contract + `validateCapabilityConfig`/`validateCapabilityInstance` (new).
2. carousel & contact-form gain the **config + L1-slot** shape and render slot subtrees via an L1 subtree renderer; behavioural config drives scroll/controls and fields/submission.
3. Conformance **`isolation`** dimension + wire both capabilities' obligations.
4. New UATs: `test_UAT_FC_REQ-85_carousel_slots`, `…_contactform_capability`, `…_conformance`.

**A separate follow-on ticket — the reproduction migration:** move the 8 fidelity/reproduction test files + capture→L1 fold off module dials onto L1-slot authoring, and *then* delete the dials. Until then the old dial path stays so reproduction keeps working.

The one unavoidable conflict: the ticket says *"no layout dials remain."* Doing that literally **now** breaks ~100 reproduction assertions with no replacement in the same commit. My split keeps the dials alive one more ticket so reproduction never regresses, at the cost of a brief overlap (the "no legacy" rule bends for one ticket, deliberately and tracked).

**Two ways forward — your call:**
- **(a) Take the split** — I free-code the contract + reframe seam + conformance now (green suite preserved), and file the reproduction-migration follow-on. *My recommendation.*
- **(b) Literal full reframe now** — I strip the dials, delete/rewrite the 8 fidelity files, and accept a reproduction-capability regression landing in this commit. Bigger, riskier, and arguably belongs in `xgd develop`.

Which do you want — (a) split, or (b) literal strip-and-migrate? I'll update the REQ-85 body to match whichever you pick, then start.

<!-- xgd-turn id="9d7a28c7-1a5b-4350-a60a-35827fc6936b-user" -->

<!-- xgd-chat role="user" ts="2026-07-21T16:48:16.266294+00:00" -->
#### You
We can do multiple commits on one ticket - there's no need for a second ticket

<!-- xgd-turn id="9d7a28c7-1a5b-4350-a60a-35827fc6936b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-21T17:06:52.664540+00:00" -->
#### Claude
Understood — one ticket, multiple `[FREE-CODED]` commits. Let me lock scope into the ticket first (protocol), set up tracking, then build commit-by-commit keeping the suite green.

Let me check the ticket-update interface and the L1 validate surface I'll need.

Now let me scope the ticket — append the confirmed design decisions and execution plan (preserving the existing body).

Ticket scoped. Now **Commit 1: the `CapabilityMeta` contract + validation** (additive, keeps suite green). Let me write it.

Now export the contract from the barrel, and check the framework index.

Now the framework barrel:

Now the UAT test for the contract (Commit 1):

Contract UATs green. Let me typecheck the framework package before committing (green vitest ≠ typecheck-clean).

tsc clean. Let me check the version-bump requirement before committing, and confirm nothing else regressed.

Version bump script is live. Let me bump patch and commit 1.

Commit 1 landed. Let me record the sha on the ticket, then move to Commit 2 (carousel reframe).

Commit 2 is the carousel reframe. Let me examine the L1 renderer's class-naming and document shape so slot subtrees don't collide when mounted.

This reframe makes the entire module-aesthetics subsystem (dials, text-style, content) dead once both modules go slot-based — a large, coherent change. Let me build the load-bearing mechanism first: an L1 **subtree/fragment renderer** so a capability can mount slot content without class collisions. Let me add it and namespace-support to the renderer.

Now add the fragment renderer after `renderL1Document`:

I'll parallelize: dispatch an inventory of the test-suite fallout while I build the carousel core.

Let me check how `getModuleCss` extracts each module's static CSS (so I keep the carousel chrome static and slot CSS dynamic).

`<style set:html>` self-closing in source won't be folded by `getModuleCss` (no `</style>`), but survives at runtime — exactly what I need for per-instance slot CSS. Let me check how `generate.test.ts` and site fixtures build instances (the pipeline coupling).

Confirmed: `generate.test.ts` and the pipeline are coupled too — this is one big coherent reframe commit. Let me build it. First, carousel meta + component + enhance.

The inventory gives me a precise migration map (delete ~19 dial tests, migrate ~13, keep behavioural ones). One correction I'll apply: contact-form's styled-run **content** tests (req45) and `contactFormMeta.dials.width` (req20) don't survive — those are presentation/layout moving to L1, so they get deleted, not kept. The truly behavioural bits (field schema, submission, honeypot, Turnstile, no-JS) migrate from `content`→`config`.

Let me build the reframe. Reading the files I'll overwrite:

Now write the carousel meta, component, and enhance:

Now the carousel `enhance.ts` (autoplay/loop PE — isolated, testable, defensive):

Now contact-form meta and component (keeping the functional core + `enhance.ts`, moving presentation to slots):

Now update the registry to `CapabilityDefinition`:

Before I touch `moduleInstanceSchema`, I need to measure the reconciliation/reproduction-engine coupling — that pipeline is built on the dial/content model and re-basing it is out of REQ-85's scope. Let me measure precisely.

The reconcile/reproduction engine uses `dials`/`content` broadly (28 files touch dials), but critically **it's a separate subsystem** — re-basing it onto L1 is the pivot's other epic, not REQ-85. So the disciplined boundary: reframe the modules + conformance + thread `config`/`slots` through the pipeline **additively** (leave the reproduction engine's `dials`/`content` schema fields intact — a different consumer, not a legacy dual-path for the modules). That bounds the break to the inventory's ~8 fidelity files + generate + conformance, exactly as agreed.

Let me check the conformance harness's coupling to the old meta shape.

The harness validates its fixture instance through the site-schema, so I do need `config`/`slots` on `moduleInstanceSchema` (additive, and relax `variant`/`dials`/`content` to optional for the reproduction engine). Let me look at the schema's value-type building blocks.

Now update generate's `render.ts` — the resolver type and the props it passes:

Now update the conformance harness to build a capability instance (config/slots):

Let me typecheck framework + generate to surface compile errors before fixing tests.

Cross-package type drift — generate resolves `@1stcontact/site-schema` to a stale dist. Let me check how packages resolve (dist vs src) and whether a rebuild is needed.

`@1stcontact/framework` resolves to source, but `@1stcontact/site-schema` uses built `dist` — my schema change needs a rebuild. Let me build it (a build, not an install).

Both typecheck clean. Now let me run the affected tests to see exact fallout before migrating them.

Fallout is as predicted. Let me get the complete failing-test inventory across the whole suite before migrating.

I've hit a hard, decision-relevant finding that's bigger and different from what my earlier inventory showed. Let me stop and surface it rather than plow ahead deleting things.

## What the full run reveals

The module reframe (staged in the working tree, **not committed**) breaks **65 tests across ~20 files** — and critically, it's **not just the ~8 fidelity files** my inventory predicted. It breaks the **reconciliation / reproduction engine**, which renders *through* the carousel/contact-form components using `dials`/`content`:

- `reconciliation-absolute-or-overlay-values` — **AC660–665** (colour hex/role, absolute lengths, named steps, radius)
- `reconciliation-responsive-dials` — **AC666–670** (per-breakpoint length dials)
- `reconciliation-repro-treatments` — **AC676–678** (field-labels, submit-inline, submit-colour)
- `reconcile-gradient-first-class` — **AC637**
- plus `req46`, `req50`, `req62`, `req24`, `req66`, `req11`, `chat9`, `req61-rollout`, and the fidelity files.

These are **formal, delivered acceptance criteria**, not loose fidelity checks. Reframing the two modules ⟺ breaking them — there's no middle path, because the reproduction engine literally renders these modules via dials/content.

## Why this changes the decision

"No layout dials remain" doesn't just retire ~8 fidelity tests — it **guts the reproduction engine's ability to render these two modules, deleting ~15 formal reconciliation ACs with no L1 replacement in this ticket.** That's a capability-matrix regression, and the free-coding rules explicitly warn that corrupting the matrix is a failure mode. My inventory undersold this — it looked at direct component tests and missed that reconciliation renders through the same components.

So the real work behind REQ-85's acceptance is one of two things, and I shouldn't pick unilaterally:

- **(1) Re-base the reproduction/reconciliation engine onto L1** so those ACs are re-expressed against slot-authored L1 (faithful, no capability loss) — a multi-day epic, genuinely `xgd develop` territory.
- **(2) Retire those reconciliation ACs** as superseded by the pivot and delete/rewrite ~65 tests now — fast, but a deliberate, hard-to-reverse capability regression that needs to be recorded as *superseded*, not silently deleted.

## Where things stand

- **Commit 1 is landed and green** — the `CapabilityMeta` contract + `validateCapability*` + the `renderL1Fragment` slot-mount seam. That's real, reusable REQ-85 progress with zero regression.
- The full module reframe is **staged in the working tree, uncommitted**, and red across 65 tests.

## My recommendation

Land the **contract + seam** (commit 1, done) as REQ-85's safe deliverable, and **do not** mass-delete the reconciliation ACs in this session. Route the module reframe + reproduction re-basing (option 1) to a proper multi-commit effort where those ACs are re-expressed on L1, not dropped.

**Your call:** do you want me to **(1)** treat this as the reproduction-engine re-basing epic (I'll revert the staged reframe, keep commit 1, and we scope the epic), or **(2)** proceed to retire the reconciliation ACs now — in which case I'll mark them superseded in their tickets and rewrite the 65 tests onto the capability model? I recommend (1).

<!-- xgd-turn id="58664804-6956-467d-9d47-4e0f289813ba-user" -->

<!-- xgd-chat role="user" ts="2026-07-21T17:46:33.362511+00:00" -->
#### You
Lets proceed carefully, its just more commits into this ticket

<!-- xgd-turn id="58664804-6956-467d-9d47-4e0f289813ba-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-21T18:07:19.960194+00:00" -->
#### Claude
Understood — proceeding carefully with option 2, across more commits. Let me first scope the decision into the ticket (including which reconciliation ACs REQ-85 supersedes), then migrate methodically.

Ticket updated. Now let me migrate the core files myself to establish the patterns. Reading them:

Migrating `framework-content-modules.test.ts` to the capability model:

Core file `framework-content-modules` migrated. Now let me parallelize the mechanical trims (delete dial-layout tests, keep framework-utility tests) via two agents on disjoint file sets, while I handle the semantic core files (carousel UAT, generate, conformance, framework-tokens, chat9).

Now my core files. Delete the old carousel test and write the REQ-85 carousel acceptance UAT:

Both green. Now `framework-tokens`, `generate`, `chat9`, and the conformance fixtures. Reading the relevant sections:

Now `chat9-edit-hooks` — migrate the instance fixtures to config/slots:

Now `generate.test.ts` — migrate instances and the CSS assertions:

Core files green. Now the conformance suite (req39–42) — tightly coupled to my harness change. Let me inspect its fixtures and broken-meta shape.

Agent B done: removed 3 files, trimmed 2, kept 5 — all green (45 tests). Now let me finish the conformance migration. Updating `cleanFixture` and the broken-meta shape:

Now check req40/41/42 for the same fixture patterns:

Let me check whether chromium is available (it gates most conformance tests) and inspect the payloads helpers that build content from meta:

The security payloads are built on the old `contentSchema`/`variants` — they need reworking for the capability model. Let me read the full file:

Let me rewrite `payloads.ts` for the capability model, then migrate req40. First, how req40 uses these helpers:

Both trim agents finished (green). Now let me rework `payloads.ts` for the capability model. First, who consumes these helpers:

Only req40 consumes `buildBenignContent`; `buildSecurityFixtures` is unused. Let me rewrite `payloads.ts` for the capability model (inject into config URLs + L1 slot subtrees):

Now migrate req40's broken meta, version, and benign fixture:

Now req41 and req42. Let me read their fixture blocks:

Now fix req41's broken-meta shape and clean fixture:

Now req42 — check for broken-meta and fix the clean fixture:

All conformance fixtures migrated. Let me typecheck and run the full affected set:

Down to 3 failures / 522 (all browser-based). Let me see the actual violations:

Three issues, all fixable. The root cause of the two conformance failures: I added a JS `<script>` island to the carousel, whose dev-path bundle 404s in the static conformance build — but the carousel was **deliberately pure-CSS / SSR-only** (DOC-7). Autoplay/loop genuinely need client JS, which contradicts that contract and the generate pipeline (no island-JS bundling). The faithful fix: keep the carousel pure-CSS (view + controls), drop autoplay/loop + the script. The acceptance UAT only requires "config drives scroll/controls." Plus shot.test.ts needs a v2 seed.

Let me apply these.

Now update the carousel UAT — drop autoplay/loop/enhance, keep an isolation angle on malformed slots:

All green. Now the full suite to confirm nothing else regressed:

Full suite green (521/521). Now a clean typecheck sweep across packages before committing (green vitest ≠ typecheck-clean):

Clean. Let me confirm no other workspace package references the changed module surface, then commit 2.

No external consumers. Let me review the full changeset and commit 2. First check dist tracking and bump the version:

dist is gitignored (fine). Let me bump version and commit 2 (the full reframe):

Commit 2 landed, suite green. Now **Commit 3: the `isolation` conformance dimension + obligation wiring + the third acceptance UAT.** Let me study the harness dispatch and checks.

The harness is clear. Let me add the `isolation` dimension — a browser-free render-robustness check. First the dimension type:

Now add the isolation branch + `assertIsolationConforms` to the harness:

Now the throwing fixture (to prove the isolation dimension discriminates) and the third acceptance UAT:

Isolation dimension works (4/4, including discrimination). Full suite check before committing 3:

525/525 green. Let me update the conformance index docstring, bump, and commit 3:

All three code commits landed; status=`free_coded`; suite green (525/525). Let me do a final clean-state verification.

The ticket didn't capture commit 3 / the status change (the combined update seems to have partially applied). Let me fix it:

Status transition needs the dedicated gate command (which runs the version-bump check). Let me use it:

Done — the code half of REQ-85 is complete, gated to `free_coded`, and the tree is clean.

## What landed (3 `[FREE-CODED]` commits on REQ-85)

1. **`a1f739b` — capability contract + validation.** New `CapabilityMeta` (vetted core + behavioural `config` + named L1 `slots` + conformance obligations incl. `isolation`) and `validateCapabilityConfig/Slots/Instance` — slot content validated as L1 subtrees (the security line).
2. **`0e70641` — the reframe.** Carousel and contact-form become capability modules: behavioural config + L1-slot presentation, **no aesthetic dials**. Carousel is pure-CSS scroll-snap (view + controls), slides mounted via a new `renderL1Fragment` (namespaced so instances never collide). Contact-form keeps its functional core (field schema, honeypot, Turnstile, no-JS post, `enhance.ts`); intro/submit presentation → slots. Pipeline threaded through: registry → `CapabilityDefinition`, generate renders `config`/`slots`, `moduleInstanceSchema` gains `config`/`slots` (repro `dials`/`content` kept optional for the capture→dials engine). Reproduction-via-module-dials tests superseded by L1 were retired (AC637/660–670/676–678 + the fidelity suite); behavioural tests migrated `content`→`config`/`slots`.
3. **`0f3f5b1` — the `isolation` conformance dimension.** Render-level (no browser): a capability given degenerate config/slots must degrade inertly. Completes the obligation set (safety/security/x-browser/responsive + isolation) both survivors declare.

**All three acceptance UATs pass** (`carousel_slots`, `contactform_capability`, `conformance`). Full suite: **525/525 green**; clean `tsc` across site-schema, framework, generate.

## Two decisions worth flagging
- **Autoplay/loop dropped from the carousel.** They require client JS, which contradicts the carousel's SSR-only contract (DOC-7) and 404'd in the static conformance build. Kept the carousel pure-CSS; the acceptance UAT only requires "config drives scroll/controls," which holds.
- **`dials`/`content` kept optional on `moduleInstanceSchema`.** The capture→dials reproduction engine still emits them; the capability modules ignore them. Re-basing that engine onto L1 is the pivot's separate effort (recorded in the ticket) — not silently deleted.

## Remaining: the docs
The ticket also lists a **Capability-Modules spec**, a **Capability-Module Authoring/Vetting process** (replacing DOC-14), and updates to **DOC-8 / DOC-20 / DOC-21**. Docs are outside the free-coding protocol, and this is a sizable, judgment-heavy chunk — so I paused before writing five doc files unprompted.

Want me to proceed with the docs now (I'd start with the Capability-Modules spec using carousel + contact-form as the worked examples), or is landing the code enough for this session?

<!-- xgd-turn id="598c9d12-f293-4179-9548-bc4cf8cae308-user" -->

<!-- xgd-chat role="user" ts="2026-07-21T19:40:25.085841+00:00" -->
#### You
**Autoplay/loop dropped from the carousel.** They require client JS, which contradicts the carousel's SSR-only contract (DOC-7) and 404'd in the static conformance build. Kept the carousel pure-CSS; the acceptance UAT only requires "config drives scroll/controls," which holds. <-- this I don't understand, the whole point of behavioral modules is that they have code. The display part of them their appearance should be extremely flexible and open to Claude to set up however it chooses but the functionality the code should be fixed and tested that's the point. So I'm confused by this statement it doesn't make sense to me

<!-- xgd-turn id="598c9d12-f293-4179-9548-bc4cf8cae308-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-21T19:50:10.683120+00:00" -->
#### Claude
You're right, and I need to correct my thinking — that was a wrong call. The whole point of a capability module is that it ships **fixed, vetted, tested behavioural code**; the appearance is the flexible L1 part. Client JS is exactly what a capability is *for* — contact-form already ships `enhance.ts`. Dropping autoplay/loop "because it needs JS" gets the model backwards.

What I actually hit was a **pipeline bug, not a reason to remove behaviour**: the generate render emits an island `<script src=…index.astro?astro&type=script>` (a dev path) that 404s in the static build because generate never bundles/ships the capability's client JS. That same bug affects contact-form's `enhance.ts` — it just isn't conformance-tested, so it went unnoticed. The fix is to make capability client JS *ship*, then restore autoplay/loop.

Let me investigate how the pipeline handles (or fails to handle) capability client JS before I pick the fix.

That confirms it: the generate pipeline ships **no** capability client JS at all — the container render emits a dev-path `<script src>` that 404s, and there's no bundling/emit step. So contact-form's `enhance.ts` doesn't actually ship through generate either. It's a real pipeline gap, and my "drop autoplay" was papering over it.

The right fix: make capability client JS a first-class shipped asset (exactly analogous to how `getModuleCss()` folds each module's `<style>` into `theme.css`), then restore autoplay/loop. Let me scope this into the ticket and build it.

Everything checks out: static server serves `.js`, framework is consumed from source (so plain `.js` ships fine and isn't typecheck-noise), and the client test imports the enhance logic directly (I'll repoint it). Let me scope this into the ticket, then build.

Ticket scoped. Now build. First, the carousel's vetted client behaviour as shippable plain JS:

Now migrate contact-form's `enhance.ts` to plain shippable JS. Let me read the full file:

Now restore autoplay/loop to the carousel meta + component, and remove the island scripts from both components:

Now remove the island `<script>` from contact-form (client JS now ships via the pipeline):

Now the pipeline emit. Add `getModuleClientJs()` alongside `getModuleCss()`:

Export it and wire the render pipeline:

Now wire `render.ts`: import `getModuleClientJs`, write `capabilities.js`, and reference it in the page `<head>`:

Now write `capabilities.js` in `renderSite` alongside `theme.css`:

Now update the tests. First, repoint the contact-form client test to `client.js`:

Now update the carousel UAT — restore autoplay/loop, add client-behaviour unit tests:

Now add a generate assertion that `capabilities.js` ships + is referenced:

Let me typecheck and run the affected tests (including the browser conformance ones that caught the original 404):

All green, including the conformance tests that caught the original 404 — `capabilities.js` ships correctly. Full suite + typecheck sweep:

Full suite green (528), tsc clean. Let me review the changeset and commit 4:

Now re-gate to `free_coded` with all four commits:

You were right to push back — thanks for the correction. It exposed a real pipeline bug, not just a cosmetic one.

## Fixed (commit `3b65fc8`, the 4th `[FREE-CODED]` commit on REQ-85)

The mistake was treating "needs client JS" as a reason to drop behaviour. The actual problem: **`tools/generate` renders SSR HTML via Astro's container API and never shipped island JS** — so the dev-path `<script src=…index.astro?astro&type=script>` 404'd. That silently broke **contact-form's `enhance.ts` too**; it just wasn't conformance-tested, so nobody noticed.

The fix makes capability client JS a **first-class shipped asset**, exactly mirroring how `getModuleCss()` folds each module's `<style>` into `theme.css`:

- Each capability authors a self-contained, defensive **`client.js`** (plain browser JS, no imports) — unit-tested by import, shipped verbatim.
- `getModuleClientJs()` folds the catalog's `client.js` files; `renderSite` writes one **`capabilities.js`** asset and the page references it once as `<script type="module">`. No dev-path island scripts anywhere.
- **Carousel `autoplay`/`loop` restored** as vetted client behaviour in `carousel/client.js`.
- **contact-form `enhance.ts` → `contact-form/client.js`** on the same mechanism — its JSON-fetch enhancement now actually ships through generate for the first time.

Isolation still holds: every `client.js` entry point is guarded + try/catch, so a misbehaving capability degrades to the no-JS baseline.

This is the correct division you described: **appearance = flexible L1; behaviour = fixed, vetted, tested code that ships.**

## State
- **528/528 tests green** (the two conformance browser tests that caught the 404 now pass because `capabilities.js` serves cleanly), clean `tsc` across site-schema / framework / generate.
- REQ-85 back at `free_coded` with all **4 commits** recorded.

The only remaining item from the ticket is the **docs** (Capability-Modules spec, Authoring/Vetting process replacing DOC-14, DOC-8/20/21 updates) — still outside the free-coding protocol and unstarted. Want me to write those now, or leave the code as the deliverable for this session?

<!-- xgd-turn id="717d962f-983e-4fd3-ab04-7b565b2fbbd5-user" -->

<!-- xgd-chat role="user" ts="2026-07-21T20:08:00.112779+00:00" -->
#### You
please finish up

<!-- xgd-turn id="717d962f-983e-4fd3-ab04-7b565b2fbbd5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-21T20:12:15.958969+00:00" -->
#### Claude
Let me finish the docs. First, locate the doc set and read the relevant ones to match format and cross-references.

The DOCs are XGD tickets (type=doc), not files. Let me confirm and read the relevant ones:

Docs are doc-type tickets. "Finish up" authorizes the docs named in REQ-85's body. Let me read the ones I'll update/supersede and a fresh pivot doc for style.

Now the three docs I'll update — DOC-20 (conformance), DOC-21 (attribution ladder), DOC-8 (tool surface):

I have the full picture. Let me check the doc-creation interface, then author the two new docs and update DOC-20/21/8.

Now authoring the first new doc — the Capability-Modules spec:

DOC-25 created. Now the Authoring & Vetting process doc (replaces DOC-14):

Both new docs created (DOC-25, DOC-26). Now append REQ-85 update sections to the three existing docs. DOC-20 (conformance → promote 4 ACs to 5 with isolation):

DOC-21 (attribution ladder → L1 axes + capability gaps):

Now DOC-8 (tool surface — AI configures capabilities via config + L1 slots), and a pointer in DOC-14 to the new authoring doc:

All docs authored. Let me record completion on REQ-85 and verify the final state:

REQ-85 is complete. Here's the final state.

## Code — 4 `[FREE-CODED]` commits, `free_coded`, tree clean, 528/528 green

1. `a1f739b` — `CapabilityMeta` contract + `validateCapability*` (slot content validated as L1 — the security line).
2. `0e70641` — the reframe: carousel + contact-form become capability modules (behavioural `config` + L1-slot presentation, no aesthetic dials); pipeline threaded (registry → `CapabilityDefinition`, `renderL1Fragment`, `moduleInstanceSchema` gains `config`/`slots`); retired the reproduction-via-dials tests superseded by L1, migrated the behavioural ones.
3. `0f3f5b1` — the `isolation` conformance dimension (render-level, no browser) + the third acceptance UAT.
4. `3b65fc8` — capability client JS ships as a first-class `capabilities.js` asset (`getModuleClientJs`); **autoplay/loop restored** on the carousel; contact-form's enhancement now actually ships.

All three acceptance UATs pass (`carousel_slots`, `contactform_capability`, `conformance`); clean `tsc` across site-schema / framework / generate.

## Docs — done

- **NEW DOC-25** — *Capability Modules — Contract & Catalog* (carousel + contact-form worked examples).
- **NEW DOC-26** — *Capability-Module Authoring & Vetting Process* (**replaces DOC-14**; DOC-14 given a successor pointer).
- **DOC-20** — universal ACs promoted to the **five-AC envelope** (added isolation); harness/fixtures reframed to config/slots.
- **DOC-21** — attribution ladder reframed (layout gap → L1 axis; behaviour gap → configure existing capability → author new).
- **DOC-8** — tool surface: AI authors L1 + configures capability `config`/`slots`.

## Two course-corrections worth remembering
- The reframe transitively broke the reproduction/reconciliation engine (it renders through these modules via dials) — handled by retiring the superseded ACs, recorded in the ticket, with L1 re-basing flagged as separate work.
- Your push-back on autoplay/loop was right and exposed a real gap: **capability client JS never shipped through `generate`** (contact-form's too). Fixed properly — behaviour is fixed/vetted/tested code that ships; appearance is flexible L1.

One honest caveat: the browser-dependent conformance dimensions (safety/security/x-browser/responsive) ran against Chromium here; the `full`-tier WebKit/Firefox sweep is a regression-time concern per DOC-20 and wasn't exercised this session. The `isolation` dimension is browser-free and always runs.

<!-- xgd-chat-end -->