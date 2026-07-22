---
uid: doc-e9b3b75f
id: DOC-7
type: doc
title: Website Framework Architecture Principles
created_by: xgd
created_at: '2026-06-30T01:01:58.435922+00:00'
updated_at: '2026-07-20T22:04:40.893815+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  doc_kind: architecture
---

> ⚠️ **Split by the framework pivot (REQ-79 / REQ-84 / REQ-85).** This document
> predates the pivot and its **semantic-layout-module half is withdrawn**; its
> **security / validation half is re-founded on L1**. Read it with this map:
>
> **Withdrawn (→ the L1 substrate).** Everything that treats a *module* as the unit
> of **layout** — the composition hierarchy where pages are stacks of
> header/hero/footer/text-block/services-grid/layer bands (§2.3, §3 the layout
> Module Contract, the layout dials/variants of §3–§4, the nav-pattern module
> catalog §5, the "Bad Wix / finite dials" framing §6.1, and catalog-evolution as
> *layout* modules §7) — is gone. Layout is now owned by the **L1 layout substrate**
> (one typed, CSS-faithful element tree — [[DOC-23]]). A "module" now means a
> **capability** (a vetted behavioural core the AI *configures*: carousel,
> contact-form, later payments/auth/…); its contract is REQ-85. The framework's
> purpose is a **safety envelope, not aesthetic rails** — [[DOC-24]].
>
> **Re-founded on L1 (still current).** The load-bearing **security boundary** —
> *site definitions are structured data only, never raw code/CSS/HTML* (§6.2) — and
> the **mechanical validation contract** (§6.5) survive and are now enforced at the
> **L1** layer; the authoritative statement is [[DOC-2]] (Security Policy). The
> **theme-token system** (§4 tokens), **storage/versioning/rendering** (§8, [[DOC-12]]),
> **technology stack** (§9), **repo structure** (§10) and **build pipeline** (§11)
> remain valid. Where the text below says "module" in a *layout* sense, substitute
> "L1"; where it says "module" in a *behaviour/capability* sense, it still applies.

---

# 1st Contact Website Framework — Architecture Principles

## 1. Purpose & Scope

This document captures the durable architectural principles for the 1st Contact website framework: the shared engine that renders every site built on the platform. The 1st Contact marketing site is one such site, with no special-casing — it is built, stored, and served exactly like any customer site.

It is paired with [[DOC-4]] (product vision) and [[DOC-5]] (platform architecture). DOC-5 covers the platform-wide Cloudflare/D1/R2/Workers shape; this doc covers the framework specifically — how a site is modeled, rendered, and evolved.

**This document commits to:**

- A module-based composition model.
- An evolving, **expressively-complete structured design language** — a growing set of modules and layout primitives powerful enough that output looks bespoke, never templated. Expressiveness grows without limit; the only walls are **security** and **reliability**, never taste.
- AI edits site definitions as **structured data** — positions, layers, and layout included — never as raw code, CSS, or HTML. That boundary is for security and reproducibility, not to constrain design.
- One framework, one site model: the 1st Contact marketing site is an ordinary platform site, not a special case. File-backed (`sites/<name>/` — offline development and seed fixtures) and D1-backed are two storage representations of the same site, not two kinds of site; file-backed sites are migrated into the D1-backed canonical store.
- One **server-side** renderer: static generation at build time / via the `1c` CLI. No client-side/in-browser renderer (see §2.4).
- A single mechanical validator that enforces **structure, security, and referential integrity** at every layer — not aesthetic conformance. Quality comes from the AI's eyes and iteration (§6), not from constraints.
- Astro as the rendering technology; Astro + React for the control app.

**This document deliberately does not commit to:**

- Specific module catalog contents (handled in REQ tickets per iteration).
- Specific theme token values (defined per site, evolved over time).
- Specific schemas for D1 storage of site definitions (handled in DOC-5 and dedicated schema tickets).
- Pixel-precise positioning, art-directed layouts, or per-site custom CSS — these are out of scope by design.

---

## 2. Composition Model

### 2.1 Hierarchy

```
Site
├── config          (business profile, contact, hours, integrations)
├── theme           (site-wide token values)
├── nav             (pattern + entries)
├── pages[]
│   └── modules[]   (ordered list of module instances)
│       └── { type, version, variant, dials, content }
└── assets          (image / file references)
```

A **single-page site** is one page with N module instances. A **multi-page site** is N pages, each with its own module list. Both are the same primitive — there is no separate "single-page mode."

### 2.2 One site model, two storage representations

