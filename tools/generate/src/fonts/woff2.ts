/**
 * [[REQ-312]] — the WOFF2 container, as a lossless repackaging of an `sfnt`.
 *
 * WHY THIS FILE EXISTS AT ALL. The platform font mirror serves `woff2`, and
 * `github.com/google/fonts` — the canonical upstream for every family in
 * `fonts/catalogue.json` — ships **`ttf` only**. The `woff2` the web actually
 * loads comes from `fonts.gstatic.com` and is subsetted per unicode-range, which
 * is a *modified* version of the font in exactly the sense OFL's Reserved Font
 * Name clause is about. So there is no "mirror the upstream woff2" option: the
 * bytes have to be repackaged here, and the whole licence posture of the mirror
 * rests on that repackaging taking nothing away.
 *
 * SO IT TAKES NOTHING AWAY, AND PROVES IT. Only the null transform is used —
 * transformation version 3 for `glyf`/`loca`, version 0 for everything else
 * (WOFF2 §4.1) — so every table's bytes are handed to Brotli literally. No
 * subsetting, no re-naming, no re-hinting, no table dropped for size. What comes
 * back out of {@link woff2ToSfnt} is the input, and {@link roundTripDifferences}
 * is what the mirror asserts that with on every file it writes.
 *
 * THE TWO DIFFERENCES ARE THE SPECIFICATION'S, NOT OURS, and both are required:
 *
 *   - **`DSIG` is removed.** WOFF2 §5 makes this a MUST for any encoder: a
 *     digital signature over the old table offsets cannot survive repackaging,
 *     so a retained `DSIG` would be a signature that no longer verifies rather
 *     than one that does.
 *   - **`head.flags` bit 11 is set**, which §5 also makes a MUST: it is the
 *     format's own marker for "this font was losslessly repackaged". Setting it
 *     changes `head`, which changes the font's `checkSumAdjustment`, so a
 *     conforming decoder recomputes that too — those two fields are the entire
 *     delta, and {@link roundTripDifferences} knows about exactly them.
 *
 * NO NEW DEPENDENCY. Brotli is in Node's standard library and the container is
 * a frozen format, so this is ~400 lines that will not need maintaining, against
 * a 1.4MB emscripten WASM blob (`wawoff2`) in the supply chain of a GB-scale
 * build step. It is not a general-purpose WOFF2 implementation and does not try
 * to be: it declines font collections and never emits a transformed table, which
 * is the whole reason it can promise what it promises.
 */

import { brotliCompressSync, brotliDecompressSync, constants as zlibConstants } from 'node:zlib'

/** `wOF2` — the WOFF2 signature (WOFF2 §4). */
const WOFF2_SIGNATURE = 0x774f4632

/** `ttcf` — a font collection, which this encoder declines rather than mangles. */
const TTC_FLAVOR = 0x74746366

/** The fixed 48-byte WOFF2 header (WOFF2 §4). */
const HEADER_SIZE = 48

/**
 * The "known table tags" table (WOFF2 §4.1), whose INDEX is what a directory
 * entry's low six flag bits carry. Order is normative — an index is a wire
 * value, not a lookup convenience — and the spec requires an encoder to use the
 * known-tag encoding whenever the tag appears here.
 */
const KNOWN_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post',
  'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT',
  'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea',
  'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH',
  'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar',
  'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar',
  'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop',
  'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill',
] as const

/** `63` in the low six bits means "an arbitrary 4-byte tag follows" (WOFF2 §4.1). */
const ARBITRARY_TAG = 63

/**
 * The null transform, per tag. `glyf` and `loca` spell "untransformed" as
 * version 3; every other table spells it as version 0 (WOFF2 §4.1). Getting this
 * backwards produces a file whose glyphs a decoder will try to un-transform.
 */
function nullTransformVersion(tag: string): number {
  return tag === 'glyf' || tag === 'loca' ? 3 : 0
}

/** Byte offset of `checkSumAdjustment` within the `head` table (OFF). */
const HEAD_CHECKSUM_ADJUSTMENT_OFFSET = 8
/** Byte offset of the `flags` field within the `head` table (OFF). */
const HEAD_FLAGS_OFFSET = 16
/** "Font data has been losslessly modified" — the bit WOFF2 §5 requires an encoder to set. */
const HEAD_FLAG_LOSSLESS_TRANSFORM = 1 << 11

