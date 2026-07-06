export { registry, getModule } from './registry'
export { getModuleCss } from './styles'
export { SECTION_CSS, renderBackgroundLayers, wrapWithBackground } from './background'
export { LAYER_CSS, renderLayer, wrapWithLayer } from './layer'
export { OVERLAY_BAND_CSS, composeOverlayHeader } from './overlay'
export { ROW_CSS, composeRow } from './row'
export {
  MOTION_CSS,
  MOTION_SCRIPT,
  motionClasses,
  motionVars,
  wrapWithMotion,
  isScrollMotion,
} from './motion'
export { headerMeta } from './header/meta'
export { heroMeta } from './hero/meta'
export { footerMeta } from './footer/meta'
export { textBlockMeta } from './text-block/meta'
export { servicesGridMeta } from './services-grid/meta'
export { contactFormMeta } from './contact-form/meta'
export { layerMeta } from './layer/meta'
export { navHref } from './nav'
export { renderMarkdown, CALLOUT_CSS } from './markdown'
export { gradientImage, gradientTextStyle } from './gradient'
export type { GradientTreatment, GradientStop } from './gradient'
export { validateModuleContent } from './validate'
export type { ContentValidationError } from './validate'
export { ContentSafetyError, isUnsafeUrl, assertSafeUrl, assertSafeHtml } from './safety'
export { SPACING_DIAL, SURFACE_DIAL, SIZE_DIAL, ALIGN_DIAL, GAP_DIAL } from './dials'
export type {
  ModuleMeta,
  ModuleDefinition,
  ContentFieldSpec,
  ContentFieldType,
} from './types'
