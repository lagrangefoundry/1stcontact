/**
 * Reconciliation UATs — story-8acc338d "Fold a multi-viewport capture into one L1
 * reproduction document…", the **seam-config + materialization** span
 * (REQ-88 / BUG-23).
 *
 * The other criteria of this story are proven in its sibling reconciliation files
 * (tests/reconciliation-l1-fold*.test.ts). This file proves the two whose subject
 * is what happens *around* the folded document — what a recovered behaviour seam
 * derives from the capture, and how a bundle becomes a servable site:
 *
 *   AC-1348  a seam's behavioural config is derived from the capture alone, the
 *            enumeration is complete, and every honest default records a
 *            derivation gap on the seam's own channel
 *   AC-1349  `1c repro <slug> --ref <bundle>` materializes a bundle into a site:
 *            seams mounted by name, the definition validated before disk, every
 *            media handle localized, an unmirrored handle failing the run, and an
 *            unreferenced mirrored asset reported as a fold gap
 *
 * AC-1348 drives the real `foldToL1` (with its `forms` / `residuals`
 * out-collectors); AC-1349 drives the real `cmdRepro` CLI entry point against a
 * bundle written to a temporary directory. No internal component is mocked.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { foldToL1, type FoldedForm, type FoldResidual } from '../tools/generate/src'
import { writeForms, writeL1 } from '../tools/generate/src/cli/capture/bundle'
import { cmdRepro } from '../tools/generate/src/cli/repro'
import type { L1Document } from '../packages/site-schema/src/index'
import type {
  Capture,
  CaptureAsset,
  MultiStateCapture,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

// ── AC-1348: the seam's capture-derived behavioural config ────────────────────

/** A captured text-free control, as the a11y tree describes it. */
function control(over: Partial<ValueElement> & { box: ValueElement['box'] }): ValueElement {
  return {
    text: '',
    role: 'field',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'textbox',
    ...over,
  }
}

/** A captured submit affordance: a painted run the a11y tree calls a button. */
function buttonEl(text: string, box: NonNullable<ValueElement['box']>): ValueElement {
  return {
    text,
    role: 'button',
    color: '#ffffff',
    fontFamily: 'Inter',
    fontSizePx: 16,
    fontWeight: 500,
    a11yRole: 'button',
    surfaceFill: '#0f172b',
    borderRadiusPx: 8,
    // An authored vertical inset marks a run as painting its own surface, so the
    // chip's axes ride on its text leaf rather than on an inferred card behind it.
    paddingTopPx: 12,
    paddingBottomPx: 12,
    paddingLeftPx: 24,
    paddingRightPx: 24,
    box,
  }
}

