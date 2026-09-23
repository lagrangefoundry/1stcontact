import { DurableObject } from 'cloudflare:workers'

/**
 * The session junction, made durable (REQ-307).
 *
 * WHAT THIS IS FOR. The junction is the only place a turn's records live while
 * the turn is open: the archive deliberately lags by a whole open turn
 * (`closedPrefix` cuts at the last boundary where no turn is open, because
 * folding half a turn splits one reply in two), so between `turn_start` and
 * `turn_end` there is no durable copy of the prose OR the tool records. In this
 * Worker that junction was RAM, per isolate — so an isolate evicted under memory
 * pressure, or a `wrangler dev` reload, destroyed the turn outright: no
 * `turn_end`, no fold, no spend row, and [[BUG-121]]'s pending record left
 * `open`. A restart must cost the client the rest of the answer and nothing
 * else.
 *
 * NO UPSTREAM CHANGE, AND UPSTREAM SAYS SO. `junction_memory.js`'s own header
 * names the exposure and the route back in terms: *"A Durable Object restores
 * both properties — it is a single writer with a synchronous SQLite API — and
 * needs no change here, which is the point of making storage a port."* This
 * class is that Durable Object; `junctions.ts` is the adapter on our side of the
 * port.
 *
 * WHY SQLITE AND NOT THE KEY-VALUE STORAGE BESIDE IT. The junction's one
 * performance obligation is that appends stay O(delta) — DOC-21 §2 exists to
 * remove exactly the quadratic rewrite the pre-junction design had, and an
 * adapter that reintroduced it would defeat the port. A row per append, carrying
 * its byte offset, is that discipline in SQL: an append inserts one row and a
 * read touches only the rows past the cursor. `ctx.storage.put` over one growing
 * value would rewrite the whole stream on every token delta.
 *
 * BYTES AND NOT TEXT IN THE COLUMN. The port's offsets are BYTE offsets into the
 * same NDJSON stream a file would hold — that is what lets a watermark written by
 * one runtime be read by another — and a JS string is UTF-16. Storing the encoded
 * bytes means the offsets this class reports and the offsets the adapter's mirror
 * counts are the same number, with no re-encoding anywhere that could disagree.
 *
 * ONE DURABLE OBJECT PER SESSION, addressed by `idFromName(sessionId)`. That is
 * the second property `junction_memory.js` names: DOC-21 §1.1 rejected an
 * in-memory hub because the junction assumes a single writer per session, and a
 * DO keyed by session restores it.
 */

/** The junction's state as of one read — see {@link SessionJunction.since}. */
export interface JunctionSlice {
  /** Whether any record has ever been written (the port's `exists`). */
  present: boolean
  /** Total bytes held here (the port's `size`). */
  size: number
  /**
   * Bumped by every `replace` and `remove`, and by nothing else.
   *
   * WHAT IT IS FOR. A reader that has a mirror needs to know whether the bytes
   * BEFORE its cursor are still the bytes it holds. An append can never
   * invalidate them; a `replace` (which is `seed`) or a `remove` (which is
   * `closeSession`) invalidates all of them, and neither is visible in the size
   * alone — a replace can land on the same length. So the one thing a length
   * cannot say is said separately.
   */
  epoch: number
  /**
   * The byte offset {@link JunctionSlice.bytes} STARTS AT — `0` or the `from`
   * that was asked for, and never anything else.
   *
   * IT IS THE READER'S INSTRUCTION AND NOT A DIAGNOSTIC. `0` means "these are
   * the whole stream, replace what you hold"; anything else means "these are the
   * delta, append them". Reporting the splice point rather than a flag is what
   * makes the two cases impossible to confuse — a reader cannot append a whole
   * stream onto itself, or replace itself with a tail, because the number says
   * which it has. That confusion, in an earlier draft of this file, produced a
   * mirror holding half a record and a torn line the record layer then refused.
   */
  at: number
  /** Bytes from {@link JunctionSlice.at} onward. */
  bytes: Uint8Array
  /** The stored watermark blob (the port's `readMeta`), or null. */
  meta: string | null
}

const ENCODER = new TextEncoder()

