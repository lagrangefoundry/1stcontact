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
 * DOC-7's type list all reduce to `string` at runtime; the remaining structural
 * distinctions are: scalar (string / number / boolean), asset reference, a
 * nested object (a typed record — e.g. a services-grid item, a contact-form
 * field, a footer link), or a list of any of these.
 *
 * Number and boolean scalars are first-class: modules consume them as data, not
 * as text (e.g. contact-form's `field.required` is a real boolean bound to an
 * HTML attribute). Restricting content to strings would force every such value
 * through stringify/parse round-trips at the module boundary.
 *
 * The object form is a plain `z.record` of content values: it validates *shape*
 * (nested content values keyed by string), never per-module field names — that
 * remains `validateModuleContent`'s job at the framework layer (per the
 * schema-layer scope comment above). None of these forms is a raw-CSS/HTML
 * escape hatch: values stay within this closed set of content-value shapes, so
 * no raw `style`/`css`/`html` can be smuggled through, and the `.strict()`
 * raw-prop rejection on `moduleInstanceSchema` (DOC-7 §6.2) is untouched.
 *
 * `assetRefSchema` precedes the generic record in the union so an asset content
 * value still validates (and types) as an AssetRef rather than a plain record.
 */
type ContentValueT =
  | string
  | number
  | boolean
  | z.infer<typeof assetRefSchema>
  | ContentValueT[]
  | { [key: string]: ContentValueT }
export const contentValueSchema: z.ZodType<ContentValueT> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    assetRefSchema,
    z.array(contentValueSchema),
    z.record(z.string(), contentValueSchema),
  ]),
)

/** SEO metadata for a page. */
export const seoMetaSchema = z.object({
  title: z.string(),
  description: z.string(),
  ogImage: z.string().optional(),
})

/**
 * A layer painted between a section background and its content, giving text
 * legible contrast over busy images (REQ-14 / DOC-13 §4). `opacity` is a 0..1
 * fraction; `color` a hex color.
 */
export const backgroundOverlaySchema = z.object({
  color: hexColor,
  opacity: z.number().min(0).max(1),
})

/** How an image background fills its section. */
export const backgroundFitSchema = z.enum(['cover', 'contain'])

/**
 * Section-level background (REQ-14, DOC-13 §4): a color fill, an image, or a
 * CSS gradient, each with an optional overlay and text rendered on top. A
 * discriminated union on `type` so each variant carries exactly the fields it
 * needs — `color` requires `value`, `image` requires `asset`, `gradient`
 * requires `gradient` — and validation errors point at the offending field.
 */
export const backgroundSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('color'),
    value: hexColor,
    overlay: backgroundOverlaySchema.optional(),
  }),
  z.object({
    type: z.literal('image'),
    asset: assetRefSchema,
    fit: backgroundFitSchema.optional(),
    overlay: backgroundOverlaySchema.optional(),
  }),
  z.object({
    type: z.literal('gradient'),
    gradient: cssValue,
    overlay: backgroundOverlaySchema.optional(),
  }),
])

/** The four responsive breakpoints, by token name (REQ-15). */
export const breakpointNameSchema = z.enum(['sm', 'md', 'lg', 'xl'])

/**
 * A structured position for a layer child (REQ-15, DOC-7 §3.2 rule 1).
 *
 * Every field is a *number*, never raw CSS: `x`/`y` are percentage offsets of
 * the layer box (0 = left/top edge), `z` is stacking order, `width`/`height`
 * are percentages of the layer box, `rotate` is degrees. The framework — never
 * the instance — turns these into CSS custom properties. `breakpoints` carries
 * per-breakpoint overrides for any subset of the same fields. `.strict()` so a
 * raw `style`/`css` field smuggled onto a position is a validation error.
 */
const positionFields = {
  x: z.number(),
  y: z.number(),
  z: z.number().int(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  rotate: z.number().optional(),
}
export const positionOverrideSchema = z
  .object({
    x: positionFields.x.optional(),
    y: positionFields.y.optional(),
    z: positionFields.z.optional(),
    width: positionFields.width,
    height: positionFields.height,
    rotate: positionFields.rotate,
  })
  .strict()
/** Per-breakpoint overrides: any subset of the four breakpoints may be set. */
export const positionBreakpointsSchema = z
  .object({
    sm: positionOverrideSchema.optional(),
    md: positionOverrideSchema.optional(),
    lg: positionOverrideSchema.optional(),
    xl: positionOverrideSchema.optional(),
  })
  .strict()
export const positionSchema = z
  .object({
    ...positionFields,
    /** Per-breakpoint overrides, keyed by breakpoint token name. */
    breakpoints: positionBreakpointsSchema.optional(),
  })
  .strict()

/**
 * Image-child edge/shape treatments (REQ-15, DOC-15 design log §A/B). `shape`
 * clips the image (circle / rounded); `edge` feathers or tears it (`soft-mask`
 * = radial mask, `torn-asset` = a pre-torn PNG mask supplied as an asset). All
 * are enumerated, never raw CSS.
 */
export const imageTreatmentSchema = z
  .object({
    shape: z.enum(['none', 'circle', 'rounded']).optional(),
    edge: z.enum(['none', 'soft-mask', 'torn-asset']).optional(),
  })
  .strict()

/**
 * Structured motion (REQ-16, DOC-7 §6, sycamore.so analysis).
 *
 * A motion describes an animation as *structured params*, never raw CSS: `type`
 * is what animates (fade / slide / scale, or `stagger` to sequence a group's
 * children), `trigger` is when (`load` on render, `scroll` when the element
 * enters the viewport via the island, `hover` on pointer). `duration`/`delay`
 * are milliseconds; `easing` is a named curve from a finite set — a raw
 * `cubic-bezier(...)` string is not accepted, keeping the security /
 * reproducibility line of DOC-7 §6.2. The framework — never the instance —
 * turns these into CSS custom properties + classes. `.strict()` rejects any
 * smuggled raw-CSS field.
 */
export const motionTypeSchema = z.enum(['fade', 'slide', 'scale', 'stagger'])
export const motionTriggerSchema = z.enum(['load', 'scroll', 'hover'])
export const motionEasingSchema = z.enum([
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
])
export const motionSchema = z
  .object({
    type: motionTypeSchema,
    trigger: motionTriggerSchema,
    /** Animation length in milliseconds. Framework default when omitted. */
    duration: z.number().int().nonnegative().optional(),
    /** Named easing curve. Framework default when omitted. */
    easing: motionEasingSchema.optional(),
    /** Start delay in milliseconds. Framework default when omitted. */
    delay: z.number().int().nonnegative().optional(),
  })
  .strict()

/**
 * One freely-positioned child of a layer (REQ-15). A discriminated union on
 * `kind`: an `image` (with an optional treatment) or a `text` run (markdown).
 * Each carries its own structured `position` and an optional `motion`
 * (REQ-16). `.strict()` rejects raw CSS.
 */
export const layerChildSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('image'),
      asset: assetRefSchema,
      treatment: imageTreatmentSchema.optional(),
      position: positionSchema,
      motion: motionSchema.optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('text'),
      text: z.string(),
      position: positionSchema,
      motion: motionSchema.optional(),
    })
    .strict(),
])

