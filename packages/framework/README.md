# @1stcontact/framework

The module catalog and theme-token system that renders every 1st Contact site
(DOC-7). Server-side render only — module components are Astro components
compiled by the consuming build (`tools/generate`); there is no in-browser
renderer (DOC-7 §2.4 / DOC-12).

## What's here (REQ-4)

- **Theme tokens** (`src/tokens/`)
  - `contract.ts` — re-exports `ThemeTokens` (and per-group types) from
    `@1stcontact/site-schema`, the single source of truth for the token shape.
  - `defaults.ts` — `defaultTokens`: a complete neutral default for every slot.
  - `css.ts` — `generateThemeCss(tokens?, { dark? })`: emits a `:root` block of
    CSS custom properties (`--color-*`, `--space-*`, …), filling omitted slots
    from defaults, with an optional `prefers-color-scheme: dark` palette block.
- **Module registry** (`src/modules/`)
  - `types.ts` — the `ModuleMeta` contract (DOC-7 §3.1).
  - `registry.ts` — `registry` + `getModule(id, version)`.
  - `header`, `hero`, `footer` — the three chrome modules, each a `meta.ts`
    contract plus an `index.astro` component with scoped, token-driven CSS.

## Token surface

55 tokens: palette (9), typography family (2) / scale (9) / weights (5) /
lineHeights (3), spacing (10), radius (5), shadow (4), container (4),
breakpoints (4). Shape is owned by `@1stcontact/site-schema`.

## Testing

Module components are rendered via Astro's container API under Vitest (the
`.astro` transform is wired through `getViteConfig` in the root
`vitest.config.mts`). UATs live in `tests/framework-*.test.ts`.
