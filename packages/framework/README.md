# @1stcontact/framework

The **L1 layout substrate**, the **behavior-module** catalog, and the
theme-token system that renders every 1st Contact site (DOC-7 security half,
DOC-23, DOC-24). Server-side render only — a behavior module is a plain
TypeScript function of its props (REQ-148), so the render runs in Node and in
workerd through the same code; there is no in-browser renderer (DOC-7 §2.4 /
DOC-12).

Since the framework pivot (REQ-79 / REQ-84) **layout is owned by L1**, not by
semantic layout modules. The old header/hero/footer/text-block/services-grid/layer
modules and their composition helpers (background/layer/overlay/row/nav/motion)
are gone; a "module" now means a **behavior** — a vetted behavioural core the
AI *configures*, never writes code for.

## What's here

- **L1 substrate** (`src/l1/`)
  - `render.ts` — `renderL1Document` / `renderL1Page`: the *one* safe emitter
    that turns a typed L1 element tree into HTML + CSS. Every value is re-checked
    and emitted through a typed sink (escaped text, hex-only colours, URL-scheme
    allowlist, sanitised font-family, numeric lengths) — the substrate is safe by
    construction (DOC-2). The L1 schema + envelope validator live in
    `@1stcontact/site-schema` (`src/l1`).
- **Theme tokens** (`src/tokens/`)
  - `contract.ts` — re-exports `ThemeTokens` (and per-group types) from
    `@1stcontact/site-schema`, the single source of truth for the token shape.
  - `defaults.ts` — `defaultTokens`: a complete neutral default for every slot.
  - `css.ts` — `generateThemeCss(tokens?, { dark? })`: emits a `:root` block of
    CSS custom properties (`--color-*`, `--space-*`, …), filling omitted slots
    from defaults, with an optional `prefers-color-scheme: dark` palette block.
- **Behavior-module catalog** (`src/modules/`)
  - `types.ts` — the `ModuleMeta` contract (DOC-7 §3.1).
  - `registry.ts` — `registry` + `getModule(id, version)`. The catalog holds the
    behavior modules only.
  - `carousel`, `contact-form` — the current behavior modules, each a `meta.ts`
    contract, a `component.ts` render function, a `client.js` of vetted client
    behaviour, and a `styles.css` carrying only its invariant-element chrome
    (DOC-25 §10.3). `1c assets` precompiles the last two into
    `module-assets.ts` so a runtime with no filesystem can compose `theme.css`
    and `capabilities.js`.
  - `html.ts` — the two explicit string sinks (`escapeHtml`, `attr`) a module's
    own markup goes through. They were the Astro compiler's job until REQ-148.
  - `dials.ts` — shared per-instance dial enums + the length/step resolvers
    (`resolveStep`, `classifyLength`, `responsiveStepVars`, … — the
    absolute-or-overlay seam) reused across behavior modules.
  - `text-style.ts` / `text-markup.ts` / `markdown.ts` — the styled-text run
    model shared by every text-bearing behavior.

## Testing

Module components and the L1 renderer are exercised by calling them: both are
plain functions, so a UAT renders one directly and asserts on the HTML. UATs
live in `tests/`; the workerd half of the render (`*.workers.test.ts`) runs in
Miniflare against real bindings.
