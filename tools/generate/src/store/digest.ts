/**
 * Content identity for stored bytes ([[REQ-304]]).
 *
 * WHY IT IS ITS OWN MODULE. Three adapters, the revision arithmetic and the
 * publish sequence all have to agree on exactly what "these are the same bytes"
 * means, and they do not share a runtime — one reaches `node:fs`, one reaches
 * D1 and R2, one reaches a `Map`. A digest computed two ways is two answers, and
 * the whole of this ticket rests on there being one.
 *
 * WHAT IT REPLACES. `byteKey` turned a picture into a JavaScript string one
 * character per byte, so that two of them could be compared with `===`. That is
 * the same question this answers, asked of a fixed 64 characters instead of
 * fifty million — which is the difference between a publish that fits in a
 * 128 MB isolate and one that does not.
 *
 * `crypto.subtle` RATHER THAN `node:crypto`, because this runs in workerd as
 * often as it runs in Node, and a store that hashed differently depending on
 * where it was mounted would make a revision's digest a property of the host.
 */

/**
 * How many hex characters a content digest is.
 *
 * THE WHOLE OF SHA-256. A digest is an R2 KEY here, not a display string: two
 * assets that collided would be one asset, and one client's photograph would be
 * served where another's belongs. Truncation buys a shorter key listing and
 * spends the one property the address has to have.
 */
export const CONTENT_DIGEST_LENGTH = 64

/** Whether a string could be a content digest — lowercase hex, full length. */
export function isContentDigest(value: unknown): value is string {
  return typeof value === 'string' && new RegExp(`^[0-9a-f]{${CONTENT_DIGEST_LENGTH}}$`).test(value)
}

/**
 * The SHA-256 of some bytes, as lowercase hex.
 *
 * `bytes.slice()` AND NOT `bytes.buffer`. A `Uint8Array` may be a VIEW onto a
 * larger buffer — which is exactly what `new Uint8Array(await object.arrayBuffer())`
 * can hand back — and hashing the whole buffer would give a digest for bytes
 * this asset does not contain. Identical content would then hash differently
 * depending on how it was read, which defeats the entire point of a content
 * address. `ladder.ts` learned this first; it is the same rule.
 */
export async function contentDigest(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes.slice())
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
