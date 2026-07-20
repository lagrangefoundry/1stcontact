/**
 * L1 substrate — TypeScript types, all inferred from the Zod schemas in
 * {@link module:schema} (Zod is the single source of truth; no hand-written
 * parallel types).
 */
import type { z } from 'zod'
import type {
  l1AxisSizingSchema,
  l1BoxAxesSchema,
  l1BoxSchema,
  l1ContainerSchema,
  l1DistributionSchema,
  l1DocumentSchema,
  l1GeometrySchema,
  l1ImageAxesSchema,
  l1ImageSchema,
  l1KeyframeSchema,
  l1NodeSchema,
  l1SegmentSchema,
  l1SizingSchema,
  l1SlotSchema,
  l1TextAxesSchema,
  l1TextSchema,
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
export type L1BoxAxes = z.infer<typeof l1BoxAxesSchema>
export type L1ImageAxes = z.infer<typeof l1ImageAxesSchema>

export type L1Text = z.infer<typeof l1TextSchema>
export type L1Image = z.infer<typeof l1ImageSchema>
export type L1Slot = z.infer<typeof l1SlotSchema>
export type L1Box = z.infer<typeof l1BoxSchema>
export type L1Container = z.infer<typeof l1ContainerSchema>
export type L1Node = z.infer<typeof l1NodeSchema>
export type L1Document = z.infer<typeof l1DocumentSchema>
