/**
 * REQ-275 — audit capture completeness ONCE, mechanically, instead of one
 * reproduction round at a time.
 *
 * `CAPTURE_SCHEMA_AXES` (REQ-270) names the axes a stored bundle is missing, and
 * it is reactive by construction: an axis joined that register only after a
 * round — about $7 of one — had discovered the bundle could not express it. Five
 * axes were in the register and those five were exactly the five a round found.
 *
 * `1c capture audit` replaces the discovery half. It serves a stored bundle
 * offline, enumerates every CSS longhand whose rule matches a visible element on
 * the bundle's OWN rendered DOM (plus inline styles and DOM attributes), and
 * triages each against a written register of decisions. What is left — the
 * properties nothing has decided about — is the report.
 *
 * Its first run over the three stored references returned four, all DOM facts:
 * `target`, and a control's `name`/`method`/`required`. That the CSS half came
 * back empty is a result rather than a coincidence — REQ-47/48/63/265/269 have
 * swept the paint surface repeatedly, and what was left uncovered was the half
 * no pixel gate can see: whether a link opens a new tab, and what a form
 * actually submits. All four land here as `CAPTURE_SCHEMA` 3 → 4, ONE bump for
 * four axes, which is the point.
 *
 * The browser UATs drive a REAL headless Chromium against a committed fixture
 * over an ephemeral loopback server and skip cleanly where none can launch. The
 * rest pin the triage, the register's integrity and the staleness sentence with
 * no browser at all.
 */
import { describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CAPTURE_COVERAGE,
  CAPTURE_SCHEMA,
  CAPTURE_SCHEMA_AXES,
  auditObservations,
  chromiumAvailable,
  cmdCapturePage,
  combineAudits,
  createPlaywrightDriver,
  runCaptureAudit,
  staleCaptureDetail,
  type Capture,
  type CaptureAudit,
  type RawAudit,
} from '../tools/generate/src/cli/capture'
import { fsReferenceStore } from '../tools/generate/src/store/fs-reference-store'

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
const FIXTURE_PAGE = 'req275-completeness.html'

async function serveDir(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
    const file = path.join(dir, rel || 'index.html')
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.statusCode = 404
      res.end()
      return
    }
    res.setHeader('content-type', 'text/html; charset=utf-8')
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

/**
 * The fixture captured to a real bundle, then audited through the real command
 * core. Deliberately the whole path: `1c capture audit` takes a BUNDLE and
 * serves it offline, so a test that handed the probe a live page would exercise
 * a route the command does not have.
 */
async function captureAndAudit(): Promise<{ capture: Capture; audit: CaptureAudit }> {
  const server = await serveDir(FIXTURES)
  const cwd = mkdtempSync(path.join(tmpdir(), 'req275-'))
  try {
    const store = fsReferenceStore(cwd)
    const { name, capture } = await cmdCapturePage(`${server.origin}/${FIXTURE_PAGE}`, store)
    const audit = await runCaptureAudit(store.bundle(name), { driverFactory: createPlaywrightDriver })
    return { capture, audit }
  } finally {
    await server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
}

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

// Driven ONCE and shared: every browser UAT below asks a different question of
// the same page, and the real Chromium run is the expensive part.
const live = browserOk ? await captureAndAudit() : undefined

// ── browser-free fixtures ────────────────────────────────────────────────────

const observation = (property: string, values: string[] = ['x']) => ({ property, count: 1, values })

const raw = (...properties: ReturnType<typeof observation>[]): RawAudit => ({
  elements: 12,
  css: properties.filter((p) => !p.property.startsWith('dom:')),
  dom: properties.filter((p) => p.property.startsWith('dom:')),
})

/** A bundle body at whatever schema, with the fields a witness reads. */
const captureAt = (schema: number | undefined, overrides: Partial<Capture> = {}): Capture =>
  ({
    url: 'https://example.test/',
    host: 'example.test',
    path: '/',
    capturedAt: '2026-09-18T00:00:00.000Z',
    captureSchema: schema,
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null, subScales: {} },
    sections: [],
    assets: [],
    ...overrides,
  }) as unknown as Capture

const sectionWith = (content: unknown[], fields: unknown[] = []) => ({
  box: { x: 0, y: 0, width: 1280, height: 400 },
  screenshot: { x: 0, y: 0, width: 1280, height: 400 },
  background: { kind: 'color', color: '#ffffff' },
  layout: { textOverImage: false, contentAlign: 'left', arrangement: 'stack', columns: 1, contentMaxWidthPx: null, contentAnchorRatio: null },
  content,
  items: [],
  fields,
})

