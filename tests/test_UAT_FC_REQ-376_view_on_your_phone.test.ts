// @vitest-environment jsdom
/**
 * [[REQ-376]] UATs — **View on your phone**: the draft, as a QR code, beside
 * "Open in new tab".
 *
 * WHAT MAKES THIS EVIDENCE. The builder claims are driven against the ACTUAL
 * composition — `mountBuilder`, the real panel, the real toolbar, the real URL
 * helpers — exactly as BUG-131's suite drives "Open in new tab", because the
 * claim is that the two controls derive the SAME address from the LIVE pane.
 *
 * AND THE CODE IS READ BACK, NOT TRUSTED. Every assertion about what the code
 * says goes through {@link decodeSvg}, a reader written here from ISO/IEC 18004
 * and sharing nothing with `qr.js`: it reads the modules off the SVG that is on
 * screen, takes the alignment positions from the standard's table rather than a
 * formula, recovers the mask from the format bits' own BCH code, and finds the
 * block layout by searching for the one whose Reed–Solomon syndromes are all
 * zero — so a wrong table, a wrong mask, a wrong zig-zag or a wrong error
 * correction in the encoder cannot come back as the right URL.
 *
 * Covered:
 *
 *   1  the control sits immediately after "Open in new tab" in View and in Edit
 *   2  the code is the "Open in new tab" address, made absolute — and in Edit
 *      that is the draft channel, never the edit channel
 *   3  the code decodes, including a long address that needs a large version
 *      (several error-correction blocks and the version-information areas)
 *   4  changing page while the dialog is open re-draws the code for the new page;
 *      rebuilding the strip closes it
 *   5  the dialog says what will happen, shows the address and copies it
 *   6  the consultant's priming names the control, in both declared orders
 */
import { beforeEach, describe, expect, it } from 'vitest'
import * as pageState from '../packages/framework/src/l1/page-state'
import { setBusinessScope } from '../apps/control-app/src/builder/api.js'
import { openPhonePreview } from '../apps/control-app/src/builder/phone-preview.js'
import { primingConfig } from '../tools/generate/src/cli/ai/roles'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

// ── an independent QR reader ────────────────────────────────────────────────

/** ISO/IEC 18004 Annex E — alignment pattern centres, by version. */
const ALIGNMENT: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
  11: [6, 30, 54],
  12: [6, 32, 58],
  13: [6, 34, 62],
  14: [6, 26, 46, 66],
  15: [6, 26, 48, 70],
  16: [6, 26, 50, 74],
  17: [6, 30, 54, 78],
  18: [6, 30, 56, 82],
  19: [6, 30, 58, 86],
  20: [6, 34, 62, 90],
}

/** ISO §8.8.1's mask conditions, in the standard's own (row i, column j) form. */
const MASK: Array<(i: number, j: number) => boolean> = [
  (i, j) => (i + j) % 2 === 0,
  (i) => i % 2 === 0,
  (_i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0,
  (i, j) => (((i * j) % 3) + ((i + j) % 2)) % 2 === 0,
]

/** GF(256) by log/antilog tables — a different construction from the encoder's. */
const EXP: number[] = []
const LOG: number[] = []
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x
  LOG[x] = i
  x <<= 1
  if (x & 0x100) x ^= 0x11d
}
const gfMul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[(LOG[a] + LOG[b]) % 255])

/** True when every syndrome of `block` (data then ECC) over α^0..α^(ecc-1) is zero. */
function syndromesZero(block: number[], ecc: number): boolean {
  for (let k = 0; k < ecc; k++) {
    let s = 0
    for (const c of block) s = gfMul(s, EXP[k]) ^ c
    if (s !== 0) return false
  }
  return true
}

/** The fifteen-bit format word for (level, mask), by BCH(15,5) long division. */
function formatWord(level: number, mask: number): number {
  const data = (level << 3) | mask
  let rem = data << 10
  for (let bit = 14; bit >= 10; bit--) if (rem & (1 << bit)) rem ^= 0x537 << (bit - 10)
  return ((data << 10) | rem) ^ 0x5412
}