/** `n` rounded up to a 4-byte boundary — how an `sfnt` pads its table data. */
function round4(n: number): number {
  return (n + 3) & ~3
}

// ── sfnt ─────────────────────────────────────────────────────────────────────

/** One table of an `sfnt`, as its directory records it. */
export interface SfntTable {
  tag: string
  checksum: number
  data: Buffer
}

/** A parsed `sfnt` — its flavor (`sfnt version`) and its tables. */
export interface Sfnt {
  flavor: number
  tables: SfntTable[]
}

/** Raised for input this encoder declines, so a mirror run names the file. */
export class FontFormatError extends Error {}

/**
 * Parse an `sfnt` (`.ttf` / `.otf`) into its tables.
 *
 * Table DATA is copied out by the directory's offsets, so the order tables
 * happen to sit in the file is discarded — which is correct, because it is not
 * information: the directory is the font, and both WOFF2 and OFF let a
 * repackager lay the data out however it likes.
 */
export function parseSfnt(bytes: Buffer): Sfnt {
  if (bytes.length < 12) throw new FontFormatError('Not a font: fewer than 12 bytes.')
  const flavor = bytes.readUInt32BE(0)
  if (flavor === TTC_FLAVOR) {
    throw new FontFormatError(
      'Font collections (`ttcf`) are not mirrored: one file holding several faces has no ' +
        'single family to register, and no upstream family in the catalogue ships one.',
    )
  }
  const numTables = bytes.readUInt16BE(4)
  const directoryEnd = 12 + numTables * 16
  if (directoryEnd > bytes.length) {
    throw new FontFormatError(`Truncated font: ${numTables} tables need ${directoryEnd} bytes.`)
  }

  const tables: SfntTable[] = []
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16
    const tag = bytes.toString('latin1', rec, rec + 4)
    const checksum = bytes.readUInt32BE(rec + 4)
    const offset = bytes.readUInt32BE(rec + 8)
    const length = bytes.readUInt32BE(rec + 12)
    if (offset + length > bytes.length) {
      throw new FontFormatError(`Truncated font: table '${tag}' runs past the end of the file.`)
    }
    tables.push({ tag, checksum, data: bytes.subarray(offset, offset + length) })
  }
  return { flavor, tables }
}

/**
 * Serialise tables back into an `sfnt`.
 *
 * Directory entries go in ascending tag order, which is what OFF requires and
 * what a WOFF2 decoder is told to produce. Checksums are recomputed rather than
 * carried over, because `head` is rewritten on the way through and a stale
 * checksum is worse than none — `checkSumAdjustment` is then recomputed over the
 * finished file, exactly as WOFF2 §5 requires of a decoder.
 */
export function serialiseSfnt(font: Sfnt): Buffer {
  const tables = [...font.tables].sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0))
  const numTables = tables.length
  const entrySelector = numTables > 0 ? Math.floor(Math.log2(numTables)) : 0
  const searchRange = numTables > 0 ? 16 * 2 ** entrySelector : 0

  const directorySize = 12 + numTables * 16
  const total = tables.reduce((n, t) => n + round4(t.data.length), directorySize)
  const out = Buffer.alloc(total)

  out.writeUInt32BE(font.flavor, 0)
  out.writeUInt16BE(numTables, 4)
  out.writeUInt16BE(searchRange, 6)
  out.writeUInt16BE(entrySelector, 8)
  out.writeUInt16BE(numTables * 16 - searchRange, 10)

  let offset = directorySize
  tables.forEach((table, i) => {
    const rec = 12 + i * 16
    out.write(table.tag, rec, 4, 'latin1')
    out.writeUInt32BE(tableChecksum(table.data), rec + 4)
    out.writeUInt32BE(offset, rec + 8)
    out.writeUInt32BE(table.data.length, rec + 12)
    table.data.copy(out, offset)
    offset += round4(table.data.length)
  })

  const headIndex = tables.findIndex((t) => t.tag === 'head')
  if (headIndex >= 0) {
    const headOffset = out.readUInt32BE(12 + headIndex * 16 + 8)
    writeCheckSumAdjustment(out, headOffset)
  }
  return out
}

