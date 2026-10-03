/**
 * A QR code encoder, small enough to own ([[REQ-376]]).
 *
 * WHY IT IS WRITTEN HERE AND NOT FETCHED. The one thing this encodes is the URL
 * of a client's private draft, and any QR service that drew it would be handed
 * that URL — so the code is made in the browser or not at all. The repo had no
 * QR library, and the part of the standard a URL needs is a few hundred lines:
 * byte mode, one error-correction level, every version, the eight masks. That is
 * cheaper to keep than a dependency is to vet, pin and ship.
 *
 * WHAT IT COVERS AND WHAT IT DOES NOT. Byte mode only (a URL is bytes; numeric
 * and alphanumeric segments would save a few modules and cost a segmenter).
 * Error-correction level M, which survives a screen's glare and a camera held at
 * an angle without growing the code much. The smallest version that fits, and
 * the mask with the lowest penalty score — both as ISO/IEC 18004 specifies them,
 * because a scanner that finds a mask it did not expect still reads it but a
 * badly chosen one can make a code that scans poorly off a monitor.
 *
 * Pure: no DOM, no state. {@link qrSvg} is the only drawing, and it is a string.
 */

/** Level M's error-correction codewords per block, by version (index 0 unused). */
const ECC_PER_BLOCK = [
  -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28,
  28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
]

/** Level M's number of error-correction blocks, by version (index 0 unused). */
const ECC_BLOCKS = [
  -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23,
  25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
]

/** The two format bits that name level M. */
const LEVEL_M_BITS = 0

/** Every module of a version that carries data or error correction, as a count. */
function rawDataModules(version) {
  let n = (16 * version + 128) * version + 64
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2
    n -= (25 * align - 10) * align - 55
    if (version >= 7) n -= 36
  }
  return n
}

/** How many data codewords a version carries at level M. */
function dataCodewords(version) {
  return Math.floor(rawDataModules(version) / 8) - ECC_PER_BLOCK[version] * ECC_BLOCKS[version]
}

/** The alignment pattern centres of a version, on each axis. */
function alignmentPositions(version) {
  if (version === 1) return []
  const count = Math.floor(version / 7) + 2
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2
  const out = [6]
  for (let pos = version * 4 + 10; out.length < count; pos -= step) out.splice(1, 0, pos)
  return out
}

// ── Reed–Solomon over GF(256), polynomial 0x11D ─────────────────────────────

function gfMultiply(x, y) {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z & 0xff
}

function rsDivisor(degree) {
  const result = new Array(degree).fill(0)
  result[degree - 1] = 1
  let root = 1
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = gfMultiply(result[j], root)
      if (j + 1 < result.length) result[j] ^= result[j + 1]
    }
    root = gfMultiply(root, 0x02)
  }
  return result
}

function rsRemainder(data, divisor) {
  const result = divisor.map(() => 0)
  for (const b of data) {
    const factor = b ^ result.shift()
    result.push(0)
    divisor.forEach((coef, i) => (result[i] ^= gfMultiply(coef, factor)))
  }
  return result
}

// ── codewords ───────────────────────────────────────────────────────────────

/** The data codewords for `bytes` at `version`: mode, count, data, terminator, padding. */
function dataStream(bytes, version) {
  const bits = []
  const put = (value, length) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1)
  }
  put(0b0100, 4)
  put(bytes.length, version < 10 ? 8 : 16)
  for (const b of bytes) put(b, 8)
  const capacity = dataCodewords(version) * 8
  put(0, Math.min(4, capacity - bits.length))
  put(0, (8 - (bits.length % 8)) % 8)
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) put(pad, 8)
  const out = []
  for (let i = 0; i < bits.length; i += 8) {
    out.push(bits.slice(i, i + 8).reduce((acc, bit) => (acc << 1) | bit, 0))
  }
  return out
}

/** Split into blocks, append each block's error correction, interleave. */
function interleave(data, version) {
  const blocks = ECC_BLOCKS[version]
  const eccLen = ECC_PER_BLOCK[version]
  const raw = Math.floor(rawDataModules(version) / 8)
  const shortBlocks = blocks - (raw % blocks)
  const shortLen = Math.floor(raw / blocks)
  const divisor = rsDivisor(eccLen)
  const all = []
  for (let i = 0, k = 0; i < blocks; i++) {
    const dataLen = shortLen - eccLen + (i < shortBlocks ? 0 : 1)
    const block = data.slice(k, k + dataLen)
    k += dataLen
    const ecc = rsRemainder(block, divisor)
    // Short blocks carry a placeholder where the long ones have one more data
    // byte, so every block can be read column by column below.
    if (i < shortBlocks) block.push(-1)
    all.push(block.concat(ecc))
  }
  const out = []
  for (let col = 0; col < all[0].length; col++) {
    for (const block of all) if (block[col] !== -1) out.push(block[col])
  }
  return out
}

// ── the grid ────────────────────────────────────────────────────────────────

function emptyGrid(size) {
  return Array.from({ length: size }, () => new Array(size).fill(false))
}