/** Read the text out of a QR code drawn as `qr.js` draws it. */
function decodeSvg(svg: SVGElement): { text: string; version: number; blocks: number } {
  const span = Number(svg.getAttribute('viewBox')!.split(' ')[2])
  const quiet = 4
  const size = span - quiet * 2
  const dark: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))
  const d = svg.querySelector('path')!.getAttribute('d')!
  for (const m of d.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) dark[Number(m[2]) - quiet][Number(m[1]) - quiet] = true

  const version = (size - 17) / 4
  expect(Number.isInteger(version) && version >= 1, `not a QR size: ${size}`).toBe(true)
  const centres = ALIGNMENT[version]
  expect(centres, `the reader's table stops before version ${version}`).toBeDefined()

  // Which modules are NOT data: finders + separators + format, timing,
  // alignment, the dark module, version information.
  const reserved = (r: number, c: number): boolean => {
    if (r <= 8 && c <= 8) return true
    if (r <= 8 && c >= size - 8) return true
    if (r >= size - 8 && c <= 8) return true
    if (r === 6 || c === 6) return true
    if (version >= 7 && ((r <= 5 && c >= size - 11 && c <= size - 9) || (c <= 5 && r >= size - 11 && r <= size - 9))) {
      return true
    }
    const last = centres.length - 1
    for (let a = 0; a <= last; a++) {
      for (let b = 0; b <= last; b++) {
        if ((a === 0 && b === 0) || (a === 0 && b === last) || (a === last && b === 0)) continue
        if (Math.abs(r - centres[a]) <= 2 && Math.abs(c - centres[b]) <= 2) return true
      }
    }
    return false
  }

  // Format, first copy: around the top-left finder, bit 14 first.
  const positions: Array<[number, number]> = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ]
  let read = 0
  for (let b = 14; b >= 0; b--) {
    const [r, c] = positions[14 - b]
    if (dark[r][c]) read |= 1 << b
  }
  let level = -1
  let mask = -1
  for (let l = 0; l < 4; l++) for (let m = 0; m < 8; m++) if (formatWord(l, m) === read) [level, mask] = [l, m]
  expect(mask, `format bits ${read.toString(2)} name no level/mask`).not.toBe(-1)
  expect(level, 'error correction level is not M').toBe(0)

  // The zig-zag, unmasking as it reads.
  const bits: number[] = []
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right = 5
    const upward = ((size - 1 - right) >> 1) % 2 === 0
    for (let v = 0; v < size; v++) {
      const r = upward ? size - 1 - v : v
      for (const c of [right, right - 1]) {
        if (reserved(r, c)) continue
        bits.push(Number(dark[r][c] !== MASK[mask](r, c)))
      }
    }
  }
  const total = Math.floor(bits.length / 8)
  const codewords: number[] = []
  for (let i = 0; i < total; i++) codewords.push(bits.slice(i * 8, i * 8 + 8).reduce((a, b) => (a << 1) | b, 0))

  // The block layout is FOUND, not looked up: the one whose every block is a
  // Reed–Solomon codeword, preferring the most error correction.
  for (let ecc = 30; ecc >= 7; ecc--) {
    for (let blocks = 1; blocks <= 81; blocks++) {
      const shortLen = Math.floor(total / blocks)
      const shortCount = blocks - (total % blocks)
      const dataLen = (i: number) => shortLen - ecc + (i < shortCount ? 0 : 1)
      if (dataLen(0) <= 0) break
      const split: number[][] = Array.from({ length: blocks }, () => [])
      let k = 0
      const maxData = dataLen(blocks - 1)
      for (let col = 0; col < maxData; col++) {
        for (let i = 0; i < blocks; i++) if (col < dataLen(i)) split[i].push(codewords[k++])
      }
      for (let col = 0; col < ecc; col++) for (let i = 0; i < blocks; i++) split[i].push(codewords[k++])
      if (!split.every((block) => syndromesZero(block, ecc))) continue

      const data = split.flatMap((block, i) => block.slice(0, dataLen(i)))
      const stream = data.flatMap((byte) => [7, 6, 5, 4, 3, 2, 1, 0].map((s) => (byte >> s) & 1))
      let at = 0
      const take = (n: number) => {
        let v = 0
        for (let i = 0; i < n; i++) v = (v << 1) | stream[at++]
        return v
      }
      expect(take(4), 'not byte mode').toBe(0b0100)
      const length = take(version < 10 ? 8 : 16)
      const bytes = Array.from({ length }, () => take(8))
      return { text: new TextDecoder().decode(new Uint8Array(bytes)), version, blocks }
    }
  }
  throw new Error('no block layout makes every block a Reed–Solomon codeword')
}

// ── the builder ─────────────────────────────────────────────────────────────

const SITES = [{ site: 'acme', latest: null }]
const PAGES = [
  { id: 'home', slug: 'home', title: 'Home', reachable: true },
  { id: 'about', slug: 'about', title: 'About us', reachable: true },
]

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  } as Storage
}

const settled = () => new Promise((resolve) => setTimeout(resolve, 0))

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`REQ-376 phone-preview suite skipped: ${WEBUI_SKIP_REASON}`)

