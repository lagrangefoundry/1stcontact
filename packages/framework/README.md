# @1stcontact/framework

The **L1 layout substrate**, the **capability-module** catalog, and the
theme-token system that renders every 1st Contact site (DOC-7 security half,
DOC-23, DOC-24). Server-side render only — module components are Astro
components compiled by the consuming build (`tools/generate`); there is no
in-browser renderer (DOC-7 §2.4 / DOC-12).

Since the framework pivot (REQ-79 / REQ-84) **layout is owned by L1**, not by
semantic layout modules. The old header/hero/footer/text-block/services-grid/layer
modules and their composition helpers (background/layer/overlay/row/nav/motion)
are gone; a "module" now means a **capability** — a vetted behavioural core the
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
- **Capability-module catalog** (`src/modules/`)
  - `types.ts` — the `ModuleMeta` contract (DOC-7 §3.1).
  - `registry.ts` — `registry` + `getModule(id, version)`. The catalog holds the
    capability modules only.
  - `carousel`, `contact-form` — the current capability modules, each a `meta.ts`
    contract plus an `index.astro` component with scoped, token-driven CSS.
  - `dials.ts` — shared per-instance dial enums + the length/step resolvers
    (`resolveStep`, `classifyLength`, `responsiveStepVars`, … — the
    absolute-or-overlay seam) reused across capability modules.
  - `text-style.ts` / `text-markup.ts` / `markdown.ts` — the styled-text run
    model shared by every text-bearing capability.

## Testing

Module components and the L1 renderer are exercised via Astro's container API
under Vitest (the `.astro` transform is wired through `getViteConfig` in the
root `vitest.config.mts`). UATs live in `tests/`.
