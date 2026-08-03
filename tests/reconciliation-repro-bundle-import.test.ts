/**
 * story-8b2f295c — **an imported reproduction serves the reference's own bytes
 * and configures its behaviours only from what the capture recorded.**
 *
 * `1c repro <slug> --ref <bundle>` writes a site whose home page IS the bundle's
 * folded L1 document, plus one behaviour instance per form the fold recovered.
 * Two properties make that an import rather than a viewer:
 *
 *   - **Self-containment.** Every media handle the fold transcribes is the
 *     absolute URL the original page served. Left alone the reproduction
 *     *hotlinks the target*: it renders only while that host is up, and every
 *     perceptual comparison measures the target against a page serving the
 *     target's own bytes — a hole in the gate, not merely in the output.
 *   - **Derivation, not invention.** Each mounted behaviour's config comes from
 *     the capture alone; what the capture never recorded is reported as a
 *     residual and left absent, never fabricated.
 *
 * These UATs drive the operator boundary — `cmdRepro` / `1c render` / the `1c`
 * CLI dispatcher — against bundles written to an isolated temp working dir:
 *   AC-792  every media handle in the imported page names the site's own mirror
 *   AC-793  the rendered reproduction names no remote host and ships every byte
 *   AC-794  an unmirrored absolute handle fails the import and writes no site
 *   AC-795  re-import is stable and the bundle's own artifacts are untouched
 *   AC-796  unreferenced mirrored image/font bytes are reported as a fold gap
 *   AC-797  layout seams and behaviour bindings that disagree fail the import
 *   AC-798  each mounted behaviour's fields are derived from captured controls
 *   AC-799  an endpoint the capture never recorded is a residual, never invented
 *   AC-800  the import reports what it produced, with per-behaviour residuals
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { foldToL1 } from '../tools/generate/src/l1'
import type { FoldedForm } from '../tools/generate/src/l1'
import { writeForms, writeL1 } from '../tools/generate/src/cli/capture/bundle'
import { cmdRepro } from '../tools/generate/src/cli/repro'
import { cmdRender } from '../tools/generate/src/cli/commands'
import { run } from '../tools/generate/src/cli'
import type { L1Document } from '../packages/site-schema/src/index'
import type {
  Capture,
  CaptureAsset,
  MultiStateCapture,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'

// ── the captured origin the fixtures reproduce ───────────────────────────────

const ORIGIN = 'https://gigabytealchemy.ai'
const HERO = `${ORIGIN}/images/AlchemistLabWithTech.png`
const PHOTO = `${ORIGIN}/images/lab.jpg`
const FONT = 'https://fonts.gstatic.com/s/cinzel/v26/cinzel.woff2'
const ORPHAN = `${ORIGIN}/images/unused.png`

/** The width ladder every fixture capture is sampled at. */
const LADDER = [320, 375, 768, 1024, 1280, 1440]
/** The narrower ladder the hand-authored fixture documents declare. */
const WIDTHS = [320, 1280]

interface Box {
  x: number
  y: number
  width: number
  height: number
}

// ── fixtures: documents carrying the media handles a real fold transcribes ───

function keyframes(widths: number[], height = 400): { keyframes: Array<Record<string, number>> } {
  return { keyframes: widths.map((at) => ({ at, x: 0, y: 0, width: at, height })) }
}

/** The three asset-bearing shapes a captured page produces, as L1 nodes. */
function mediaNodes(widths: number[], hero = HERO, photo = PHOTO): unknown[] {
  const geometry = keyframes(widths)
  return [
    { kind: 'box', id: 'section-bg-0', geometry, axes: { backgroundImageUrl: hero } },
    {
      kind: 'container',
      layout: 'stack',
      geometry,
      children: [{ kind: 'image', id: 'img-0', geometry, src: photo, alt: 'Lab' }],
    },
  ]
}