There is exactly one kind of site (the site definition of §2.1). The 1st Contact marketing site is an ordinary site, not a special case. A site has two possible *storage representations* — not two kinds:

| Representation | Site definition source | Role |
|---|---|---|
| **File-backed** | JSON files under `sites/<name>/` in the repo | Offline development and seed fixtures; file-backed sites are migrated into D1 |
| **D1-backed** | Records in the Cloudflare D1 product database | Canonical store for every live site — the marketing site and all customer sites alike |

There is no permanently file-backed site. The canonical home for every live site is D1 (the definition) plus R2 (asset bytes); file-backed `sites/<name>/` is an authoring/seed format that converges to D1 via migration. During development we may build several sites in filespace and migrate them to Cloudflare. The renderer accepts either representation via a common interface — module rendering is identical, there are no divergent code paths.

The file-backed layout (`draft/`, locked `revisions/`, `history.json`) and the full storage/versioning/rendering model are specified in [[DOC-12]].

### 2.3 The module is the unit of reuse

Modules are the atomic unit of visual composition. A module is not a snippet of HTML or a CSS class — it is a versioned, contract-bound Astro component. The catalog of available module types is closed at any given framework version; it grows only through deliberate framework iteration (see §7).

### 2.4 Renderer runs server-side (build/CLI), not in the browser

The renderer — the module catalog plus the theme system as packaged in `packages/framework` — runs **server-side**: at build time via the `1c` CLI / `tools/generate`, producing static HTML + CSS + JS that is shipped fully-formed to the browser.

There is **no client-side/in-browser renderer.** The earlier commitment that "the in-browser preview IS the production renderer" is withdrawn — it forced the framework to be browser-ESM-pure and maintained two execution contexts, a premature optimization. The builder's future preview is **server-rendered HTML shown in an iframe**, not a client render. A client-side renderer may be revisited only if interaction latency proves it necessary.

Implications for the framework package:

- It may use Node/build-time tooling on the render path; it does **not** need to be importable as ESM in the browser.
- Asset reference resolution still works through a context-agnostic interface so the same module code resolves file-backed `assets/` paths (build) and R2-served URLs (runtime).

See [[DOC-12]] for the full storage/versioning/rendering model.

---

## 3. Module Contract

### 3.1 Required exports

Every module exports a `moduleMeta` object declaring its full contract:

```typescript
export const moduleMeta = {
  id: 'photo-text',                       // stable identifier, never renamed
  version: 1,                             // monotonically incremented on breaking change
  variants: ['image-left', 'image-right', 'stacked'] as const,
  dials: {
    size:          ['sm', 'md', 'lg'],
    shape:         ['square', 'rounded', 'circle'],
    align:         ['left', 'center', 'right'],
    spacingTop:    ['none', 'sm', 'md', 'lg', 'xl'],
    spacingBottom: ['none', 'sm', 'md', 'lg', 'xl'],
    surface:       ['default', 'subtle', 'inverse', 'accent'],
  },
  contentSchema: {
    heading: { type: 'string',     required: false },
    body:    { type: 'markdown',   required: true },
    image:   { type: 'asset-ref',  required: true },
  },
} as const;
```

### 3.2 Contract rules

1. **Visual properties are structured data, not raw CSS.** Where an enumerated set fits (a surface, a variant), dials use it; where a design needs free values (positions, coordinates, sizes, z-order, transforms), those are **free-valued structured fields**, validated for type and range. What is forbidden is raw CSS/HTML — not free values.
2. **Content is structured.** Every content field has a typed schema entry (`string`, `markdown`, `asset-ref`, `url`, `enum`, `list-of<T>`).
3. **Modules are pure functions of their props.** Modules never read site-wide state outside what is passed in.
4. **Instance data becomes CSS only through the module, never by injection.** Variant / dial / position / layout props flow into scoped, class-based styling and CSS custom properties the module controls — never raw inline CSS supplied by the instance.
5. **No raw per-instance CSS/HTML.** An instance may carry **structured** layout (position, size, z-order, treatment) that the module interprets; it may not carry custom CSS or arbitrary style/markup. Structured layout is fine — raw code is the security/reproducibility line.
6. **Same render in both storage representations.** A module produces identical output regardless of whether its props came from a file or D1.

### 3.3 Module identity and stability

- `id` is permanent. Renaming a module is forbidden; deprecate and supersede instead.
- `version` increments on any breaking change to `variants`, `dials`, or `contentSchema`.
- Backward-compatible additions (new variant, new dial value, new optional content field) do not require a version bump.

