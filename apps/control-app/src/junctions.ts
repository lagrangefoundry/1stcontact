import * as aiLib from './generated/ai-workers.js'
import type { JunctionSlice, SessionJunction } from './junction-do'

/**
 * The junction port, over a Durable Object (REQ-307).
 *
 * THIS FILE IS THE ADAPTER AND `junction-do.ts` IS THE SUBSTRATE. Everything
 * that makes a record a record lives in upstream's `SessionLog`; a junction
 * adapter supplies only bytes, which is why a session driven here and a session
 * driven on a disk produce the same stream.
 *
 * THE PORT IS SYNCHRONOUS AND A DURABLE OBJECT IS NOT, and that is the whole
 * design of this file. `JunctionStorage` is `exists / size / append / read /
 * replace / remove / readMeta / writeMeta`, and `SessionLog` calls every one of
 * them inline — `log.append(TURN_END, …)` RETURNS the record, `log.readFrom(0)`
 * RETURNS rows. A stub reached over RPC cannot sit behind that. So this adapter
 * is a MIRROR plus a WRITE-BEHIND:
 *
 *   - every read is answered from an in-isolate mirror, synchronously, at the
 *     same cost `memoryJunctions()` charges — this is upstream's own
 *     `MemoryJunctionStorage`, composed rather than reimplemented, so the
 *     chunk-list-plus-offset-index discipline that keeps appends O(delta) is the
 *     one upstream documents and not a second copy of it here;
 *   - every write lands in the mirror synchronously AND is queued, in order, to
 *     the Durable Object.
 *
 * WHAT THAT BUYS AND WHAT IT DOES NOT. The turn's records become durable as they
 * are appended rather than when the turn closes, which is the whole point: the
 * archive lags by a whole open turn, so before this the only copy of a live
 * turn's prose and tool records was RAM in one isolate. The residual window is
 * one flush — microseconds of queue, plus a round trip — rather than one turn,
 * which can be nine minutes. It is not zero, and it cannot be: a synchronous
 * durable append would require the session manager to run INSIDE the Durable
 * Object, which is a different and much larger change (it would also make every
 * deploy restart every conversation, since a code deploy restarts every DO).
 *
 * THE MIRROR IS FILLED BY {@link DurableJunctions.prepare}, which is the one
 * async call this port adds. `host-core.ts` awaits it at each of its four
 * session entry points, where the session id is already in hand; a junctions
 * store without the method — `memoryJunctions()`, the file junction — is
 * untouched by it.
 *
 * A STORAGE THAT HAS NOT ADOPTED ITS OBJECT NEVER WRITES TO IT. That is the one
 * safety rule here and it covers three cases with one line: a session nobody
 * prepared (the agent surface opens past conversations' junctions by id, and
 * falls through to the archive when there is nothing there), a prepare that
 * failed, and a deployment whose Durable Object is unreachable. In every one of
 * them this degrades to exactly `memoryJunctions()` — today's behaviour — rather
 * than to a `seed` overwriting a real junction with an archive replay.
 */

/** The library is untyped JavaScript; the boundary is narrow and named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

const lib = aiLib as unknown as Untyped

const DECODER = new TextDecoder()

/** What this adapter needs of the namespace — one stub, addressed by name. */
export interface JunctionNamespace {
  idFromName(name: string): DurableObjectId
  get(id: DurableObjectId): DurableObjectStub<SessionJunction>
}

/**
 * One session's bytes: a mirror that answers every read, and a queue that makes
 * them durable.
 */
class DurableJunctionStorage {
  readonly key: string
  private readonly mirror: Untyped
  private readonly stub: DurableObjectStub<SessionJunction>
  /** False until {@link adopt} has read the object; no write leaves until it is. */
  private adopted = false
  /**
   * The object's epoch as of the last {@link adopt}, and NEVER a local guess.
   *
   * A local `replace` moves the object's epoch past this one, so the next adopt
   * reads a mismatch and takes the whole stream again. That is a wasted download
   * of a stream this isolate already holds — and it is the right trade, because
   * the alternative is predicting the object's counter and being wrong about it
   * the one time a flush did not land.
   */
  private epoch = 0
  /** The write-behind chain — one flush at a time, in append order. */
  private tail: Promise<void> = Promise.resolve()

  constructor(sessionId: string, stub: DurableObjectStub<SessionJunction>) {
    this.key = `durable:${sessionId}`
    this.mirror = new lib.MemoryJunctionStorage(this.key)
    this.stub = stub
  }

  // -- the port's reads, straight off the mirror ----------------------------

  exists(): boolean {
    return this.mirror.exists()
  }

  size(): number {
    return this.mirror.size()
  }

  read(cursor: number, length: number): Uint8Array {
    return this.mirror.read(cursor, length)
  }

  readMeta(): string | null {
    return this.mirror.readMeta()
  }

  // -- the port's writes: mirror now, object shortly after ------------------

  append(text: string): void {
    this.mirror.append(text)
    this.queue((stub) => stub.append(text))
  }

  replace(text: string): void {
    this.mirror.replace(text)
    this.queue((stub) => stub.replace(text))
  }

  remove(): void {
    this.mirror.remove()
    this.queue((stub) => stub.remove())
  }

  writeMeta(text: string): void {
    this.mirror.writeMeta(text)
    this.queue((stub) => stub.writeMeta(text))
  }