/**
 * A layer: an ordered stack of freely-positioned children composited over the
 * host module's markup (REQ-15). `reflow` controls narrow-viewport behaviour —
 * `stack` (default) collapses absolute positioning to normal document flow
 * below `reflowBelow` (default `sm`); `none` keeps positioning at every width.
 * An optional `overlay` tints between the host content and the child stack,
 * reusing REQ-14's overlay shape. `.strict()` rejects raw CSS/HTML.
 */
export const layerReflowSchema = z.enum(['stack', 'none'])
export const layerSchema = z
  .object({
    children: z.array(layerChildSchema),
    reflow: layerReflowSchema.optional(),
    reflowBelow: breakpointNameSchema.optional(),
    overlay: backgroundOverlaySchema.optional(),
  })
  .strict()

/**
 * A single module instance within a page.
 *
 * `.strict()` (REQ-15): the only permitted keys are those declared below.
 * Structured layout (`background`, `layer`) is welcome; a raw `style`/`css`/
 * `html` prop is the security/reproducibility line (DOC-7 §6.2) and is rejected
 * with a path-pointed error so AI callers can self-correct (DOC-8 §6).
 */
export const moduleInstanceSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    version: z.number().int().positive(),
    variant: z.string(),
    dials: z.record(z.string(), z.string()),
    content: z.record(z.string(), contentValueSchema),
    /** Optional section-level background painted behind this module (REQ-14). */
    background: backgroundSchema.optional(),
    /** Optional layer of freely-positioned children composited over this module (REQ-15). */
    layer: layerSchema.optional(),
    /** Optional entrance / scroll-reveal / hover motion for this module (REQ-16). */
    motion: motionSchema.optional(),
  })
  .strict()

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

/**
 * Palette roles. `text` is the foreground role (replaced REQ-3's `fg`).
 * `secondary` (REQ-20) is an optional second functional accent — a hue distinct
 * from the brand `accent`, used where a site marks a second status/category
 * (e.g. gigabytealchemy's blue "coming soon" cards). Optional so existing 9-role
 * themes keep validating; the token defaults fill it when omitted.
 */
export const paletteTokensSchema = z.object({
  bg: hexColor,
  surface: hexColor,
  surfaceSubtle: hexColor,
  surfaceInverse: hexColor,
  text: hexColor,
  muted: hexColor,
  primary: hexColor,
  accent: hexColor,
  secondary: hexColor.optional(),
  // `neutralCool` (REQ-32) is an optional cool neutral (slate) distinct from the
  // often-warm `muted`, so a site can tint panels/borders cool independent of
  // its neutral text colour. Optional so existing themes keep validating; the
  // token defaults fill it when omitted.
  neutralCool: hexColor.optional(),
  border: hexColor,
})

/**
 * A site-declared web font (REQ-24). Structured — never raw `@font-face` CSS
 * (DOC-7 §6.2). The framework's CSS generator turns each entry into one
 * validated `@font-face` rule pointing at the mirrored asset. `src` is an
 * asset-relative path (e.g. "assets/cinzel.woff2"), the same shape
 * `AssetRef.src` uses; `weight`/`style`/`display` are optional descriptors.
 */
export const fontFaceSchema = z.object({
  family: z.string().min(1),
  src: z.string().min(1),
  weight: cssValue.optional(),
  style: z.enum(['normal', 'italic']).optional(),
  display: z.enum(['auto', 'block', 'swap', 'fallback', 'optional']).optional(),
})

/**
 * Typography: families, a 9-step size scale, 5 weights, 3 line-heights.
 *
 * `family.display` (REQ-24) is an optional third family slot for a bespoke
 * display/wordmark face (e.g. a gold Cinzel wordmark), distinct from the
 * `heading`/`body` families. Omitted → the CSS generator falls back to
 * `heading` for `--font-family-display`.
 */
export const typographyTokensSchema = z.object({
  family: z.object({
    heading: z.string(),
    body: z.string(),
    display: z.string().optional(),
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
  /** Site-declared web fonts (REQ-24). Optional — most sites use system fonts. */
  fonts: z.array(fontFaceSchema).optional(),
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