/** A table's OFF checksum: the sum of its 4-byte words, zero-padded, mod 2³². */
function tableChecksum(data: Buffer): number {
  let sum = 0
  for (let i = 0; i < data.length; i += 4) {
    const word =
      (data[i] << 24) | ((data[i + 1] ?? 0) << 16) | ((data[i + 2] ?? 0) << 8) | (data[i + 3] ?? 0)
    sum = (sum + (word >>> 0)) >>> 0
  }
  return sum
}

/**
 * Recompute `head.checkSumAdjustment` over a finished font, in place.
 *
 * The field is defined as `0xB1B0AFBA` minus the checksum of the whole file
 * computed with this very field zeroed, so it is written twice: once as zero to
 * make the sum well-defined, then with the answer.
 */
function writeCheckSumAdjustment(font: Buffer, headOffset: number): void {
  font.writeUInt32BE(0, headOffset + HEAD_CHECKSUM_ADJUSTMENT_OFFSET)
  const adjustment = (0xb1b0afba - tableChecksum(font)) >>> 0
  font.writeUInt32BE(adjustment, headOffset + HEAD_CHECKSUM_ADJUSTMENT_OFFSET)
}

// ── UIntBase128 (WOFF2 §3.1) ─────────────────────────────────────────────────

/**
 * `UIntBase128` — seven bits per byte, most significant first, continuation bit
 * high on every byte but the last.
 *
 * The spec forbids a leading zero byte (`0x80` first) and caps the encoding at
 * five bytes, so the encoding of a value is unique and a decoder cannot be
 * walked off the end by a padded one.
 */
export function encodeUIntBase128(value: number): Buffer {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    throw new FontFormatError(`UIntBase128 cannot encode ${value}.`)
  }
  const septets: number[] = []
  let n = value
  do {
    septets.unshift(n & 0x7f)
    n = Math.floor(n / 128)
  } while (n > 0)
  return Buffer.from(septets.map((s, i) => (i === septets.length - 1 ? s : s | 0x80)))
}

/** Read a `UIntBase128` at `offset`, returning the value and the next offset. */
export function readUIntBase128(bytes: Buffer, offset: number): { value: number; next: number } {
  let value = 0
  for (let i = 0; i < 5; i++) {
    const at = offset + i
    if (at >= bytes.length) throw new FontFormatError('Truncated UIntBase128.')
    const byte = bytes[at]
    if (i === 0 && byte === 0x80) throw new FontFormatError('UIntBase128 with a leading zero.')
    value = value * 128 + (byte & 0x7f)
    if (value > 0xffffffff) throw new FontFormatError('UIntBase128 wider than 32 bits.')
    if ((byte & 0x80) === 0) return { value, next: at + 1 }
  }
  throw new FontFormatError('UIntBase128 longer than five bytes.')
}

// ── Encoding ─────────────────────────────────────────────────────────────────

/**
 * The tables an encoder hands to Brotli, after the two edits WOFF2 §5 requires.
 *
 * Exported because the round-trip check needs the same answer this produced —
 * comparing a decoded font against the raw input would report the specification's
 * own two required differences as damage on every single file.
 */
export function preparedTables(font: Sfnt): SfntTable[] {
  const kept = font.tables.filter((t) => t.tag !== 'DSIG')
  return kept.map((table) => {
    if (table.tag !== 'head' || table.data.length < HEAD_FLAGS_OFFSET + 2) return table
    const head = Buffer.from(table.data)
    head.writeUInt16BE(head.readUInt16BE(HEAD_FLAGS_OFFSET) | HEAD_FLAG_LOSSLESS_TRANSFORM, HEAD_FLAGS_OFFSET)
    return { ...table, data: head }
  })
}

/**
 * Order the table directory.
 *
 * Ascending by tag, which satisfies WOFF2 §5.5's one ordering constraint for
 * free: `loca` must follow `glyf`, and `'glyf' < 'loca'` in the byte ordering
 * the tags already sort by. The constraint is asserted below rather than assumed,
 * because it holding by coincidence of the alphabet is not a reason to leave a
 * MUST unchecked.
 */
