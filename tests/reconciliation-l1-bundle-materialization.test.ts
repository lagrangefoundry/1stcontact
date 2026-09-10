/**
 * Reconciliation UAT — story-8acc338d, AC-1628: a retained capture bundle
 * materializes as a servable 1c site whose home page **is** the bundle's folded
 * L1 document (REQ-88 / BUG-23).
 *
 * This is the last step of the fold half of the pipeline: everything upstream
 * produces `l1.json` in a bundle, and this is what turns that artifact into a
 * draft the existing render / serve / shot / diff loop can operate on unchanged.
 *
 * The UAT drives the real `cmdRepro` entry point over bundles written to a
 * temporary directory — the same boundary `1c repro` calls. Nothing internal is
 * mocked; the only synthetic input is the bundle itself.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { writeL1 } from '../tools/generate/src/cli/capture/bundle'
import { cmdRepro } from '../tools/generate/src/cli/repro'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import type { Capture, CaptureAsset } from '../tools/generate/src/cli/capture'

const ORIGIN = 'https://reference.example.com'
const HERO = `${ORIGIN}/images/hero.png`
const PHOTO = `${ORIGIN}/images/lab.jpg`
const FONT = 'https://fonts.gstatic.com/s/cinzel/v26/cinzel.woff2'
const WIDTHS = [320, 1280]

/** A folded document shaped like a real capture: a painted band, an image leaf
 *  in a container, and a face — three media handles across three axis shapes. */
function docWithRemoteHandles(extra: L1Node[] = []): L1Document {
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
          children: [{ kind: 'image', id: 'image-0', geometry, src: PHOTO, alt: 'Lab' }],
        },
        ...extra,
      ],
    },
    resources: { fonts: [{ family: 'Cinzel', src: FONT }] },
  } as L1Document
}

/** The bundle's origin→mirror map, as `capture.json` records it. */
function assetMap(): CaptureAsset[] {
  return [
    { id: 'hero', kind: 'image', src: HERO, localPath: 'assets/hero.png' },
    { id: 'photo', kind: 'image', src: PHOTO, localPath: 'assets/lab.jpg' },
    { id: 'face', kind: 'font', src: FONT, localPath: 'assets/cinzel.woff2' },
    // Mirrored but referenced by no leaf — the fold gap the import must report.
    { id: 'orphan', kind: 'image', src: `${ORIGIN}/images/unused.png`, localPath: 'assets/unused.png' },
    // A page subresource: never L1-referenceable, so never a fold gap.
    { id: 'sheet', kind: 'stylesheet', src: `${ORIGIN}/site.css`, localPath: 'assets/site.css' },
  ]
}

let cwd: string
beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'ac1628-'))
})
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/** Write a capture bundle: the folded `l1.json`, the asset map, the mirrored
 *  bytes, and (optionally) the behaviour bindings. `doc: null` omits the fold. */
function bundle(
  doc: L1Document | null,
  assets: CaptureAsset[],
  forms?: Array<Record<string, unknown>>,
): string {
  const dir = path.join(cwd, 'bundle')
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  if (doc) writeL1(dir, doc)
  const capture = { url: `${ORIGIN}/`, host: 'reference.example.com', assets } as unknown as Capture
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))
  for (const a of assets) writeFileSync(path.join(dir, a.localPath), `bytes:${a.id}`)
  if (forms) writeFileSync(path.join(dir, 'forms.json'), JSON.stringify(forms, null, 2))
  return dir
}

/** Every node in a document, flattened — the node-count measure. */
function nodesOf(doc: L1Document): L1Node[] {
  const out: L1Node[] = []
  const walk = (n: L1Node): void => {
    out.push(n)
    for (const c of ('children' in n ? (n.children ?? []) : []) as L1Node[]) walk(c)
  }
  walk(doc.root)
  return out
}

/** Every file under `dir`, as a relative-path → contents map. */
function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {}
  const walk = (abs: string, rel: string): void => {
    for (const entry of readdirSync(abs).sort()) {
      const full = path.join(abs, entry)
      const key = rel ? `${rel}/${entry}` : entry
      if (statSync(full).isDirectory()) walk(full, key)
      else out[key] = readFileSync(full, 'utf8')
    }
  }
  walk(dir, '')
  return out
}

/** The home page definition the import wrote. */
function homePage(draftDir: string): { l1: L1Document; modules: unknown[] } {
  return JSON.parse(readFileSync(path.join(draftDir, 'pages', 'home.json'), 'utf8'))
}

