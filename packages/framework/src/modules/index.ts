export { registry, getModule } from './registry'
export { getModuleCss, getModuleClientJs } from './styles'
export { contactFormMeta } from './contact-form/meta'
export { carouselMeta } from './carousel/meta'
export { renderMarkdown, CALLOUT_CSS } from './markdown'
export {
  resolveTextStyle,
  resolveColor,
  resolveSurfaceGradient,
  TEXT_STYLE_ALIASES,
  GRADIENT_DIRECTION_ALIASES,
  PALETTE_ROLE_ALIASES,
  isColorLiteral,
  isPaletteRole,
} from './text-style'
export type { TextRun, TextRunGradient, GradientStop } from './text-style'
export {
  parseStyledText,
  serializeStyledText,
  normalizeRuns,
  normalizeStyledText,
} from './text-markup'
export type {
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
} from './text-markup'
export { validateModuleContent } from './validate'
export type { ContentValidationError } from './validate'
export { ContentSafetyError, isUnsafeUrl, assertSafeUrl, assertSafeHtml } from './safety'
export { SPACING_DIAL, SURFACE_DIAL, ALIGN_DIAL, GAP_DIAL } from './dials'
export type {
  ModuleMeta,
  ModuleDefinition,
  ContentFieldSpec,
  ContentFieldType,
} from './types'
export {
  validateCapabilityConfig,
  validateCapabilitySlots,
  validateCapabilityInstance,
} from './capability'
export type {
  CapabilityMeta,
  CapabilityConfigSpec,
  CapabilityConfigType,
  CapabilitySlotSpec,
  CapabilitySlotValue,
  CapabilityInstance,
  CapabilityDefinition,
  CapabilityConformance,
  ConformanceObligation,
  CapabilityValidationError,
  AssertCapabilityMeta,
} from './capability'
