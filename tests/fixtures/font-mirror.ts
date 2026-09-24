/**
 * [[REQ-314]] — a populated font mirror in a temp workspace.
 *
 * WHY A FIXTURE AT ALL. `tools/generate/src/cli/ai/platform-fonts.json` is
 * COMMITTED EMPTY — `{"mirror":null,"families":[]}` — because the mirror is a
 * build product and a fresh checkout has none. A suite that read the bundled
 * projection would therefore assert against an empty corpus on every machine but
 * the one that last ran `1c fonts mirror`, which is a suite that proves nothing
 * and passes anyway.
 *
 * THE FAMILIES ARE REAL AND ONLY THE BYTES ARE NOT. Every entry is lifted
 * verbatim out of the repository's own committed `fonts/catalogue.json` — its
 * real category, its real `stroke`, its real weights — so a test asserting that
 * `Roboto Slab` answers the Slab Serif chip is asserting against the same
 * classification the shipped control reads. What is synthesised is the manifest
 * (`fonts/platform.json`) and the staged `woff2` files, because those are the
 * gigabyte this repository deliberately does not carry.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
/** The repository root, from this file — `tests/fixtures/` is two deep. */
const REPO = path.resolve(HERE, '../..')

interface CatalogueFamily {
  family: string
  slug: string
  licence: string
  licence_source: string
  category?: string
  stroke?: string
  weights?: number[]
  italic?: boolean
  variable?: boolean
  axes?: { tag: string; min?: number; max?: number }[]
  [key: string]: unknown
}

let cached: CatalogueFamily[] | null = null

/** The repository's own catalogue — read once per process, it is 1.1MB. */
export function repoCatalogue(): CatalogueFamily[] {
  if (!cached) {
    const raw = fs.readFileSync(path.join(REPO, 'fonts', 'catalogue.json'), 'utf8')
    cached = (JSON.parse(raw) as { families: CatalogueFamily[] }).families
  }
  return cached
}

/** A digest-shaped string. The manifest schema requires 64 hex characters. */
function digest(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return hash.toString(16).padStart(8, '0').repeat(8)
}

/**
 * Write a catalogue, a manifest and staged bytes for `families` into `cwd`.
 *
 * ONE 400/normal FACE PER FAMILY, plus an italic where the catalogue declares
 * one — which is what `faceFor` needs to find a preview face and what
 * `resolveFont` needs to bind anything at all. Variable families get their file
 * marked so a weight the catalogue names but no static file draws still resolves,
 * exactly as the real mirror's does.
 *
 * @returns the family names actually written — a name the catalogue does not
 *   carry is skipped rather than fabricated, because a fixture that invents a
 *   family can prove the control lists families that do not exist.
 */
export function seedFontMirror(cwd: string, families: readonly string[]): string[] {
  const byName = new Map(repoCatalogue().map((f) => [f.family.toLowerCase(), f]))
  const picked: CatalogueFamily[] = []
  for (const name of families) {
    const entry = byName.get(name.toLowerCase())
    // Only what the mirror could actually hold: the platform tier is OFL/Apache
    // by allowlist, and a fixture carrying a UFL family would be testing a state
    // `1c fonts mirror` cannot produce.
    if (entry && (entry.licence === 'OFL-1.1' || entry.licence === 'Apache-2.0')) picked.push(entry)
  }

  const fontsDir = path.join(cwd, 'fonts')
  fs.mkdirSync(fontsDir, { recursive: true })
  fs.writeFileSync(
    path.join(fontsDir, 'catalogue.json'),
    JSON.stringify(
      {
        source: 'fixture',
        retrieved: '2026-09-23',
        family_count: picked.length,
        families: picked,
        caveats: [],
      },
      null,
      1,
    ),
  )

  const manifestFamilies = picked.map((entry) => {
    const upstreamDir = entry.licence_source.replace(/\/METADATA\.pb$/, '')
    const stem = entry.family.replace(/[^A-Za-z0-9]/g, '')
    const files = [
      {
        path: `${entry.slug}/${stem}-Regular.woff2`,
        upstream: `${stem}-Regular.ttf`,
        weight: 400,
        style: 'normal' as const,
        ...(entry.variable ? { axes: (entry.axes ?? []).map((a) => a.tag) } : {}),
        bytes: 1024,
        sha256: digest(`${entry.slug}-regular`),
        upstream_sha256: digest(`${entry.slug}-regular-ttf`),
      },
      ...(entry.italic
        ? [
            {
              path: `${entry.slug}/${stem}-Italic.woff2`,
              upstream: `${stem}-Italic.ttf`,
              weight: 400,
              style: 'italic' as const,
              bytes: 1024,
              sha256: digest(`${entry.slug}-italic`),
              upstream_sha256: digest(`${entry.slug}-italic-ttf`),
            },
          ]
        : []),
    ]
    for (const file of files) {
      const abs = path.join(fontsDir, 'mirror', file.path)
      fs.mkdirSync(path.dirname(abs), { recursive: true })
      // `wOF2` — the real magic number, so a served preview is recognisable as a
      // font rather than as a text file that happens to be 404-free.
      fs.writeFileSync(abs, Buffer.concat([Buffer.from('wOF2'), Buffer.alloc(1020)]))
    }
    return {
      family: entry.family,
      slug: entry.slug,
      licence: entry.licence as 'OFL-1.1' | 'Apache-2.0',
      upstream_dir: upstreamDir,
      source: `https://github.com/google/fonts/tree/main/${upstreamDir}`,
      copyright: [`Copyright the ${entry.family} Project Authors`],
      licence_file: `${entry.slug}/OFL.txt`,
      mirrored: '2026-09-23',
      files,
    }
  })

  fs.writeFileSync(
    path.join(fontsDir, 'platform.json'),
    JSON.stringify(
      {
        catalogue: { retrieved: '2026-09-23', family_count: picked.length },
        upstream: { repo: 'https://github.com/google/fonts', ref: 'fixture' },
        format: { container: 'woff2', source: 'sfnt', transform: 'none' },
        families: manifestFamilies,
      },
      null,
      1,
    ),
  )

  return picked.map((f) => f.family)
}
