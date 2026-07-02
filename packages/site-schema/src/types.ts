import type { z } from 'zod'
import type {
  assetRefSchema,
  backgroundFitSchema,
  backgroundOverlaySchema,
  backgroundSchema,
  breakpointTokensSchema,
  containerTokensSchema,
  contentValueSchema,
  moduleInstanceSchema,
  navConfigSchema,
  navEntrySchema,
  navPatternSchema,
  navTargetSchema,
  pageSchema,
  paletteTokensSchema,
  radiusTokensSchema,
  seoMetaSchema,
  shadowTokensSchema,
  siteConfigSchema,
  siteSchema,
  spacingTokensSchema,
  themeTokensSchema,
  typographyTokensSchema,
} from './schema'

/**
 * Public TypeScript types for site definitions.
 *
 * Every type is derived from its Zod schema via `z.infer` — the schemas in
 * `schema.ts` are the single source of truth. Do not hand-maintain a parallel
 * type here; change the schema and the type follows.
 */

export type Site = z.infer<typeof siteSchema>
export type SiteConfig = z.infer<typeof siteConfigSchema>
export type ThemeTokens = z.infer<typeof themeTokensSchema>
export type PaletteTokens = z.infer<typeof paletteTokensSchema>
export type TypographyTokens = z.infer<typeof typographyTokensSchema>
export type SpacingTokens = z.infer<typeof spacingTokensSchema>
export type RadiusTokens = z.infer<typeof radiusTokensSchema>
export type ShadowTokens = z.infer<typeof shadowTokensSchema>
export type ContainerTokens = z.infer<typeof containerTokensSchema>
export type BreakpointTokens = z.infer<typeof breakpointTokensSchema>
export type NavConfig = z.infer<typeof navConfigSchema>
export type NavPattern = z.infer<typeof navPatternSchema>
export type NavEntry = z.infer<typeof navEntrySchema>
export type NavTarget = z.infer<typeof navTargetSchema>
export type Page = z.infer<typeof pageSchema>
export type ModuleInstance = z.infer<typeof moduleInstanceSchema>
export type ModuleContent = ModuleInstance['content']
export type Dials = ModuleInstance['dials']
export type ContentValue = z.infer<typeof contentValueSchema>
export type AssetRef = z.infer<typeof assetRefSchema>
export type Background = z.infer<typeof backgroundSchema>
export type BackgroundOverlay = z.infer<typeof backgroundOverlaySchema>
export type BackgroundFit = z.infer<typeof backgroundFitSchema>
export type SeoMeta = z.infer<typeof seoMetaSchema>

/**
 * Compile-time brands for the string-shaped content kinds DOC-7 distinguishes.
 * At runtime these are plain strings (the schema validates them as such); the
 * brands let consumers annotate intent without changing the validated shape.
 */
export type MarkdownString = string & { readonly __brand: 'markdown' }
export type UrlString = string & { readonly __brand: 'url' }
export type EnumValue = string & { readonly __brand: 'enum' }
