/**
 * REQ-39 — the shared module-conformance harness ([[DOC-20]]). Public surface:
 * `assertModuleConforms` (the one call every thin leaf makes) plus the types and
 * the below-the-line `serveOneModulePage` helper the harness self-tests use.
 */
export { assertModuleConforms, serveOneModulePage, ConformanceError } from './harness'
export type { OneModuleServe } from './harness'
export { evaluateSafety, SAFETY_PROBE } from './checks'
export type { SafetyProbe } from './checks'
export { evaluateSecurity, SECURITY_PROBE, XSS_SENTINEL } from './checks'
export type { SecurityProbe } from './checks'
export {
  evaluateResponsive,
  RESPONSIVE_PROBE,
  MOBILE_BAND_MAX_PX,
  MIN_TAP_TARGET_PX,
  MOBILE_FONT_FLOOR_PX,
} from './checks'
export type { ResponsiveProbe } from './checks'
export {
  evaluateXBrowser,
  evaluateXBrowserBackstop,
  X_BROWSER_BOX_PROBE,
  X_BROWSER_TOLERANCE,
  X_BROWSER_BACKSTOP_THRESHOLD,
} from './checks'
export type { XBrowserProbe, XBrowserBox, XBrowserTolerance } from './checks'
export {
  buildInjectionContent,
  buildBenignContent,
  buildSecurityFixtures,
} from './payloads'
export type {
  ConformanceFixture,
  ConformanceOptions,
  ConformanceViolation,
  ConformanceDimension,
  ConformanceTier,
  ConformanceEngine,
} from './types'
