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
  latestModuleVersion,
  getModuleCss,
  getModuleClientJs,
  contactFormMeta,
  carouselMeta,
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
  validateBehaviorConfig,
  validateBehaviorSlots,
  validateBehaviorControls,
  validateBehaviorInstance,
  resolveControlNames,
  contactFormControls,
  controlId,
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
  BehaviorMeta,
  BehaviorConfigSpec,
  BehaviorConfigType,
  BehaviorControlSpec,
  ContactFormField,
  BehaviorSlotSpec,
  BehaviorSlotValue,
  BehaviorInstance,
  BehaviorDefinition,
  BehaviorConformance,
  ConformanceObligation,
  BehaviorValidationError,
  AssertBehaviorMeta,
} from './modules'

export { BUILD_YEAR } from './buildInfo'

// L1 layout substrate renderer (REQ-82) — the one safe emitter.
export { renderL1Document, renderL1Page, renderL1Fragment, L1_REVEAL_SCRIPT } from './l1/render'
export type {
  L1RenderResult,
  L1FragmentResult,
  L1RenderOptions,
  L1ControlElement,
  L1ControlTag,
} from './l1/render'

// L2 — the optional library of vetted L1 designs (REQ-96): a default look a site
// can drop into a behavior's slot when it has no capture to transcribe.
export { contactFormPreset } from './l2/contact-form'
export type { ContactFormPresetField, ContactFormPresetOptions } from './l2/contact-form'