function multiFrom(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: { source: `seam@${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 900 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

const ENDPOINT = 'https://forms.example.com/contact'

/**
 * A three-field contact form with its submit button 18px below it, every fact the
 * derivation reads present in the capture: accessible names, name sources, input
 * types, and the form action.
 */
function formCapture(over: (els: ValueElement[]) => ValueElement[] = (e) => e): MultiStateCapture {
  return multiFrom(() =>
    over([
      control({
        accessibleName: 'Your name',
        nameSource: 'placeholder',
        controlType: 'text',
        formAction: ENDPOINT,
        box: { x: 20, y: 900, width: 400, height: 50 },
      }),
      control({
        accessibleName: 'Your email',
        nameSource: 'placeholder',
        controlType: 'email',
        formAction: ENDPOINT,
        box: { x: 20, y: 966, width: 400, height: 50 },
      }),
      control({
        accessibleName: 'Your message',
        nameSource: 'label',
        controlType: 'textarea',
        formAction: ENDPOINT,
        box: { x: 20, y: 1032, width: 400, height: 150 },
      }),
      buttonEl('Send message', { x: 20, y: 1200, width: 170, height: 48 }),
    ]),
  )
}

/** Fold a capture, collecting both out-channels: seams and typed element residuals. */
function foldSeams(capture: MultiStateCapture): {
  doc: L1Document
  forms: FoldedForm[]
  residuals: FoldResidual[]
} {
  const forms: FoldedForm[] = []
  const residuals: FoldResidual[] = []
  const doc = foldToL1(capture, { forms, residuals })
  return { doc, forms, residuals }
}

describe('AC-1348 a seam’s behavioural config is derived from the capture alone', () => {
  it('test_UAT_AC1348_seam_config_derives_the_six_facts_and_records_every_gap', () => {
    const { forms, residuals } = foldSeams(formCapture())
    expect(forms).toHaveLength(1)
    const seam = forms[0]

    // 1. One field per captured control, with a submission key slugified from the
    //    label and made unique within the form.
    expect(seam.fields.map((f) => f.name)).toEqual(['your-name', 'your-email', 'your-message'])
    // 2. Each field's label — the a11y tree's accessible name, whatever named it.
    expect(seam.fields.map((f) => f.label)).toEqual(['Your name', 'Your email', 'Your message'])
    // 3. Label placement, from the name SOURCE: a placeholder-named control folds
    //    to placeholder labelling, anything else to a visible label above the box.
    //    (Getting this wrong costs geometry, not polish — a label row the
    //    reference never had pushes every field below it down.)
    expect(seam.fields.map((f) => f.labelMode)).toEqual(['placeholder', 'placeholder', 'visible'])
    // 4. Each field's type, from the captured input type.
    expect(seam.fields.map((f) => f.type)).toEqual(['text', 'email', 'textarea'])
    // 5. The submission endpoint, from the captured form action.
    expect(seam.action).toBe(ENDPOINT)
    // 6. The claimed submit button's own words as the form's submit copy.
    expect(seam.submitLabel).toBe('Send message')

    // Nothing was defaulted: the derivation-gap list is empty.
    expect(seam.residuals).toEqual([])

    // A repeated label still yields a UNIQUE submission key.
    const duplicated = foldSeams(
      formCapture((els) =>
        els.map((el) =>
          el.a11yRole === 'textbox' && el.accessibleName === 'Your email'
            ? { ...el, accessibleName: 'Your name' }
            : el,
        ),
      ),
    ).forms[0]
    expect(duplicated.fields.map((f) => f.label)).toEqual(['Your name', 'Your name', 'Your message'])
    expect(duplicated.fields.map((f) => f.name)).toEqual(['your-name', 'your-name-2', 'your-message'])
    expect(new Set(duplicated.fields.map((f) => f.name)).size).toBe(duplicated.fields.length)

    // ── The derivation invents nothing: each fallback records its own gap ──────

    // (a) No recorded input type → typed from HEIGHT (materially taller than the
    //     form's shortest is a multi-line box), with a gap naming what was missing.
    const untyped = foldSeams(
      formCapture((els) =>
        els.map((el) => {
          if (el.a11yRole !== 'textbox') return el
          const { controlType: _drop, ...rest } = el as ValueElement & { controlType?: string }
          return rest as ValueElement
        }),
      ),
    ).forms[0]
    expect(untyped.fields.map((f) => f.type)).toEqual(['text', 'text', 'textarea'])
    expect(untyped.residuals.filter((r) => /no input type/.test(r)).length).toBe(3)

    // (b) An unnamed control is still a field, under a POSITIONAL label, with a gap.
    const unnamed = foldSeams(
      formCapture((els) =>
        els.map((el) => (el.accessibleName === 'Your email' ? { ...el, accessibleName: '' } : el)),
      ),
    ).forms[0]
    expect(unnamed.fields).toHaveLength(3)
    expect(unnamed.fields[1].label).toBe('Field 2')
    expect(unnamed.fields[1].name).toBe('field-2')
    expect(unnamed.residuals.some((r) => /no accessible name/.test(r))).toBe(true)

    // (c) No captured action → no endpoint carried (the form posts to its own
    //     URL, which is what a page whose endpoint we never saw honestly does).
    const actionless = foldSeams(
      formCapture((els) =>
        els.map((el) => {
          const { formAction: _drop, ...rest } = el as ValueElement & { formAction?: string }
          return rest as ValueElement
        }),
      ),
    ).forms[0]
    expect(actionless.action).toBeUndefined()
    expect(actionless.residuals.some((r) => /no form action captured/.test(r))).toBe(true)

    // (d) An action that is not a safe URL is DROPPED, never carried — a
    //     fabricated endpoint is the one derivation that would silently send real
    //     leads somewhere, so it is refused outright, with a gap naming it.
    const UNSAFE = 'javascript:steal(document.forms[0])'
    const unsafe = foldSeams(
      formCapture((els) => els.map((el) => (el.a11yRole === 'textbox' ? { ...el, formAction: UNSAFE } : el))),
    ).forms[0]
    expect(unsafe.action).toBeUndefined()
    expect(unsafe.residuals.some((r) => r.includes(UNSAFE) && /not a safe URL/.test(r))).toBe(true)

    // ── Channel separation ────────────────────────────────────────────────────
    // Every gap above rides on the SEAM's own derivation-gap list. The form was
    // mounted, so a missing endpoint names a gap in what the capture saw — not a
    // gap in L1's expressive power. The typed element-residual list is unchanged
    // by any of them: conflating the two would make a successfully mounted form
    // read as an un-foldable field.
    const clean = foldSeams(formCapture())
    // Each variant above genuinely recorded a gap on the seam's own channel…
    for (const variant of [actionless, unsafe, untyped, unnamed]) {
      expect(variant.residuals.length).toBeGreaterThan(0)
    }
    // …while the fold's typed element-residual list is unchanged by any of them.
    const actionlessFold = foldSeams(
      formCapture((els) =>
        els.map((el) => {
          const { formAction: _drop, ...rest } = el as ValueElement & { formAction?: string }
          return rest as ValueElement
        }),
      ),
    )
    expect(actionlessFold.forms[0].residuals.length).toBeGreaterThan(0)
    expect(actionlessFold.residuals).toEqual(clean.residuals)
    // A mounted form contributes NO element residual: a `field` residual would say
    // the control could not be folded, which is the conflation this separates.
    expect(actionlessFold.residuals.filter((r) => r.kind === 'field')).toEqual([])
    expect(clean.residuals.filter((r) => r.kind === 'field')).toEqual([])
  })
})

// ── AC-1349: `1c repro --ref` materializes a bundle into a servable site ──────

describe('AC-1349 `1c repro --ref` materializes a bundle into a servable site', () => {
  const ORIGIN = 'https://gigabytealchemy.ai'
  const HERO = `${ORIGIN}/images/AlchemistLabWithTech.png`
  const PHOTO = `${ORIGIN}/images/lab.jpg`
  const FONT = 'https://fonts.gstatic.com/s/cinzel/v26/cinzel.woff2'
  const WIDTHS = [320, 1280]
  const SEAM = 'form-0'

  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'ac1349-'))
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  /** A folded document shaped like a real capture: hero band, photo leaf, face, seam. */
  function foldedDoc(): L1Document {
    const geometry = { keyframes: WIDTHS.map((at) => ({ at, x: 0, y: 0, width: at, height: 400 })) }
    return {
      widths: WIDTHS,
      root: {
        kind: 'box',
        children: [
          { kind: 'box', id: 'section-bg-0', geometry, axes: { backgroundImageUrl: HERO } },
          { kind: 'image', id: 'img-0', geometry, src: PHOTO, alt: 'Lab' },
          { kind: 'slot', name: SEAM, geometry },
        ],
      },
      resources: { fonts: [{ family: 'Cinzel', src: FONT }] },
    } as L1Document
  }

  /** The seam binding the same fold wrote — one behaviour per `slot` in the document. */
  function foldedForms(): FoldedForm[] {
    return [
      {
        slot: SEAM,
        behavior: 'contact-form',
        fields: [{ name: 'your-email', label: 'Your email', type: 'email', labelMode: 'placeholder' }],
        action: ENDPOINT,
        submitLabel: 'Send message',
        form: {
          kind: 'box',
          geometry: { keyframes: WIDTHS.map((at) => ({ at, x: 0, y: 0, width: 400, height: 120 })) },
          children: [
            {
              kind: 'control',
              control: 'your-email',
              geometry: { keyframes: WIDTHS.map((at) => ({ at, x: 0, y: 0, width: 400, height: 50 })) },
            },
          ],
        },
        residuals: [],
      } as unknown as FoldedForm,
    ]
  }

  function assetMap(): CaptureAsset[] {
    return [
      { id: 'hero', kind: 'image', src: HERO, localPath: 'assets/AlchemistLabWithTech.png' },
      { id: 'photo', kind: 'image', src: PHOTO, localPath: 'assets/lab.jpg' },
      { id: 'face', kind: 'font', src: FONT, localPath: 'assets/cinzel.woff2' },
    ]
  }

  /** Write a retained bundle: the folded document, its seam bindings, the mirror. */
  function bundle(assets: CaptureAsset[], forms: FoldedForm[] = foldedForms()): string {
    const dir = path.join(cwd, 'bundle')
    mkdirSync(path.join(dir, 'assets'), { recursive: true })
    writeL1(dir, foldedDoc())
    writeForms(dir, forms)
    const capture = { url: `${ORIGIN}/`, host: 'gigabytealchemy.ai', assets } as unknown as Capture
    writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))
    for (const a of assets) writeFileSync(path.join(dir, a.localPath), `bytes:${a.id}`)
    return dir
  }

  const pageOf = (draftDir: string) =>
    JSON.parse(readFileSync(path.join(draftDir, 'pages', 'home.json'), 'utf8')) as {
      l1: L1Document
      modules: Array<{ id: string; type: string; slot: string; config: Record<string, unknown>; slots: unknown }>
    }

  it('test_UAT_AC1349_repro_materializes_seams_and_localizes_every_handle', () => {
    const ref = bundle(assetMap())
    const result = cmdRepro('gigabyte', { cwd, ref })
    const page = pageOf(result.draftDir)

    // ── The site's page document IS the bundle's folded L1 document ────────────
    expect(page.l1.widths).toEqual(WIDTHS)
    expect(page.l1.root.kind).toBe('box')

    // …with one behaviour instance per recovered seam, bound BY NAME to the slot
    // the fold emitted, carrying that seam's capture-derived config and subtree.
    expect(page.modules).toHaveLength(1)
    expect(page.modules[0].slot).toBe(SEAM)
    expect(page.modules[0].id).toBe(SEAM)
    expect(page.modules[0].type).toBe('contact-form')
    expect(page.modules[0].config.action).toBe(ENDPOINT)
    expect(page.modules[0].config.submitLabel).toBe('Send message')
    expect(page.modules[0].slots).toBeTruthy()
    // The definition validated before anything touched disk — `cmdRepro` throws on
    // an invalid one rather than writing it, so reaching here IS that assertion,
    // and the site it wrote is on disk.
    expect(existsSync(path.join(result.draftDir, 'site.json'))).toBe(true)

    // ── Every media handle is bound to the bundle's own mirror ────────────────
    const json = JSON.stringify(page.l1)
    expect(json).toContain('/assets/AlchemistLabWithTech.png') // a background-image handle
    expect(json).toContain('/assets/lab.jpg') // an image `src`
    expect(json).toContain('/assets/cinzel.woff2') // the font resource table
    expect(json).not.toContain(ORIGIN)
    expect(json).not.toContain('fonts.gstatic.com')
    expect(result.localizedAssets).toBe(3)
    // …and the bytes are mirrored into the site.
    expect(existsSync(path.join(result.draftDir, 'assets', 'lab.jpg'))).toBe(true)

    // Rewriting handles is a MATERIALIZATION concern: the folded document in the
    // bundle still carries the handles the capture recorded.
    expect(readFileSync(path.join(ref, 'l1.json'), 'utf8')).toContain(ORIGIN)

    // ── A handle with no mirror fails the run outright ────────────────────────
    // Falling back to the origin is the defect itself: the perceptual gate would
    // then compare the target against a page serving the target's own bytes.
    const partial = bundle(assetMap().filter((a) => a.src !== HERO))
    expect(() => cmdRepro('gigabyte', { cwd, ref: partial })).toThrow(/hotlink the captured origin/)
    expect(() => cmdRepro('gigabyte', { cwd, ref: partial })).toThrow(/AlchemistLabWithTech\.png/)
    expect(() => cmdRepro('gigabyte', { cwd, ref: partial })).toThrow(/re-capture/i)

    // ── The opposite channel: a mirrored asset the fold references NOWHERE ────
    // The bundle carries the bytes but no leaf and no `@font-face` names them —
    // folder power the reproduction is missing, not a broken reproduction, so it
    // is reported as a fold gap while the run still succeeds.
    const orphaned = bundle([
      ...assetMap(),
      { id: 'orphan', kind: 'image', src: `${ORIGIN}/images/unused.png`, localPath: 'assets/unused.png' },
      // A page subresource is never L1-referenceable, so it is never a gap.
      { id: 'sheet', kind: 'stylesheet', src: `${ORIGIN}/site.css`, localPath: 'assets/site.css' },
    ])
    const orphanResult = cmdRepro('gigabyte', { cwd, ref: orphaned })
    expect(orphanResult.unreferencedAssets).toEqual(['assets/unused.png'])

    // ── A part-stale bundle fails rather than rendering inert placeholders ────
    const stale = bundle(assetMap(), [])
    expect(() => cmdRepro('gigabyte', { cwd, ref: stale })).toThrow(/internally inconsistent/)
    expect(() => cmdRepro('gigabyte', { cwd, ref: stale })).toThrow(/re-capture/i)

    // ── Idempotence: a re-run wipes the target site and rebuilds it ───────────
    const clean = bundle(assetMap())
    const first = cmdRepro('gigabyte', { cwd, ref: clean })
    const firstPage = readFileSync(path.join(first.draftDir, 'pages', 'home.json'), 'utf8')
    const stray = path.join(first.draftDir, 'pages', 'leftover.json')
    writeFileSync(stray, '{"id":"leftover"}')
    const second = cmdRepro('gigabyte', { cwd, ref: clean })
    expect(readFileSync(path.join(second.draftDir, 'pages', 'home.json'), 'utf8')).toBe(firstPage)
    expect(existsSync(stray)).toBe(false)
  })
})
