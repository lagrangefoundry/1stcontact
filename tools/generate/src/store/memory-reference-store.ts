/**
 * {@link ReferenceStore} in memory — REQ-155.
 *
 * The counterpart of `memory-store.ts`, and it exists for the same two reasons.
 * It is what the shared contract runs against in the node project without
 * touching a disk, so a contract failure is the port's and not the filesystem's.
 * And it is the adapter a capture test can hand `cmdCapturePage` when what it is
 * asserting is the *bundle* rather than where the bundle landed.
 *
 * IT IS NOT A FAKE OF THE FILESYSTEM. It implements the port, is held to the
 * same contract as the other two, and answers `list` with the same sorted
 * forward-slashed keys. Nothing about it is shaped around what a test wants to
 * see — which is exactly the property that lets the contract be one body of
 * assertions rather than three that agree by inspection.
 */
import type { ReferenceBundle, ReferenceStore } from './reference-store'

/** A bundle handle over a plain map, for tests and for the contract. */
export function memoryReferenceBundle(
  name: string,
  members: Map<string, Uint8Array> = new Map(),
): ReferenceBundle {
  return {
    name,
    async read(member) {
      const bytes = members.get(member)
      // Copied on the way out: a caller that mutated the returned view would
      // otherwise be editing the store, which no other adapter permits and no
      // caller may therefore rely on.
      return bytes ? new Uint8Array(bytes) : null
    },
    async write(member, bytes) {
      members.set(member, new Uint8Array(bytes))
    },
    async list(prefix) {
      const keys = [...members.keys()].sort()
      return prefix ? keys.filter((key) => key.startsWith(prefix)) : keys
    },
  }
}

export function memoryReferenceStore(): ReferenceStore {
  const bundles = new Map<string, Map<string, Uint8Array>>()

  return {
    bundle(name) {
      let members = bundles.get(name)
      if (!members) {
        members = new Map()
        bundles.set(name, members)
      }
      return memoryReferenceBundle(name, members)
    },
    async list() {
      // A bundle nothing was ever written to does not count as held — `bundle()`
      // is total (see the port), so merely asking for a handle must not conjure
      // one into the listing.
      return [...bundles.entries()]
        .filter(([, members]) => members.size > 0)
        .map(([name]) => name)
        .sort()
    },
  }
}