  /**
   * Take the object's state as this isolate's, or push what only this isolate
   * has.
   *
   * THE FIRST CALL ADOPTS WHOLESALE. A fresh isolate's mirror is empty and the
   * object is the truth — including, after a restart mid-turn, a turn that was
   * never closed. That is the state `SessionManager._reconcile` exists to
   * finish: a lapsed lease says the producer is gone, so it closes the dangling
   * turn `aborted` and drains it into the archive. Until now it had nothing to
   * recover from, because the junction died with the isolate.
   *
   * LATER CALLS SPLICE THE DELTA, so a warm isolate pays one round trip and not
   * one transcript per turn. The stream is append-only, so bytes before the
   * cursor cannot have changed — unless the epoch moved, which is what `replace`
   * and `remove` are, and then the only sound answer is to take the whole thing
   * again.
   *
   * AN OBJECT THAT IS BEHIND IS PUSHED FORWARD, not obeyed. That happens when a
   * queued flush never landed, and the mirror is then the only copy of those
   * records — adopting would delete them. Re-sending the tail is both the repair
   * and the thing that keeps the object the durable copy it is here to be.
   */
  private async adopt(): Promise<void> {
    // OUR OWN QUEUED WRITES FIRST, or the delta this reads would be measured
    // against a cursor the object has not caught up to yet.
    await this.drain()
    const from = this.adopted ? this.mirror.size() : 0
    const slice: JunctionSlice = await this.stub.since(from, this.epoch)
    const bytes = new Uint8Array(slice.bytes)
    if (this.adopted && slice.epoch === this.epoch && slice.size < this.mirror.size()) {
      // THE OBJECT IS BEHIND, AND IS PUSHED FORWARD RATHER THAN OBEYED. This is
      // a flush that did not land, and the mirror is then the only copy of those
      // records — adopting would delete them. Re-sending the tail is both the
      // repair and the thing that keeps the object the durable copy it is here
      // to be.
      const tail = DECODER.decode(this.mirror.read(slice.size, this.mirror.size() - slice.size))
      this.adopted = true
      this.epoch = slice.epoch
      this.queue((stub) => stub.append(tail))
      await this.drain()
      return
    }
    if (!slice.present) {
      this.mirror.remove()
    } else if (slice.at === 0) {
      // The whole stream — see {@link JunctionSlice.at}. This is every first
      // attach, and every attach after something invalidated the prefix.
      this.mirror.replace(DECODER.decode(bytes))
      if (slice.meta !== null) this.mirror.writeMeta(slice.meta)
    } else if (bytes.length > 0) {
      this.mirror.append(DECODER.decode(bytes))
      if (slice.meta !== null) this.mirror.writeMeta(slice.meta)
    }
    this.adopted = true
    this.epoch = slice.epoch
  }

  /** {@link adopt}, but a failure leaves this session memory-backed rather than throwing. */
  async prepare(): Promise<void> {
    try {
      await this.adopt()
    } catch (err) {
      this.adopted = false
      // NOT FATAL, AND NOT SILENT. The junction is a durability tier, not the
      // truth in flight: a conversation whose object cannot be reached still
      // opens, still replays and still takes a turn. What it must not do is
      // write to an object it has not read — see the class comment.
      console.error(`junction ${this.key}: could not be prepared — ${String(err)}`)
    }
  }

  /** Wait for every queued write to land; never rejects, for the reason below. */
  async drain(): Promise<void> {
    await this.tail
  }

  private queue(write: (stub: DurableObjectStub<SessionJunction>) => Promise<unknown>): void {
    if (!this.adopted) return
    this.tail = this.tail.then(async () => {
      try {
        await write(this.stub)
      } catch (err) {
        // ONE FAILED WRITE MUST NOT POISON THE CHAIN, and it must not reject:
        // the only caller that awaits this is the route's `ctx.waitUntil` drain,
        // and a rejected `waitUntil` is an invocation error. The object is now
        // behind the mirror, which the next `adopt` detects by length and
        // repairs by re-sending the tail.
        console.error(`junction ${this.key}: write did not land — ${String(err)}`)
      }
    })
  }
}

/** The `Junctions` store this Worker runs on — see the file comment. */
export interface DurableJunctions {
  prepare(sessionId: string): Promise<void>
  open(sessionId: string): Untyped
  discover(): string[]
  flush(sessionId?: string): Promise<void>
}

/**
 * A `Junctions` store keeping its sessions in a Durable Object apiece.
 *
 * Storages are held per session id for the isolate's life, exactly as
 * `memoryJunctions()` holds them, so two `open` calls on one id share bytes —
 * which is what makes a second reader (the archive syncer, a projection) see
 * what a writer appended.
 *
 * `discover()` REPORTS THIS ISOLATE'S SESSIONS, which is the same answer
 * `memoryJunctions()` gives and the honest one here: one Durable Object per
 * session means there is no list to enumerate without a second index, and
 * nothing in this Worker asks — `reconcileOrphans` is a Node-host entry point,
 * and the recovery that matters here happens per session on attach.
 */
export function durableJunctions(namespace: JunctionNamespace): DurableJunctions {
  const storages = new Map<string, DurableJunctionStorage>()
  const storageFor = (sessionId: string): DurableJunctionStorage => {
    let storage = storages.get(sessionId)
    if (storage === undefined) {
      storage = new DurableJunctionStorage(sessionId, namespace.get(namespace.idFromName(sessionId)))
      storages.set(sessionId, storage)
    }
    return storage
  }
  return {
    prepare: (sessionId: string) => storageFor(sessionId).prepare(),
    open: (sessionId: string) => new lib.SessionLog(sessionId, storageFor(sessionId)),
    discover: () =>
      [...storages.entries()]
        .filter(([, storage]) => storage.exists())
        .map(([sessionId]) => sessionId)
        .sort(),
    flush: async (sessionId?: string) => {
      const pending = sessionId
        ? [storages.get(sessionId)].filter((s): s is DurableJunctionStorage => s !== undefined)
        : [...storages.values()]
      await Promise.all(pending.map((storage) => storage.drain()))
    },
  }
}
