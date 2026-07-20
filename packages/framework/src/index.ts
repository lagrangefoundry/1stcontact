/**
 * @1stcontact/framework
 *
 * The module catalog + theme-token system that renders every 1st Contact site
 * (DOC-7). Server-side render path: the module components are Astro components
 * compiled by the consuming build (`tools/generate`); this package exposes the
 * catalog registry, the theme-token defaults, and the theme-CSS generator.
 */
export { defaultTokens, generateThemeCss } from './tokens'
export type {
  ThemeTokens,
  PaletteTokens,
  TypographyTokens,
  SpacingTokens,
  RadiusTokens,
  ShadowTokens,
  ContainerTokens,
  BreakpointTokens,
  PartialPalette,
  DeepPartial,
} from './tokens'

export {
  registry,
  getModule,
  getModuleCss,
  SECTION_CSS,
  renderBackgroundLayers,
  wrapWithBackground,
  LAYER_CSS,
  renderLayer,
  wrapWithLayer,
  OVERLAY_BAND_CSS,
  composeOverlayHeader,
  ROW_CSS,
  composeRow,
  MOTION_CSS,
  MOTION_SCRIPT,
  motionClasses,
  motionVars,
  wrapWithMotion,
  isScrollMotion,
  headerMeta,
  heroMeta,
  footerMeta,
  textBlockMeta,
  servicesGridMeta,
  contactFormMeta,
  layerMeta,
  navHref,
  renderMarkdown,
  CALLOUT_CSS,
  resolveTextStyle,
  resolveColor,
  resolveSurfaceGradient,
  parseStyledText,
  serializeStyledText,
  normalizeRuns,
  normalizeStyledText,
  TEXT_STYLE_ALIASES,
  GRADIENT_DIRECTION_ALIASES,
  PALETTE_ROLE_ALIASES,
  isColorLiteral,
  isPaletteRole,
  validateModuleContent,
  ContentSafetyError,
  isUnsafeUrl,
  assertSafeUrl,
  assertSafeHtml,
} from './modules'
export type {
  ModuleMeta,
  ModuleDefinition,
  ContentFieldSpec,
  ContentFieldType,
  ContentValidationError,
  TextRun,
  TextRunGradient,
  GradientStop,
  StyledText,
  StyledRun,
  StyleOverride,
  Emphasis,
  HeadingLevel,
  Block,
  ParagraphBlock,
  HeadingBlock,
  CodeBlock,
  ListBlock,
  ListItem,
  BlockquoteBlock,
  TableBlock,
  TableCell,
} from './modules'

export { BUILD_YEAR } from './buildInfo'

// L1 layout substrate renderer (REQ-82) — the one safe emitter.
export { renderL1Document, renderL1Page } from './l1/render'
export type { L1RenderResult } from './l1/render'