/** Draw every function pattern and return which modules they claim. */
function drawFunctionPatterns(grid, version) {
  const size = grid.length
  const fn = emptyGrid(size)
  const set = (x, y, dark) => {
    grid[y][x] = dark
    fn[y][x] = true
  }

  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0)
    set(i, 6, i % 2 === 0)
  }

  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx
        const y = cy + dy
        if (x < 0 || x >= size || y < 0 || y >= size) continue
        const d = Math.max(Math.abs(dx), Math.abs(dy))
        set(x, y, d !== 2 && d !== 4)
      }
    }
  }
  finder(3, 3)
  finder(size - 4, 3)
  finder(3, size - 4)

  const centres = alignmentPositions(version)
  const last = centres.length - 1
  centres.forEach((cy, i) => {
    centres.forEach((cx, j) => {
      // The three corners a finder already occupies.
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
        }
      }
    })
  })

  // Format areas are reserved now and written once the mask is chosen.
  drawFormat(grid, fn, 0, set)

  if (version >= 7) {
    let rem = version
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
    const bits = (version << 12) | rem
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) === 1
      const a = size - 11 + (i % 3)
      const b = Math.floor(i / 3)
      set(a, b, dark)
      set(b, a, dark)
    }
  }
  return fn
}

/** The fifteen format bits for level M and `mask`, in both copies. */
function drawFormat(grid, fn, mask, set = (x, y, dark) => (grid[y][x] = dark)) {
  const size = grid.length
  const data = (LEVEL_M_BITS << 3) | mask
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  const bits = ((data << 10) | rem) ^ 0x5412
  const bit = (i) => ((bits >>> i) & 1) === 1

  for (let i = 0; i <= 5; i++) set(8, i, bit(i))
  set(8, 7, bit(6))
  set(8, 8, bit(7))
  set(7, 8, bit(8))
  for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i))

  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i))
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i))
  set(8, size - 8, true)
}

/** Lay the codewords into the non-function modules, in the standard zig-zag. */
function placeCodewords(grid, fn, codewords) {
  const size = grid.length
  let i = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const upward = ((right + 1) & 2) === 0
        const y = upward ? size - 1 - vert : vert
        if (fn[y][x]) continue
        if (i < codewords.length * 8) {
          grid[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) === 1
          i++
        }
      }
    }
  }
}

const MASKS = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
]

function applyMask(grid, fn, mask) {
  const test = MASKS[mask]
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid.length; x++) {
      if (!fn[y][x] && test(x, y)) grid[y][x] = !grid[y][x]
    }
  }
}

/** ISO/IEC 18004 §7.8.3's penalty: runs, blocks, finder look-alikes, balance. */
function penalty(grid) {
  const size = grid.length
  let score = 0
  const lines = []
  for (let i = 0; i < size; i++) {
    lines.push(grid[i])
    lines.push(grid.map((row) => row[i]))
  }
  for (const line of lines) {
    let run = 1
    for (let i = 1; i <= size; i++) {
      if (i < size && line[i] === line[i - 1]) run++
      else {
        if (run >= 5) score += run - 2
        run = 1
      }
    }
    // 1:1:3:1:1 with four light modules on either side.
    const s = line.map((d) => (d ? '1' : '0')).join('')
    for (const pat of ['10111010000', '00001011101']) {
      for (let at = s.indexOf(pat); at !== -1; at = s.indexOf(pat, at + 1)) score += 40
    }
  }
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = grid[y][x]
      if (c === grid[y][x + 1] && c === grid[y + 1][x] && c === grid[y + 1][x + 1]) score += 3
    }
  }
  const dark = grid.reduce((n, row) => n + row.filter(Boolean).length, 0)
  const total = size * size
  score += Math.floor(Math.abs(dark * 20 - total * 10) / total) * 10
  return score
}

/**
 * The QR code for `text`, as rows of booleans (true is dark). No quiet zone —
 * that is the drawing's business.
 *
 * Throws on text longer than the largest version carries at level M (2,331
 * bytes), which no URL this product composes approaches.
 */
export function qrMatrix(text) {
  const bytes = [...new TextEncoder().encode(String(text))]
  let version = 1
  while (version <= 40) {
    const header = 4 + (version < 10 ? 8 : 16)
    if (header + bytes.length * 8 <= dataCodewords(version) * 8) break
    version++
  }
  if (version > 40) throw new Error('qr: text too long to encode')

  const codewords = interleave(dataStream(bytes, version), version)
  const size = version * 4 + 17

  let best = null
  for (let mask = 0; mask < 8; mask++) {
    const grid = emptyGrid(size)
    const fn = drawFunctionPatterns(grid, version)
    placeCodewords(grid, fn, codewords)
    applyMask(grid, fn, mask)
    drawFormat(grid, fn, mask)
    const score = penalty(grid)
    if (best === null || score < best.score) best = { grid, score }
  }
  return best.grid
}

/**
 * The QR code for `text` as an SVG document string: one path of unit squares,
 * with the four-module quiet zone the standard requires drawn as the viewBox's
 * margin, so the code scans wherever it is placed.
 */
export function qrSvg(text) {
  const grid = qrMatrix(text)
  const quiet = 4
  const span = grid.length + quiet * 2
  let d = ''
  grid.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) d += `M${x + quiet} ${y + quiet}h1v1h-1z`
    })
  })
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${span} ${span}" ` +
    `shape-rendering="crispEdges" role="img">` +
    `<rect width="${span}" height="${span}" fill="#fff"/>` +
    `<path fill="#000" d="${d}"/></svg>`
  )
}
