/**
 * [[BUG-227]] — a platform font the page names is a font the browser will load.
 *
 * WHAT WAS TRUE BEFORE. Every look on a site declared its faces correctly and the
 * renderer emitted the matching `@font-face`, and the faces still painted as
 * fallbacks in the client's own browser. The bytes were the defect: the mirror's
 * WOFF2 encoder ended the file on the last Brotli byte, and the decoder every
 * browser ships refuses a file whose compressed block does not end on a 4-byte
 * boundary. Three in four of the corpus were "Invalid font data" in Chrome, and
 * the mirror's incremental carry kept every one of them forever because its
 * digest still matched.
 *
 * WHAT MAKES THESE EVIDENCE. The real `fonts mirror` entry point, a real
 * TrueType font already committed to this repository, a real temp workspace and
 * a `google/fonts`-shaped checkout on disk. Nothing is mocked. The assertion is
 * the framing check a browser's decoder makes, stated over the bytes on disk.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import type { PlatformFontManifest } from '../packages/site-schema/src/index'
import { cmdFontsMirror } from '../tools/generate/src/cli/font-mirror'
import { MANIFEST_REL, MIRROR_DIR_REL } from '../tools/generate/src/fonts/mirror'
import { sha256 } from '../tools/generate/src/fonts/upstream'
import { woff2ToSfnt } from '../tools/generate/src/fonts/woff2'

const UPSTREAM_TTF = fileURLToPath(new URL('./fixtures/capture/heading-font.ttf', import.meta.url))
const TODAY = '2026-10-18'
const REF = '0123456789abcdef0123456789abcdef01234567'
const SLUG = 'headingfont'
const FILE = 'HeadingFont-Regular'

const scratch: string[] = []
afterEach(() => {
  while (scratch.length > 0) rmSync(scratch.pop()!, { recursive: true, force: true })
})

/** A checkout with one OFL family whose release file is the real TTF. */
function checkout(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'bug227-gf-'))
  scratch.push(dir)
  const family = path.join(dir, 'ofl', SLUG)
  mkdirSync(family, { recursive: true })
  writeFileSync(
    path.join(family, 'METADATA.pb'),
    [
      'name: "Heading Font"',
      'license: "OFL"',
      'fonts {',
      '  name: "Heading Font"',
      '  style: "normal"',
      '  weight: 400',
      `  filename: "${FILE}.ttf"`,
      '  copyright: "Copyright 2026 The Heading Font Project Authors"',
      '}',
    ].join('\n') + '\n',
  )
  writeFileSync(path.join(family, 'OFL.txt'), 'Copyright 2026\n\nSIL OPEN FONT LICENSE Version 1.1\n')
  writeFileSync(path.join(family, `${FILE}.ttf`), readFileSync(UPSTREAM_TTF))
  return dir
}

/** A workspace whose catalogue documents that one family. */
function workspace(): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'bug227-repo-'))
  scratch.push(cwd)
  mkdirSync(path.join(cwd, 'fonts'), { recursive: true })
  writeFileSync(path.join(cwd, 'fonts', 'registry.yaml'), 'fonts: []\n')
  writeFileSync(
    path.join(cwd, 'fonts', 'catalogue.json'),
    JSON.stringify({
      source: 'fixture',
      retrieved: TODAY,
      family_count: 1,
      families: [
        {
          family: 'Heading Font',
          slug: SLUG,
          licence: 'OFL-1.1',
          licence_source: `ofl/${SLUG}/METADATA.pb`,
          variable: false,
        },
      ],
    }),
  )
  return cwd
}

/** The two framing facts a browser's decoder checks before it reads a table. */
function framing(bytes: Buffer): { headerLength: number; size: number; aligned: boolean } {
  return { headerLength: bytes.readUInt32BE(8), size: bytes.length, aligned: bytes.length % 4 === 0 }
}

/**
 * The file as the encoder wrote it before this fix: the same bytes with the
 * trailing padding taken off and the header's `length` saying so. `null` when
 * this output needed no padding, and so has no legacy twin.
 */
function legacyOf(padded: Buffer): Buffer | null {
  let end = padded.length
  while (end > padded.length - 3 && padded[end - 1] === 0) end -= 1
  if (end === padded.length) return null
  const legacy = Buffer.from(padded.subarray(0, end))
  legacy.writeUInt32BE(legacy.length, 8)
  return legacy
}

