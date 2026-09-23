/**
 * REQ-302 issues 5 and 3 — the capture bundle records what the browser already
 * measured, and records a run's role at the element the rest of its semantics
 * are read at.
 *
 * ## Issue 5 — four axes measured and then thrown away
 *
 * REQ-64 added `paddingTopPx`, `paddingRightPx`, `paddingBottomPx` and
 * `textAlign` to `RawRun` and taught the comparator to diff all four. Nothing
 * added them to `ContentRun`, so `toContentRun` copied `paddingLeftPx` and
 * dropped the other three sides and the alignment. The browser measured them
 * on every run; the bundle kept one; the comparator's both-sides guard never
 * fired, and four COMPARED axes read clean by construction on every reference.
 *
 * One measured round put numbers on it: `capture.json` carried `paddingLeftPx`
 * 59 times, `paddingTopPx` 4 times (REQ-269's form fields, not runs) and
 * `textAlign` ZERO times in a 130KB capture of a page with 59 runs — and those
 * four axes were 4 of the round's 5 `unmeasured`, the number the loop exists to
 * drive down.
 *
 * ## Issue 3 — the role read off the wrong element
 *
 * `hrefOf` and `headingLevelOf` resolve from the nearest semantic ancestor.
 * `a11yRoleOf` read the run's own element and nothing else. A gradient-text or
 * colour-accent treatment has to wrap the words in a presentational `<span>`
 * inside the semantic element — `<a href="/"><span …>Gigabyte Alchemy</span></a>`
 * — so the run's owning element is the span, and the bundle recorded a
 * CONTRADICTION: a record carrying an `href` whose role is `generic`.
 *
 * It also made the measurement asymmetric, which is what made it expensive. An
 * L1 render emits the `<a>`/`<h1>` DIRECTLY around its text (there is no
 * presentational span in an L1 document), so the same function returned `link`
 * on the reproduction and `generic` on the reference — the two highest-severity
 * deltas of one round, 3100 each, pointing at the side that was right.
 *
 * ## Both are persisted, so both need a re-capture
 *
 * A fold fix takes effect on `1c refold`; these do not. The schema probe is
 * what makes that actionable rather than silent: `CAPTURE_SCHEMA` is 5, and a
 * bundle behind it is NAMED as stale with the axes it cannot answer, so a
 * residual measured against it is not mistaken for a live one.
 */
import { describe, expect, it } from 'vitest'
import {
  CAPTURE_SCHEMA,
  RUN_AXES,
  UNMEASURED_AXES,
  captureSchemaOf,
  flattenCapture,
  readerOf,
  staleCaptureAxes,
  staleCaptureDetail,
} from '../tools/generate/src/cli/capture'
import { buildSections } from '../tools/generate/src/cli/capture/sections'
import type { Capture, ContentRun, RawBand, RawRun, RawSignals, Section } from '../tools/generate/src/cli/capture'

/** The four axes REQ-64 measured and the bundle used to drop. */
const TYPE_A = ['paddingTopPx', 'paddingRightPx', 'paddingBottomPx', 'textAlign'] as const

/** A raw run as the browser measures it — all four sides, and an alignment. */
function rawRun(over: Partial<RawRun> = {}): RawRun {
  return {
    role: 'body',
    text: 'A padded, centred paragraph.',
    color: '#1e293b',
    fontFamily: 'system-ui',
    fontSizePx: 16,
    fontWeight: 400,
    lineHeightPx: 24,
    letterSpacingPx: 0,
    gradientCss: null,
    borderLeftWidthPx: 0,
    borderLeftColor: null,
    accentBox: null,
    box: { x: 40, y: 100, width: 400, height: 56 },
    // The four the fixture pages carry, deliberately all DIFFERENT so a
    // projection that copied one side into all four could not pass.
    paddingTopPx: 11,
    paddingRightPx: 13,
    paddingBottomPx: 17,
    paddingLeftPx: 19,
    textAlign: 'center',
    a11yRole: 'link',
    href: '/',
    ...over,
  } as unknown as RawRun
}

