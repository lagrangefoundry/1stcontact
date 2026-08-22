/**
 * @1stcontact/framework
 *
 * The module catalog + theme-token system that renders every 1st Contact site
 * (DOC-7). Server-side render path: a behavior module is a plain TypeScript
 * function of its props (REQ-148), so it renders in Node and in workerd through
 * the same code; this package exposes the catalog registry, the theme-token
 * defaults, and the theme-CSS generator.
 */
export { defaultTokens, generateThemeCss } from './tokens'
export type {
  ThemeTokens,
  TypographyTokens,
  SpacingTokens,
  RadiusTokens,
  ShadowTokens,
  ContainerTokens,
  BreakpointTokens,
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
  isColorLiteral,
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
  BehaviorComponent,
  BehaviorProps,
  BehaviorConformance,
  ConformanceObligation,
  BehaviorValidationError,
  AssertBehaviorMeta,
} from './modules'

export { BUILD_YEAR } from './buildInfo'

// REQ-152 — the one place money and time become text. Exists ahead of the
// payments and calendar modules so neither invents its own answer: money is
// `{amountMinor, currency}` formatted by ICU (minor units are not always two),
// and time is a UTC instant plus an IANA zone id, never a wall-clock string or
// a fixed offset. `intl.ts` also carries the render-determinism rule (DOC-34
// §8.4) that `buildInfo.ts` points at.
export { formatMoney, formatDateTime } from './intl'

// L1 layout substrate renderer (REQ-82) — the one safe emitter.
export {
  renderL1Document,
  renderL1Page,
  renderL1Fragment,
  L1_REVEAL_SCRIPT,
  L1_POINTER_SCRIPT,
  // REQ-116 — the edit channel's vocabulary: the two stamped attributes, the
  // document-level marker, and the channel's own stylesheet.
  L1_EDIT_PATH_ATTR,
  L1_EDIT_SEGMENT_ATTR,
  L1_EDIT_MARKER_ATTR,
  // REQ-117 — the page half of an address, so a click resolves to a definition
  // node without the client re-deriving the renderer's home-page rule.
  L1_EDIT_PAGE_ATTR,
  L1_EDIT_HOT_CLASS,
  L1_EDIT_CSS,
  // REQ-140 — the paint test the segment rule itself uses, so the text modal's
  // escalation finds the same panel the renderer stamped.
  l1PaintsSurface,
} from './l1/render'
export type {
  L1RenderResult,
  L1FragmentResult,
  L1RenderOptions,
  L1ControlElement,
  L1ControlTag,
  L1SegmentKind,
} from './l1/render'
// REQ-117 — the edit bridge's client half: a clicked element back to the address
// the emitter above stamped on it. Beside the emitter so the two cannot drift.
export { resolveEditTarget, mountL1EditBridge } from './l1/edit-client'
export type { L1EditHit, L1EditBridge } from './l1/edit-client'

// L2 — the optional library of vetted L1 designs (REQ-96): a default look a site
// can drop into a behavior's slot when it has no capture to transcribe.
export { contactFormPreset } from './l2/contact-form'
export type { ContactFormPresetField, ContactFormPresetOptions } from './l2/contact-form'
// REQ-130 — the same library, asked by behavior id, so a caller creating an
// instance never has to know which module happens to have a preset.
export { presetSlots, hasSlotPreset } from './l2/presets'
export type { SlotPresetBuilder } from './l2/presets'
