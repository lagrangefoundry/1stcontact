import { z } from 'zod'

/**
 * Zod schemas for 1st Contact site definitions.
 *
 * These schemas are the single source of truth for the site-definition data
 * contract (DOC-7 §2.1). TypeScript types are derived from them via `z.infer`
 * in `types.ts` — never hand-write a type that a schema already pins.
 *
 * Scope (DOC-7 §6.5 layer 1): structural validation only. The schema validates
 * shape, primitive types, universal enums, theme-token-slot completeness, and
 * structural uniqueness (module ids per page, page slugs per site). It does NOT
 * validate catalog membership — whether `type: 'hero'` is a real module, or
 * whether a variant/dial value exists in a module's `moduleMeta`. That is the
 * framework's job at render time.
 */

/** Hex color: #rgb, #rrggbb, or #rrggbbaa. */
const hexColor = z
  .string()
  .regex(
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
    'must be a hex color (#rgb, #rrggbb, or #rrggbbaa)',
  )

/**
 * A CSS length / value string (e.g. "1rem", "16px", "0 1px 2px rgba(...)").
 * Validated as a non-empty string only — CSS correctness is out of scope here.
 */
const cssValue = z.string().min(1, 'must be a non-empty CSS value string')

/** Asset reference. Also the only object shape permitted inside a ContentValue. */
export const assetRefSchema = z.object({
  id: z.string(),
  src: z.string(),
  alt: z.string(),
  focalPoint: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
    })
    .optional(),
})

/**
 * Recursive content value. MarkdownString, UrlString, and EnumValue from
 * DOC-7's type list all reduce to `string` at runtime — the only structural
 * distinctions are: scalar string, asset reference, or a list of values.
 */
type ContentValueT = string | z.infer<typeof assetRefSchema> | ContentValueT[]
export const contentValueSchema: z.ZodType<ContentValueT> = z.lazy(() =>
  z.union([z.string(), assetRefSchema, z.array(contentValueSchema)]),
)

/** SEO metadata for a page. */
export const seoMetaSchema = z.object({
  title: z.string(),
  description: z.string(),
  ogImage: z.string().optional(),
})

/** A single module instance within a page. */
export const moduleInstanceSchema = z.object({
  id: z.string(),
  type: z.string(),
  version: z.number().int().positive(),
  variant: z.string(),
  dials: z.record(z.string(), z.string()),
  content: z.record(z.string(), contentValueSchema),
})

/** A page: an ordered list of module instances. */
export const pageSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    seoMeta: seoMetaSchema.optional(),
    modules: z.array(moduleInstanceSchema),
  })
  .superRefine((page, ctx) => {
    const seen = new Set<string>()
    page.modules.forEach((m, i) => {
      if (seen.has(m.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['modules', i, 'id'],
          message: `duplicate module id '${m.id}' within page`,
        })
      }
      seen.add(m.id)
    })
  })

/** Navigation pattern — finite, enumerated (DOC-7 §5). */
export const navPatternSchema = z.enum([
  'in-page-anchors',
  'top-tabs',
  'top-tabs-dropdown',
  'hamburger',
  'footer-only',
])

/** Navigation entry target — discriminated by `kind`. */
export const navTargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('page'), pageId: z.string() }),
  z.object({ kind: z.literal('anchor'), pageId: z.string(), moduleId: z.string() }),
  z.object({ kind: z.literal('url'), href: z.string() }),
])

export const navEntrySchema = z.object({
  label: z.string(),
  target: navTargetSchema,
})

export const navConfigSchema = z.object({
  pattern: navPatternSchema,
  entries: z.array(navEntrySchema),
})

/**
 * Site-wide theme tokens (DOC-7 §4). Every slot below is required — a missing
 * slot is a validation failure, per the ticket's token-completeness contract.
 *
 * This is the REQ-4 superset (55 tokens total): the framework imports
 * `ThemeTokens` from here and never redefines it. Sub-token schemas are named
 * exports so consumers (the framework's defaults + CSS generator) can derive
 * precise types per group.
 */

/** 9 palette roles. `text` is the foreground role (replaced REQ-3's `fg`). */
export const paletteTokensSchema = z.object({
  bg: hexColor,
  surface: hexColor,
  surfaceSubtle: hexColor,
  surfaceInverse: hexColor,
  text: hexColor,
  muted: hexColor,
  primary: hexColor,
  accent: hexColor,
  border: hexColor,
})

/** Typography: families, a 9-step size scale, 5 weights, 3 line-heights. */
export const typographyTokensSchema = z.object({
  family: z.object({
    heading: z.string(),
    body: z.string(),
  }),
  scale: z.object({
    xs: cssValue,
    sm: cssValue,
    base: cssValue,
    lg: cssValue,
    xl: cssValue,
    '2xl': cssValue,
    '3xl': cssValue,
    '4xl': cssValue,
    '5xl': cssValue,
  }),
  weights: z.object({
    regular: cssValue,
    medium: cssValue,
    semibold: cssValue,
    bold: cssValue,
    black: cssValue,
  }),
  lineHeights: z.object({
    tight: cssValue,
    normal: cssValue,
    relaxed: cssValue,
  }),
})

/** 10-step geometric spacing scale. Keys are quoted numeric strings. */
export const spacingTokensSchema = z.object({
  '0': cssValue,
  '1': cssValue,
  '2': cssValue,
  '3': cssValue,
  '4': cssValue,
  '6': cssValue,
  '8': cssValue,
  '12': cssValue,
  '16': cssValue,
  '24': cssValue,
})

export const radiusTokensSchema = z.object({
  none: cssValue,
  sm: cssValue,
  md: cssValue,
  lg: cssValue,
  full: cssValue,
})

export const shadowTokensSchema = z.object({
  none: cssValue,
  sm: cssValue,
  md: cssValue,
  lg: cssValue,
})

/** 4 container widths; `default` is the canonical body container. */
export const containerTokensSchema = z.object({
  narrow: cssValue,
  default: cssValue,
  wide: cssValue,
  bleed: cssValue,
})

export const breakpointTokensSchema = z.object({
  sm: cssValue,
  md: cssValue,
  lg: cssValue,
  xl: cssValue,
})

export const themeTokensSchema = z.object({
  palette: paletteTokensSchema,
  typography: typographyTokensSchema,
  spacing: spacingTokensSchema,
  radius: radiusTokensSchema,
  shadow: shadowTokensSchema,
  container: containerTokensSchema,
  breakpoints: breakpointTokensSchema,
})

/** Business profile, contact, and integration config. */
export const siteConfigSchema = z.object({
  businessName: z.string(),
  tagline: z.string().optional(),
  contact: z
    .object({
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  integrations: z.record(z.string(), z.string()).optional(),
})

/** Top-level site definition (DOC-7 §2.1). */
export const siteSchema = z
  .object({
    id: z.string(),
    config: siteConfigSchema,
    theme: themeTokensSchema,
    nav: navConfigSchema,
    pages: z.array(pageSchema),
    assets: z.array(assetRefSchema).optional(),
  })
  .superRefine((site, ctx) => {
    const seen = new Set<string>()
    site.pages.forEach((p, i) => {
      if (seen.has(p.slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pages', i, 'slug'],
          message: `duplicate page slug '${p.slug}' within site`,
        })
      }
      seen.add(p.slug)
    })
  })