/** A folded document shaped like a real capture: hero band + photo leaf + face. */
function docWithRemoteHandles(): L1Document {
  return {
    widths: WIDTHS,
    root: { kind: 'box', children: mediaNodes(WIDTHS) },
    resources: { fonts: [{ family: 'Cinzel', src: FONT }] },
  } as unknown as L1Document
}

/** The bundle's origin→mirror map, as `capture.json` records it. */
function assetMap(): CaptureAsset[] {
  return [
    { id: 'hero', kind: 'image', src: HERO, localPath: 'assets/AlchemistLabWithTech.png' },
    { id: 'photo', kind: 'image', src: PHOTO, localPath: 'assets/lab.jpg' },
    { id: 'face', kind: 'font', src: FONT, localPath: 'assets/cinzel.woff2' },
    // Mirrored but referenced by no node — the fold-gap signal (AC-796).
    { id: 'orphan', kind: 'image', src: ORPHAN, localPath: 'assets/unused.png' },
    // A page subresource: never L1-referenceable, so never reported as a gap.
    { id: 'sheet', kind: 'stylesheet', src: `${ORIGIN}/site.css`, localPath: 'assets/site.css' },
  ]
}

// ── fixtures: captures whose controls the fold recovers into behaviour seams ──

function textEl(width: number, text: string, y: number): ValueElement {
  return {
    text,
    role: 'heading',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 32,
    fontWeight: 700,
    box: { x: 20, y, width: width - 40, height: 40 },
  }
}

/** A captured text-free control, exactly as the a11y tree recorded it. */
function control(over: Partial<ValueElement>): ValueElement {
  return {
    text: '',
    role: 'field',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'textbox',
    accessibleName: '',
    nameSource: null,
    ...over,
  }
}

