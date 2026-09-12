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
 * THE SCAN IS `ASSETS_PREFIX`, NOT THE WHOLE BUNDLE, and that is a deliberate
 * line rather than an oversight. Every subresource the capture pipeline mirrored
 * lives under that prefix, and mirrored subresources are exactly what gets
 * copied into a draft. The bundle's other members — the retained oracle, the
 * screenshot ladder, `rendered.html` — run to tens of megabytes between them,
 * nothing copies them into a draft, and reading them on every import would put a
 * Worker's CPU and memory limits between the operator and their push.
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

import { ASSETS_PREFIX, type ReferenceStore } from './reference-store'

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

/** The sha256 of `bytes`, lowercase hex. WebCrypto, so it runs on both hosts. */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Refuse any of `assets` whose bytes this store already holds as a mirrored
 * subresource of a capture.
 *
 * THE INCOMING SIDE IS HASHED FIRST AND THE BUNDLES ARE WALKED SECOND, which is
 * the cheap direction: the assets are already in memory, and a bundle member has
 * to be fetched before it can be hashed. So a push carrying nothing returns
 * without touching the store at all, and a tenant holding no captures costs one
 * empty listing.
 *
 * IT THROWS ON THE FIRST MATCH rather than collecting every offender. One
 * refused asset is enough to refuse the push, the operator has to deal with the
 * capture-derived draft as a whole either way, and stopping early is what keeps
 * the worst case bounded by the first offending member rather than by the size
 * of the reference store.
 */
export async function assertNotCaptureMirrored(
  assets: readonly { name: string; bytes: Uint8Array }[],
  references: ReferenceStore,
): Promise<void> {
  if (assets.length === 0) return

  const incoming = new Map<string, string>()
  for (const asset of assets) incoming.set(await sha256Hex(asset.bytes), asset.name)

  for (const name of await references.list()) {
    const bundle = references.bundle(name)
    for (const member of await bundle.list(ASSETS_PREFIX)) {
      const bytes = await bundle.read(member)
      // A member that lists but will not read is a bundle changing underneath
      // us. It is not evidence of anything, so it is skipped rather than treated
      // as a match — this gate refuses on what it can prove, never on a guess.
      if (!bytes) continue
      const asset = incoming.get(await sha256Hex(bytes))
      if (asset !== undefined) throw new MirroredAssetError(asset, name, member)
    }
  }
}