describe('REQ-275 — the completeness probe', () => {
  /**
   * AC: a property the register has never decided about is the report. Nothing
   * else about a page is news; a decision already taken is not a finding.
   */
  it('test_UAT_FC_REQ_275_untriaged_is_what_the_register_has_no_answer_for', () => {
    const audit = auditObservations(
      raw(
        observation('color', ['#111827']),
        observation('display', ['flex']),
        observation('overflow-x', ['hidden']),
        observation('scrollbar-gutter', ['stable']),
      ),
      captureAt(CAPTURE_SCHEMA),
      'fixture',
    )

    expect(audit.untriaged.map((f) => f.property)).toEqual(['scrollbar-gutter'])
    // And the three that WERE decided are reported under the decision, each
    // carrying the reason it was taken — the register's whole purpose.
    expect(audit.declined.map((f) => f.property)).toEqual(['display'])
    expect(audit.notExpressible.map((f) => f.property)).toEqual(['overflow-x'])
    expect(audit.carried).toBe(1)
    for (const finding of [...audit.declined, ...audit.notExpressible]) {
      expect(finding.note, finding.property).toBeTruthy()
    }
  })

  /**
   * AC: the probe reports what the page uses that the BUNDLE does not carry —
   * not merely what the extractor does not know how to record. A recorded axis
   * with no instance in this bundle is the other half of the report.
   */
  it('test_UAT_FC_REQ_275_a_recorded_axis_absent_from_the_bundle_is_reported', () => {
    const observed = raw(observation('dom:target', ['_blank']))

    const empty = auditObservations(observed, captureAt(CAPTURE_SCHEMA, { sections: [] as never }), 'empty')
    expect(empty.lost.map((f) => f.property)).toEqual(['dom:target'])
    expect(empty.lost[0].note).toContain('newTab')

    // A bundle that visibly carries the axis is never accused of losing it —
    // the same asymmetry REQ-270's `present` runs on, and for the same reason.
    const carried = auditObservations(
      observed,
      captureAt(CAPTURE_SCHEMA, {
        sections: [sectionWith([{ role: 'link', text: 'x', newTab: true }])] as never,
      }),
      'carried',
    )
    expect(carried.lost).toEqual([])
    expect(carried.carried).toBe(1)
  })

  /**
   * AC: an entry triaged *deliberately not recorded* carries its reason in the
   * code beside the decision. Enforced rather than reviewed — a note-less
   * entry is a decision nobody can audit later.
   */
  it('test_UAT_FC_REQ_275_every_register_entry_states_its_reason', () => {
    expect(CAPTURE_COVERAGE.size).toBeGreaterThan(100)
    for (const [property, entry] of CAPTURE_COVERAGE) {
      expect(entry.property, property).toBe(property)
      // A `recorded` note says WHERE the value lands, which can be short. A
      // decision NOT to record has to carry the reasoning, because that is the
      // half a later reader would otherwise have to re-derive from scratch.
      expect(entry.note.length, property).toBeGreaterThan(entry.verdict === 'recorded' ? 10 : 60)
      // A witness only makes sense for an axis we claim to record.
      if (entry.verdict !== 'recorded') expect(entry.present, property).toBeUndefined()
    }
  })

  /**
   * AC: everything triaged *record it* is carried by the extractor, has a
   * `CAPTURE_SCHEMA_AXES` row, and is visible to `staleCaptureDetail` — and the
   * schema bumps ONCE for the four, not four times.
   */
  it('test_UAT_FC_REQ_275_the_four_landed_axes_share_one_schema_bump', () => {
    // REQ-302 bumped the stamp to 5, so the CURRENT schema is no longer pinned
    // here — that was incidental to what this UAT is about. What it is about is
    // that REQ-275's four axes came out of ONE mechanical pass and share ONE
    // bump, which is a property of the schema-4 group and stays true however far
    // the stamp advances afterwards. Pinning the live number instead would make
    // every later capture change look like a REQ-275 regression.
    expect(CAPTURE_SCHEMA).toBeGreaterThanOrEqual(4)
    const landed = CAPTURE_SCHEMA_AXES.filter((a) => a.since === 4).map((a) => a.axis)
    expect(landed).toEqual(['newTab', 'controlName', 'formMethod', 'required'])

    // A bundle at the PREVIOUS schema is told which four it is missing, by name.
    const detail = staleCaptureDetail(captureAt(3))
    expect(detail).toBeTruthy()
    for (const axis of landed) expect(detail).toContain(axis)
    expect(detail).toContain('schema 3')
    expect(detail).toContain(`vs ${CAPTURE_SCHEMA} today`)

    // And the audit and the staleness sentence agree about them: each landed
    // axis is also a register row, so a re-run never reports one as untriaged.
    for (const property of ['dom:target', 'dom:name', 'dom:method', 'dom:required']) {
      expect(CAPTURE_COVERAGE.get(property)?.verdict, property).toBe('recorded')
    }
  })

  /** AC: the combined report is over the corpus — one row per property, naming the bundles it was seen in. */
  it('test_UAT_FC_REQ_275_findings_combine_across_bundles', () => {
    const one = auditObservations(raw(observation('scrollbar-gutter', ['stable'])), captureAt(CAPTURE_SCHEMA), 'a')
    const two = auditObservations(
      raw(observation('scrollbar-gutter', ['both']), observation('zoom', ['1.2'])),
      captureAt(CAPTURE_SCHEMA),
      'b',
    )
    const combined = combineAudits([one, two])
    expect(combined.untriaged.map((f) => f.property)).toEqual(['scrollbar-gutter', 'zoom'])
    expect(combined.untriaged[0].bundles).toEqual(['a', 'b'])
    expect(combined.untriaged[0].count).toBe(2)
    expect(combined.untriaged[0].values).toEqual(['stable', 'both'])
  })

  /**
   * AC (browser): the probe enumerates what the page ACTUALLY uses, from the
   * page rather than from a list — so a property nothing has decided about
   * surfaces without anybody having thought to look for it.
   */
  itB('test_UAT_FC_REQ_275_a_real_page_surfaces_an_undecided_property', () => {
    const audit = live!.audit
    expect(audit.elements).toBeGreaterThan(5)
    expect(audit.observed).toBeGreaterThan(20)
    // The fixture sets `tab-size`, which no register row mentions.
    expect(CAPTURE_COVERAGE.has('tab-size')).toBe(false)
    expect(audit.untriaged.map((f) => f.property)).toContain('tab-size')
    // …and every reported finding is genuinely undecided, not merely unmatched.
    for (const finding of audit.untriaged) expect(CAPTURE_COVERAGE.has(finding.property)).toBe(false)
    // The page's paint is decided about, so the report stays small enough to read.
    expect(audit.untriaged.length).toBeLessThan(10)
  })

  /**
   * AC (browser): the four axes the audit surfaced are now carried by the
   * extractor — the fixture's form and its new-tab link reach `capture.json`.
   */
  itB('test_UAT_FC_REQ_275_the_extractor_now_carries_the_submission_contract', () => {
    const capture = live!.capture
    expect(capture.captureSchema).toBe(CAPTURE_SCHEMA)

    const fields = capture.sections.flatMap((s) => s.fields ?? [])
    const email = fields.find((f) => f.controlType === 'email')
    expect(email, 'the email control reached the bundle').toBeTruthy()
    expect(email!.controlName).toBe('email')
    expect(email!.formMethod).toBe('POST')
    expect(email!.required).toBe(true)
    expect(email!.formAction).toContain('/subscribe')

    const message = fields.find((f) => f.controlType === 'textarea')
    expect(message!.controlName).toBe('message')
    // The browser does not insist on this one, and the bundle says so rather
    // than saying nothing — an absent value and a false one are different facts.
    expect(message!.required).toBe(false)

    const runs = capture.sections.flatMap((s) => [...s.content, ...s.items.flatMap((i) => i.content)])
    const newTab = runs.find((r) => r.text.includes('Opens a new tab'))
    expect(newTab, 'the outbound link reached the bundle').toBeTruthy()
    expect(newTab!.newTab).toBe(true)
    expect(newTab!.href).toBe('https://elsewhere.test/profile')

    const sameTab = runs.find((r) => r.text.includes('stays in this one'))
    expect(sameTab!.newTab).toBe(false)
  })

  /**
   * AC (browser): a bundle the current extractor took is reported as carrying
   * the axes rather than losing them — the probe measures the bundle, not the
   * calendar.
   */
  itB('test_UAT_FC_REQ_275_a_current_bundle_is_not_accused_of_losing_them', () => {
    const audit = live!.audit
    expect(audit.stale).toBeNull()
    const lost = audit.lost.map((f) => f.property)
    for (const property of ['dom:target', 'dom:name', 'dom:method', 'dom:required', 'dom:href']) {
      expect(lost, property).not.toContain(property)
    }
  })
})
