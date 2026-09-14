/**
 * What a site asset may be called ([[REQ-246]]).
 *
 * THE FAILURE THIS EXISTS FOR. Nothing sanitised a filename anywhere on the path
 * from a file dropped on the conversation to an object in R2: the client's own
 * name became the site asset name and the asset name became the key suffix, so
 * `How_Can_You_Trust_the_Code_Your_AI_Writes?.pdf` is a real key with a literal
 * `?` in it. A name carrying `?`, `#`, `%` or a space is equal to the name a page
 * references only if every reader between them encodes and decodes it
 * identically, and a name is not a place to find that out.
 *
 * TWO RULES, AND THEY ARE NOT THE SAME RULE.
 *
 *   {@link sanitizeAssetName} is what a name arriving from OUTSIDE is put
 *   through before it becomes a name. It is total: every input yields a usable
 *   name, because refusing a client's file over its filename is not a thing this
 *   product should do.
 *
 *   {@link isUnsafeAssetName} is the hard floor the STORE enforces on every
 *   write, sanitised or not. It refuses only what cannot be a single key segment
 *   at all — a separator or a traversal — and it is deliberately narrower than
 *   the sanitiser, because assets already stored under awkward-but-harmless
 *   names have to go on resolving, and go on being published, until somebody
 *   renames them.
 *
 * SANITISING IS NOT DEDUPLICATING. Two different files whose names sanitise to
 * the same string are two files; minting a free name for the second is
 * `freeAssetName`'s job, which is why it runs the sanitiser first — so the
 * collision it decides about is the real one.
 */

/**
 * Characters a name may keep.
 *
 * The unreserved set of RFC 3986 less `~`: every one of these survives being a
 * URL path segment, an R2 key and a filename with no encoding, so the name a
 * page references and the name the bytes are stored under are byte-identical.
 */
const UNSAFE_RUN = /[^A-Za-z0-9._-]+/g

/** The name given to something whose own name sanitises to nothing at all. */
const FALLBACK_STEM = 'file'

/** One component of a name — the stem or the extension — made safe. */
function collapse(part: string): string {
  return part
    .replace(UNSAFE_RUN, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
}

/**
 * A name restricted to characters that need no encoding anywhere.
 *
 * THE EXTENSION IS PRESERVED, because it is what every consumer reads the type
 * from — `contentTypeOf`, the picker's icon, an operator's eye. A stem that
 * sanitises to nothing becomes {@link FALLBACK_STEM} rather than the empty
 * string, so the result is always a name somebody can type.
 *
 * ANY LEADING PATH IS DROPPED, not rejected. A browser's file input can hand
 * over a relative path on a directory upload, and the last segment is the only
 * part of it that was ever a filename.
 *
 * IDEMPOTENT BY CONSTRUCTION, which is what lets it be applied at more than one
 * point on a path without the second application meaning anything.
 */
export function sanitizeAssetName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? ''
  const dot = base.lastIndexOf('.')
  const stem = collapse(dot > 0 ? base.slice(0, dot) : base) || FALLBACK_STEM
  const ext = dot > 0 ? collapse(base.slice(dot + 1)) : ''
  return ext === '' ? stem : `${stem}.${ext}`
}

/**
 * Names that must never reach a key.
 *
 * The filesystem adapter confines `readAsset` to the assets root so a `..` can
 * never climb out of it. R2 has no directories to climb, but a name carrying a
 * separator would still produce a key that a *later* listing or a rendered tree
 * would interpret as one — so the same names are refused, by every adapter, and
 * this is the one statement of which ones.
 */
export function isUnsafeAssetName(name: string): boolean {
  return (
    name === '' ||
    name.includes('/') ||
    name.includes('\\') ||
    name === '.' ||
    name === '..' ||
    name.startsWith('../')
  )
}

/**
 * A write refused because of the name it was given.
 *
 * ITS OWN CLASS BECAUSE THE ALTERNATIVE WAS SILENCE. Every store skipped an
 * unsafe name with `continue` and reported the write as a success, so the bytes
 * vanished and the caller was told nothing — the failure mode that costs the
 * most to diagnose, because the only evidence of it is a 404 much later.
 */
export class UnsafeAssetNameError extends Error {
  /**
   * The name that was refused.
   *
   * NOT `name`: that is `Error`'s own field and holds the class name, so a
   * handler reading `err.name` to report the file would report
   * `UnsafeAssetNameError` instead of the thing the operator is looking for.
   */
  readonly assetName: string

  constructor(assetName: string) {
    super(
      `'${assetName}' is not a name an asset can be stored under: a name is one ` +
        'segment, with no "/" or "\\" in it and no path traversal.',
    )
    this.name = 'UnsafeAssetNameError'
    this.assetName = assetName
  }
}

/**
 * The guard every adapter's `write` runs before it touches a byte.
 *
 * It throws on the FIRST bad name rather than writing the good ones and
 * complaining afterwards: a change set is one act, and half of it landing is a
 * worse answer than none of it.
 */
export function assertWritableAssetNames(
  assets: ReadonlyArray<{ name: string }> | undefined,
): void {
  for (const { name } of assets ?? []) {
    if (isUnsafeAssetName(name)) throw new UnsafeAssetNameError(name)
  }
}