function multiFrom(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: { source: `repro@${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 900 } },
  }))
  return { url: `${ORIGIN}/`, notes: [], projections }
}

/** One four-field form, stacked with the reference's own 16px gutter. */
const FIELD_BOXES: Box[] = [
  { x: 20, y: 900, width: 400, height: 50 },
  { x: 20, y: 966, width: 400, height: 50 },
  { x: 20, y: 1032, width: 400, height: 150 },
  { x: 20, y: 1198, width: 400, height: 50 },
  { x: 20, y: 1264, width: 400, height: 50 },
]

/** Two visibly separate forms: a one-field signup, and a three-field contact. */
const SIGNUP_BOX: Box = { x: 20, y: 300, width: 240, height: 50 }
const CONTACT_BOXES: Box[] = [
  { x: 20, y: 900, width: 400, height: 50 },
  { x: 20, y: 966, width: 400, height: 50 },
  { x: 20, y: 1032, width: 400, height: 150 },
]

function twoFormCapture(contactAction?: string): MultiStateCapture {
  const contact = (name: string, box: Box, controlType: string): ValueElement =>
    control({
      accessibleName: name,
      box,
      controlType,
      nameSource: 'label',
      ...(contactAction ? { formAction: contactAction } : {}),
    })
  return multiFrom((w) => [
    textEl(w, 'Get in touch', 100),
    // form-0 — one field, and deliberately NO captured endpoint.
    control({ accessibleName: 'Your email address', box: SIGNUP_BOX, controlType: 'email', nameSource: 'label' }),
    // form-1 — three fields, with whatever endpoint the caller asked for.
    contact('Your name', CONTACT_BOXES[0], 'text'),
    contact('Your email', CONTACT_BOXES[1], 'email'),
    contact('Your message', CONTACT_BOXES[2], 'textarea'),
  ])
}

// ── isolation ────────────────────────────────────────────────────────────────

let cwd: string
beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'story-repro-'))
})
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/** Write a capture bundle: folded l1.json, the asset map, mirrored bytes, forms. */
function bundle(
  doc: L1Document,
  assets: CaptureAsset[] = [],
  forms?: FoldedForm[],
  name = 'bundle',
): string {
  const dir = path.join(cwd, name)
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  writeL1(dir, doc)
  const capture = { url: `${ORIGIN}/`, host: 'gigabytealchemy.ai', assets } as unknown as Capture
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))
  for (const a of assets) writeFileSync(path.join(dir, a.localPath), `bytes:${a.id}`)
  if (forms) writeForms(dir, forms)
  return dir
}

/** The page definition the import wrote for `slug`. */
function pageOf(draft: string): { l1: L1Document; modules?: Array<Record<string, unknown>> } {
  return JSON.parse(readFileSync(path.join(draft, 'pages', 'home.json'), 'utf8'))
}

/** Every `.html`/`.css` artifact under `dir`, recursively. */
function textArtifacts(dir: string): Array<{ file: string; body: string }> {
  const out: Array<{ file: string; body: string }> = []
  const walk = (at: string): void => {
    for (const entry of readdirSync(at)) {
      const full = path.join(at, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (full.endsWith('.html') || full.endsWith('.css')) out.push({ file: full, body: readFileSync(full, 'utf8') })
    }
  }
  walk(dir)
  return out
}

// ── AC-792 — every media handle names the site's own mirrored asset ──────────

describe('story-8b2f295c — the imported page serves the site\'s own mirrored bytes', () => {
  it('test_UAT_AC792_every_media_handle_resolves_to_the_sites_own_mirror', () => {
    const ref = bundle(docWithRemoteHandles(), assetMap())
    const result = cmdRepro('gigabyte', { cwd, ref })

    // All three asset-bearing handle kinds — a box's background image, an image
    // leaf's src, and a font face — are bound to the mirror, and the import says
    // how many it bound.
    expect(result.localizedAssets).toBe(3)

    const page = pageOf(result.draftDir)
    const root = page.l1.root as unknown as { children: Array<Record<string, never>> }
    const bg = root.children[0] as unknown as { axes: { backgroundImageUrl: string } }
    const img = (root.children[1] as unknown as { children: Array<{ src: string }> }).children[0]
    const face = (page.l1 as unknown as { resources: { fonts: Array<{ src: string }> } }).resources.fonts[0]

    // Each names the site's own copy, as a ROOT-relative path (so it resolves the
    // same from any page depth) — not the URL the original page served.
    expect(bg.axes.backgroundImageUrl).toBe('/assets/AlchemistLabWithTech.png')
    expect(img.src).toBe('/assets/lab.jpg')
    expect(face.src).toBe('/assets/cinzel.woff2')

    // …and no handle naming the captured origin (or any other remote host)
    // survives anywhere in the written page definition.
    const json = JSON.stringify(page)
    expect(json).not.toContain(ORIGIN)
    expect(json).not.toContain('fonts.gstatic.com')
    expect(json).not.toMatch(/https?:\/\//)
  })
})

// ── AC-793 — the rendered reproduction cannot reach the target host ──────────

describe('story-8b2f295c — the rendered reproduction names no remote host', () => {
  it('test_UAT_AC793_rendered_output_is_self_contained_and_origin_free', async () => {
    const ref = bundle(docWithRemoteHandles(), assetMap())
    cmdRepro('gigabyte', { cwd, ref })
    const { outDir } = await cmdRender('gigabyte', { cwd })

    const artifacts = textArtifacts(outDir)
    expect(artifacts.length).toBeGreaterThan(0)
    // No emitted HTML or CSS artifact names the captured origin or the font host.
    for (const { file, body } of artifacts) {
      expect(body, file).not.toContain(ORIGIN)
      expect(body, file).not.toContain('fonts.gstatic.com')
    }

    // The page emits local asset handles…
    const body = artifacts.map((a) => a.body).join('\n')
    const refs = [...body.matchAll(/["'(](\/assets\/[^"')]+)/g)].map((m) => m[1])
    expect(refs.length).toBeGreaterThan(0)
    // …and every one of them resolves to a file present in the same output, so
    // the render is identical with the target host unreachable.
    for (const r of new Set(refs)) {
      expect(existsSync(path.join(outDir, r.replace(/^\//, ''))), r).toBe(true)
    }
    // There is no absolute handle left at all (the XML namespace aside).
    expect(/https?:\/\//.test(body.replace(/https?:\/\/www\.w3\.org[^"']*/g, ''))).toBe(false)
  })
})

// ── AC-794 — an unmirrored absolute handle fails the import ──────────────────

describe('story-8b2f295c — an unmirrored handle fails the import rather than hotlinking', () => {
  it('test_UAT_AC794_unmirrored_handle_fails_the_import_and_writes_no_site', () => {
    // Drop the hero from the asset map: the bundle no longer mirrors it. Falling
    // back to the origin for "just this one asset" preserves exactly the gate
    // hole, so there is no partial mode — the import fails outright.
    const partial = assetMap().filter((a) => a.src !== HERO)
    const ref = bundle(docWithRemoteHandles(), partial)

    let message = ''
    try {
      cmdRepro('unmirrored', { cwd, ref })
      expect.unreachable('the import must fail on an unmirrored absolute handle')
    } catch (err) {
      message = err instanceof Error ? err.message : String(err)
    }
    // The failure states the reason (hotlinking the captured origin), counts the
    // unresolved handles, names every one of them, and points at re-capturing.
    expect(message).toMatch(/hotlink the captured origin/)
    expect(message).toMatch(/1 media handle\(s\) have no mirrored asset/)
    expect(message).toContain(HERO)
    expect(message).toMatch(/[Rr]e-capture/)

    // No site draft was produced by the failed import.
    expect(existsSync(path.join(cwd, 'storage', 'sites', 'unmirrored'))).toBe(false)

    // With the asset restored, the same import succeeds.
    const whole = bundle(docWithRemoteHandles(), assetMap(), undefined, 'bundle-whole')
    const ok = cmdRepro('unmirrored', { cwd, ref: whole })
    expect(ok.localizedAssets).toBe(3)
    expect(existsSync(path.join(ok.draftDir, 'pages', 'home.json'))).toBe(true)
  })
})

// ── AC-795 — re-import is stable; the bundle's own artifacts are untouched ───

describe('story-8b2f295c — re-importing is stable and leaves the bundle unchanged', () => {
  it('test_UAT_AC795_reimport_is_stable_and_the_bundle_artifacts_are_untouched', () => {
    const ref = bundle(docWithRemoteHandles(), assetMap())
    const l1Path = path.join(ref, 'l1.json')
    const before = readFileSync(l1Path, 'utf8')

    const first = cmdRepro('gigabyte', { cwd, ref })
    const firstPage = readFileSync(path.join(first.draftDir, 'pages', 'home.json'), 'utf8')
    const second = cmdRepro('gigabyte', { cwd, ref })
    const secondPage = readFileSync(path.join(second.draftDir, 'pages', 'home.json'), 'utf8')

    // Re-import rewrites the draft from the same bundle and yields byte-identical
    // handles — no double-prefixing, no re-resolution.
    expect(secondPage).toBe(firstPage)

    // The bundle's own folded document is NOT modified by an import: it still
    // carries the handles exactly as the capture recorded them (absolute), so the
    // read-only analytic gate that re-folds the bundle sees the same input.
    const after = readFileSync(l1Path, 'utf8')
    expect(after).toBe(before)
    expect(after).toContain(HERO)
    expect(after).toContain(FONT)

    // Importing an ALREADY-LOCALIZED document rewrites nothing further: handles
    // that are already site-local are only normalised to root-relative form, so a
    // bundle whose fold is already bound to the mirror binds zero new handles and
    // produces byte-identical handles to the first import's.
    //
    // (The criterion's own last clause — the bundle's artifacts are untouched —
    // is why the *same* bundle re-imported still binds its 3 absolute handles:
    // its l1.json is deliberately left absolute. The "zero newly-bound handles"
    // property therefore belongs to an already-localized document, which is what
    // is exercised here.)
    const localizedDoc = JSON.parse(firstPage).l1 as L1Document
    const denormalized = JSON.parse(JSON.stringify(localizedDoc)) as L1Document
    const root = denormalized.root as unknown as { children: Array<Record<string, never>> }
    // Two site-local spellings that must normalise to the same root-relative path.
    ;(root.children[0] as unknown as { axes: { backgroundImageUrl: string } }).axes.backgroundImageUrl =
      'assets/AlchemistLabWithTech.png'
    ;(denormalized as unknown as { resources: { fonts: Array<{ src: string }> } }).resources.fonts[0].src =
      './assets/cinzel.woff2'

    const localRef = bundle(denormalized, assetMap(), undefined, 'bundle-local')
    const reimported = cmdRepro('gigabyte-local', { cwd, ref: localRef })
    expect(reimported.localizedAssets).toBe(0)
    expect(reimported.unreferencedAssets).toEqual(['assets/unused.png'])
    const localPage = pageOf(reimported.draftDir)
    expect(JSON.stringify(localPage.l1)).toBe(JSON.stringify(localizedDoc))
  })
})

// ── AC-796 — unreferenced mirrored image/font bytes are a fold gap ───────────

describe('story-8b2f295c — mirrored bytes nothing references are reported as a fold gap', () => {
  it('test_UAT_AC796_unreferenced_image_and_font_bytes_are_reported_not_subresources', () => {
    // The map carries a referenced image, a referenced font, an UNreferenced
    // mirrored image, and a mirrored stylesheet.
    const ref = bundle(docWithRemoteHandles(), assetMap())
    const result = cmdRepro('gigabyte', { cwd, ref })

    // Exactly the unreferenced image is reported: the bytes are in the bundle but
    // nothing was emitted to use them.
    expect(result.unreferencedAssets).toEqual(['assets/unused.png'])
    // A stylesheet is a page subresource a layout can never reference, so it is
    // excluded from the signal rather than reported as noise.
    expect(result.unreferencedAssets).not.toContain('assets/site.css')

    // A bundle in which every mirrored image and font is referenced reports none.
    const allReferenced = assetMap().filter((a) => a.kind !== 'stylesheet' && a.src !== ORPHAN)
    const clean = bundle(docWithRemoteHandles(), allReferenced, undefined, 'bundle-clean')
    expect(cmdRepro('gigabyte-clean', { cwd, ref: clean }).unreferencedAssets).toEqual([])
  })
})

// ── AC-797 — disagreeing seams and bindings fail the import ─────────────────

describe('story-8b2f295c — a part-stale bundle fails the import, naming the mismatch', () => {
  it('test_UAT_AC797_seam_and_binding_disagreement_fails_naming_each_direction', () => {
    const seamGeometry = keyframes(WIDTHS, 300)
    const docWithSeam = (names: string[]): L1Document =>
      ({
        widths: WIDTHS,
        root: {
          kind: 'box',
          children: names.map((name) => ({ kind: 'slot', id: name, name, behavior: 'contact-form', geometry: seamGeometry })),
        },
      }) as unknown as L1Document
    const binding = (slot: string): FoldedForm => ({
      slot,
      behavior: 'contact-form',
      fields: [{ name: 'email', label: 'Your email', type: 'email', labelMode: 'visible' }],
      residuals: [],
    })

    // 1. A seam in the layout that no binding claims. Importing it anyway would
    //    render the behaviour as an inert placeholder — exactly the stranding the
    //    check exists to end — so the import fails, naming the unclaimed seam.
    const orphanSeam = bundle(docWithSeam(['form-0']), [], undefined, 'bundle-orphan-seam')
    let message = ''
    try {
      cmdRepro('stale-a', { cwd, ref: orphanSeam })
      expect.unreachable('an unclaimed seam must fail the import')
    } catch (err) {
      message = err instanceof Error ? err.message : String(err)
    }
    expect(message).toMatch(/internally inconsistent/)
    expect(message).toMatch(/slot 'form-0' has no binding in forms\.json/)
    expect(message).toMatch(/[Rr]e-capture/)
    expect(existsSync(path.join(cwd, 'storage', 'sites', 'stale-a'))).toBe(false)

    // 2. A binding naming a seam the layout does not carry, in the other
    //    direction: the failure names that binding as absent from the layout.
    const ghost = bundle(docWithSeam(['form-0']), [], [binding('form-0'), binding('ghost')], 'bundle-ghost')
    let ghostMessage = ''
    try {
      cmdRepro('stale-b', { cwd, ref: ghost })
      expect.unreachable('a binding for a seam the layout lacks must fail the import')
    } catch (err) {
      ghostMessage = err instanceof Error ? err.message : String(err)
    }
    expect(ghostMessage).toMatch(/forms\.json binds slot 'ghost', absent from l1\.json/)
    // The seam that IS matched is not reported as a mismatch.
    expect(ghostMessage).not.toMatch(/'form-0'/)
    expect(existsSync(path.join(cwd, 'storage', 'sites', 'stale-b'))).toBe(false)

    // 3. A bundle carrying neither seams nor bindings — a page with no behaviour,
    //    or one captured before behaviours were recovered — imports normally.
    const plain = bundle(docWithRemoteHandles(), assetMap(), undefined, 'bundle-plain')
    const ok = cmdRepro('no-behaviour', { cwd, ref: plain })
    expect(ok.forms).toEqual([])
    expect(existsSync(path.join(ok.draftDir, 'pages', 'home.json'))).toBe(true)
  })
})

// ── AC-798 — fields are derived from the captured control facts ─────────────

describe('story-8b2f295c — a mounted behaviour\'s fields come from the captured controls', () => {
  it('test_UAT_AC798_fields_are_derived_from_captured_name_type_and_name_source', () => {
    // One form whose controls exercise every derivation input the capture holds:
    // a recorded control type, a recorded name source, a control whose type was
    // NOT recorded (a materially taller box), a duplicate label, and an unnamed
    // control.
    const capture = multiFrom(() => [
      control({ accessibleName: 'Your name', box: FIELD_BOXES[0], controlType: 'text', nameSource: 'placeholder' }),
      control({ accessibleName: 'Your email', box: FIELD_BOXES[1], controlType: 'email', nameSource: 'label' }),
      // No controlType recorded, and materially taller than the shortest control.
      control({ accessibleName: 'Your message', box: FIELD_BOXES[2], nameSource: 'label' }),
      // The same label again — the submission key must still be unique.
      control({ accessibleName: 'Your email', box: FIELD_BOXES[3], controlType: 'email', nameSource: 'label' }),
      // Named by nothing the a11y tree could see.
      control({ box: FIELD_BOXES[4], controlType: 'text' }),
    ])
    const forms: FoldedForm[] = []
    const doc = foldToL1(capture, { forms })
    expect(forms).toHaveLength(1)

    const ref = bundle(doc, [], forms, 'bundle-fields')
    const imported = cmdRepro('fields', { cwd, ref })
    const mounted = pageOf(imported.draftDir).modules![0] as unknown as {
      slot: string
      config: { fields: Array<{ name: string; label: string; type: string; labelMode: string }> }
    }
    const fields = mounted.config.fields
    expect(mounted.slot).toBe(forms[0].slot)
    expect(fields).toHaveLength(5)

    // Label verbatim from the accessible name; type from the captured control
    // type; labelling mode from the captured name source — so a control the
    // reference named with placeholder text is placeholder-labelled rather than
    // given a label row the reference never had.
    expect(fields[0]).toMatchObject({ name: 'your-name', label: 'Your name', type: 'text', labelMode: 'placeholder' })
    expect(fields[1]).toMatchObject({ name: 'your-email', label: 'Your email', type: 'email', labelMode: 'visible' })

    // A control whose type the capture did not record is inferred as multi-line
    // from its height, and the inference is recorded as a residual so it is not
    // mistaken for a fact.
    expect(fields[2]).toMatchObject({ label: 'Your message', type: 'textarea', labelMode: 'visible' })
    expect(imported.forms[0].residuals).toContainEqual(
      expect.stringMatching(/control 3 carries no input type — inferred from height/),
    )

    // Submission keys are derived from the labels and unique within the form.
    expect(fields.map((f) => f.name)).toEqual(fields.map((f) => f.name.toLowerCase()))
    expect(new Set(fields.map((f) => f.name)).size).toBe(fields.length)
    expect(fields[3].label).toBe('Your email')
    expect(fields[3].name).not.toBe(fields[1].name)

    // An unnamed control still becomes a field, under a positional label, with
    // the missing name recorded as a residual.
    expect(fields[4]).toMatchObject({ name: 'field-5', label: 'Field 5', type: 'text' })
    expect(imported.forms[0].residuals).toContainEqual(
      expect.stringMatching(/control 5 has no accessible name in the capture/),
    )
  })
})

// ── AC-799 — an unrecorded endpoint is a residual, never an invention ───────

describe('story-8b2f295c — a submission endpoint is never fabricated', () => {
  it('test_UAT_AC799_endpoint_is_captured_verbatim_absent_or_dropped_with_a_residual', () => {
    const endpointCase = (
      formAction: string | undefined,
      slug: string,
    ): { form: FoldedForm; action: unknown; mounted: Record<string, unknown> } => {
      const capture = multiFrom(() => [
        control({
          accessibleName: 'Your email',
          box: FIELD_BOXES[0],
          controlType: 'email',
          nameSource: 'label',
          ...(formAction ? { formAction } : {}),
        }),
      ])
      const forms: FoldedForm[] = []
      const doc = foldToL1(capture, { forms })
      const ref = bundle(doc, [], forms, `bundle-${slug}`)
      const imported = cmdRepro(slug, { cwd, ref })
      const mounted = pageOf(imported.draftDir).modules![0] as Record<string, unknown>
      return { form: imported.forms[0], action: (mounted.config as { action: unknown }).action, mounted }
    }

    // A safe captured endpoint is used verbatim, with no residual.
    const safe = endpointCase('https://forms.example.com/leads', 'safe')
    expect(safe.form.action).toBe('https://forms.example.com/leads')
    expect(safe.action).toBe('https://forms.example.com/leads')
    expect(safe.form.residuals).toEqual([])

    // No captured endpoint: the behaviour carries none — it submits to its own
    // address, which is what a page whose endpoint was never observed honestly
    // does — and the gap is reported as a residual naming the consequence.
    const none = endpointCase(undefined, 'no-endpoint')
    expect(none.form.action).toBeUndefined()
    expect(none.action).toBe('')
    expect(none.form.residuals).toContainEqual(
      expect.stringMatching(/no form action captured — the form posts to its own URL/),
    )
    expect(none.form.residuals.join('\n')).toMatch(/set the endpoint on the reproduced site/)

    // An unsafe captured endpoint is dropped rather than carried into the
    // reproduction, and the drop is reported as a residual naming the value.
    const unsafe = endpointCase('javascript:alert(1)', 'unsafe-endpoint')
    expect(unsafe.form.action).toBeUndefined()
    expect(unsafe.action).toBe('')
    // Absent from the configuration the reproduction carries — the residual is
    // the only place the rejected value appears, because it must name it.
    expect(JSON.stringify(unsafe.mounted)).not.toContain('javascript:alert(1)')
    expect(unsafe.form.residuals).toContainEqual(
      expect.stringMatching(/captured form action 'javascript:alert\(1\)' is not a safe URL — dropped/),
    )
  })
})

// ── AC-800 — the import reports what it produced ────────────────────────────

describe('story-8b2f295c — the import summarises what it produced', () => {
  it('test_UAT_AC800_summary_reports_nodes_handles_gaps_and_each_behaviour', async () => {
    // A bundle with mirrored assets, one unreferenced mirrored image, and two
    // recovered forms — the first of which has no captured endpoint.
    const forms: FoldedForm[] = []
    const folded = foldToL1(twoFormCapture('https://forms.example.com/leads'), { forms })
    expect(forms.map((f) => f.slot)).toEqual(['form-0', 'form-1'])
    // Splice in the media handles a captured page carries, at the fold's ladder.
    const doc = JSON.parse(JSON.stringify(folded)) as L1Document
    const root = doc.root as unknown as { children: unknown[] }
    root.children.push(...mediaNodes(doc.widths as unknown as number[]))
    ;(doc as unknown as { resources: unknown }).resources = { fonts: [{ family: 'Cinzel', src: FONT }] }
    const ref = bundle(doc, assetMap(), forms, 'bundle-summary')

    // Ground truth from the import itself, so the printed numbers are checked
    // against what was actually produced rather than a hard-coded constant.
    const truth = cmdRepro('summary', { cwd, ref })

    const printed: string[] = []
    const logSpy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void printed.push(a.join(' ')))
    const origCwd = process.cwd()
    try {
      // run() resolves the store against process.cwd(); chdir so the CLI-level
      // invocation targets the isolated temp dir.
      process.chdir(cwd)
      await run(['repro', 'summary', '--ref', ref])
    } finally {
      process.chdir(origCwd)
      logSpy.mockRestore()
    }
    const summary = printed.join('\n')

    // The bundle it read and the location it wrote.
    expect(summary).toContain(ref)
    expect(summary).toContain(truth.draftDir)
    // The number of layout nodes on the imported home page, whether the bundle's
    // assets were mirrored into the site, and the count bound to that mirror.
    expect(truth.nodeCount).toBeGreaterThan(0)
    expect(summary).toContain(`${truth.nodeCount} node(s)`)
    expect(truth.copiedAssets).toBe(true)
    expect(summary).toContain('assets copied')
    expect(truth.localizedAssets).toBe(3)
    expect(summary).toContain('3 media handle(s) bound to local mirror')
    // The asset reported as a fold gap.
    expect(summary).toMatch(/1 mirrored asset\(s\) referenced by no node \(fold gap\)/)
    expect(summary).toContain('assets/unused.png')
    // A stylesheet is not reported as a gap.
    expect(summary).not.toContain('assets/site.css')

    // One line per mounted behaviour: its name, its seam, and its field count.
    expect(summary).toContain('behaviours mounted: 2')
    expect(summary).toContain("contact-form → slot 'form-0' (1 field(s))")
    expect(summary).toContain("contact-form → slot 'form-1' (3 field(s))")
    // …and each residual the derivation recorded, under the form it belongs to:
    // the missing endpoint is form-0's, and is printed between the two lines.
    const missing = summary.indexOf('no form action captured')
    expect(missing).toBeGreaterThan(summary.indexOf("slot 'form-0'"))
    expect(missing).toBeLessThan(summary.indexOf("slot 'form-1'"))

    // A bundle with no behaviours and no reported gaps prints neither section.
    const bare = assetMap().filter((a) => a.kind !== 'stylesheet' && a.src !== ORPHAN)
    const quietRef = bundle(docWithRemoteHandles(), bare, undefined, 'bundle-quiet')
    const quiet: string[] = []
    const quietSpy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void quiet.push(a.join(' ')))
    try {
      process.chdir(cwd)
      await run(['repro', 'quiet', '--ref', quietRef])
    } finally {
      process.chdir(origCwd)
      quietSpy.mockRestore()
    }
    const quietSummary = quiet.join('\n')
    expect(quietSummary).toContain('3 media handle(s) bound to local mirror')
    expect(quietSummary).not.toContain('behaviours mounted')
    expect(quietSummary).not.toContain('fold gap')
  })
})