function signalsOf(runs: RawRun[]): RawSignals {
  const band = {
    box: { x: 0, y: 0, width: 1280, height: 400 },
    backgroundColor: '#ffffff',
    backgroundImage: 'none',
    content: runs,
    items: [],
    fields: [],
  } as unknown as RawBand
  return { bands: [band], viewport: { width: 1280, height: 900 }, containerMaxWidthPx: null } as unknown as RawSignals
}

/** A bundle around `sections`, stamped at `schema`. */
function captureOf(sections: Section[], schema?: number): Capture {
  return {
    url: 'http://req302.test/',
    sections,
    theme: {},
    viewport: { width: 1280, height: 900 },
    ...(schema === undefined ? {} : { captureSchema: schema }),
  } as unknown as Capture
}

describe('REQ-302 — the bundle records the four axes the browser measured', () => {
  it('test_UAT_FC_REQ-302_a_runs_four_padding_sides_and_its_alignment_reach_the_bundle', () => {
    // THE FAILURE. `toContentRun` kept `paddingLeftPx` and dropped the rest.
    const [section] = buildSections(signalsOf([rawRun()]), () => undefined)
    const run = section.content[0] as ContentRun

    // All four sides, each at its own value — and the left one still there,
    // so the fix added the three rather than replacing the one.
    expect(run.paddingTopPx).toBe(11)
    expect(run.paddingRightPx).toBe(13)
    expect(run.paddingBottomPx).toBe(17)
    expect(run.paddingLeftPx).toBe(19)
    expect(run.textAlign).toBe('center')

    // ...and they survive the projection the comparator actually reads, which
    // is the end of the path that was broken: measured → bundle → manifest.
    const [el] = flattenCapture(captureOf([section])).elements
    for (const axis of TYPE_A) {
      expect((el as Record<string, unknown>)[axis], `${axis} reaches the manifest`).toBeDefined()
    }
    expect((el as unknown as { paddingTopPx: number }).paddingTopPx).toBe(11)
    expect((el as unknown as { textAlign: string }).textAlign).toBe('center')
  })

  it('test_UAT_FC_REQ-302_a_measured_zero_is_a_measurement_and_survives_as_one', () => {
    // The discrimination the axis table depends on. Presence, not truthiness:
    // a run that pads nothing measured 0, and 0 must reach the bundle as 0 —
    // not fall out as absent and read as UNMEASURED on a page that simply has
    // no padding.
    const [section] = buildSections(
      signalsOf([rawRun({ paddingTopPx: 0, paddingRightPx: 0, paddingBottomPx: 0, paddingLeftPx: 0 })]),
      () => undefined,
    )
    const run = section.content[0] as ContentRun
    for (const axis of ['paddingTopPx', 'paddingRightPx', 'paddingBottomPx'] as const) {
      expect(run[axis], `${axis} is present`).toBe(0)
    }
  })

  it('test_UAT_FC_REQ-302_the_four_axes_are_no_longer_declared_unreadable_on_the_reference_side', () => {
    // The other half of the fix, and the half that closes the round's headline
    // number. While `ContentRun` could not answer, the four were declared
    // reference-side `unsupplied` so they reached the gate as UNMEASURED
    // rather than passing as clean. With the bundle recording them, that
    // declaration has to be withdrawn — otherwise the instrument reports a gap
    // it no longer has, and 4 of 5 unmeasured never falls.
    for (const axis of TYPE_A) {
      const row = RUN_AXES.find((r) => r.axis === axis)
      expect(row, `${axis} is a declared run axis`).toBeDefined()
      expect(row!.role).toBe('compared')
      expect(readerOf(row!.reference), `${axis} reads from the reference`).not.toBeNull()
      expect(readerOf(row!.reproduction), `${axis} reads from the reproduction`).not.toBeNull()
    }
    // And they are gone from the instrument-wide unmeasured list entirely.
    const stillDeclared = UNMEASURED_AXES.filter((u) => (TYPE_A as readonly string[]).includes(u.axis))
    expect(stillDeclared).toEqual([])
  })
})

