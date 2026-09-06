/**
 * The one minter of opaque keys ([[REQ-190]]).
 *
 * **No data field is ever a key.** A key is a surrogate the system mints and
 * never shows meaning through; anything a human chose, typed, or might change is
 * an attribute. This module is the whole of the minting half of that rule.
 *
 * WHY IT LIVES DOWN HERE rather than in `identity.ts`, where it was written.
 * `sites` is keyed by a value the STORE has to mint — `createDraft` is where a
 * site comes into existence — and `control-app` imports `tools/generate`, never
 * the reverse. Leaving `newId` up in the app would have meant a second minter
 * down here, and "the system mints it" stops being a property the moment there
 * are two of them. `identity.ts` re-exports this one.
 *
 * 128 BITS FROM A CSPRNG, NOT A DIGEST. A hash *of the row's data* is
 * data-as-key wearing a disguise: `sha256(email)` still changes when the address
 * changes and still says two addresses are two people. What is wanted is an
 * identifier with no relationship to its contents at all.
 *
 * ONE COLUMN, NOT TWO. An incrementing surrogate cannot appear in a URL —
 * `/b/2/`, `/b/3/` would probe every other business on the deployment and turn a
 * 403 into an existence check — which is why an earlier design carried an
 * integer key beside an opaque `public_id`. A key that is already unguessable
 * needs no second column: the same value is safe in a join, in `/b/<id>/`, in
 * `/site/<siteId>/`, in an API response and in an R2 prefix.
 *
 * 16 bytes hex is the entropy a UUIDv4 carries, without the hyphens that would
 * make the value awkward in a key.
 */

/**
 * An opaque id, `<prefix>_<32 hex chars>`.
 *
 * The prefix is a READING AID and never parsed: it says which table a value in a
 * log came from, and no code branches on it. Two ids with the same prefix are
 * not related and two with different prefixes are not ordered.
 */
export function newId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${prefix}_${hex}`
}

/**
 * Whether `value` has the shape {@link newId} mints.
 *
 * For the UATs that assert a key is opaque, and for nothing else — no runtime
 * path validates an id, because a key is compared and never interpreted.
 */
export function isOpaqueId(value: string, prefix?: string): boolean {
  const match = /^([a-z]+)_([0-9a-f]{32})$/.exec(value)
  if (!match) return false
  return prefix === undefined || match[1] === prefix
}