describe('AC-1628 a capture bundle materializes as a servable site with localized assets', () => {
  it('test_UAT_AC1628_bundle_materializes_as_a_servable_site_with_localized_assets', () => {
    const doc = docWithRemoteHandles()
    expect(validateL1(doc).ok).toBe(true)
    const ref = bundle(doc, assetMap())

    // ── The draft exists and its home page IS the bundle's folded document ────
    const result = cmdRepro('reproduction', { cwd, ref })
    expect(existsSync(result.draftDir)).toBe(true)
    expect(existsSync(path.join(result.draftDir, 'site.json'))).toBe(true)
    expect(existsSync(path.join(result.draftDir, 'pages', 'home.json'))).toBe(true)

    const page = homePage(result.draftDir)
    // Copied VERBATIM: the import adds and subtracts nothing on the reproduction
    // values. Node count is the coarse form of that…
    expect(nodesOf(page.l1)).toHaveLength(nodesOf(doc).length)
    expect(result.nodeCount).toBe(nodesOf(doc).length)
    // …and this is the exact form: the written document differs from the bundle's
    // ONLY where a media handle was rebound to the mirror. Everything else — every
    // keyframe, id, axis and width — survives byte for byte.
    const rebound = JSON.parse(JSON.stringify(doc)) as L1Document
    const asBox = rebound.root as Extract<L1Node, { kind: 'box' }>
    const band = asBox.children![0] as Extract<L1Node, { kind: 'box' }>
    const stack = asBox.children![1] as Extract<L1Node, { kind: 'container' }>
    band.axes!.backgroundImageUrl = '/assets/hero.png'
    ;(stack.children![0] as Extract<L1Node, { kind: 'image' }>).src = '/assets/lab.jpg'
    rebound.resources!.fonts![0].src = '/assets/cinzel.woff2'
    expect(page.l1).toEqual(rebound)

    // ── Every media handle was rebound BEFORE the document was written ────────
    // Three handles across three different axis shapes: a box's background image,
    // an image leaf's src, and an @font-face source.
    expect(result.localizedAssets).toBe(3)
    const written = JSON.stringify(page.l1)
    // The reported count equals the number of handles actually rewritten to the
    // mirror — not a tally of the bundle's assets (five) nor of its images (four).
    expect([...written.matchAll(/"\/assets\/[^"]+"/g)]).toHaveLength(result.localizedAssets)
    // …and no handle in the written document still names the captured origin. A
    // reproduction that hotlinked it would render only while that host is up.
    expect(written).not.toContain(ORIGIN)
    expect(written).not.toContain('fonts.gstatic.com')
    // The mirrored bytes came along, so those handles resolve on disk.
    expect(result.copiedAssets).toBe(true)
    expect(existsSync(path.join(result.draftDir, 'assets', 'hero.png'))).toBe(true)

    // ── A mirrored asset no leaf references is REPORTED, not ignored ──────────
    // Bytes in the bundle with no node (or @font-face) emitted for them are a
    // fold gap to close. The stylesheet is a page subresource and is never one.
    expect(result.unreferencedAssets).toEqual(['assets/unused.png'])
    // …and it is a report, not a failure: the import still succeeded above.

    // ── Idempotent: re-running rebuilds rather than accumulating ──────────────
    const first = snapshot(result.draftDir)
    const again = cmdRepro('reproduction', { cwd, ref })
    expect(again.draftDir).toBe(result.draftDir)
    expect(snapshot(again.draftDir)).toEqual(first)
    // The reported figures are stable too — a second pass over already-local
    // handles rewrites nothing further and invents no new gap.
    expect(again.localizedAssets).toBe(result.localizedAssets)
    expect(again.unreferencedAssets).toEqual(result.unreferencedAssets)

    // ── An unmirrored handle fails the import OUTRIGHT ────────────────────────
    // Falling back to the captured origin is exactly the defect: it would render
    // only while that host is up and would blind the perceptual gate to image
    // regressions. So the import throws, and names the handle it cannot resolve.
    rmSync(path.join(cwd, 'bundle'), { recursive: true, force: true })
    const noHero = bundle(docWithRemoteHandles(), assetMap().filter((a) => a.src !== HERO))
    expect(() => cmdRepro('reproduction', { cwd, ref: noHero })).toThrow(/hotlink the captured origin/)
    expect(() => cmdRepro('reproduction', { cwd, ref: noHero })).toThrow(/hero\.png/)
    // …with the instruction that fixes it.
    expect(() => cmdRepro('reproduction', { cwd, ref: noHero })).toThrow(/1c capture page/)
    // The failure is BEFORE the draft, not half-way through one: the good draft
    // written above is still exactly what it was, not emptied or half-rebuilt.
    expect(snapshot(result.draftDir)).toEqual(first)

    // ── A bundle with NO folded document is rejected ──────────────────────────
    rmSync(path.join(cwd, 'bundle'), { recursive: true, force: true })
    const noFold = bundle(null, assetMap())
    expect(() => cmdRepro('reproduction', { cwd, ref: noFold })).toThrow(/No l1\.json/)
    expect(() => cmdRepro('reproduction', { cwd, ref: noFold })).toThrow(/1c capture page/)

    // ── A bundle whose L1 seams and behaviour bindings DISAGREE is rejected ────
    // The two artifacts are written by one fold, so a mismatch means the bundle is
    // part-stale. Importing it anyway would render its behaviours as inert
    // placeholders — the exact stranding the check exists to end.
    //
    // (a) the document carries a seam that nothing binds.
    rmSync(path.join(cwd, 'bundle'), { recursive: true, force: true })
    const seam: L1Node = {
      kind: 'slot',
      name: 'contact',
      geometry: { keyframes: WIDTHS.map((at) => ({ at, x: 0, y: 0, width: at, height: 200 })) },
    }
    const unbound = bundle(docWithRemoteHandles([seam]), assetMap())
    expect(() => cmdRepro('reproduction', { cwd, ref: unbound })).toThrow(/internally inconsistent/)
    expect(() => cmdRepro('reproduction', { cwd, ref: unbound })).toThrow(/'contact' has no binding/)
    expect(() => cmdRepro('reproduction', { cwd, ref: unbound })).toThrow(/1c capture page/)

    // (b) the mirror image — a binding for a seam the document does not carry.
    rmSync(path.join(cwd, 'bundle'), { recursive: true, force: true })
    const dangling = bundle(docWithRemoteHandles(), assetMap(), [
      { slot: 'newsletter', behavior: 'contact-form', action: '', fields: [], form: { kind: 'box', children: [] } },
    ])
    expect(() => cmdRepro('reproduction', { cwd, ref: dangling })).toThrow(/internally inconsistent/)
    expect(() => cmdRepro('reproduction', { cwd, ref: dangling })).toThrow(/'newsletter', absent from l1\.json/)
  })
})
