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
export {
  foldToL1,
  classifyElement,
  isSynthesizedSurfaceId,
  SYNTHESIZED_SURFACE_ID_PREFIXES,
  type FoldOptions,
  type FoldResidual,
  type FoldableElement,
  type FoldLeafKind,
} from './fold'
// REQ-93 — captured form controls → behavior-module bindings mounted at L1 slots.
export {
  clusterControls,
  foldedFormFor,
  type ControlRow,
  type ControlSample,
  type FoldedForm,
  type FoldedFormField,
} from './forms'
// BUG-23 — bind media handles to the bundle's mirrored assets (never the origin).
export { localizeAssets, type LocalizedAssets } from './assets'
// End-to-end reproduction gate (REQ-86) — the 3-probe acceptance + demand-driven
// flow promotion (structure recovery applied only where the pinned form fails).
export {
  evaluateLayout,
  evalScalarTrack,
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
