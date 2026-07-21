/**
 * L1 round-trip gate (REQ-82) — render an L1 document, serve it, capture it
 * across the browser matrix, and diff against the projected-from-L1 expectation.
 */
export {
  serveL1,
  captureL1,
  expectedTextManifest,
  roundTripReport,
  type L1Serve,
  type L1CaptureOptions,
} from './roundtrip'
// Capture → L1 fold (REQ-83) — the multi-viewport ladder folded into one document.
export { foldToL1, type FoldOptions } from './fold'
// End-to-end reproduction gate (REQ-86) — the 3-probe acceptance + demand-driven
// flow promotion (structure recovery applied only where the pinned form fails).
export {
  evaluateLayout,
  sampleFidelityProbe,
  offSampleProbe,
  contentRobustnessProbe,
  threeProbeGate,
  promoteToFlow,
  oracleBoxes,
  type EvalBox,
  type EvalLeaf,
  type LayoutFinding,
  type LayoutResult,
  type EvaluateOptions,
  type OracleSource,
  type OracleBox,
  type SampleFidelityReport,
  type SampleFidelityOptions,
  type EnvelopeReport,
  type ThreeProbeReport,
  type ThreeProbeOptions,
  type PromoteResult,
} from './probes'