function directoryOrder(tables: SfntTable[]): SfntTable[] {
  const ordered = [...tables].sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0))
  const glyf = ordered.findIndex((t) => t.tag === 'glyf')
  const loca = ordered.findIndex((t) => t.tag === 'loca')
  if (glyf >= 0 && loca >= 0 && loca < glyf) {
    throw new FontFormatError("WOFF2 requires the 'loca' table to follow 'glyf' in the directory.")
  }
  return ordered
}

/** How hard to compress. Brotli's maximum — this runs once per corpus refresh. */
const BROTLI_QUALITY = 11

/**
 * Repackage an `sfnt` as WOFF2, applying no transform to any table.
 *
 * `quality` exists for the test suite and for an operator who would rather have
 * the mirror back sooner than 5% smaller; it changes the size of the output and
 * nothing about its content.
 */
export function sfntToWoff2(bytes: Buffer, quality: number = BROTLI_QUALITY): Buffer {
  const font = parseSfnt(bytes)
  const tables = directoryOrder(preparedTables(font))

  const entries: Buffer[] = []
  for (const table of tables) {
    const known = KNOWN_TAGS.indexOf(table.tag as (typeof KNOWN_TAGS)[number])
    const index = known >= 0 ? known : ARBITRARY_TAG
    const flags = Buffer.from([index | (nullTransformVersion(table.tag) << 6)])
    // No `transformLength`: it is present if and only if a non-null transform was
    // applied (WOFF2 §4.1), and this encoder applies none.
    const parts: Buffer[] = [flags]
    if (known < 0) parts.push(Buffer.from(table.tag, 'latin1'))
    parts.push(encodeUIntBase128(table.data.length))
    entries.push(Buffer.concat(parts))
  }
  const directory = Buffer.concat(entries)

  // The table data block: every table's bytes, in directory order, with NO
  // padding between them — the spec pins this by requiring the decompressed
  // block to equal the sum of the directory's lengths exactly (WOFF2 §5).
  const raw = Buffer.concat(tables.map((t) => t.data))
  const compressed = brotliCompressSync(raw, {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: quality,
      [zlibConstants.BROTLI_PARAM_LGWIN]: 24,
      [zlibConstants.BROTLI_PARAM_SIZE_HINT]: raw.length,
    },
  })

  const totalSfntSize = tables.reduce((n, t) => n + round4(t.data.length), 12 + tables.length * 16)
  const header = Buffer.alloc(HEADER_SIZE)
  header.writeUInt32BE(WOFF2_SIGNATURE, 0)
  header.writeUInt32BE(font.flavor, 4)
  header.writeUInt32BE(HEADER_SIZE + directory.length + compressed.length, 8)
  header.writeUInt16BE(tables.length, 12)
  header.writeUInt16BE(0, 14) // reserved
  header.writeUInt32BE(totalSfntSize, 16)
  header.writeUInt32BE(compressed.length, 20)
  header.writeUInt16BE(1, 24) // majorVersion
  header.writeUInt16BE(0, 26) // minorVersion
  // metaOffset/metaLength/metaOrigLength/privOffset/privLength — all absent, and
  // absent is spelled zero. With no metadata block the compressed data is the
  // last block, so it takes no trailing padding (WOFF2 §6).
  header.fill(0, 28, HEADER_SIZE)

  return Buffer.concat([header, directory, compressed])
}

// ── Decoding ─────────────────────────────────────────────────────────────────

/**
 * Unpack a WOFF2 produced by {@link sfntToWoff2} back into an `sfnt`.
 *
 * This is the verification half, not a general decoder: it refuses any entry
 * carrying a non-null transform rather than implementing the `glyf`/`loca`/`hmtx`
 * reverse transforms. That refusal is deliberate — the one thing the mirror needs
 * proved is that its own output took nothing away, and a decoder that could also
 * un-transform someone else's file would be able to hide a transform we
 * accidentally emitted.
 */