describe('REQ-302 — a bundle that predates the fix is named, not silently read', () => {
  it('test_UAT_FC_REQ-302_a_stale_bundle_is_told_which_axes_it_cannot_answer', () => {
    // Both fixes are PERSISTED: `1c refold` cannot pick them up, and a residual
    // measured against an old bundle may already be fixed. The stamp moved to 5
    // so the operator is told to re-capture, and told what for.
    expect(CAPTURE_SCHEMA).toBeGreaterThanOrEqual(5)

    // A schema-4 bundle whose runs carry only `paddingLeftPx` — exactly the
    // bundle the measured round was taken from.
    const [section] = buildSections(
      signalsOf([rawRun({ paddingTopPx: undefined, paddingRightPx: undefined, paddingBottomPx: undefined, textAlign: undefined } as Partial<RawRun>)]),
      () => undefined,
    )
    const stale = captureOf([section], 4)
    expect(captureSchemaOf(stale)).toBe(4)

    const named = staleCaptureAxes(stale).map((a) => a.axis).join(' | ')
    expect(named).toMatch(/paddingTopPx/)
    expect(named).toMatch(/textAlign/)
    const detail = staleCaptureDetail(stale)
    expect(detail).toBeTruthy()
    expect(detail!).toContain('schema 4')
    expect(detail!).toContain('1c capture page')
  })

  it('test_UAT_FC_REQ-302_a_role_that_contradicts_its_own_href_proves_the_bundle_is_old', () => {
    // Issue 3's probe, and the reason it is shaped the way it is. `a11yRole`
    // has ALWAYS been written, so presence proves nothing. What a pre-REQ-302
    // bundle carries is a contradiction: a run with a navigation target that
    // is not in a link. A document cannot be in that state, so seeing the pair
    // is proof the role was read off the presentational span.
    const contradictory = buildSections(
      signalsOf([rawRun({ a11yRole: 'generic', href: '/' })]),
      () => undefined,
    )
    const flagged = staleCaptureAxes(captureOf(contradictory, 4)).map((a) => a.axis)
    expect(flagged.some((a) => a.includes('a11yRole'))).toBe(true)

    // ...and NOT seeing the pair proves nothing either way — a page may simply
    // wrap nothing — so a consistent bundle must not be flagged on this axis.
    // The probe only ever REMOVES an axis from a finding, which is the
    // asymmetry every probe in this table is documented to have.
    const consistent = buildSections(signalsOf([rawRun({ a11yRole: 'link', href: '/' })]), () => undefined)
    const clean = staleCaptureAxes(captureOf(consistent, 4)).map((a) => a.axis)
    expect(clean.some((a) => a.includes('a11yRole'))).toBe(false)

    // A heading wrapped the same way is the same contradiction, read through
    // the other semantic field — so the probe is about semantics, not about
    // links specifically.
    const wrappedHeading = buildSections(
      signalsOf([rawRun({ a11yRole: 'generic', href: undefined, headingLevel: 1 } as Partial<RawRun>)]),
      () => undefined,
    )
    expect(
      staleCaptureAxes(captureOf(wrappedHeading, 4)).some((a) => a.axis.includes('a11yRole')),
    ).toBe(true)
  })

  it('test_UAT_FC_REQ-302_a_current_bundle_is_not_told_to_re_capture', () => {
    // The control. A bundle at the current stamp has nothing to answer for,
    // however its runs happen to look — otherwise every capture would carry a
    // permanent re-capture nag, which is how a warning stops being read.
    const [section] = buildSections(signalsOf([rawRun()]), () => undefined)
    expect(staleCaptureAxes(captureOf([section], CAPTURE_SCHEMA))).toEqual([])
    expect(staleCaptureDetail(captureOf([section], CAPTURE_SCHEMA))).toBeNull()
  })
})
