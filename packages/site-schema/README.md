# @1stcontact/site-schema

The foundational data contract for 1st Contact site definitions: Zod schemas,
derived TypeScript types, and a structural validator.

## What it provides

- **Schemas** (`src/schema.ts`) — Zod schemas for the full site-definition
  hierarchy (DOC-7 §2.1): `Site`, `SiteConfig`, `ThemeTokens`, `NavConfig`,
  `Page`, `ModuleInstance`, `AssetRef`, etc. The schemas are the single source
  of truth.
- **Types** (`src/types.ts`) — TypeScript types derived from the schemas via
  `z.infer`.
- **Validator** (`src/validate.ts`) — `validateSite(input): Result<Site, ValidationError[]>`,
  returning a discriminated union with JSON-pointer-style error paths.

## Scope boundary

This package validates **structure** (DOC-7 §6.5 layer 1): shape, primitive
types, universal enums, theme-token-slot completeness, and structural
uniqueness (module ids per page, page slugs per site).

It does **not** validate **catalog membership** — whether a module `type`
exists, or whether a `variant`/dial value is legal for a given module. That is
`packages/framework`'s responsibility at render time using each module's
`moduleMeta`.

## Usage

```ts
import { validateSite, type Site } from '@1stcontact/site-schema'

const result = validateSite(input)
if (result.ok) {
  const site: Site = result.value
} else {
  console.error(result.errors) // [{ path: "/theme/palette/primary", message: "..." }]
}
```