---

## 4. Theme Token System

### 4.1 Two layers of tokens

| Layer | Scope | Owner | Examples |
|---|---|---|---|
| **Site-wide theme tokens** | Site | AI / operator | Palette, type family, type scale, spacing scale, radius, shadow, container width, breakpoints |
| **Per-instance dials** | Single module instance | AI / operator | Size, shape, alignment, spacing top/bottom, surface, text-align, emphasis |

Site-wide tokens set the visual language. Per-instance dials let individual module instances vary within that language. Together they absorb the great majority of "nudge it slightly" requests as structured choices.

### 4.2 Implementation

- Tokens are realized as **CSS custom properties** (`--color-primary`, `--space-md`, etc.).
- Each site has a **generated CSS file** produced at build time from its token values. This file is cacheable, inspectable, and immutable per build.
- Per-instance dials apply as class names on the module's root element. Module CSS resolves dial classes to token references.
- Mobile-first responsive system: all spacing, type, and container tokens have responsive scales; modules use these directly rather than declaring media queries.

### 4.3 What tokens cannot do

- Tokens cannot introduce new visual properties beyond the framework's token contract.
- Tokens cannot inject arbitrary CSS rules.
- Tokens cannot target individual elements outside the module system.

---

## 5. Navigation Patterns

Navigation pattern is a top-level site setting. The framework provides a finite, enumerated set:

| Pattern | Use |
|---|---|
| `in-page-anchors` | Single-page sites; module IDs become anchor targets; smooth-scroll |
| `top-tabs` | Multi-page sites, ≤ 6 top-level entries |
| `top-tabs-dropdown` | Multi-page with sub-pages (e.g., Services → Catering / Corporate / Weddings) |
| `hamburger` | Mobile-style menu used on desktop; minimal-aesthetic sites |
| `footer-only` | No top nav; in-page CTAs only |

