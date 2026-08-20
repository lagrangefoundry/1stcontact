import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderSiteFiles } from '../tools/generate/src/render'
import { fsSiteStore } from '../tools/generate/src/store/fs-store'
import { importSite } from '../tools/generate/src/store/import-site'
import { memorySiteStore } from '../tools/generate/src/store/memory-store'
import type { LoadedSite, LoadResult } from '../tools/generate/src/store/assemble'

/**
 * REQ-143 AC-6, the half that needs Astro — a site renders the same from any
 * store that holds it.
 *
 * WHY AC-6 IS PROVED IN TWO PLACES. The claim is that a site imported from
 * `storage/sites/` renders byte-identically from the D1/R2 store and the
 * filesystem store. No single test can assert that today, because the two ends
 * live in runtimes that cannot meet: D1 exists only inside workerd, and the
 * render runs through Astro's container API, which workerd has no transform for.
 * Relocating the render is precisely DOC-12 §7 phase 2's next step (REQ-145) and
 * is not this ticket.
 *
 * So the claim is split at the one place it can be split without a gap —
 * {@link LoadedSite}, which is the ONLY input `renderSiteFiles` reads:
 *
 *   1. The workerd suite proves a real site imported into D1 assembles to a
 *      `LoadedSite` deep-equal to the source store's.
 *   2. This file proves the render is a pure function of that `LoadedSite` — two
 *      stores holding the same definition produce byte-identical output.
 *
 * Together those give the AC. Neither half is a proxy for the other and neither
 * is hand-waved: the seam between them is a value both sides assert on, not a
 * narrative link.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const SITES = path.join(REPO, 'storage', 'sites')

/** Every real site on disk. Not a fixture — the sites the operator builds with. */
function realSlugs(): string[] {
  return readdirSync(SITES).filter((name) =>
    statSync(path.join(SITES, name, 'draft'), { throwIfNoEntry: false })?.isDirectory(),
  )
}

function readJson(file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
}

function unwrap(result: LoadResult, slug: string): LoadedSite {
  if (!result.ok) {
    throw new Error(`${slug} failed to assemble: ${result.errors.map((e) => e.message).join('; ')}`)
  }
  return result.value
}

describe('REQ-143 — the render is a pure function of the assembled site', () => {
  const slugs = realSlugs()

  it('UAT_FC_REQ-143 there is at least one real site to render', () => {
    // A guard, not decoration: an empty `storage/sites/` would make every
    // `it.each` below vacuous and the suite would go green having asserted
    // nothing at all.
    expect(slugs.length).toBeGreaterThan(0)
  })

  it.each(slugs)(
    'UAT_FC_REQ-143 %s renders byte-identically from the filesystem store and a store with no filesystem',
    async (slug) => {
      const draft = path.join(SITES, slug, 'draft')

      const fs = fsSiteStore({ cwd: REPO, root: 'sites' })
      const memory = memorySiteStore()
      memory.seed(slug, {
        siteJson: readJson(path.join(draft, 'site.json')),
        pages: Object.fromEntries(
          readdirSync(path.join(draft, 'pages'))
            .filter((name) => name.endsWith('.json'))
            .map((name) => [name, readJson(path.join(draft, 'pages', name))]),
        ),
        assets: Object.fromEntries(
          (statSync(path.join(draft, 'assets'), { throwIfNoEntry: false })?.isDirectory()
            ? readdirSync(path.join(draft, 'assets'))
            : []
          ).map((name) => [name, new Uint8Array(readFileSync(path.join(draft, 'assets', name)))]),
        ),
      })

      const fromFs = unwrap((await fs.loadDraft(slug))!.result, slug)
      const fromMemory = unwrap((await memory.loadDraft(slug))!.result, slug)

      // The assembled definitions agree apart from `sourceDir`, which names the
      // store by design and is documented as read by nothing at request time.
      expect({ ...fromMemory, sourceDir: '' }).toEqual({ ...fromFs, sourceDir: '' })

      const renderedFromFs = await renderSiteFiles(fromFs)
      const renderedFromMemory = await renderSiteFiles(fromMemory)

      expect(renderedFromMemory.pages).toEqual(renderedFromFs.pages)
      expect([...renderedFromMemory.files.keys()].sort()).toEqual(
        [...renderedFromFs.files.keys()].sort(),
      )
      // Byte-for-byte, every file. Not a spot check on the HTML: `theme.css` and
      // `capabilities.js` are where a store that quietly reordered pages or
      // dropped an asset would show up.
      for (const [file, content] of renderedFromFs.files) {
        expect(renderedFromMemory.files.get(file), `${slug}/${file}`).toBe(content)
      }
      expect(renderedFromFs.files.size).toBeGreaterThan(0)
    },
  )

  it('UAT_FC_REQ-143 an imported site renders identically to the site it was imported from', async () => {
    const slug = slugs[0]
    const source = fsSiteStore({ cwd: REPO, root: 'sites' })

    // The same `importSite` the D1 path uses — this is the port-to-port copy
    // (REQ-143 §5's import path), run here between two adapters that a single
    // runtime can hold. What it exercises is the function, not the destination.
    const destination = memorySiteStore()
    destination.seed(slug, { siteJson: {}, pages: {} })
    const summary = await importSite(source, destination, slug)
    expect(summary.siteJson).toBe(true)
    expect(summary.pages.length).toBeGreaterThan(0)

    const before = await renderSiteFiles(unwrap((await source.loadDraft(slug))!.result, slug))
    const after = await renderSiteFiles(unwrap((await destination.loadDraft(slug))!.result, slug))

    for (const [file, content] of before.files) {
      expect(after.files.get(file), `${slug}/${file}`).toBe(content)
    }
    expect(after.pages).toEqual(before.pages)
  })
})
