import { contentDigest } from '../../tools/generate/src/store/digest'
import type { LadderSource } from '../../tools/generate/src/publish/ladder'

/**
 * A {@link LadderSource} over pictures a test is holding ([[REQ-304]]).
 *
 * WHY THE SHAPE CHANGED. The ladder used to be handed every asset on the site
 * with its bytes attached, which meant the caller had already materialised the
 * whole site; it now takes the LISTING and a way to fetch one picture, so it can
 * hold one at a time. A publish supplies the draft's manifest and the store's
 * own read; a test supplies the bytes it just invented, and this is the two-line
 * adapter between them.
 *
 * THE DIGESTS ARE REAL, computed by the same function the stores use, because
 * the rendition name is derived from one — a fixture that invented them would be
 * asserting a path the product would never produce.
 */
export async function ladderSource(
  assets: readonly { name: string; bytes: Uint8Array }[],
): Promise<LadderSource> {
  const refs = await Promise.all(
    assets.map(async (a) => ({
      name: a.name,
      digest: await contentDigest(a.bytes),
      size: a.bytes.byteLength,
    })),
  )
  const held = new Map(assets.map((a) => [a.name, a.bytes]))
  return { assets: refs, read: (name) => Promise.resolve(held.get(name) ?? null) }
}
