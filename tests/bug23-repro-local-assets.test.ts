/**
 * BUG-23 — the reproduction must serve its OWN mirrored assets, never hotlink
 * the captured origin.
 *
 * The fold transcribes the capture, so media handles come out as the absolute
 * URLs the original site served. `1c repro` mirrored the bundle's `assets/` into
 * the draft but left the handles pointing at the origin, so the reproduction
 * rendered only while that host was reachable — and every `1c shot` / `1c diff`
 * run compared the target against a page serving the target's own bytes. Hero
 * fidelity was guaranteed by the network, not by the pipeline, so the gate could
 * not detect an image-handling regression at all.
 *
 * These UATs drive `1c repro` + `1c render` end to end against a bundle whose
 * fold carries remote handles, and assert the rendered output is self-contained:
 * every referenced byte is on disk, and nothing names the captured origin.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { writeL1 } from '../tools/generate/src/cli/capture/bundle'
import { localizeAssets } from '../tools/generate/src/l1'
import { cmdRepro } from '../tools/generate/src/cli/repro'
import { cmdRender } from '../tools/generate/src/cli/commands'
import type { L1Document } from '../packages/site-schema/src/index'
import type { Capture, CaptureAsset } from '../tools/generate/src/cli/capture'
import { fsReferenceBundle } from '../tools/generate/src/store/fs-reference-store'

const ORIGIN = 'https://gigabytealchemy.ai'
const HERO = `${ORIGIN}/images/AlchemistLabWithTech.png`
const PHOTO = `${ORIGIN}/images/lab.jpg`
const FONT = 'https://fonts.gstatic.com/s/cinzel/v26/cinzel.woff2'
const WIDTHS = [320, 1280]

/** A folded document shaped like a real capture: hero band + photo leaf + face. */
function docWithRemoteHandles(): L1Document {
  const geometry = { keyframes: WIDTHS.map((at) => ({ at, x: 0, y: 0, width: at, height: 400 })) }
  return {
    widths: WIDTHS,
    root: {
      kind: 'box',
      children: [
        { kind: 'box', id: 'section-bg-0', geometry, axes: { backgroundImageUrl: HERO } },
        {
          kind: 'container',
          layout: 'stack',
          geometry,
          children: [{ kind: 'image', id: 'img-0', geometry, src: PHOTO, alt: 'Lab' }],
        },
      ],
    },
    resources: { fonts: [{ family: 'Cinzel', src: FONT }] },
  } as L1Document
}

/** The bundle's origin→mirror map, as `capture.json` records it. */
function assetMap(): CaptureAsset[] {
  return [
    { id: 'hero', kind: 'image', src: HERO, localPath: 'assets/AlchemistLabWithTech.png' },
    { id: 'photo', kind: 'image', src: PHOTO, localPath: 'assets/lab.jpg' },
    { id: 'face', kind: 'font', src: FONT, localPath: 'assets/cinzel.woff2' },
    // Mirrored but unreferenced by the fold — the AC-4 fold-gap signal.
    { id: 'orphan', kind: 'image', src: `${ORIGIN}/images/unused.png`, localPath: 'assets/unused.png' },
    // A page subresource: never L1-referenceable, so never reported as a gap.
    { id: 'sheet', kind: 'stylesheet', src: `${ORIGIN}/site.css`, localPath: 'assets/site.css' },
  ]
}

let cwd: string
beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'bug23-'))
})
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/** Write a capture bundle: folded l1.json, the asset map, and the mirrored bytes. */
async function bundle(doc: L1Document, assets: CaptureAsset[]): Promise<string> {
  const dir = path.join(cwd, 'bundle')
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  await writeL1(fsReferenceBundle(dir), doc)
  const capture = { url: `${ORIGIN}/`, host: 'gigabytealchemy.ai', assets } as unknown as Capture
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))
  for (const a of assets) writeFileSync(path.join(dir, a.localPath), `bytes:${a.id}`)
  return dir
}

