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
  l1BoxAxesSchema,
  l1BoxSchema,
  l1ContainerSchema,
  l1DistributionSchema,
  l1DocumentSchema,
  l1FontFaceSchema,
  l1GeometrySchema,
  l1GradientSchema,
  l1GradientStopSchema,
  l1ImageAxesSchema,
  l1ImageSchema,
  l1KeyframeSchema,
  l1MaskSchema,
  l1NodeSchema,
  l1OverlaySchema,
  l1PaddingSchema,
  l1ResourcesSchema,
  l1ScalarKeyframeSchema,
  l1ScalarTrackSchema,
  l1SegmentSchema,
  l1ShadowSchema,
  l1SizingSchema,
  l1SlotSchema,
  l1TextAxesSchema,
  l1TextResponsiveSchema,
  l1TextSchema,
  l1TransformSchema,
  l1VisibilitySchema,
} from './schema'

export type L1Keyframe = z.infer<typeof l1KeyframeSchema>
export type L1Segment = z.infer<typeof l1SegmentSchema>
export type L1Geometry = z.infer<typeof l1GeometrySchema>
export type L1Sizing = z.infer<typeof l1SizingSchema>
export type L1AxisSizing = z.infer<typeof l1AxisSizingSchema>
export type L1Distribution = z.infer<typeof l1DistributionSchema>
export type L1Visibility = z.infer<typeof l1VisibilitySchema>
export type L1TextAxes = z.infer<typeof l1TextAxesSchema>
// BUG-18 responsive scalar-axis tracks.
export type L1ScalarKeyframe = z.infer<typeof l1ScalarKeyframeSchema>
export type L1ScalarTrack = z.infer<typeof l1ScalarTrackSchema>
export type L1TextResponsive = z.infer<typeof l1TextResponsiveSchema>
export type L1BoxAxes = z.infer<typeof l1BoxAxesSchema>
export type L1ImageAxes = z.infer<typeof l1ImageAxesSchema>

// REQ-91 shared structured axis forms.
export type L1GradientStop = z.infer<typeof l1GradientStopSchema>
export type L1Gradient = z.infer<typeof l1GradientSchema>
export type L1Shadow = z.infer<typeof l1ShadowSchema>
export type L1Border = z.infer<typeof l1BorderSchema>
export type L1Mask = z.infer<typeof l1MaskSchema>
export type L1Transform = z.infer<typeof l1TransformSchema>
export type L1BlendMode = z.infer<typeof l1BlendModeSchema>
export type L1Overlay = z.infer<typeof l1OverlaySchema>
export type L1Padding = z.infer<typeof l1PaddingSchema>

export type L1Text = z.infer<typeof l1TextSchema>
export type L1Image = z.infer<typeof l1ImageSchema>
export type L1Slot = z.infer<typeof l1SlotSchema>
export type L1Box = z.infer<typeof l1BoxSchema>
export type L1Container = z.infer<typeof l1ContainerSchema>
export type L1Node = z.infer<typeof l1NodeSchema>

// REQ-90 — document-level resource table (handle → substance).
export type L1FontFace = z.infer<typeof l1FontFaceSchema>
export type L1Resources = z.infer<typeof l1ResourcesSchema>

export type L1Document = z.infer<typeof l1DocumentSchema>