The phased delivery order is `in-page-anchors` and `top-tabs` first (sufficient for 1st Contact's own site and most service businesses), with the remainder added as customer demand justifies. All patterns are implemented in the shared library; per-site customization is limited to choice of pattern, entry labels, and entry order.

---

## 6. A Powerful Structured Language, Not a Box

### 6.1 Philosophy — the enemy is "Bad Wix"

The failure mode to avoid is **Bad Wix**: all the constraints of a template builder, none of the human design input. Wix traps a *human* in rigid templates so their taste cannot get out; trapping a far more capable AI in finite dials repeats that failure with something powerful wasted inside the box.

Our stance is the inverse: **hand the AI a powerful structured design language and let it out.** Our sites should *look like they have no templates* — not because there is no template, but because the template is a **language, not a layout**, expressive enough that its output reads as bespoke.

This flips the burden of proof on every constraint: a constraint must justify itself by **security** or **reliability**. "It might look mediocre" is **not** a valid reason to remove a capability — that is what the AI's judgment, its eyes, and iteration are for (§6.4). Any rule whose only job is taste-policing is deleted.

### 6.2 The only wall: structured, not raw code

There is exactly one hard boundary: definitions are edited as **structured data — never as raw code, CSS, or HTML.** Free positioning, layering / compositing, transforms, backgrounds, motion are all welcome **as structured fields**. Raw CSS/HTML is not — and that line serves concrete, non-aesthetic goals:

- **Security** — raw CSS/HTML in instance data is an injection / XSS surface; structured-only closes it.
- **Reproducibility & portability** — structured properties round-trip through capture ([[DOC-13]]), serialize to D1, and re-render deterministically; raw CSS does not.

So "structured" is not the box — a *small* vocabulary would be. The commitment is to an **expressively-complete, ever-growing** one.

### 6.3 Grow the language; never fall back to raw

When the language cannot yet express a design, the answer is to **add a primitive** — a treatment, a transform, a gradient, a layer, a motion — **not** to open a raw-CSS escape hatch. Every real site we capture ([[DOC-13]]) that we cannot reproduce is a **language gap to close**, prioritized by how often it appears — not a "sorry, out of scope." The expressive ceiling rises without limit; the security/reproducibility wall stays put.

This supersedes the earlier "finite dials as AI-safety" model and the operator-only custom-CSS escape hatch — neither is how quality or safety is achieved here.

### 6.4 Quality comes from eyes, not constraints

Finite dials were the old guardrail against chaos. Removing them, the mechanism that replaces them is **the AI's eyes**: it renders its own output, sees it (screenshots — [[DOC-13]] §6), and iterates, with human review as the backstop. This is why the capture / screenshot capability is **foundational, not peripheral** — without eyes you need constraints; with eyes you can hand the AI the full language. The guardrails that remain are **security** (§6.2) and **reliability** (browser / render robustness), enforced structurally, not by narrowing design.

### 6.5 Mechanical validation contract

The **structural and security** boundaries of §6.2 are enforced mechanically by a single validator owned by `packages/site-schema` — it enforces well-formedness and safety, **not** aesthetic conformance:

```
validate(siteDefinition, frameworkCatalog) → Result
```

The validator is **deterministic, synchronous, and fast** — runs in well under a frame for typical sites (a few hundred module instances or fewer). It performs no I/O.

What it checks:

1. **Schema conformance** — the site definition matches the published JSON schema: required fields present, types correct, no unknown keys.
2. **Module-meta conformance** — every module instance's `type` exists in the catalog at the pinned `version`; `variant` is in `moduleMeta.variants`; enumerated dial values are in `moduleMeta.dials[name]` and free-valued structured props (positions, sizes, z-order) pass type/range checks; content fields match `moduleMeta.contentSchema`.
3. **Theme-token conformance** — every set token name exists in the framework's contract; values pass type checks for their token kind (color, scale step, breakpoint, etc.).
4. **Referential integrity** — every `asset-ref` resolves; every nav entry's target page or anchor exists; module IDs referenced from nav exist.
5. **Uniqueness and structure** — module IDs unique within a page; page slugs unique within a site; nav entries non-circular.
6. **Content-field safety** — content fields do not contain inline `<style>` / `<script>` or raw HTML beyond what the framework's content type for that field permits; URL fields are well-formed.

Validation failures return **machine-readable** errors so AI callers can self-correct:

```json
{
  "tool": "set_module_dial",
  "path": "modules[2].dials.shape",
  "expected": ["square", "rounded", "circle"],
  "got": "cirle"
}
```

The validator is consumed at **four layers**, every layer using the same code and the same rules:

| Layer | Owner | Where in the system | On failure |
|---|---|---|---|
| 1. AI tool call | Builder UI | Pre-state-apply | Reject; structured error to AI; AI retries within turn |
| 2. Builder state | Builder UI | State store | Refuse to ingest invalid definition |
| 3. Save to D1 | `control-app` Worker | Server-side, pre-persist | 4xx; client surfaces error |
| 4. Build / publish | `tools/generate` | Pre-render | Block publish; operator-facing error |

**No code path may write a site definition to D1, render it for production, or apply it to builder state without passing the validator.** This is the guarantee that turns "structured changes only" from an aspiration into a property. Drift between layers is the single failure mode it must prevent — which is why the validator is *shared*, not duplicated, across consumers.

---

## 7. Catalog Evolution

The catalog grows through a **two-tier composition model**: Tier A composes sites from the reusable library (structured config); Tier B authors a **bespoke module** (code, with structured params) when the library cannot express a design. The module is a *structured escape valve to arbitrary code* — which is why the framework has **no expressive ceiling** (template builders have no code escape). Bespoke modules are drafted in-session (1C), **hardened by XGD** (tests, security, generalization), and either kept site-local or promoted to the library by demand. Full model: [[DOC-14]] (Module Lifecycle & Two-Tier Composition).

### 7.1 Customer-driven, framework-bound

When a customer's need cannot be expressed via existing modules, variants, dials, or tokens, the response is to **iterate the framework**, not to fork the site:

```
customer asks for X
  → request becomes a ticket on the platform
  → framework iteration adds module / variant / dial / token
  → all sites gain the capability
  → request now in-catalog for the next customer
```

This turns the catalog gap from a customer-facing limitation into a system-strengthening signal, and aligns with the broader XGD demonstration: customer demand drives autonomous framework development.

### 7.2 Variant-first discipline

When evaluating a new capability, the question order is:

1. Is this a new **dial value** on an existing module? (Cheapest.)
2. Is this a new **variant** of an existing module? (Cheap.)
3. Is this a new **module**? (Expensive; only when no existing module fits.)

The catalog should grow primarily through new variants. Module proliferation is a smell.

### 7.3 Vertical-specific tagging

Modules and variants may be tagged as vertical-specific (e.g., `vertical: catering` for an allergen-tagged menu variant). The general module set should remain lean; vertical-specific capabilities are surfaced only when relevant to the site's declared vertical.

### 7.4 Graceful degradation through `text-block`

Until a dedicated module exists for a given content shape, structured prose in the `text-block` module is the canonical fallback. Because `text-block`'s body field is markdown, it can carry rich content — images, lists, links, sub-headings — and serve as an "article-style" stand-in for content that will eventually warrant a dedicated module (about pages, FAQ-as-prose, terms, manifestos, founder notes).

This is deliberate, not a workaround. It means:

- **Nothing is blocked** waiting for the perfect module to exist.
- **Catalog gaps surface as observable patterns** — repeated text-block use for the same content shape is the signal to design a dedicated module, and the existing text-block content informs the new module's contract.
- **Two valid visual outcomes are preserved.** A text-block-about reads as "a personal note from the founder." A future `about` module reads as "a designed about section." Both are legitimate; the distinction itself has product value.

Operators and AI should reach for `text-block` for any prose-shaped content while the catalog matures, without treating it as a compromise.

---

## 8. Module Versioning

- Site definitions **pin** to a specific module version (`{ type: 'photo-text', version: 1, ... }`).
- New framework releases never silently change rendering of existing sites.
- Upgrading a site to a new module version is an **explicit operator action**, with optional preview and rollback via the platform's revision model (DOC-5).
- Multiple module versions may coexist in the framework so old sites continue to render correctly.
- Long-deprecated versions may be retired with notice and a forced upgrade path; this is rare and deliberate.

---

## 9. Technology Stack

### 9.1 Sites — the marketing site and customer sites, rendered identically

- **Astro** for static rendering.
- Modules are Astro components.
- Build output is fully static HTML + assets + the generated theme CSS file + the shared site JS bundle.
- Deployed to Cloudflare via Workers Static Assets.

### 9.2 Control app (builder UI + portal)

- **Astro shell** with **React islands** for interactive surfaces.
- **Tailwind CSS** as the utility layer.
- **shadcn/ui** for component primitives (copy-paste source, no runtime cost).
- Aggressive island boundaries; lightweight state (Zustand or `useSyncExternalStore`).
- Mobile-first; CI enforces a JS payload budget and Lighthouse mobile thresholds.

### 9.3 API and platform backend

Per DOC-5: Cloudflare Workers for the API, D1 for structured product data, R2 for assets and snapshots, Queues for background jobs, Durable Objects where coordination is needed, magic links for auth, Stripe for payments.

The API is not a separate Worker — instead, public-facing endpoints live on the `public-site` Worker (form submission, magic-link initiation) and authenticated endpoints live on the `control-app` Worker (CRUD on site definitions, leads, customers, AI orchestration). This keeps the boundary between public and authenticated surfaces at the Worker level rather than as application-layer middleware.

---

## 10. Repo Structure

```
1stcontact/
├── apps/
│   ├── public-site/       Cloudflare Worker for 1stcontact.io
│   │                      (generic site server: every published site by host/slug + public form/API endpoints)
│   └── control-app/       Cloudflare Worker for app.1stcontact.io
│                          (serves the builder/portal SPA + authenticated API endpoints)
├── packages/
│   ├── framework/         Module catalog, theme system, layout primitives
│   ├── site-schema/       JSON schema + TypeScript types + validator for site definitions
│   ├── builder-ui/        React components for the chat builder + portal
│   └── ui-kit/            Shared design-system components (shadcn-based)
├── sites/
│   └── 1stcontact/        The 1st Contact marketing site — an ordinary site, authored here as a D1 seed
│       ├── site.json
│       └── assets/
├── tools/
│   └── generate/          Static generator: site-def → static output
└── db/
    └── migrations/        D1 schema migrations
```

**Dependency direction:**

- `apps/public-site` depends on `tools/generate` (build-time) and `packages/framework`.
- `apps/control-app` depends on `packages/builder-ui`, `packages/ui-kit`, `packages/framework` (for in-browser preview rendering per §2.4), and `packages/site-schema` (for the validator).
- `tools/generate` depends on `packages/framework` and `packages/site-schema`.
- `packages/builder-ui` depends on `packages/ui-kit`, `packages/site-schema`, and `packages/framework` (in-browser renderer).
- `packages/framework` depends only on `packages/site-schema`.
- `packages/site-schema` is the canonical home of the validator (§6.5) and depends on nothing.
- `sites/1stcontact` is data — consumed by `tools/generate`, depends on nothing.

Live customer sites do not appear in the repo — their definitions live in D1. Sites under `sites/<name>/` (the marketing site included) are development/seed fixtures that are migrated into D1; all sites, wherever stored, are consumed at build time by the same `tools/generate` static generator.

**Two-Worker split rationale:**

- `public-site` is the **generic multi-tenant site server**: it serves `1stcontact.io/*` (the apex — the marketing site) and `*.1stcontact.io/*` (every customer site by slug subdomain) from D1-backed static output, *and* hosts public-facing endpoints (form submission, magic-link request initiation, Stripe webhook intake for public flows). `app` is a reserved slug, so the more-specific `app.1stcontact.io/*` route always wins over the wildcard.
- `control-app` serves `app.1stcontact.io/*` — the authenticated builder/portal **application** (a real app, not a framework-rendered site) *and* authenticated API endpoints (CRUD on site definitions, leads, customers, AI orchestration).
- Independent rollback. The public site stays up if the control app is being rebuilt and vice versa.

---

## 11. Build & Render Pipeline

### 11.1 Common pipeline

```
Site definition (file or D1)
+ assets (file or R2)
       ↓
tools/generate (Astro build harness)
       ↓
Generated static output (HTML + CSS + JS + assets)
       ↓
Cloudflare deploy (Workers Static Assets)
```

`tools/generate` is the only component that knows whether the site definition came from a file or D1. From the module's perspective, both are identical.

Per §2.4, rendering runs server-side only — there is no in-browser renderer. The private **draft preview** and the public **published** site are produced by this same build path to two separate destinations (`dist/<slug>/draft/` and `dist/<slug>/published/`); `publish` always renders the published output. See [[DOC-12]] for the storage/versioning/rendering model.

### 11.2 Local development

- `wrangler dev` runs the Worker API and serves static assets with local D1/R2/KV emulators.
- The control app dev server runs alongside, proxied through the Worker for same-origin behavior.
- A single root `npm run dev` orchestrates both.

### 11.3 Deployment

- A GitHub Actions workflow on `push: branches: [xgd-stable]` deploys both Workers — `public-site` (1stcontact.io) and `control-app` (app.1stcontact.io) — to Cloudflare. Each is deployable independently.
- Customer site builds are triggered via the platform's own publish pipeline (Workers Static Assets per site, or shared Worker with per-site routing — to be decided in a later REQ).

---

## 12. Out of Scope (v1)

These are explicit non-goals for the first iteration. Some may be revisited; others are permanently out of scope.

| Item | Status |
|---|---|
| Pixel-precise positioning | Permanently out of scope |
| Art-directed asymmetric layouts | Permanently out of scope |
| Overlapping element compositions | Permanently out of scope |
| Per-site custom CSS | Out of scope v1; operator-only escape hatch may come later |
| Arbitrary AI-generated styling | Permanently out of scope |
| Customer-installable framework package | Out of scope v1 |
| Multi-page nav patterns beyond `top-tabs` | Phased — added as demand justifies |
| AI-driven module catalog extension | Out of scope v1; framework iteration is operator-led |
| Live in-browser AI editing of module source | Out of scope v1 |

---

## 13. Open Questions Carried Forward

These are not blocking v1 but should be revisited in subsequent REQs as the product matures:

1. **First showcase vertical** — DOC-5 open question; defer until 1st Contact site and one or two customer sites have validated the module catalog.
2. **AI intent layer** — should the AI work directly on JSON, or via a higher-level intent interpreter that translates natural-language nudges into structured edits? v1 is direct-JSON.
3. **Per-site escape hatch** — design the operator-only custom CSS facility only when accumulated framework iterations cannot absorb specific real customer needs.
4. **Site snapshot storage** — D1 vs R2 for revision snapshots (DOC-5 open question).
5. **Build trigger for customer sites** — manual operator publish vs queued background build; depends on deployment model decision.
6. **Email provider for form notifications** — DOC-5 open question; only matters when wiring lead-capture pipeline.

---

## 14. Related Tickets

- [[DOC-4]] — Product definition and vision.
- [[DOC-5]] — Platform architecture (Cloudflare/D1/R2/Workers, identity, payments, monitoring).
- [[DOC-8]] — Builder UI architecture principles (chat-left / preview-right layout, in-browser preview, chat → AI → diff → state → render pipeline, AI tool surface, validator consumption).
- First framework REQ (forthcoming) — concrete v1 framework scope: module list for Phase 0, theme token surface, contact form lead-capture pipeline, 1st Contact marketing site target.
- Validator REQ (forthcoming) — concrete v1 validator scope per §6.5: schema, module-meta, theme-token, referential integrity, uniqueness, content-field safety. Shipped before or alongside the first builder REQ.