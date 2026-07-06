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
