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
  mountBehaviours,
  type ControlRow,
  type ControlSample,
  type FoldedForm,
  type FoldedFormField,
} from './forms'
// BUG-23 — bind media handles to the bundle's mirrored assets (never the origin).
export { localizeAssets, type LocalizedAssets } from './assets'
// End-to-end reproduction gate (REQ-86) — the acceptance probes + demand-driven
// flow promotion (structure recovery applied only where the pinned form fails).
export {
  evaluateLayout,
  evalScalarTrack,
  sampleFidelityProbe,
  offSampleProbe,
  contentRobustnessProbe,
  onSampleProbe,
  acceptanceGate,
  // BUG-143 — the surface→run backing the containment assertion is made against,
  // and the two sampling sets the envelope probes derive from the capture.
  deriveSurfaceBacking,
  envelopeHeights,
  offSampleWidths,
  promoteToFlow,
  // REQ-278 — the served-document choice, made once for `repro` and the gate.
  chooseRecovery,
  oracleBoxes,
  measuredTextHeights,
  type EvalBox,
  type EvalLeaf,
  type LayoutFinding,
  type LayoutResult,
  type EvaluateOptions,
  type SurfaceBacking,
  type OracleSource,
  type OracleBox,
  type SampleFidelityReport,
  type SampleFidelityOptions,
  type EnvelopeReport,
  type AcceptanceReport,
  type AcceptanceOptions,
  type PromoteResult,
  type RecoveryScore,
  type RecoveryVerdict,
  type RecoveryChoiceOptions,
  type MeasuredTextHeights,
} from './probes'
