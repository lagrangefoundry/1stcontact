/**
 * The rights gate on the seed/push door (BUG-84).
 *
 * THE RULE, IN ONE SENTENCE: **bytes this system mirrored from a captured page
 * may not enter a site's assets.**
 *
 * WHY THE DOOR NEEDS ITS OWN GATE. `promoteToSiteAsset` already refuses to put
 * a capture-sourced picture on a site — [[DOC-38]] §5 calls that "the most
 * damaging single action available in the system", because it publishes third
 * party copyright under the client's own domain — and it enforces that by
 * reading `republishable` off the material's own record. The seed/push door has
 * no record to read. `1c repro` mirrors a bundle's subresources straight into
 * `storage/sites/<slug>/draft/assets/`, and `1c push` copies whatever is in that
 * directory up; nothing along the way mints a ticket, so the gate has nothing to
 * consult and the bytes arrive ungated. That is how a third party's photograph
 * reached a site's assets with no rights record at all.
 *
 * IDENTITY IS THE SHA256 OF THE BYTES, AND IT HAS TO BE. The copy into the draft
 * directory destroys every other link back to the capture: the member arrives
 * under its own basename in a directory that records nothing about where it came
 * from. A path test has no path left to read and a name test is defeated by a
 * rename an operator can perform in one keystroke. The content hash is the only
 * evidence the copy cannot erase — which is also why this is a *stronger* test
 * than the one promotion applies, not a weaker stand-in for it.
 *
 * THE GATE COVERS `ASSETS_PREFIX`, NOT THE WHOLE BUNDLE, and that is a
 * deliberate line rather than an oversight. Every subresource the capture
 * pipeline mirrored lives under that prefix, and mirrored subresources are
 * exactly what gets copied into a draft. The bundle's other members — the
 * retained oracle, the screenshot ladder, `rendered.html` — are never copied
 * into a draft. On R2 the hashes of those members are recorded when they are
 * written, so the import route never reads a bundle at all.
 *
 * EVERY MIRRORED SUBRESOURCE, NOT ONLY PICTURES. A third party's stylesheet or
 * licensed webfont republished on a client's domain is the same act as their
 * photograph, and a per-type carve-out is one more thing to get wrong at a door
 * whose whole problem was that it made no decision at all.
 *
 * NO OVERRIDE. `NotRepublishableError` has none either, for the same reason: an
 * escape hatch on a rights gate is the gate not existing. `--force` stays what
 * BUG-51 made it — the operator saying they meant to replace builder changes —
 * and does not reach this.
 *
 * IT TAKES THE PORT, SO ONE PREDICATE SERVES BOTH HOSTS. `1c push` checks
 * against the operator's `storage/references/` tree through the filesystem
 * adapter; `POST /api/import` checks against the tenant's R2 bundles through the
 * R2 adapter. Neither half is sufficient alone — a capture taken on a laptop is
 * not in R2, and a request posted by hand never runs the CLI — so the rule is
 * enforced at both and written once.
 */

import { sha256Hex, type MirroredMember, type ReferenceStore } from './reference-store'

/**
 * Raised when an asset's bytes are ones we mirrored from a captured page.
 *
 * ITS OWN CLASS, for the reason {@link NotRepublishableError} has one: this is
 * not a malformed request and not a server failure, it is a rule. A caller can
 * answer it with the status a refusal deserves rather than the one a bad
 * payload deserves, and the two shapes of "no" stay distinguishable to whoever
 * reads the log.
 *
 * IT NAMES BOTH ENDS. Told only that a push was refused, an operator has a
 * directory of files and no idea which one is the problem; told the asset AND
 * the bundle member it mirrors, they know the file and where it came from in
 * one line.
 */
export class MirroredAssetError extends Error {
  readonly name = 'MirroredAssetError'
  constructor(
    /** The asset name as the site would have held it. */
    readonly asset: string,
    /** The capture bundle holding the identical bytes. */
    readonly bundle: string,
    /** That bundle's member key — e.g. `assets/hero.jpg`. */
    readonly member: string,
  ) {
    super(
      `'${asset}' is byte-for-byte a subresource we mirrored from a captured ` +
        `page (${bundle}/${member}), so it cannot go on a site: we do not hold ` +
        `the right to republish it. Captures are reference material to work ` +
        `from — use the client's own file in its place.`,
    )
  }
}

export { sha256Hex }

/**
 * Refuse any of `assets` whose bytes this store already holds as a mirrored
 * subresource of a capture.
 *
 * ONLY THE INCOMING SIDE IS HASHED. The assets are already in memory; the
 * store's side is answered by {@link ReferenceStore.findMirrored}, which on R2
 * is one keyed lookup per incoming hash against an index written when each
 * member was captured. So the cost is bounded by the request — the push's own
 * assets — and never by how many captures the business has accumulated: no
 * bundle is listed, no member is read, nothing of theirs is hashed
 * (Architecture Policy #2, #31, #35). A push carrying nothing returns without
 * touching the store at all.
 *
 * THE FIRST OFFENDER, IN THE PUSH'S OWN ORDER, is the one named. One refused
 * asset is enough to refuse the push, and naming them in the order the operator
 * sent them keeps the refusal deterministic whatever order the store answers in.
 */
export async function assertNotCaptureMirrored(
  assets: readonly { name: string; bytes: Uint8Array }[],
  references: ReferenceStore,
): Promise<void> {
  if (assets.length === 0) return

  const incoming: { name: string; sha256: string }[] = []
  for (const asset of assets) incoming.push({ name: asset.name, sha256: await sha256Hex(asset.bytes) })

  const held = new Map<string, MirroredMember>()
  for (const found of await references.findMirrored(incoming.map((a) => a.sha256))) {
    held.set(found.sha256, found)
  }
  for (const asset of incoming) {
    const match = held.get(asset.sha256)
    if (match) throw new MirroredAssetError(asset.name, match.bundle, match.member)
  }
}