/** `size`, `epoch` and `present` live here; the stream lives in `chunk`. */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS chunk (
  start INTEGER PRIMARY KEY,
  len   INTEGER NOT NULL,
  bytes BLOB NOT NULL
);
CREATE TABLE IF NOT EXISTS state (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);
`

export class SessionJunction extends DurableObject<unknown> {
  /**
   * THE SCHEMA IS APPLIED IN THE CONSTRUCTOR, not behind `blockConcurrencyWhile`.
   * `ctx.storage.sql` is synchronous — which is the whole reason a Durable Object
   * can satisfy this port at all — so the tables exist before any method can be
   * entered, with no window to guard.
   */
  constructor(ctx: DurableObjectState, env: unknown) {
    // NO ENV TYPE, and the absence is the statement: this object reaches
    // NOTHING. It holds one session's bytes and answers about them; it has no
    // store, no bucket, no credential and no way to acquire one.
    super(ctx, env)
    this.ctx.storage.sql.exec(SCHEMA)
  }

  private num(key: string, fallback: number): number {
    const rows = this.ctx.storage.sql.exec('SELECT v FROM state WHERE k = ?', key).toArray()
    return rows.length ? Number(rows[0].v) : fallback
  }

  private put(key: string, value: string): void {
    this.ctx.storage.sql.exec(
      'INSERT INTO state (k, v) VALUES (?, ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v',
      key,
      value,
    )
  }

  /**
   * The stream from `from` onward, and enough state to know whether to splice it.
   *
   * THE ONE READ THIS CLASS HAS, and it answers both questions the adapter asks
   * — "what has landed since I last looked" on a warm request, and "what is
   * there at all" on the first attach after a restart. Those are the same
   * question with a different cursor, so they are one method rather than two
   * that could disagree about what `present` means.
   */
  since(from: number, epoch: number): JunctionSlice {
    const size = this.num('size', 0)
    const held = this.num('epoch', 0)
    const present = this.num('present', 0) === 1
    const metaRows = this.ctx.storage.sql.exec('SELECT v FROM state WHERE k = ?', 'meta').toArray()
    const meta = metaRows.length ? String(metaRows[0].v) : null
    /**
     * WHEN A DELTA IS NOT AN HONEST ANSWER, and the whole stream goes back
     * instead. Three cases, and each is a reader whose own bytes cannot be
     * trusted as a prefix of these:
     *
     *   - the epoch has moved, so a `replace` or a `remove` invalidated every
     *     byte before the cursor — which a length comparison cannot see;
     *   - `from` is past the end, so the reader holds MORE than this object
     *     does (a flush that never landed) and there is no delta to send;
     *   - `from` is not a point this stream was ever cut at, so a splice there
     *     would land mid-record and tear the line the record layer parses.
     */
    const spliceable =
      epoch === held &&
      from > 0 &&
      from <= size &&
      (from === size ||
        this.ctx.storage.sql.exec('SELECT 1 FROM chunk WHERE start = ?', from).toArray().length > 0)
    const cursor = spliceable ? from : 0
    const rows = this.ctx.storage.sql
      .exec<{ start: number; len: number; bytes: ArrayBuffer }>(
        'SELECT start, len, bytes FROM chunk WHERE start + len > ? ORDER BY start',
        cursor,
      )
      .toArray()
    let span = 0
    for (const row of rows) span += Number(row.len)
    const gathered = new Uint8Array(span)
    let at = 0
    let head = size
    for (const row of rows) {
      head = Math.min(head, Number(row.start))
      gathered.set(new Uint8Array(row.bytes), at)
      at += Number(row.len)
    }
    const bytes = rows.length ? gathered.subarray(Math.max(0, cursor - head)) : gathered
    // A COPY, because `subarray` is a view onto a buffer this method allocated
    // and RPC serialises what it is handed. Returning the view would ship the
    // whole gathered span across the boundary and hand the caller a slice of it.
    return { present, size, epoch: held, at: cursor, bytes: bytes.slice(), meta }
  }

  /**
   * Append in ONE write, at the end — the port's O(delta) guarantee.
   *
   * The row's key IS its byte offset, so nothing has to be renumbered and the
   * boundary check above is a primary-key lookup.
   */
  append(text: string): number {
    const bytes = ENCODER.encode(text)
    const size = this.num('size', 0)
    // AN EMPTY APPEND WRITES NO ROW, and the reason is the primary key: the row's
    // key is its offset, so two empty writes at the same offset would collide.
    // The port still counts it — `exists()` goes true on any append, including
    // one carrying nothing — so `present` moves and the stream does not.
    if (bytes.length > 0) {
      this.ctx.storage.sql.exec(
        'INSERT INTO chunk (start, len, bytes) VALUES (?, ?, ?)',
        size,
        bytes.length,
        bytes,
      )
    }
    const grown = size + bytes.length
    this.put('size', String(grown))
    this.put('present', '1')
    return grown
  }

  /**
   * Replace the whole stream — `seed`, and nothing else.
   *
   * THE EPOCH MOVES. Every byte a reader holds is now wrong, and that is exactly
   * what the epoch is for: a length comparison cannot see a replacement that
   * happens to land on the same length.
   */
  replace(text: string): number {
    const bytes = ENCODER.encode(text)
    this.ctx.storage.sql.exec('DELETE FROM chunk')
    if (bytes.length > 0) {
      this.ctx.storage.sql.exec(
        'INSERT INTO chunk (start, len, bytes) VALUES (0, ?, ?)',
        bytes.length,
        bytes,
      )
    }
    this.put('size', String(bytes.length))
    this.put('present', '1')
    this.put('epoch', String(this.num('epoch', 0) + 1))
    return bytes.length
  }

  /** Delete the stream and its watermark — the port's `remove`. */
  remove(): void {
    this.ctx.storage.sql.exec('DELETE FROM chunk')
    this.ctx.storage.sql.exec("DELETE FROM state WHERE k = 'meta'")
    this.put('size', '0')
    this.put('present', '0')
    this.put('epoch', String(this.num('epoch', 0) + 1))
  }

  /** Store the watermark blob — the port's `writeMeta`. */
  writeMeta(text: string): void {
    this.put('meta', text)
  }
}