describe.skipIf(!WEBUI_INSTALLED)('REQ-376 — View on your phone', () => {
  let root: HTMLElement

  beforeEach(async () => {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    setBusinessScope(null)
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
  })

  const mount = (over: Record<string, unknown> = {}) =>
    mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      pageState,
      pagesTransport: { list: async () => ({ pages: PAGES }) },
      ...over,
    })

  const modeButton = (id: string) =>
    root.querySelector(`.builder-toolbar__modes button[data-mode="${id}"]`) as HTMLButtonElement
  const phoneButton = () => root.querySelector('[data-action="phone-preview"]') as HTMLButtonElement | null
  const tabHref = () => (root.querySelector('.builder-toolbar__open') as HTMLAnchorElement).getAttribute('href')!
  const dialog = () => document.querySelector('.builder-phone') as HTMLElement | null
  const decoded = () => decodeSvg(dialog()!.querySelector('.builder-phone__code svg') as SVGElement).text
  const absolute = (href: string) => new URL(href, document.baseURI).href
  const choose = (slug: string): void => {
    const select = root.querySelector('[data-action="pages"] select') as HTMLSelectElement
    select.value = slug
    select.dispatchEvent(new Event('change'))
  }

  it('test_UAT_FC_REQ-376_the_control_sits_beside_open_in_new_tab_in_view_and_edit', async () => {
    const app = mount()
    await settled()
    for (const mode of ['view', 'edit']) {
      modeButton(mode).click()
      await settled()
      const ids: string[] = app.toolbar.ids()
      expect(ids, `in ${mode}`).toContain('open-new-tab')
      expect(ids.indexOf('phone-preview'), `in ${mode}`).toBe(ids.indexOf('open-new-tab') + 1)
      expect(phoneButton()!.textContent).toBe('View on your phone')
    }
  })

  it('test_UAT_FC_REQ-376_the_code_is_the_open_in_new_tab_address_and_the_draft_in_edit', async () => {
    mount()
    await settled()
    modeButton('edit').click()
    await settled()
    choose('about')

    phoneButton()!.click()
    expect(dialog(), 'no dialog opened').not.toBeNull()
    const text = decoded()
    // One address, two controls: the tab's, made absolute for another device.
    expect(text).toBe(absolute(tabHref()))
    expect(text).toMatch(/^https?:\/\//)
    expect(text).toContain('/preview/acme/draft/about')
    expect(text).not.toContain('/edit/')
    // The written address is the same value the code carries.
    expect((dialog()!.querySelector('.builder-phone__url input') as HTMLInputElement).value).toBe(text)
  })

  it('test_UAT_FC_REQ-376_a_long_address_still_round_trips', () => {
    // Long enough to need a large version: several error-correction blocks and
    // the version-information areas, which a short URL never exercises.
    const long = `/b/acct_${'x'.repeat(40)}/preview/${'site-'.repeat(20)}/draft/${'page/'.repeat(25)}`
    const handle = openPhonePreview({ url: long })
    const svg = handle.element.querySelector('.builder-phone__code svg') as SVGElement
    const out = decodeSvg(svg)
    expect(out.text).toBe(absolute(long))
    expect(out.version).toBeGreaterThanOrEqual(7)
    expect(out.blocks).toBeGreaterThan(1)
    handle.close()
  })

  it('test_UAT_FC_REQ-376_changing_page_redraws_the_code_and_a_rebuilt_strip_closes_it', async () => {
    const app = mount()
    await settled()
    choose('home')
    phoneButton()!.click()
    expect(decoded()).toBe(absolute('/preview/acme/draft/home'))

    // The page changes underneath the open dialog — the code must follow it.
    choose('about')
    expect(dialog(), 'the dialog closed instead of following').not.toBeNull()
    expect(decoded()).toBe(absolute('/preview/acme/draft/about'))
    expect(decoded()).toBe(absolute(tabHref()))

    // A mode change rebuilds the strip; the dialog goes with the control.
    app.panel.setMode('edit')
    await settled()
    expect(dialog()).toBeNull()
  })

  it('test_UAT_FC_REQ-376_the_dialog_says_what_will_happen_and_copies_the_address', async () => {
    mount()
    await settled()
    phoneButton()!.click()
    const text = dialog()!.textContent!
    expect(text).toMatch(/camera/i)
    expect(text).toMatch(/sign in/i)
    expect(text).toMatch(/same email/i)

    const copied: string[] = []
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (s: string) => void copied.push(s) },
    })
    const copy = [...dialog()!.querySelectorAll('button')].find((b) => b.textContent === 'Copy')!
    copy.click()
    await settled()
    expect(copied).toEqual([decoded()])
    expect(copy.textContent).toBe('Copied')
  })
})

describe('REQ-376 — the consultant is told the control exists', () => {
  it('test_UAT_FC_REQ-376_the_consultant_priming_names_the_control_in_both_orders', () => {
    for (const withCorpus of [true, false]) {
      const entries = primingConfig(withCorpus).priming as Array<{ text?: unknown }>
      const told = entries.map((e) => (typeof e.text === 'string' ? e.text : '')).join('\n')
      expect(told, `withCorpus=${withCorpus}`).toContain('View on your phone')
      expect(told).toMatch(/View on your phone\* beside the preview/)
      expect(told).toMatch(/same email/)
    }
  })
})
