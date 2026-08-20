export { registry, getModule, latestModuleVersion } from './registry'
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
  isColorLiteral,
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
  validateBehaviorConfig,
  validateBehaviorSlots,
  validateBehaviorControls,
  validateBehaviorInstance,
  resolveControlNames,
} from './behavior'
// REQ-96 — `contact-form`'s attribute bundles (the module's half of the control
// contract), exported so the repro pipeline and tests can resolve the same roster.
export { contactFormControls, controlId } from './contact-form/controls'
export type { ContactFormField } from './contact-form/controls'
export type {
  BehaviorMeta,
  BehaviorConfigSpec,
  BehaviorConfigType,
  BehaviorControlSpec,
  BehaviorSlotSpec,
  BehaviorSlotValue,
  BehaviorInstance,
  BehaviorDefinition,
  BehaviorComponent,
  BehaviorProps,
  BehaviorConformance,
  ConformanceObligation,
  BehaviorValidationError,
  AssertBehaviorMeta,
} from './behavior'