export function woff2ToSfnt(bytes: Buffer): Buffer {
  if (bytes.length < HEADER_SIZE) throw new FontFormatError('Not a WOFF2 file: too short.')
  if (bytes.readUInt32BE(0) !== WOFF2_SIGNATURE) throw new FontFormatError("Not a WOFF2 file: bad signature.")
  const flavor = bytes.readUInt32BE(4)
  const numTables = bytes.readUInt16BE(12)
  const totalCompressedSize = bytes.readUInt32BE(20)

  let at = HEADER_SIZE
  const directory: { tag: string; length: number }[] = []
  for (let i = 0; i < numTables; i++) {
    if (at >= bytes.length) throw new FontFormatError('Truncated WOFF2 table directory.')
    const flags = bytes[at]
    at += 1
    const index = flags & 0x3f
    let tag: string
    if (index === ARBITRARY_TAG) {
      tag = bytes.toString('latin1', at, at + 4)
      at += 4
    } else {
      tag = KNOWN_TAGS[index]
      if (tag === undefined) throw new FontFormatError(`Unknown table tag index ${index}.`)
    }
    const transformVersion = flags >> 6
    if (transformVersion !== nullTransformVersion(tag)) {
      throw new FontFormatError(
        `Table '${tag}' carries transform version ${transformVersion}; this decoder reads only the null transform.`,
      )
    }
    const orig = readUIntBase128(bytes, at)
    at = orig.next
    directory.push({ tag, length: orig.value })
  }

  const compressed = bytes.subarray(at, at + totalCompressedSize)
  const raw = brotliDecompressSync(compressed)
  const expected = directory.reduce((n, d) => n + d.length, 0)
  if (raw.length !== expected) {
    throw new FontFormatError(
      `Decompressed table data is ${raw.length} bytes; the directory accounts for ${expected}.`,
    )
  }

  let offset = 0
  const tables: SfntTable[] = directory.map((d) => {
    const data = raw.subarray(offset, offset + d.length)
    offset += d.length
    return { tag: d.tag, checksum: tableChecksum(data), data }
  })
  return serialiseSfnt({ flavor, tables })
}

// ── The lossless claim, as an assertion ──────────────────────────────────────

/**
 * Every way a decoded font differs from what the encoder was given, in words.
 *
 * An EMPTY list is the mirror's licence posture stated as a fact about bytes: no
 * glyph, no `name` record and no embedded copyright string changed on the way
 * through, so the mirrored file is the upstream font in a different container
 * rather than a modified version of it.
 *
 * It compares against {@link preparedTables} — the input after the two edits the
 * specification REQUIRES (`DSIG` dropped, `head.flags` bit 11 set) — because
 * those are the format's demands on any encoder, not this one's choices.
 * `head.checkSumAdjustment` follows from them and is skipped for the same reason:
 * a decoder is required to recompute it.
 */
export function roundTripDifferences(original: Buffer, woff2: Buffer): string[] {
  const expected = preparedTables(parseSfnt(original))
  const actual = parseSfnt(woff2ToSfnt(woff2))
  const differences: string[] = []

  const actualByTag = new Map(actual.tables.map((t) => [t.tag, t.data]))
  for (const table of expected) {
    const got = actualByTag.get(table.tag)
    if (got === undefined) {
      differences.push(`table '${table.tag}' is missing after the round trip`)
      continue
    }
    actualByTag.delete(table.tag)
    if (got.length !== table.data.length) {
      differences.push(
        `table '${table.tag}' is ${got.length} bytes after the round trip, was ${table.data.length}`,
      )
      continue
    }
    if (table.tag === 'head') {
      // Everything but `checkSumAdjustment`, which a decoder must recompute.
      const before = Buffer.concat([
        table.data.subarray(0, HEAD_CHECKSUM_ADJUSTMENT_OFFSET),
        table.data.subarray(HEAD_CHECKSUM_ADJUSTMENT_OFFSET + 4),
      ])
      const after = Buffer.concat([
        got.subarray(0, HEAD_CHECKSUM_ADJUSTMENT_OFFSET),
        got.subarray(HEAD_CHECKSUM_ADJUSTMENT_OFFSET + 4),
      ])
      if (!before.equals(after)) differences.push("table 'head' changed outside checkSumAdjustment")
      continue
    }
    if (!got.equals(table.data)) differences.push(`table '${table.tag}' changed`)
  }
  for (const tag of actualByTag.keys()) differences.push(`table '${tag}' appeared from nowhere`)
  return differences
}