/**
 * Mirror the family at the first quality level whose output needed padding —
 * a file that happened to land on a boundary cannot stand in for a broken one,
 * and across a handful of levels one always does not.
 */
function mirrorNeedingPadding(cwd: string, repo: string): { staged: string; legacy: Buffer } {
  const staged = path.join(cwd, MIRROR_DIR_REL, SLUG, `${FILE}.woff2`)
  for (const quality of [5, 4, 6, 3, 7, 2, 8]) {
    rmSync(path.join(cwd, MIRROR_DIR_REL), { recursive: true, force: true })
    rmSync(path.join(cwd, MANIFEST_REL), { force: true })
    expect(cmdFontsMirror({ cwd, repo, ref: REF, today: TODAY, quality }).failures).toEqual([])
    const legacy = legacyOf(readFileSync(staged))
    if (legacy) return { staged, legacy }
  }
  throw new Error('no quality level produced a file that needed padding')
}

describe('BUG-227 — the mirror writes WOFF2 a browser will load', () => {
  it('test_UAT_FC_BUG-227_every_mirrored_woff2_is_framed_as_a_browser_requires', () => {
    const cwd = workspace()
    const report = cmdFontsMirror({ cwd, repo: checkout(), ref: REF, today: TODAY, quality: 5 })
    expect(report.failures).toEqual([])
    expect(report.written).toBe(1)

    const bytes = readFileSync(path.join(cwd, MIRROR_DIR_REL, SLUG, `${FILE}.woff2`))
    // The header's `length` is the file's, and the file ends on a 4-byte
    // boundary — the two checks that turned three in four of the corpus into
    // "Invalid font data".
    expect(framing(bytes)).toEqual({ headerLength: bytes.length, size: bytes.length, aligned: true })
    // And the padding took nothing away: it still reverses to a font.
    expect(woff2ToSfnt(bytes).length).toBeGreaterThan(0)

    // The manifest describes exactly what is on disk, so publish and seed move
    // the padded bytes and `1c fonts check` reads the right size.
    const manifest = JSON.parse(readFileSync(path.join(cwd, MANIFEST_REL), 'utf8')) as PlatformFontManifest
    expect(manifest.families[0].files[0].bytes).toBe(bytes.length)
    expect(manifest.families[0].files[0].sha256).toBe(sha256(bytes))
  })

  it('test_UAT_FC_BUG-227_an_unpadded_woff2_is_refused_the_way_a_browser_refuses_it', () => {
    const cwd = workspace()
    const { legacy } = mirrorNeedingPadding(cwd, checkout())

    expect(framing(legacy).aligned).toBe(false)
    expect(() => woff2ToSfnt(legacy)).toThrow(/Misframed WOFF2/)
  })

  it('test_UAT_FC_BUG-227_a_staged_file_from_the_old_encoder_is_rewritten_not_carried', () => {
    // THE CARRY IS WHAT KEPT THE CORPUS BROKEN. A refresh carries a staged file
    // whose digest matches the manifest, and the broken files all matched — so
    // fixing the encoder alone would have changed nothing on disk. Here the
    // staged file and its manifest entry are put back exactly as the old encoder
    // left them, and a refresh against an unchanged upstream must redo it.
    const cwd = workspace()
    const repo = checkout()
    const { staged, legacy } = mirrorNeedingPadding(cwd, repo)
    writeFileSync(staged, legacy)
    const manifestPath = path.join(cwd, MANIFEST_REL)
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as PlatformFontManifest
    manifest.families[0].files[0].bytes = legacy.length
    manifest.families[0].files[0].sha256 = sha256(legacy)
    writeFileSync(manifestPath, JSON.stringify(manifest))
    const refresh = cmdFontsMirror({ cwd, repo, ref: REF, today: TODAY, quality: 5 })
    expect(refresh.failures).toEqual([])
    expect(refresh.written).toBe(1)
    expect(refresh.unchanged).toBe(0)

    const rewritten = readFileSync(staged)
    expect(framing(rewritten)).toEqual({ headerLength: rewritten.length, size: rewritten.length, aligned: true })
    const after = JSON.parse(readFileSync(manifestPath, 'utf8')) as PlatformFontManifest
    expect(after.families[0].files[0].sha256).toBe(sha256(rewritten))
  })
})