describe('BUG-23 — reproduction serves its own mirrored assets', () => {
  it('test_UAT_FC_BUG-23_media_handles_resolve_to_local_mirror', async () => {
    const ref = await bundle(docWithRemoteHandles(), assetMap())
    const result = await cmdRepro('gigabyte', { cwd, ref })

    // AC-1: every asset-bearing axis — background image, image leaf src, and the
    // font face — now names the site's own mirror, not the captured origin.
    expect(result.localizedAssets).toBe(3)
    const page = JSON.parse(
      readFileSync(path.join(result.draftDir, 'pages', 'home.json'), 'utf8'),
    ) as { l1: L1Document }
    const json = JSON.stringify(page.l1)
    expect(json).toContain('/assets/AlchemistLabWithTech.png')
    expect(json).toContain('/assets/lab.jpg')
    expect(json).toContain('/assets/cinzel.woff2')
    expect(json).not.toContain(ORIGIN)
    expect(json).not.toContain('fonts.gstatic.com')
  })

  it('test_UAT_FC_BUG-23_rendered_output_is_free_of_captured_origin', async () => {
    const ref = await bundle(docWithRemoteHandles(), assetMap())
    await cmdRepro('gigabyte', { cwd, ref })
    const { outDir } = await cmdRender('gigabyte', { cwd })

    // AC-2: no absolute URL pointing at the captured origin survives into any
    // rendered artifact (the CSS carries the background-image + @font-face).
    for (const file of readdirSync(outDir)) {
      const full = path.join(outDir, file)
      if (!full.endsWith('.html') && !full.endsWith('.css')) continue
      const body = readFileSync(full, 'utf8')
      expect(body).not.toContain(ORIGIN)
      expect(body).not.toContain('fonts.gstatic.com')
    }
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    const css = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    // REQ-109 — the definition still authors `/assets/…`; the RENDERED handle is
    // document-relative so the snapshot is relocatable under any path prefix.
    expect(`${html}${css}`).toContain('url("assets/AlchemistLabWithTech.png")')
  })

  it('test_UAT_FC_BUG-23_reproduction_renders_without_reaching_the_target_host', async () => {
    const ref = await bundle(docWithRemoteHandles(), assetMap())
    await cmdRepro('gigabyte', { cwd, ref })
    const { outDir } = await cmdRender('gigabyte', { cwd })

    // AC-3: the render is self-contained — every handle it emits resolves to a
    // file that exists in the render output, so no request ever leaves the box.
    const body = [
      readFileSync(path.join(outDir, 'index.html'), 'utf8'),
      readFileSync(path.join(outDir, 'theme.css'), 'utf8'),
    ].join('\n')
    // REQ-109 — rendered handles are document-relative (`assets/…`); the leading
    // slash is optional here so the check reads either shape as self-contained.
    const refs = [...body.matchAll(/["'(](\/?assets\/[^"')]+)/g)].map((m) => m[1])
    expect(refs.length).toBeGreaterThan(0)
    for (const r of refs) {
      expect(existsSync(path.join(outDir, r.replace(/^\//, '')))).toBe(true)
    }
    // …and there is no absolute handle left at all.
    expect(/https?:\/\//.test(body.replace(/https?:\/\/www\.w3\.org[^"']*/g, ''))).toBe(false)
  })

  it('test_UAT_FC_BUG-23_unreferenced_mirrored_assets_are_reported_as_a_fold_gap', async () => {
    const ref = await bundle(docWithRemoteHandles(), assetMap())
    const result = await cmdRepro('gigabyte', { cwd, ref })

    // AC-4: the orphan image (bytes mirrored, no node references it) is reported.
    // The stylesheet is a page subresource, never L1-referenceable, so it is not.
    expect(result.unreferencedAssets).toEqual(['assets/unused.png'])
  })

  it('test_UAT_FC_BUG-23_unmirrored_handle_fails_the_import_rather_than_hotlinking', async () => {
    // Drop the hero from the asset map: the bundle no longer mirrors it. Falling
    // back to the origin is exactly the defect, so the import must fail loudly.
    const partial = assetMap().filter((a) => a.src !== HERO)
    const ref = await bundle(docWithRemoteHandles(), partial)
    await expect(cmdRepro('gigabyte', { cwd, ref })).rejects.toThrow(/hotlink the captured origin/)
    await expect(cmdRepro('gigabyte', { cwd, ref })).rejects.toThrow(/AlchemistLabWithTech\.png/)
  })

  it('test_UAT_FC_BUG-23_localize_is_pure_and_normalizes_already_local_handles', () => {
    const doc = docWithRemoteHandles()
    const before = JSON.stringify(doc)
    const first = localizeAssets(doc, assetMap())
    // Pure: the caller's document is untouched (the fold's artifact stays faithful
    // to the capture; only the site's copy is bound to the mirror).
    expect(JSON.stringify(doc)).toBe(before)

    // Idempotent + depth-independent: a second pass over already-local handles
    // leaves them root-relative, rewrites nothing further, and stays resolved.
    const second = localizeAssets(first.doc, assetMap())
    expect(second.rewritten).toEqual([])
    expect(JSON.stringify(second.doc)).toBe(JSON.stringify(first.doc))
    expect(second.unmirrored).toEqual([])
    expect(second.unreferenced).toEqual(['assets/unused.png'])
  })
})
