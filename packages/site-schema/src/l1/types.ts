/**
 * L1 substrate — TypeScript types, all inferred from the Zod schemas in
 * {@link module:schema} (Zod is the single source of truth; no hand-written
 * parallel types).
 */
import type { z } from 'zod'
import type {
  l1AxisSizingSchema,
  l1BlendModeSchema,
  l1BorderSchema,
  l1BoxSchema,
  l1ColumnAnchorSchema,
  l1ColumnTermSchema,
  l1ColumnSchema,
  l1ContainerSchema,
  l1ControlSchema,
  l1DistributionSchema,
  l1DocumentSchema,
  l1EasingSchema,
  l1FocusRingSchema,
  l1FilterSchema,
  l1FocusStateSchema,
  l1FontFaceSchema,
  l1HoverStateSchema,
  l1InteractionSchema,
  l1GeometrySchema,
  l1GradientExtentSchema,
  l1GradientOriginSchema,
  l1GradientSchema,
  l1GradientStopSchema,
  l1LinearGradientSchema,
  l1RadialGradientSchema,
  l1ImageAxesSchema,
  l1ImageSchema,
  l1KeyframeSchema,
  l1LayoutKeyframeSchema,
  l1LayoutModeSchema,
  l1MaskSchema,
  l1MotionSchema,
  l1NodeSchema,
  l1ObjectPositionSchema,
  l1OverlaySchema,
  l1PaddingResponsiveSchema,
  l1PaddingSchema,
  l1PatternSchema,
  l1PointerAccentSchema,
  l1ResourcesSchema,
  l1ResponsiveLayoutSchema,
  l1RevealSchema,
  l1ScalarKeyframeSchema,
  l1ScalarTrackSchema,
  l1SegmentSchema,
  l1ShadowSchema,
  l1SizingSchema,
  l1SlotSchema,
  l1SurfaceAxesSchema,
  l1TextAxesSchema,
  l1TextResponsiveSchema,
  l1TextSchema,
  l1TransformSchema,
  l1TransitionSchema,
  l1ViewportResponseSchema,
  l1VisibilitySchema,
} from './schema'

export type L1Keyframe = z.infer<typeof l1KeyframeSchema>
export type L1Segment = z.infer<typeof l1SegmentSchema>
export type L1Geometry = z.infer<typeof l1GeometrySchema>
// REQ-88 — viewport-relative extent: the `100vh` hero and the centred column.
export type L1ViewportResponse = z.infer<typeof l1ViewportResponseSchema>
export type L1Column = z.infer<typeof l1ColumnSchema>
export type L1ColumnAnchor = z.infer<typeof l1ColumnAnchorSchema>
export type L1ColumnTerm = z.infer<typeof l1ColumnTermSchema>
export type L1Sizing = z.infer<typeof l1SizingSchema>
export type L1AxisSizing = z.infer<typeof l1AxisSizingSchema>
export type L1Distribution = z.infer<typeof l1DistributionSchema>
// REQ-104 — the layout mode and its per-width track.
export type L1LayoutMode = z.infer<typeof l1LayoutModeSchema>
export type L1LayoutKeyframe = z.infer<typeof l1LayoutKeyframeSchema>
export type L1ResponsiveLayout = z.infer<typeof l1ResponsiveLayoutSchema>
export type L1Visibility = z.infer<typeof l1VisibilitySchema>
export type L1TextAxes = z.infer<typeof l1TextAxesSchema>
// BUG-18 responsive scalar-axis tracks.
export type L1ScalarKeyframe = z.infer<typeof l1ScalarKeyframeSchema>
export type L1ScalarTrack = z.infer<typeof l1ScalarTrackSchema>
export type L1TextResponsive = z.infer<typeof l1TextResponsiveSchema>
// REQ-98 — the one paint capability every box-rendering kind carries.
export type L1SurfaceAxes = z.infer<typeof l1SurfaceAxesSchema>
export type L1ImageAxes = z.infer<typeof l1ImageAxesSchema>

// REQ-91 shared structured axis forms.
export type L1GradientStop = z.infer<typeof l1GradientStopSchema>
export type L1Gradient = z.infer<typeof l1GradientSchema>
// REQ-103 — the two gradient branches, and the repeating-texture axis.
export type L1LinearGradient = z.infer<typeof l1LinearGradientSchema>
export type L1RadialGradient = z.infer<typeof l1RadialGradientSchema>
export type L1GradientOrigin = z.infer<typeof l1GradientOriginSchema>
export type L1GradientExtent = z.infer<typeof l1GradientExtentSchema>
export type L1Pattern = z.infer<typeof l1PatternSchema>
// REQ-108 — the pointer-reactive accent on whatever texture a node paints.
export type L1PointerAccent = z.infer<typeof l1PointerAccentSchema>
export type L1Shadow = z.infer<typeof l1ShadowSchema>
export type L1Border = z.infer<typeof l1BorderSchema>
export type L1Mask = z.infer<typeof l1MaskSchema>
// REQ-136 — the image-framing / colour-adjustment axes.
export type L1Filter = z.infer<typeof l1FilterSchema>
export type L1ObjectPosition = z.infer<typeof l1ObjectPositionSchema>
export type L1Transform = z.infer<typeof l1TransformSchema>
export type L1BlendMode = z.infer<typeof l1BlendModeSchema>
export type L1Overlay = z.infer<typeof l1OverlaySchema>
export type L1Padding = z.infer<typeof l1PaddingSchema>
export type L1PaddingResponsive = z.infer<typeof l1PaddingResponsiveSchema>

// REQ-99 — typed interaction state (hover / focus), the substrate's only
// vocabulary for a pseudo-class.
export type L1Easing = z.infer<typeof l1EasingSchema>
export type L1Transition = z.infer<typeof l1TransitionSchema>
// REQ-100 — the typed scroll-entrance axis (rise + fade, timed).
export type L1Reveal = z.infer<typeof l1RevealSchema>
export type L1Motion = z.infer<typeof l1MotionSchema>
export type L1FocusRing = z.infer<typeof l1FocusRingSchema>
export type L1HoverState = z.infer<typeof l1HoverStateSchema>
export type L1FocusState = z.infer<typeof l1FocusStateSchema>
export type L1Interaction = z.infer<typeof l1InteractionSchema>

export type L1Text = z.infer<typeof l1TextSchema>
export type L1Image = z.infer<typeof l1ImageSchema>
export type L1Slot = z.infer<typeof l1SlotSchema>
// REQ-96 — the control leaf: L1 wraps a module-declared element.
export type L1Control = z.infer<typeof l1ControlSchema>
export type L1Box = z.infer<typeof l1BoxSchema>
export type L1Container = z.infer<typeof l1ContainerSchema>
export type L1Node = z.infer<typeof l1NodeSchema>

// REQ-90 — document-level resource table (handle → substance).
export type L1FontFace = z.infer<typeof l1FontFaceSchema>
export type L1Resources = z.infer<typeof l1ResourcesSchema>

export type L1Document = z.infer<typeof l1DocumentSchema>
