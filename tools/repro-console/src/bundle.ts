/**
 * What a capture bundle says about ITSELF ([[REQ-272]] part 2, item 3).
 *
 * A leaf on purpose: it imports nothing of the console's, because everything
 * that needs it is upstream of everything else — the iteration records it, the
 * digest reports it, the console hands it to the round. A copy in any of those
 * three would be a second reader of `capture.json`'s field names, and the field
 * names are exactly what changes when the capture grows a new stamp.
 *
 * Both fields are OPTIONAL and always will be: a bundle written before either
 * stamp existed still parses, and reads as "no capture time" / "schema 1". The
 * ABSENCE is itself a finding a round can state, which is why it is reported
 * rather than defaulted away — "this reference cannot say how old it is" is a
 * defect in the instrument, and a round that cannot see it cannot file it.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

/** When a reference was taken, and by which extractor. */
export interface BundleProvenance {
  /** ISO timestamp — when the bytes this reference is made of were taken. */
  capturedAt?: string
  /** [[REQ-270]]'s extractor stamp — which axes the code writing it knew about. */
  captureSchema?: number
}

/** The provenance of an already-parsed `capture.json`. The one reader of its field names. */
export function provenanceOf(capture: unknown): BundleProvenance {
  const doc = (capture ?? {}) as { capturedAt?: unknown; captureSchema?: unknown }
  return {
    ...(typeof doc.capturedAt === 'string' && doc.capturedAt ? { capturedAt: doc.capturedAt } : {}),
    ...(typeof doc.captureSchema === 'number' ? { captureSchema: doc.captureSchema } : {}),
  }
}

/**
 * The provenance of the bundle at `bundleDir`, or nothing.
 *
 * READ FROM THE BUNDLE, NOT REMEMBERED. `1c capture page` already stamps both
 * fields, and a bundle name is URL-derived and overwriting — re-capturing a site
 * replaces it in place — so the only thing that can say WHICH reference an
 * iteration measured against is the bundle's own `capturedAt`, read at the
 * moment the iteration ran and recorded in its manifest.
 */
export function readBundleProvenance(bundleDir: string): BundleProvenance {
  const file = path.join(bundleDir, 'capture.json')
  if (!existsSync(file)) return {}
  try {
    return provenanceOf(JSON.parse(readFileSync(file, 'utf8')))
  } catch {
    return {}
  }
}
